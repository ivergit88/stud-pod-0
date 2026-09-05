import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { initDb } from './database';
import { createMobileApiRouter } from './src/server/mobile-api';
import { createAdminRouter } from './src/server/admin-api';
import {
  calculateOrganizationTrust,
  calculateTaskScorePreview,
  deriveCategoryFromTaskType,
  getTaskTypeLabel,
  inferTaskScoringInputFromLegacyTask,
  normalizeTaskType,
  normalizeTaskUrgency,
  normalizeTaskWorkload,
  type TaskType,
} from './src/lib/task-scoring';
import {
  buildFallbackProjectPlan,
  type GeneratedProjectPlan,
  type GeneratedProjectSubtask,
} from './src/lib/task-projects';
import { buildTaskAutofillDraft } from './src/lib/task-autofill';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_COOKIE_NAME = 'stud_pod_session';
const isProduction = process.env.NODE_ENV === 'production';
const secureCookies = process.env.COOKIE_SECURE === 'true' || isProduction;
const jwtSecret = process.env.JWT_SECRET?.trim();
const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, 'database.sqlite');
const dataDir = path.dirname(databasePath);
const uploadsRoot = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(dataDir, 'uploads');
const TASK_ATTACHMENTS_DIR = 'task-materials';
const MAX_TASK_ATTACHMENT_COUNT = 3;
const MAX_TASK_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const MAX_TASK_TEAM_SIZE = 5;
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_LIMIT_MAX = 20;
const EVENT_POINTS_MIN = 10;
const EVENT_POINTS_MAX = 80;
const OTHER_SKILL_PLACEHOLDER = 'Другое (укажите)';
const TASK_FORMATS = new Set(['online', 'hybrid', 'offline']);
const trustProxySetting =
  process.env.TRUST_PROXY === 'false'
    ? false
    : process.env.TRUST_PROXY || (isProduction ? 1 : false);
const defaultCorsOrigins = [
  'https://студ-подряд.рф',
  new URL('https://студ-подряд.рф').origin,
  'https://www.студ-подряд.рф',
  new URL('https://www.студ-подряд.рф').origin,
];
const devCorsOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
const configuredCorsOrigins = [
  process.env.CORS_ORIGINS,
  process.env.CLIENT_ORIGIN,
  process.env.PUBLIC_ORIGIN,
]
  .filter(Boolean)
  .flatMap((value) => String(value).split(','))
  .map((value) => value.trim())
  .filter(Boolean);
const allowedCorsOrigins = new Set(
  [...defaultCorsOrigins, ...configuredCorsOrigins, ...(!isProduction ? devCorsOrigins : [])]
    .map((origin) => normalizeCorsOrigin(origin)),
);
const authRateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const TASK_SELECT_FIELDS = `
  SELECT
    t.*,
    u.address AS organizationAddress,
    parent.title AS parentTaskTitle,
    parent.slug AS parentTaskSlug,
    (
      SELECT COUNT(*)
      FROM tasks child
      WHERE child.parentTaskId = t.id
    ) AS subtaskCount,
    (
      SELECT COUNT(*)
      FROM tasks child
      WHERE child.parentTaskId = t.id
        AND child.status = 'completed'
    ) AS completedSubtaskCount,
    (
      SELECT COUNT(*)
      FROM tasks sibling
      WHERE sibling.parentTaskId = t.parentTaskId
    ) AS siblingCount
  FROM tasks t
  LEFT JOIN users u ON u.id = t.organizationId
  LEFT JOIN tasks parent ON parent.id = t.parentTaskId
`;
const EVENT_SELECT_FIELDS = `
  SELECT
    e.*,
    COUNT(er.id) AS registrationsCount
  FROM events e
  LEFT JOIN event_registrations er ON er.eventId = e.id
`;
const ALLOWED_TASK_ATTACHMENT_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.zip',
  '.rar',
  '.7z',
]);

if (isProduction && !jwtSecret) {
  throw new Error('JWT_SECRET is required in production');
}

if (!isProduction && !jwtSecret) {
  console.warn('JWT_SECRET is not set; using a development-only session key.');
}

interface CurrentUser {
  id: string;
  uid: string;
  email: string;
  role: 'student' | 'organization' | 'admin';
  firstName: string;
  lastName: string;
  middleName?: string;
  name: string;
  points: number;
  university?: string;
  course?: number;
  description?: string;
  skills?: string[];
  createdAt: string;
  inn?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  status?: string;
}

interface AuthenticatedRequest extends Request {
  currentUser?: CurrentUser | null;
}

interface SessionPayload {
  userId: string;
  role: CurrentUser['role'];
}

type DbRow = Record<string, any>;

interface StoredTaskAttachment {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  relativePath: string;
}

type TaskFormat = 'online' | 'hybrid' | 'offline';
type TaskKind = 'single' | 'parent' | 'subtask';

interface GeneratedTaskBrief {
  title: string;
  description: string;
  requirements: string;
  format: TaskFormat;
  workload: ReturnType<typeof normalizeTaskWorkload>;
  taskType: TaskType;
  urgency: ReturnType<typeof normalizeTaskUrgency>;
  requiresOrgMaterials: boolean;
  requiresOnsiteCheck: boolean;
  parameterReason: string;
  missingInputs: string[];
  confidence: number;
}

type TaskResponseMemberRole = 'leader' | 'member';

interface TaskResponseMember {
  id: string;
  responseId: string;
  taskId: string;
  studentId: string;
  studentName: string;
  role: TaskResponseMemberRole;
  university?: string;
  course?: number;
  description?: string;
  skills?: string[];
  createdAt: string;
}

interface StudentDirectoryProfile {
  id: string;
  name: string;
  university?: string;
  course?: number;
  description?: string;
  skills?: string[];
  points: number;
  completedTasksCount: number;
  createdAt: string;
}

interface PlatformStats {
  totalStudents: number;
  totalOrganizations: number;
  activeTasks: number;
  completedTasks: number;
  totalResponses: number;
  totalPointsAwarded: number;
}

interface TaskInsertInput {
  id: string;
  title: string;
  description: string;
  requirements: string;
  organizationId: string;
  organizationName: string;
  category: string;
  format: TaskFormat;
  workload: ReturnType<typeof normalizeTaskWorkload>;
  taskType: TaskType;
  urgency: ReturnType<typeof normalizeTaskUrgency>;
  requiresOrgMaterials: boolean;
  requiresOnsiteCheck: boolean;
  slug: string;
  pointsReward: number;
  pointsMin: number;
  pointsRecommended: number;
  pointsMax: number;
  pointsExplanation: string[];
  taskKind: TaskKind;
  parentTaskId?: string;
  childOrder?: number;
  deadline: string;
  status: string;
  location: string;
  attachments: StoredTaskAttachment[];
  materialsLink: string;
  createdAt: string;
}

interface TaskProjectDraftPayload {
  title: string;
  projectBrief: string;
  projectSummary?: string;
  projectRequirements?: string;
  format?: TaskFormat;
  deadline: string;
  location?: string;
  coordinates?: [number, number];
  attachments?: unknown;
  materialsLink?: string;
  subtasks?: GeneratedProjectSubtask[];
}

function getJwtSecret() {
  return jwtSecret || 'dev-only-stud-pod-session-secret';
}

function getClientIp(req: Request) {
  return String(req.ip || req.socket.remoteAddress || 'unknown')
    .trim()
    .slice(0, 80);
}

function rateLimitAuth(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const key = `${getClientIp(req)}:${String(req.body?.email || '').trim().toLowerCase()}`;
  const bucket = authRateLimitBuckets.get(key);

  if (authRateLimitBuckets.size > 5000) {
    for (const [bucketKey, value] of authRateLimitBuckets) {
      if (value.resetAt <= now) {
        authRateLimitBuckets.delete(bucketKey);
      }
    }
  }

  if (!bucket || bucket.resetAt <= now) {
    authRateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS,
    });
    return next();
  }

  if (bucket.count >= AUTH_RATE_LIMIT_MAX) {
    res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    return sendError(res, 429, 'Слишком много попыток. Повторите позже.');
  }

  bucket.count += 1;
  return next();
}

function normalizeCorsOrigin(origin: string) {
  const trimmed = origin.trim().replace(/\/+$/g, '');

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}

function isAllowedCorsOrigin(origin?: string) {
  if (!origin) {
    return true;
  }

  return allowedCorsOrigins.has(normalizeCorsOrigin(origin));
}

function normalizeDate(value?: string | null) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function parseJsonArray(value?: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseStringArray(value?: string | null) {
  return parseJsonArray(value)
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCoordinates(value?: string | null) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      parsed.every((item) => typeof item === 'number')
    ) {
      return parsed as [number, number];
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function parseSkills(value?: string | null) {
  return Array.from(
    new Set(
      parseJsonArray(value)
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item) => item !== OTHER_SKILL_PLACEHOLDER),
    ),
  );
}

function normalizeTaskFormat(value?: string | null): TaskFormat {
  if (value === 'hybrid' || value === 'offline') {
    return value;
  }

  return 'online';
}

function parseBooleanFlag(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  return false;
}

function buildSqlPlaceholders(count: number) {
  return Array.from({ length: count }, () => '?').join(', ');
}

function slugifyTaskTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function ensureUniqueTaskSlug(title: string, taskId?: string) {
  const db = await initDb();
  const baseSlug = slugifyTaskTitle(title) || 'zadacha';
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const row = taskId
      ? await db.get('SELECT id FROM tasks WHERE slug = ? AND id != ?', slug, taskId)
      : await db.get('SELECT id FROM tasks WHERE slug = ?', slug);

    if (!row) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function taskPublicPath(task: { id: string; slug?: string | null }) {
  return `/задачи/${task.slug || task.id}`;
}

function buildTaskAttachmentDownloadUrl(taskId: string, attachmentId: string) {
  return `/api/tasks/${taskId}/attachments/${attachmentId}/download`;
}

function buildTaskScoringInput(task: Partial<DbRow>) {
  const taskType = task.taskType
    ? normalizeTaskType(String(task.taskType))
    : inferTaskScoringInputFromLegacyTask(task).taskType;

  return {
    format: normalizeTaskFormat(task.format),
    workload: task.workload
      ? normalizeTaskWorkload(String(task.workload))
      : inferTaskScoringInputFromLegacyTask(task).workload,
    taskType,
    urgency: normalizeTaskUrgency(typeof task.urgency === 'string' ? task.urgency : null),
    requiresOrgMaterials: parseBooleanFlag(task.requiresOrgMaterials),
    requiresOnsiteCheck:
      typeof task.requiresOnsiteCheck !== 'undefined'
        ? parseBooleanFlag(task.requiresOnsiteCheck)
        : normalizeTaskFormat(task.format) !== 'online',
  };
}

function normalizeTaskKind(value?: string | null): TaskKind {
  if (value === 'parent' || value === 'subtask') {
    return value;
  }

  return 'single';
}

async function insertTaskRecord(input: TaskInsertInput) {
  const db = await initDb();

  await db.run(
    `
      INSERT INTO tasks (
        id, title, description, requirements, organizationId, organizationName,
        category, format, workload, taskType, urgency, requiresOrgMaterials, requiresOnsiteCheck,
        slug, pointsReward, pointsMin, pointsRecommended, pointsMax, pointsExplanation,
        taskKind, parentTaskId, childOrder,
        deadline, status, location, attachments, materialsLink, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.id,
      input.title,
      input.description,
      input.requirements,
      input.organizationId,
      input.organizationName,
      input.category,
      input.format,
      input.workload,
      input.taskType,
      input.urgency,
      input.requiresOrgMaterials ? 1 : 0,
      input.requiresOnsiteCheck ? 1 : 0,
      input.slug,
      input.pointsReward,
      input.pointsMin,
      input.pointsRecommended,
      input.pointsMax,
      JSON.stringify(input.pointsExplanation),
      input.taskKind,
      input.parentTaskId || null,
      Number(input.childOrder || 0),
      input.deadline,
      input.status,
      input.location,
      JSON.stringify(input.attachments),
      input.materialsLink,
      input.createdAt,
    ],
  );
}

function buildProjectRequirementsText(parts: Array<string | undefined>) {
  return parts
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .join('\n\n');
}

async function calculateSuggestedTaskPoints(
  organizationId: string,
  subtask: Pick<
    GeneratedProjectSubtask,
    | 'format'
    | 'workload'
    | 'taskType'
    | 'urgency'
    | 'requiresOrgMaterials'
    | 'requiresOnsiteCheck'
  >,
) {
  const trustProfile = await getOrganizationTrustProfile(organizationId);
  const scoringPreview = calculateTaskScorePreview(
    {
      format: subtask.format,
      workload: normalizeTaskWorkload(subtask.workload),
      taskType: normalizeTaskType(subtask.taskType),
      urgency: normalizeTaskUrgency(subtask.urgency),
      requiresOrgMaterials: Boolean(subtask.requiresOrgMaterials),
      requiresOnsiteCheck: Boolean(subtask.requiresOnsiteCheck),
    },
    trustProfile,
  );

  return {
    pointsReward: Math.min(scoringPreview.recommended, scoringPreview.allowedMaximum),
    pointsMin: scoringPreview.minimum,
    pointsRecommended: scoringPreview.recommended,
    pointsMax: scoringPreview.maximum,
    pointsExplanation: scoringPreview.explanation,
  };
}

function normalizeGeneratedSubtask(
  subtask: Partial<GeneratedProjectSubtask>,
  baseFormat: TaskFormat,
  baseDeadline: string,
  baseLocation: string,
): GeneratedProjectSubtask {
  const format = normalizeTaskFormat(subtask.format || baseFormat);
  const workload = normalizeTaskWorkload(subtask.workload);
  const taskType = normalizeTaskType(subtask.taskType);
  const urgency = normalizeTaskUrgency(subtask.urgency);
  const requiresOrgMaterials = parseBooleanFlag(subtask.requiresOrgMaterials);
  const requiresOnsiteCheck = format === 'online' ? false : true;

  return {
    title: String(subtask.title || 'Подзадача').trim(),
    description: String(subtask.description || '').trim(),
    requirements: String(subtask.requirements || '').trim(),
    taskType,
    workload,
    urgency,
    requiresOrgMaterials,
    requiresOnsiteCheck,
    studentProfile: String(subtask.studentProfile || '').trim(),
    deliverable: String(subtask.deliverable || '').trim(),
    deadline: String(subtask.deadline || baseDeadline).trim(),
    format,
    location: format === 'online' ? '' : String(subtask.location || baseLocation).trim(),
    pointsReward: Number(subtask.pointsReward || 0),
  };
}

function buildFallbackTaskBrief(simplePrompt: string): GeneratedTaskBrief {
  return buildTaskAutofillDraft(simplePrompt);
}

function mergeMissingInputs(primary: unknown, fallback: string[]) {
  const values = Array.isArray(primary)
    ? primary.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  return Array.from(new Set([...values, ...fallback])).slice(0, 4);
}

function normalizeGeneratedTaskBrief(raw: Partial<GeneratedTaskBrief>, simplePrompt: string): GeneratedTaskBrief {
  const fallback = buildFallbackTaskBrief(simplePrompt);
  const format = normalizeTaskFormat(String(raw.format || fallback.format));
  const missingInputs = mergeMissingInputs(raw.missingInputs, fallback.missingInputs);
  const rawConfidence = Number(raw.confidence);

  return {
    title: String(raw.title || fallback.title).trim(),
    description: String(raw.description || fallback.description).trim(),
    requirements: String(raw.requirements || fallback.requirements).trim(),
    format,
    workload: normalizeTaskWorkload(String(raw.workload || fallback.workload)),
    taskType: normalizeTaskType(String(raw.taskType || fallback.taskType)),
    urgency: normalizeTaskUrgency(String(raw.urgency || fallback.urgency)),
    requiresOrgMaterials:
      typeof raw.requiresOrgMaterials === 'undefined'
        ? fallback.requiresOrgMaterials
        : parseBooleanFlag(raw.requiresOrgMaterials) || fallback.requiresOrgMaterials,
    requiresOnsiteCheck:
      format === 'online'
        ? false
        : parseBooleanFlag(raw.requiresOnsiteCheck ?? fallback.requiresOnsiteCheck) || fallback.requiresOnsiteCheck,
    parameterReason: String(raw.parameterReason || fallback.parameterReason).trim(),
    missingInputs,
    confidence: Number.isFinite(rawConfidence)
      ? Math.min(1, Math.max(0, rawConfidence))
      : fallback.confidence,
  };
}

async function syncParentTaskStatus(parentTaskId?: string | null) {
  if (!parentTaskId) {
    return;
  }

  const db = await initDb();
  const childRows = await db.all<{ status: string }[]>(
    'SELECT status FROM tasks WHERE parentTaskId = ? ORDER BY childOrder ASC, datetime(created_at) ASC',
    parentTaskId,
  );

  if (childRows.length === 0) {
    return;
  }

  const statuses = childRows.map((row) => String(row.status || 'open'));
  let nextStatus = 'open';

  if (statuses.every((status) => status === 'completed')) {
    nextStatus = 'completed';
  } else if (statuses.some((status) => status === 'review')) {
    nextStatus = 'review';
  } else if (statuses.every((status) => status === 'cancelled')) {
    nextStatus = 'cancelled';
  } else if (
    statuses.some((status) => status === 'in_progress' || status === 'completed' || status === 'cancelled')
  ) {
    nextStatus = 'in_progress';
  }

  await db.run('UPDATE tasks SET status = ? WHERE id = ?', nextStatus, parentTaskId);
}

function toUploadUrl(relativePath: string) {
  return `/uploads/${relativePath.split('/').join('/')}`;
}

function parseTaskAttachments(value?: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is StoredTaskAttachment => (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.originalName === 'string' &&
        typeof item.fileName === 'string' &&
        typeof item.relativePath === 'string'
      ))
      .map((item) => ({
        id: item.id,
        originalName: item.originalName,
        fileName: item.fileName,
        mimeType: item.mimeType || 'application/octet-stream',
        size: Number(item.size || 0),
        uploadedAt: normalizeDate(item.uploadedAt),
        relativePath: item.relativePath,
        url: toUploadUrl(item.relativePath),
      }));
  } catch {
    return [];
  }
}

function sanitizeAttachmentName(originalName: string) {
  const parsed = path.parse(originalName);
  const ext = parsed.ext.toLowerCase();
  const baseName = parsed.name
    .trim()
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'file';

  return {
    baseName,
    ext,
  };
}

function resolveRelativeUploadPath(relativePath: string) {
  const normalizedPath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolvedPath = path.resolve(uploadsRoot, normalizedPath);
  const uploadsRootWithSeparator = path.resolve(uploadsRoot) + path.sep;

  if (resolvedPath !== path.resolve(uploadsRoot) && !resolvedPath.startsWith(uploadsRootWithSeparator)) {
    throw new Error('Некорректный путь к файлу');
  }

  return resolvedPath;
}

async function syncTaskAttachments(
  taskId: string,
  rawAttachments: unknown,
  existingAttachments: ReturnType<typeof parseTaskAttachments>,
) {
  const attachments = Array.isArray(rawAttachments) ? rawAttachments : [];

  if (attachments.length > MAX_TASK_ATTACHMENT_COUNT) {
    throw new Error(`Можно прикрепить не более ${MAX_TASK_ATTACHMENT_COUNT} файлов`);
  }

  const existingMap = new Map(existingAttachments.map((attachment) => [attachment.id, attachment]));
  const keepAttachmentIds = new Set<string>();
  const nextAttachments: StoredTaskAttachment[] = [];
  const taskDir = path.join(uploadsRoot, TASK_ATTACHMENTS_DIR, taskId);

  if (attachments.length > 0) {
    await fs.mkdir(taskDir, { recursive: true });
  }

  for (const attachment of attachments) {
    if (!attachment || typeof attachment !== 'object') {
      throw new Error('Некорректные данные файла');
    }

    const input = attachment as Record<string, unknown>;
    const kind = typeof input.kind === 'string' ? input.kind : '';

    if (kind === 'existing') {
      const existingId = typeof input.id === 'string' ? input.id : '';
      const existingFile = existingMap.get(existingId);

      if (!existingFile) {
        throw new Error('Один из файлов больше недоступен');
      }

      if (!keepAttachmentIds.has(existingFile.id)) {
        keepAttachmentIds.add(existingFile.id);
        nextAttachments.push({
          id: existingFile.id,
          originalName: existingFile.originalName,
          fileName: existingFile.fileName,
          mimeType: existingFile.mimeType,
          size: existingFile.size,
          uploadedAt: existingFile.uploadedAt,
          relativePath: existingFile.relativePath,
        });
      }

      continue;
    }

    if (kind !== 'new') {
      throw new Error('Некорректный тип файла');
    }

    const originalName =
      typeof input.originalName === 'string' ? input.originalName.trim() : '';
    const mimeType =
      typeof input.mimeType === 'string' && input.mimeType.trim()
        ? input.mimeType.trim()
        : 'application/octet-stream';
    const contentBase64 =
      typeof input.contentBase64 === 'string' ? input.contentBase64.trim() : '';

    if (!originalName || !contentBase64) {
      throw new Error('Файл загружен некорректно');
    }

    const { baseName, ext } = sanitizeAttachmentName(originalName);
    if (!ALLOWED_TASK_ATTACHMENT_EXTENSIONS.has(ext)) {
      throw new Error('Разрешены только документы, изображения и архивы');
    }

    const buffer = Buffer.from(contentBase64, 'base64');
    if (buffer.length === 0) {
      throw new Error('Файл пустой');
    }

    if (buffer.length > MAX_TASK_ATTACHMENT_SIZE) {
      throw new Error('Один файл не должен превышать 5 МБ');
    }

    const attachmentId = randomUUID();
    const storedFileName = `${attachmentId}-${baseName}${ext}`;
    const relativePath = path.posix.join(TASK_ATTACHMENTS_DIR, taskId, storedFileName);

    await fs.writeFile(resolveRelativeUploadPath(relativePath), buffer);

    nextAttachments.push({
      id: attachmentId,
      originalName,
      fileName: storedFileName,
      mimeType,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
      relativePath,
    });
  }

  const attachmentsToDelete = existingAttachments.filter(
    (attachment) => !keepAttachmentIds.has(attachment.id),
  );

  await Promise.all(
    attachmentsToDelete.map((attachment) =>
      fs.rm(resolveRelativeUploadPath(attachment.relativePath), { force: true }),
    ),
  );

  if (nextAttachments.length === 0) {
    await fs.rm(taskDir, { recursive: true, force: true });
  }

  return nextAttachments;
}

function mapUser(row?: DbRow | null): CurrentUser | null {
  if (!row) {
    return null;
  }

  const fullName =
    row.name ||
    [row.firstName, row.lastName].filter(Boolean).join(' ').trim() ||
    row.email;

  return {
    id: row.id,
    uid: row.id,
    email: row.email,
    role: row.role,
    firstName: row.firstName || '',
    lastName: row.lastName || '',
    middleName: row.middleName || '',
    name: fullName,
    points: Number(row.points || 0),
    university: row.university || '',
    course: row.course ? Number(row.course) : undefined,
    description: row.description || '',
    skills: parseSkills(row.skills),
    createdAt: normalizeDate(row.created_at),
    inn: row.inn || '',
    address: row.address || '',
    contactPerson: row.contactPerson || '',
    phone: row.phone || '',
    status: row.status || (row.role === 'organization' ? 'moderation' : 'active'),
  };
}

function isUserBlocked(row?: DbRow | CurrentUser | null) {
  return String(row?.status || '').trim().toLowerCase() === 'blocked';
}

function mapTask(row: DbRow) {
  const scoringInput = buildTaskScoringInput(row);
  const explanation = parseStringArray(row.pointsExplanation);
  const attachments = parseTaskAttachments(row.attachments).map((attachment) => ({
    ...attachment,
    url: buildTaskAttachmentDownloadUrl(row.id, attachment.id),
  }));

  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title,
    description: row.description,
    requirements: row.requirements || '',
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    organizationAddress: row.organizationAddress || undefined,
    category: row.category,
    format: scoringInput.format,
    workload: scoringInput.workload,
    taskType: scoringInput.taskType,
    urgency: scoringInput.urgency,
    requiresOrgMaterials: scoringInput.requiresOrgMaterials,
    requiresOnsiteCheck: scoringInput.requiresOnsiteCheck,
    pointsReward: Number(row.pointsReward || 0),
    pointsMin: Number(row.pointsMin || 0),
    pointsRecommended: Number(row.pointsRecommended || row.pointsReward || 0),
    pointsMax: Number(row.pointsMax || row.pointsReward || 0),
    pointsExplanation: explanation,
    taskKind: normalizeTaskKind(row.taskKind),
    parentTaskId: row.parentTaskId || undefined,
    parentTaskTitle: row.parentTaskTitle || undefined,
    parentTaskSlug: row.parentTaskSlug || undefined,
    childOrder: Number(row.childOrder || 0),
    subtaskCount: Number(row.subtaskCount || 0),
    completedSubtaskCount: Number(row.completedSubtaskCount || 0),
    siblingCount: Number(row.siblingCount || 0),
    deadline: row.deadline,
    status: row.status,
    createdAt: normalizeDate(row.created_at),
    executorId: row.executorId || undefined,
    location: row.location || undefined,
    coordinates: parseCoordinates(row.coordinates),
    attachments,
    materialsLink: row.materialsLink || '',
  };
}

function mapTaskResponseMember(row: DbRow): TaskResponseMember {
  return {
    id: row.id,
    responseId: row.responseId,
    taskId: row.taskId,
    studentId: row.studentId,
    studentName: row.studentName,
    role: row.role === 'member' ? 'member' : 'leader',
    university: row.university || '',
    course: row.course ? Number(row.course) : undefined,
    description: row.description || '',
    skills: parseSkills(row.skills),
    createdAt: normalizeDate(row.created_at),
  };
}

function mapTaskResponse(row: DbRow, teamMembers: TaskResponseMember[] = []) {
  return {
    id: row.id,
    taskId: row.taskId,
    studentId: row.studentId,
    studentName: row.studentName,
    status: row.status,
    coverLetter: row.coverLetter || '',
    submissionLink: row.submissionLink || '',
    reviewComment: row.reviewComment || '',
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at || row.created_at),
    teamMembers,
  };
}

function mapStudentDirectoryProfile(row: DbRow): StudentDirectoryProfile {
  return {
    id: row.id,
    name:
      row.name ||
      [row.firstName, row.lastName].filter(Boolean).join(' ').trim() ||
      'Студент',
    university: row.university || '',
    course: row.course ? Number(row.course) : undefined,
    description: row.description || '',
    skills: parseSkills(row.skills),
    points: Number(row.points || 0),
    completedTasksCount: Number(row.completedTasksCount || 0),
    createdAt: normalizeDate(row.created_at),
  };
}

function mapEvent(row: DbRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    date: row.date,
    location: row.location,
    coordinates: parseCoordinates(row.coordinates),
    pointsReward: Number(row.pointsReward || 0),
    registrationsCount: Number(row.registrationsCount || 0),
    imageUrl: row.imageUrl || '',
    createdAt: normalizeDate(row.created_at),
  };
}

function mapEventRegistration(row: DbRow) {
  return {
    id: row.id,
    eventId: row.eventId,
    studentId: row.studentId,
    createdAt: normalizeDate(row.created_at),
  };
}

function mapProduct(row: DbRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price || 0),
    imageUrl: row.imageUrl || '',
    category: row.category,
    stock: Number(row.stock || 0),
    createdAt: normalizeDate(row.created_at),
  };
}

function mapPurchase(row: DbRow) {
  return {
    id: row.id,
    productId: row.productId,
    studentId: row.studentId,
    price: Number(row.price || 0),
    status: row.status,
    createdAt: normalizeDate(row.created_at),
  };
}

function mapNotification(row: DbRow) {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    message: row.message,
    read: Boolean(row.read),
    createdAt: normalizeDate(row.created_at),
    link: row.link || '',
    type: row.type || 'info',
  };
}

function sendError(
  res: Response,
  status: number,
  message: string,
  code?: string,
) {
  return res.status(status).json({
    error: message,
    code: code || undefined,
  });
}

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function getTaskRowById(taskId: string) {
  const db = await initDb();
  return db.get(`${TASK_SELECT_FIELDS} WHERE t.id = ?`, taskId);
}

async function getEventRowById(eventId: string) {
  const db = await initDb();
  return db.get(`${EVENT_SELECT_FIELDS} WHERE e.id = ? GROUP BY e.id`, eventId);
}

async function getOrganizationTrustProfile(organizationId: string) {
  const db = await initDb();
  const taskRows = await db.all<DbRow[]>(
    'SELECT status FROM tasks WHERE organizationId = ?',
    organizationId,
  );
  const responseRows = await db.all<DbRow[]>(
    `
      SELECT tr.status, tr.reviewComment, tr.updated_at, tr.created_at
      FROM task_responses tr
      INNER JOIN tasks t ON t.id = tr.taskId
      WHERE t.organizationId = ?
    `,
    organizationId,
  );

  return calculateOrganizationTrust(
    taskRows.map((row) => ({
      status: row.status,
    })),
    responseRows.map((row) => ({
      status: row.status,
      reviewComment: row.reviewComment,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    })),
  );
}

async function getPlatformStats(): Promise<PlatformStats> {
  const db = await initDb();
  const [
    studentsRow,
    organizationsRow,
    activeTasksRow,
    completedTasksRow,
    responsesRow,
    pointsRow,
  ] = await Promise.all([
    db.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE role = ?', 'student'),
    db.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE role = ?', 'organization'),
    db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM tasks WHERE COALESCE(taskKind, 'single') != 'parent' AND status IN ('open', 'in_progress', 'review')",
    ),
    db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM tasks WHERE COALESCE(taskKind, 'single') != 'parent' AND status = ?",
      'completed',
    ),
    db.get<{ count: number }>('SELECT COUNT(*) as count FROM task_responses'),
    db.get<{ total: number }>(
      "SELECT COALESCE(SUM(points), 0) as total FROM users WHERE role = 'student'",
    ),
  ]);

  return {
    totalStudents: Number(studentsRow?.count || 0),
    totalOrganizations: Number(organizationsRow?.count || 0),
    activeTasks: Number(activeTasksRow?.count || 0),
    completedTasks: Number(completedTasksRow?.count || 0),
    totalResponses: Number(responsesRow?.count || 0),
    totalPointsAwarded: Number(pointsRow?.total || 0),
  };
}

async function getTaskResponseMembersMap(responseIds: string[]) {
  const membersMap = new Map<string, TaskResponseMember[]>();

  if (responseIds.length === 0) {
    return membersMap;
  }

  const db = await initDb();
  const placeholders = buildSqlPlaceholders(responseIds.length);
  const memberRows = await db.all<DbRow[]>(
    `
      SELECT
        trm.*,
        u.university,
        u.course,
        u.description,
        u.skills
      FROM task_response_members trm
      LEFT JOIN users u ON u.id = trm.studentId
      WHERE trm.responseId IN (${placeholders})
      ORDER BY
        CASE trm.role WHEN 'leader' THEN 0 ELSE 1 END,
        trm.created_at ASC,
        trm.studentName COLLATE NOCASE ASC
    `,
    ...responseIds,
  );

  for (const row of memberRows) {
    const member = mapTaskResponseMember(row);
    const list = membersMap.get(member.responseId) || [];
    list.push(member);
    membersMap.set(member.responseId, list);
  }

  return membersMap;
}

async function getTaskResponseMembers(responseId: string) {
  const membersMap = await getTaskResponseMembersMap([responseId]);
  return membersMap.get(responseId) || [];
}

function canManageTaskResponseTeam(status?: string | null) {
  return status === 'accepted' || status === 'pending' || status === 'needs_revision';
}

async function ensureUpcomingDeadlineNotifications(studentId: string) {
  const db = await initDb();
  const activeResponses = await db.all<DbRow[]>(
    `
      SELECT
        tr.id AS responseId,
        t.id,
        t.slug,
        t.title,
        t.deadline
      FROM task_responses tr
      INNER JOIN task_response_members trm ON trm.responseId = tr.id
      INNER JOIN tasks t ON t.id = tr.taskId
      WHERE trm.studentId = ?
        AND tr.status IN ('pending', 'accepted', 'submitted', 'needs_revision')
        AND t.status IN ('open', 'in_progress', 'review')
      GROUP BY tr.id
    `,
    studentId,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const task of activeResponses) {
    const deadline = new Date(task.deadline);
    if (Number.isNaN(deadline.getTime())) {
      continue;
    }

    deadline.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((deadline.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

    let title = '';
    let message = '';
    let type: 'warning' | 'info' = 'warning';

    if (daysLeft < 0) {
      title = 'Дедлайн пропущен';
      message = `По задаче "${task.title}" срок уже прошел. Проверьте карточку и свяжитесь с заказчиком, если нужно продление.`;
    } else if (daysLeft === 0) {
      title = 'Дедлайн сегодня';
      message = `По задаче "${task.title}" дедлайн наступает сегодня. Не забудьте отправить результат на проверку.`;
    } else if (daysLeft <= 3) {
      title = 'Скоро дедлайн';
      message = `По задаче "${task.title}" осталось ${daysLeft} дн. до дедлайна. Проверьте, что успеваете отправить результат.`;
      type = 'info';
    } else {
      continue;
    }

    const link = taskPublicPath({
      id: String(task.id),
      slug: typeof task.slug === 'string' ? task.slug : '',
    });
    const existing = await db.get(
      'SELECT id FROM notifications WHERE userId = ? AND title = ? AND link = ?',
      studentId,
      title,
      link,
    );

    if (!existing) {
      await db.run(
        `
          INSERT INTO notifications (id, userId, title, message, read, type, link, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [randomUUID(), studentId, title, message, 0, type, link, new Date().toISOString()],
      );
    }
  }
}

function createSessionToken(user: CurrentUser) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    } satisfies SessionPayload,
    getJwtSecret(),
    {
      expiresIn: '30d',
    },
  );
}

function setSessionCookie(res: Response, user: CurrentUser) {
  const token = createSessionToken(user);

  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies,
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies,
    path: '/',
  });
}

async function withTransaction<T>(
  callback: () => Promise<T>,
) {
  const db = await initDb();
  await db.exec('BEGIN IMMEDIATE');

  try {
    const result = await callback();
    await db.exec('COMMIT');
    return result;
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

async function callYandexGpt(messages: Array<{ role: string; text: string }>) {
  const yandexGptApiKey = process.env.YANDEXGPT_API_KEY;
  const yandexFolderId = process.env.YANDEX_FOLDER_ID;

  if (!yandexGptApiKey || !yandexFolderId) {
    throw new Error('YandexGPT credentials not configured');
  }

  const response = await axios.post(
    'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
    {
      modelUri: `gpt://${yandexFolderId}/yandexgpt-lite`,
      completionOptions: {
        stream: false,
        temperature: 0.2,
        maxTokens: 1400,
      },
      messages,
    },
    {
      headers: {
        Authorization: `Api-Key ${yandexGptApiKey}`,
        'x-folder-id': yandexFolderId,
      },
    },
  );

  return response.data?.result?.alternatives?.[0]?.message?.text as string | undefined;
}

function extractJsonObject(rawText: string) {
  const cleaned = rawText.replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return JSON');
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

async function generateProjectPlanWithAi(
  payload: TaskProjectDraftPayload,
): Promise<GeneratedProjectPlan> {
  const fallbackPlan = buildFallbackProjectPlan({
    projectTitle: payload.title,
    projectBrief: payload.projectBrief,
    desiredResult: payload.projectSummary,
    sourceMaterials: buildProjectRequirementsText([
      payload.projectRequirements,
      String(payload.materialsLink || '').trim(),
    ]),
    deadline: payload.deadline,
    format: payload.format,
    location: payload.location,
  });

  try {
    const reply = await callYandexGpt([
      {
        role: 'system',
        text:
          'Ты - аналитик цифровой платформы "Студенческий подряд". Нужно разложить одну крупную задачу учреждения на 3-6 независимых мини-задач для студентов. Каждая мини-задача должна иметь самостоятельный проверяемый результат, понятный объём и безопасный вход для начинающего участника. Не растягивай подзадачу до крупного неопределённого проекта. Старайся держать уровень входа умеренным: подзадачи должны подходить начинающим студентам при наличии цифровых инструментов. Верни строго JSON без markdown. Формат: {"summary":"...","rationale":"...","subtasks":[{"title":"...","description":"...","requirements":"...","taskType":"content|design|website|bot|digitization|3d|setup|analytics|other","workload":"up_to_3_hours|one_day|two_to_three_days|more_than_three_days","urgency":"normal|urgent","requiresOrgMaterials":true,"requiresOnsiteCheck":false,"studentProfile":"...","deliverable":"..."}]}',
      },
      {
        role: 'user',
        text: [
          `Название проекта: ${String(payload.title || '').trim()}`,
          `Большая задача: ${String(payload.projectBrief || '').trim()}`,
          payload.projectSummary
            ? `Ожидаемый результат: ${String(payload.projectSummary).trim()}`
            : '',
          payload.projectRequirements
            ? `Ограничения и пожелания: ${String(payload.projectRequirements).trim()}`
            : '',
          payload.format ? `Формат: ${payload.format}` : '',
          payload.deadline ? `Дедлайн: ${payload.deadline}` : '',
          payload.location ? `Место: ${payload.location}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ]);

    if (!reply) {
      return fallbackPlan;
    }

    const parsed = extractJsonObject(reply);
    const rawSubtasks = Array.isArray(parsed.subtasks) ? parsed.subtasks : [];
    const subtasks = rawSubtasks
      .map((item) =>
        normalizeGeneratedSubtask(
          item,
          normalizeTaskFormat(payload.format),
          String(payload.deadline || '').trim(),
          String(payload.location || '').trim(),
        ),
      )
      .filter(
        (item) =>
          item.title &&
          item.description &&
          item.requirements,
      )
      .slice(0, 6);

    if (subtasks.length < 2) {
      return fallbackPlan;
    }

    return {
      summary: String(parsed.summary || fallbackPlan.summary).trim(),
      rationale: String(parsed.rationale || fallbackPlan.rationale).trim(),
      subtasks,
    };
  } catch (error) {
    console.error('Project breakdown AI fallback:', error);
    return fallbackPlan;
  }
}

async function attachCurrentUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  // Мобильный клиент присылает JWT в заголовке Authorization: Bearer <token>,
  // веб-версия продолжает работать через httpOnly-cookie.
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? String(req.headers.authorization).slice('Bearer '.length).trim()
    : undefined;
  const token = bearerToken || req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    req.currentUser = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as SessionPayload;
    const db = await initDb();
    const row = await db.get('SELECT * FROM users WHERE id = ?', payload.userId);
    if (isUserBlocked(row)) {
      clearSessionCookie(res);
      req.currentUser = null;
      return next();
    }
    req.currentUser = mapUser(row);
  } catch {
    req.currentUser = null;
  }

  return next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    return sendError(res, 401, 'Требуется авторизация');
  }

  if (isUserBlocked(req.currentUser)) {
    clearSessionCookie(res);
    return sendError(res, 403, 'Пользователь заблокирован. Обратитесь к администратору.');
  }

  return next();
}

function requireRole(roles: CurrentUser['role'][]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      return sendError(res, 401, 'Требуется авторизация');
    }

    if (isUserBlocked(req.currentUser)) {
      clearSessionCookie(res);
      return sendError(res, 403, 'Пользователь заблокирован. Обратитесь к администратору.');
    }

    if (!roles.includes(req.currentUser.role)) {
      return sendError(res, 403, 'Недостаточно прав');
    }

    return next();
  };
}

app.disable('x-powered-by');
app.set('trust proxy', trustProxySetting);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (secureCookies) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  next();
});
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin is not allowed'));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(
  '/uploads',
  express.static(uploadsRoot, {
    fallthrough: false,
    setHeaders(res, filePath) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    },
  }),
);
app.use(express.json({ limit: '25mb' }));
app.use(attachCurrentUser);

app.get('/api/health', async (_req, res) => {
  const db = await initDb();
  await db.get('SELECT 1');
  res.json({ status: 'ok' });
});

app.get('/api/tasks/:taskId/attachments/:attachmentId/download', async (req, res) => {
  try {
    const task = await getTaskRowById(req.params.taskId);

    if (!task) {
      return sendError(res, 404, 'Задача не найдена');
    }

    const attachment = parseTaskAttachments(task.attachments).find(
      (item) => item.id === req.params.attachmentId,
    );

    if (!attachment) {
      return sendError(res, 404, 'Файл не найден');
    }

    const filePath = resolveRelativeUploadPath(attachment.relativePath);

    try {
      await fs.access(filePath);
    } catch {
      return sendError(res, 404, 'Файл не найден');
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.download(filePath, attachment.originalName);
  } catch (error) {
    console.error('Task attachment download error:', error);
    return sendError(res, 500, 'Не удалось скачать файл');
  }
});

app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
  res.json({
    user: req.currentUser || null,
  });
});

app.post('/api/auth/register', rateLimitAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { role, additionalData, password } = req.body || {};

    if (role !== 'student' && role !== 'organization') {
      return sendError(res, 400, 'Некорректная роль пользователя');
    }

    if (!additionalData?.email || !password) {
      return sendError(res, 400, 'Email и пароль обязательны');
    }

    const email = String(additionalData.email).trim().toLowerCase();

    if (!isValidEmail(email)) {
      return sendError(res, 400, 'Некорректный email', 'auth/invalid-email');
    }

    if (String(password).length < 6) {
      return sendError(
        res,
        400,
        'Пароль должен содержать не менее 6 символов',
        'auth/weak-password',
      );
    }

    if (
      role === 'student' &&
      (!additionalData.firstName || !additionalData.lastName || !additionalData.university)
    ) {
      return sendError(res, 400, 'Для студента не заполнены обязательные поля');
    }

    if (
      role === 'organization' &&
      (!additionalData.name ||
        !additionalData.contactPerson ||
        !additionalData.phone ||
        !additionalData.inn)
    ) {
      return sendError(res, 400, 'Для организации не заполнены обязательные поля');
    }

    if (role === 'student') {
      const course = Number(additionalData.course);
      if (!Number.isInteger(course) || course < 1 || course > 3) {
        return sendError(res, 400, 'Для студента доступны только 1-3 курсы');
      }
    }

    if (role === 'organization' && !/^\d{10}$|^\d{12}$/.test(String(additionalData.inn || ''))) {
      return sendError(res, 400, 'ИНН должен содержать 10 или 12 цифр');
    }

    const db = await initDb();
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);

    if (existingUser) {
      return sendError(
        res,
        409,
        'Пользователь с таким email уже зарегистрирован',
        'auth/email-already-in-use',
      );
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(String(password), 10);
    const createdAt = new Date().toISOString();
    const name =
      role === 'organization'
        ? String(additionalData.name || '').trim()
        : `${String(additionalData.firstName || '').trim()} ${String(
            additionalData.lastName || '',
          ).trim()}`.trim();

    await db.run(
      `
        INSERT INTO users (
          id, email, password_hash, role, name, points, university, course, skills,
          firstName, lastName, middleName, description, inn, address, contactPerson,
          phone, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        email,
        passwordHash,
        role,
        name,
        0,
        additionalData.university || '',
        additionalData.course ? Number(additionalData.course) : null,
        JSON.stringify(
          parseSkills(
            JSON.stringify(Array.isArray(additionalData.skills) ? additionalData.skills : []),
          ),
        ),
        additionalData.firstName || '',
        additionalData.lastName || '',
        additionalData.middleName || '',
        additionalData.description || '',
        additionalData.inn || '',
        additionalData.address || '',
        additionalData.contactPerson || '',
        additionalData.phone || '',
        additionalData.status || (role === 'organization' ? 'moderation' : 'active'),
        createdAt,
      ],
    );

    const row = await db.get('SELECT * FROM users WHERE id = ?', id);
    const user = mapUser(row);

    if (!user) {
      return sendError(res, 500, 'Не удалось создать пользователя');
    }

    setSessionCookie(res, user);
    return res.status(201).json({ user, token: createSessionToken(user) });
  } catch (error) {
    console.error('Registration error:', error);
    return sendError(res, 500, 'Ошибка при регистрации');
  }
});

app.post('/api/auth/login', rateLimitAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return sendError(res, 400, 'Email и пароль обязательны');
    }

    const db = await initDb();
    const row = await db.get('SELECT * FROM users WHERE email = ?', String(email).trim().toLowerCase());

    if (!row) {
      return sendError(
        res,
        401,
        'Неверный email или пароль',
        'auth/invalid-credential',
      );
    }

    const passwordValid = await bcrypt.compare(String(password), row.password_hash);

    if (!passwordValid) {
      return sendError(
        res,
        401,
        'Неверный email или пароль',
        'auth/invalid-credential',
      );
    }

    if (isUserBlocked(row)) {
      clearSessionCookie(res);
      return sendError(
        res,
        403,
        'Пользователь заблокирован. Обратитесь к администратору.',
        'auth/user-blocked',
      );
    }

    const user = mapUser(row);

    if (!user) {
      return sendError(res, 500, 'Не удалось загрузить пользователя');
    }

    setSessionCookie(res, user);
    return res.json({ user, token: createSessionToken(user) });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 500, 'Ошибка при входе');
  }
});

app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  return res.json({ ok: true });
});

app.get('/api/bootstrap', async (req: AuthenticatedRequest, res) => {
  try {
    const db = await initDb();
    const user = req.currentUser;

    const taskRows = user
      ? await db.all(`${TASK_SELECT_FIELDS} ORDER BY datetime(t.created_at) DESC`)
      : await db.all(
          `${TASK_SELECT_FIELDS} WHERE t.status = 'open' ORDER BY datetime(t.created_at) DESC`,
        );

    let responseRows: DbRow[] = [];
    if (user?.role === 'student') {
      responseRows = await db.all(
        `
          SELECT DISTINCT tr.*
          FROM task_responses tr
          INNER JOIN task_response_members trm ON trm.responseId = tr.id
          WHERE trm.studentId = ?
          ORDER BY datetime(tr.created_at) DESC
        `,
        user.id,
      );
    } else if (user?.role === 'organization') {
      responseRows = await db.all(
        `
          SELECT tr.*
          FROM task_responses tr
          INNER JOIN tasks t ON t.id = tr.taskId
          WHERE t.organizationId = ?
          ORDER BY datetime(tr.created_at) DESC
        `,
        user.id,
      );
    } else if (user?.role === 'admin') {
      responseRows = await db.all(
        'SELECT * FROM task_responses ORDER BY datetime(created_at) DESC',
      );
    }

    const responseMembersByResponseId = await getTaskResponseMembersMap(
      responseRows.map((row) => String(row.id)),
    );
    const platformStats = await getPlatformStats();

    const eventRows = await db.all(`${EVENT_SELECT_FIELDS} GROUP BY e.id ORDER BY datetime(e.date) ASC`);
    const productRows = await db.all('SELECT * FROM products ORDER BY datetime(created_at) DESC');

    let eventRegistrationRows: DbRow[] = [];
    let purchaseRows: DbRow[] = [];
    let notificationRows: DbRow[] = [];
    let studentDirectoryRows: DbRow[] = [];

    if (user?.role === 'student') {
      await ensureUpcomingDeadlineNotifications(user.id);
      eventRegistrationRows = await db.all(
        'SELECT * FROM event_registrations WHERE studentId = ? ORDER BY datetime(created_at) DESC',
        user.id,
      );
      purchaseRows = await db.all(
        'SELECT * FROM purchases WHERE studentId = ? ORDER BY datetime(created_at) DESC',
        user.id,
      );
      studentDirectoryRows = await db.all(
        `
          SELECT
            u.*,
            COUNT(DISTINCT CASE WHEN tr.status = 'completed' THEN tr.id END) AS completedTasksCount
          FROM users u
          LEFT JOIN task_response_members trm ON trm.studentId = u.id
          LEFT JOIN task_responses tr ON tr.id = trm.responseId
          WHERE u.role = 'student'
          GROUP BY u.id
          ORDER BY COALESCE(u.points, 0) DESC, datetime(u.created_at) DESC
        `,
      );
    }

    if (user) {
      notificationRows = await db.all(
        'SELECT * FROM notifications WHERE userId = ? ORDER BY datetime(created_at) DESC',
        user.id,
      );
    }

    return res.json({
      tasks: taskRows.map(mapTask),
      responses: responseRows.map((row) =>
        mapTaskResponse(row, responseMembersByResponseId.get(String(row.id)) || []),
      ),
      events: eventRows.map(mapEvent),
      eventRegistrations: eventRegistrationRows.map(mapEventRegistration),
      products: productRows.map(mapProduct),
      purchases: purchaseRows.map(mapPurchase),
      notifications: notificationRows.map(mapNotification),
      studentsDirectory: studentDirectoryRows.map(mapStudentDirectoryProfile),
      platformStats,
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return sendError(res, 500, 'Не удалось загрузить данные');
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body || {};

    const formattedMessages: Array<{ role: string; text: string }> = [];

    if (systemInstruction) {
      formattedMessages.push({
        role: 'system',
        text: String(systemInstruction),
      });
    }

    if (Array.isArray(messages)) {
      for (const message of messages) {
        formattedMessages.push({
          role: message?.role === 'user' ? 'user' : 'assistant',
          text: String(message?.text || message?.content || ''),
        });
      }
    }

    const reply = await callYandexGpt(formattedMessages);

    if (!reply) {
      return sendError(res, 502, 'Не удалось получить ответ от модели');
    }

    return res.json({ reply });
  } catch (error: any) {
    console.error('YandexGPT chat error:', error.response?.data || error.message || error);
    return sendError(res, 500, 'Ошибка при обращении к ИИ');
  }
});

app.post('/api/ai/task-brief', requireRole(['organization', 'admin']), async (req, res) => {
  try {
    const { simplePrompt } = req.body || {};
    const prompt = String(simplePrompt || '').trim();

    if (!prompt) {
      return sendError(res, 400, 'Опишите задачу простыми словами');
    }

    let reply = '';
    let normalized: GeneratedTaskBrief;

    try {
      reply =
        (await callYandexGpt([
          {
            role: 'system',
            text:
              'Ты - IT-аналитик проекта "Студенческий подряд". Преобразуй бытовое описание задачи от учреждения культуры в понятную карточку для студента и сам подбери параметры для автоматического расчета баллов. Не усложняй задачу сверх запроса: если работа похожа на микро-задачу для начинающего студента, выбирай умеренную трудоемкость. Не придумывай дедлайн, адрес, доступы и материалы: если их нет в запросе, укажи это в missingInputs. Верни ответ строго в JSON без markdown и без дополнительных пояснений. Формат: {"title":"...","description":"...","requirements":"...","format":"online|hybrid|offline","workload":"up_to_3_hours|one_day|two_to_three_days|more_than_three_days","taskType":"content|design|website|bot|digitization|3d|setup|analytics|other","urgency":"normal|urgent","requiresOrgMaterials":true,"requiresOnsiteCheck":false,"parameterReason":"коротко почему выбраны параметры","missingInputs":["что учреждению нужно проверить перед публикацией"],"confidence":0.8}',
          },
          {
            role: 'user',
            text: prompt,
          },
        ])) || '';

      normalized = normalizeGeneratedTaskBrief(extractJsonObject(reply), prompt);
    } catch (aiError: any) {
      console.error('YandexGPT task brief fallback:', aiError.response?.data || aiError.message || aiError);
      normalized = buildFallbackTaskBrief(prompt);
    }

    return res.json({
      ...normalized,
      raw: reply || null,
    });
  } catch (error: any) {
    console.error(
      'YandexGPT task brief error:',
      error.response?.data || error.message || error,
    );
    return sendError(res, 500, 'Не удалось сгенерировать ТЗ');
  }
});

app.post('/api/ai/task-breakdown', requireRole(['organization', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.currentUser!;
    const {
      title,
      projectBrief,
      projectSummary,
      projectRequirements,
      format,
      deadline,
      location,
      materialsLink,
    } = req.body || {};

    if (!title || !projectBrief || !deadline) {
      return sendError(res, 400, 'Заполните название, описание большой задачи и дедлайн');
    }

    const normalizedFormat = normalizeTaskFormat(format);
    const normalizedLocation = String(location || '').trim();

    if (normalizedFormat !== 'online' && !normalizedLocation) {
      return sendError(res, 400, 'Для очной или смешанной задачи укажите место проведения');
    }

    const normalizedMaterialsLink = String(materialsLink || '').trim();
    if (normalizedMaterialsLink && !isValidHttpUrl(normalizedMaterialsLink)) {
      return sendError(res, 400, 'Укажите корректную ссылку на материалы');
    }

    const plan = await generateProjectPlanWithAi({
      title: String(title).trim(),
      projectBrief: String(projectBrief).trim(),
      projectSummary: String(projectSummary || '').trim(),
      projectRequirements: buildProjectRequirementsText([
        String(projectRequirements || '').trim(),
        normalizedMaterialsLink ? `Материалы в облаке: ${normalizedMaterialsLink}` : '',
      ]),
      format: normalizedFormat,
      deadline: String(deadline).trim(),
      location: normalizedLocation,
      materialsLink: normalizedMaterialsLink,
    });

    const subtasks = await Promise.all(
      plan.subtasks.map(async (rawSubtask) => {
        const subtask = normalizeGeneratedSubtask(
          rawSubtask,
          normalizedFormat,
          String(deadline).trim(),
          normalizedLocation,
        );
        const points = await calculateSuggestedTaskPoints(user.id, subtask);

        return {
          ...subtask,
          pointsReward: points.pointsReward,
        };
      }),
    );

    return res.json({
      plan: {
        summary: plan.summary,
        rationale: plan.rationale,
        subtasks,
      },
    });
  } catch (error) {
    console.error('Task breakdown error:', error);
    return sendError(res, 500, 'Не удалось подготовить проектный план');
  }
});

app.post('/api/tasks/project', requireRole(['organization', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.currentUser!;
    const {
      title,
      projectBrief,
      projectSummary,
      projectRequirements,
      deadline,
      format,
      location,
      attachments,
      materialsLink,
      subtasks,
    } = (req.body || {}) as TaskProjectDraftPayload;

    if (!title || !projectBrief || !deadline) {
      return sendError(res, 400, 'Заполните название, описание большой задачи и дедлайн');
    }

    if (!Array.isArray(subtasks) || subtasks.length < 2) {
      return sendError(res, 400, 'Добавьте хотя бы две подзадачи проекта');
    }

    const normalizedFormat = normalizeTaskFormat(format);
    const normalizedLocation = String(location || '').trim();
    if (normalizedFormat !== 'online' && !normalizedLocation) {
      return sendError(res, 400, 'Для очной или смешанной задачи укажите место проведения');
    }

    const normalizedMaterialsLink = String(materialsLink || '').trim();
    if (normalizedMaterialsLink && !isValidHttpUrl(normalizedMaterialsLink)) {
      return sendError(res, 400, 'Укажите корректную ссылку на материалы');
    }

    const normalizedSubtasks = subtasks
      .map((subtask) =>
        normalizeGeneratedSubtask(
          subtask,
          normalizedFormat,
          String(deadline).trim(),
          normalizedLocation,
        ),
      )
      .filter((subtask) => subtask.title && subtask.description && subtask.requirements)
      .slice(0, 6);

    if (normalizedSubtasks.length < 2) {
      return sendError(res, 400, 'После нормализации осталось недостаточно подзадач');
    }

    const parentId = randomUUID();
    const createdAt = new Date().toISOString();
    const parentSlug = await ensureUniqueTaskSlug(String(title).trim());
    const parentAttachments = await syncTaskAttachments(parentId, attachments ?? [], []);
    const parentRequirements = buildProjectRequirementsText([
      String(projectSummary || '').trim(),
      String(projectRequirements || '').trim(),
    ]);

    const scoredSubtasks = await Promise.all(
      normalizedSubtasks.map(async (subtask) => ({
        subtask,
        scoring: await calculateSuggestedTaskPoints(user.id, subtask),
      })),
    );
    const totalProjectPoints = scoredSubtasks.reduce(
      (sum, item) => sum + Number(item.scoring.pointsReward || 0),
      0,
    );

    await withTransaction(async () => {
      await insertTaskRecord({
        id: parentId,
        title: String(title).trim(),
        description: String(projectBrief).trim(),
        requirements: parentRequirements,
        organizationId: user.id,
        organizationName: user.name,
        category: 'Проект',
        format: normalizedFormat,
        workload: 'more_than_three_days',
        taskType: 'other',
        urgency: 'normal',
        requiresOrgMaterials: parentAttachments.length > 0 || Boolean(normalizedMaterialsLink),
        requiresOnsiteCheck: normalizedFormat !== 'online',
        slug: parentSlug,
        pointsReward: totalProjectPoints,
        pointsMin: totalProjectPoints,
        pointsRecommended: totalProjectPoints,
        pointsMax: totalProjectPoints,
        pointsExplanation: [
          'Проект автоматически разбит на отдельные мини-задачи.',
          'Общий объём баллов складывается из опубликованных подзадач.',
        ],
        taskKind: 'parent',
        deadline: String(deadline).trim(),
        status: 'open',
        location: normalizedLocation,
        attachments: parentAttachments,
        materialsLink: normalizedMaterialsLink,
        createdAt,
      });

      for (const [index, item] of scoredSubtasks.entries()) {
        const childId = randomUUID();
        const childSlug = await ensureUniqueTaskSlug(item.subtask.title);

        await insertTaskRecord({
          id: childId,
          title: item.subtask.title,
          description: item.subtask.description,
          requirements: buildProjectRequirementsText([
            item.subtask.requirements,
            item.subtask.studentProfile
              ? `Кому подходит: ${item.subtask.studentProfile}`
              : '',
            item.subtask.deliverable
              ? `Что считается результатом: ${item.subtask.deliverable}`
              : '',
          ]),
          organizationId: user.id,
          organizationName: user.name,
          category: deriveCategoryFromTaskType(item.subtask.taskType),
          format: item.subtask.format,
          workload: item.subtask.workload,
          taskType: item.subtask.taskType,
          urgency: item.subtask.urgency,
          requiresOrgMaterials: item.subtask.requiresOrgMaterials,
          requiresOnsiteCheck: item.subtask.requiresOnsiteCheck,
          slug: childSlug,
          pointsReward: item.scoring.pointsReward,
          pointsMin: item.scoring.pointsMin,
          pointsRecommended: item.scoring.pointsRecommended,
          pointsMax: item.scoring.pointsMax,
          pointsExplanation: item.scoring.pointsExplanation,
          taskKind: 'subtask',
          parentTaskId: parentId,
          childOrder: index + 1,
          deadline: item.subtask.deadline,
          status: 'open',
          location: String(item.subtask.location || '').trim(),
          attachments: [],
          materialsLink: '',
          createdAt,
        });
      }
    });

    const parentRow = await getTaskRowById(parentId);
    return res.status(201).json({ task: mapTask(parentRow) });
  } catch (error) {
    console.error('Create task project error:', error);
    return sendError(res, 500, 'Не удалось опубликовать проект');
  }
});

app.post('/api/tasks', requireRole(['organization', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.currentUser!;
    const {
      title,
      description,
      requirements,
      pointsReward,
      deadline,
      format,
      workload,
      taskType,
      urgency,
      requiresOrgMaterials,
      requiresOnsiteCheck,
      location,
      attachments,
      materialsLink,
    } = req.body || {};

    if (!title || !description || !deadline || !pointsReward) {
      return sendError(res, 400, 'Заполните обязательные поля задачи');
    }

    const numericPointsReward = Number(pointsReward);
    if (!Number.isFinite(numericPointsReward) || numericPointsReward <= 0) {
      return sendError(res, 400, 'Укажите корректное количество баллов');
    }

    const normalizedFormat = normalizeTaskFormat(format);
    if (!TASK_FORMATS.has(normalizedFormat)) {
      return sendError(res, 400, 'Укажите корректный формат задачи');
    }

    const normalizedTaskType = normalizeTaskType(
      typeof taskType === 'string' && taskType.trim()
        ? taskType
        : null,
    );
    const normalizedWorkload = normalizeTaskWorkload(workload);
    const normalizedUrgency = normalizeTaskUrgency(urgency);
    const normalizedRequiresOrgMaterials = parseBooleanFlag(requiresOrgMaterials);
    const normalizedRequiresOnsiteCheck = parseBooleanFlag(requiresOnsiteCheck);

    if (normalizedFormat === 'online' && normalizedRequiresOnsiteCheck) {
      return sendError(res, 400, 'Для онлайн-задачи нельзя требовать выезд или очную проверку');
    }

    const normalizedLocation = String(location || '').trim();
    if (normalizedFormat !== 'online' && !normalizedLocation) {
      return sendError(res, 400, 'Для очной или смешанной задачи укажите место проведения');
    }

    const normalizedMaterialsLink = String(materialsLink || '').trim();
    if (normalizedMaterialsLink && !isValidHttpUrl(normalizedMaterialsLink)) {
      return sendError(res, 400, 'Укажите корректную ссылку на материалы');
    }

    const trustProfile = await getOrganizationTrustProfile(user.id);
    const scoringPreview = calculateTaskScorePreview(
      {
        format: normalizedFormat,
        workload: normalizedWorkload,
        taskType: normalizedTaskType,
        urgency: normalizedUrgency,
        requiresOrgMaterials: normalizedRequiresOrgMaterials,
        requiresOnsiteCheck: normalizedRequiresOnsiteCheck,
      },
      trustProfile,
    );

    if (
      numericPointsReward < scoringPreview.minimum ||
      numericPointsReward > scoringPreview.allowedMaximum
    ) {
      return sendError(
        res,
        400,
        `Для вашего уровня доверия доступно от ${scoringPreview.minimum} до ${scoringPreview.allowedMaximum} баллов. Система рекомендует ${scoringPreview.recommended}.`,
      );
    }

    const id = randomUUID();
    const slug = await ensureUniqueTaskSlug(String(title).trim());
    const createdAt = new Date().toISOString();
    const nextAttachments = await syncTaskAttachments(id, attachments ?? [], []);
    const taskCategory = deriveCategoryFromTaskType(normalizedTaskType);

    await insertTaskRecord({
      id,
      title: String(title).trim(),
      description: String(description).trim(),
      requirements: String(requirements || '').trim(),
      organizationId: user.id,
      organizationName: user.name,
      category: taskCategory,
      format: normalizedFormat,
      workload: normalizedWorkload,
      taskType: normalizedTaskType,
      urgency: normalizedUrgency,
      requiresOrgMaterials: normalizedRequiresOrgMaterials,
      requiresOnsiteCheck: normalizedRequiresOnsiteCheck,
      slug,
      pointsReward: numericPointsReward,
      pointsMin: scoringPreview.minimum,
      pointsRecommended: scoringPreview.recommended,
      pointsMax: scoringPreview.maximum,
      pointsExplanation: scoringPreview.explanation,
      taskKind: 'single',
      deadline: String(deadline),
      status: 'open',
      location: normalizedLocation,
      attachments: nextAttachments,
      materialsLink: normalizedMaterialsLink,
      createdAt,
    });

    const row = await getTaskRowById(id);
    return res.status(201).json({ task: mapTask(row) });
  } catch (error) {
    console.error('Create task error:', error);
    return sendError(res, 500, 'Не удалось создать задачу');
  }
});

app.put(
  '/api/tasks/:taskId',
  requireRole(['organization', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.currentUser!;
      const {
        title,
        description,
        requirements,
        pointsReward,
        deadline,
        format,
        workload,
        taskType,
        urgency,
        requiresOrgMaterials,
        requiresOnsiteCheck,
        location,
        attachments,
        materialsLink,
      } = req.body || {};

      if (!title || !description || !deadline || !pointsReward) {
        return sendError(res, 400, 'Заполните обязательные поля задачи');
      }

      const numericPointsReward = Number(pointsReward);
      if (!Number.isFinite(numericPointsReward) || numericPointsReward <= 0) {
        return sendError(res, 400, 'Укажите корректное количество баллов');
      }

      const normalizedFormat = normalizeTaskFormat(format);
      if (!TASK_FORMATS.has(normalizedFormat)) {
        return sendError(res, 400, 'Укажите корректный формат задачи');
      }

      const normalizedTaskType = normalizeTaskType(
        typeof taskType === 'string' && taskType.trim()
          ? taskType
          : null,
      );
      const normalizedWorkload = normalizeTaskWorkload(workload);
      const normalizedUrgency = normalizeTaskUrgency(urgency);
      const normalizedRequiresOrgMaterials = parseBooleanFlag(requiresOrgMaterials);
      const normalizedRequiresOnsiteCheck = parseBooleanFlag(requiresOnsiteCheck);

      if (normalizedFormat === 'online' && normalizedRequiresOnsiteCheck) {
        return sendError(res, 400, 'Для онлайн-задачи нельзя требовать выезд или очную проверку');
      }

      const normalizedLocation = String(location || '').trim();
      if (normalizedFormat !== 'online' && !normalizedLocation) {
        return sendError(res, 400, 'Для очной или смешанной задачи укажите место проведения');
      }

      const normalizedMaterialsLink = String(materialsLink || '').trim();
      if (normalizedMaterialsLink && !isValidHttpUrl(normalizedMaterialsLink)) {
        return sendError(res, 400, 'Укажите корректную ссылку на материалы');
      }

      const db = await initDb();
      const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.taskId);

      if (!task) {
        return sendError(res, 404, 'Задача не найдена');
      }

      if (user.role !== 'admin' && task.organizationId !== user.id) {
        return sendError(res, 403, 'Недостаточно прав');
      }

      if (task.status !== 'open') {
        return sendError(res, 409, 'Редактировать можно только открытые задачи');
      }

      const trustProfile = await getOrganizationTrustProfile(task.organizationId);
      const scoringPreview = calculateTaskScorePreview(
        {
          format: normalizedFormat,
          workload: normalizedWorkload,
          taskType: normalizedTaskType,
          urgency: normalizedUrgency,
          requiresOrgMaterials: normalizedRequiresOrgMaterials,
          requiresOnsiteCheck: normalizedRequiresOnsiteCheck,
        },
        trustProfile,
      );

      if (
        numericPointsReward < scoringPreview.minimum ||
        numericPointsReward > scoringPreview.allowedMaximum
      ) {
        return sendError(
          res,
          400,
          `Для вашего уровня доверия доступно от ${scoringPreview.minimum} до ${scoringPreview.allowedMaximum} баллов. Система рекомендует ${scoringPreview.recommended}.`,
        );
      }

      const nextAttachments = await syncTaskAttachments(
        req.params.taskId,
        attachments ?? parseTaskAttachments(task.attachments).map((attachment) => ({
          kind: 'existing',
          id: attachment.id,
        })),
        parseTaskAttachments(task.attachments),
      );
      const nextSlug = await ensureUniqueTaskSlug(String(title).trim(), req.params.taskId);
      const taskCategory = deriveCategoryFromTaskType(normalizedTaskType);

      await db.run(
        `
          UPDATE tasks
          SET title = ?, description = ?, requirements = ?, category = ?, format = ?, workload = ?, taskType = ?, urgency = ?, requiresOrgMaterials = ?, requiresOnsiteCheck = ?, slug = ?, pointsReward = ?, pointsMin = ?, pointsRecommended = ?, pointsMax = ?, pointsExplanation = ?, deadline = ?, location = ?, organizationName = ?, attachments = ?, materialsLink = ?
          WHERE id = ?
        `,
        [
          String(title).trim(),
          String(description).trim(),
          String(requirements || '').trim(),
          taskCategory,
          normalizedFormat,
          normalizedWorkload,
          normalizedTaskType,
          normalizedUrgency,
          normalizedRequiresOrgMaterials ? 1 : 0,
          normalizedRequiresOnsiteCheck ? 1 : 0,
          nextSlug,
          numericPointsReward,
          scoringPreview.minimum,
          scoringPreview.recommended,
          scoringPreview.maximum,
          JSON.stringify(scoringPreview.explanation),
          String(deadline),
          normalizedLocation,
          user.role === 'organization' ? user.name : task.organizationName,
          JSON.stringify(nextAttachments),
          normalizedMaterialsLink,
          req.params.taskId,
        ],
      );

      const updated = await getTaskRowById(req.params.taskId);
      return res.json({ task: mapTask(updated) });
    } catch (error) {
      console.error('Update task error:', error);
      return sendError(res, 500, 'Не удалось обновить задачу');
    }
  },
);

app.delete(
  '/api/tasks/:taskId',
  requireRole(['organization', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.currentUser!;
      const db = await initDb();
      const task = await getTaskRowById(req.params.taskId);

      if (!task) {
        return sendError(res, 404, 'Задача не найдена');
      }

      if (user.role !== 'admin' && task.organizationId !== user.id) {
        return sendError(res, 403, 'Недостаточно прав');
      }

      const childCountRow = await db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM tasks WHERE parentTaskId = ?',
        req.params.taskId,
      );
      if (Number(childCountRow?.count || 0) > 0) {
        return sendError(res, 409, 'Сначала удалите или завершите связанные подзадачи проекта');
      }

      const responseCountRow = await db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM task_responses WHERE taskId = ?',
        req.params.taskId,
      );

      if (Number(responseCountRow?.count || 0) > 0) {
        return sendError(res, 409, 'Нельзя удалить задачу, по которой уже есть отклики');
      }

      await withTransaction(async () => {
        const txDb = await initDb();
        await txDb.run(
          'DELETE FROM notifications WHERE link IN (?, ?, ?)',
          `/организация/задачи/${req.params.taskId}`,
          taskPublicPath(task),
          `/задачи/${req.params.taskId}`,
        );
        await txDb.run('DELETE FROM tasks WHERE id = ?', req.params.taskId);
      });

      await fs.rm(path.join(uploadsRoot, TASK_ATTACHMENTS_DIR, req.params.taskId), {
        recursive: true,
        force: true,
      });

      if (task.parentTaskId) {
        await syncParentTaskStatus(task.parentTaskId);
      }

      return res.json({ ok: true });
    } catch (error) {
      console.error('Delete task error:', error);
      return sendError(res, 500, 'Не удалось удалить задачу');
    }
  },
);

app.patch(
  '/api/tasks/:taskId/status',
  requireRole(['organization', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const db = await initDb();
      const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.taskId);

      if (!task) {
        return sendError(res, 404, 'Задача не найдена');
      }

      if (req.currentUser?.role !== 'admin' && task.organizationId !== req.currentUser?.id) {
        return sendError(res, 403, 'Недостаточно прав для изменения задачи');
      }

      const status = String(req.body?.status || '').trim();
      const allowedStatuses = ['open', 'in_progress', 'review', 'completed', 'cancelled'];

      if (!allowedStatuses.includes(status)) {
        return sendError(res, 400, 'Некорректный статус задачи');
      }

      await db.run('UPDATE tasks SET status = ? WHERE id = ?', status, req.params.taskId);
      if (task.parentTaskId) {
        await syncParentTaskStatus(task.parentTaskId);
      }
      const updated = await getTaskRowById(req.params.taskId);
      return res.json({ task: mapTask(updated) });
    } catch (error) {
      console.error('Update task status error:', error);
      return sendError(res, 500, 'Не удалось изменить статус задачи');
    }
  },
);

app.post(
  '/api/tasks/:taskId/take',
  requireRole(['student', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.currentUser!;
      const { coverLetter } = req.body || {};
      const db = await initDb();
      const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.taskId);

      if (!task) {
        return sendError(res, 404, 'Задача не найдена');
      }

      if (normalizeTaskKind(task.taskKind) === 'parent') {
        return sendError(res, 400, 'Нельзя откликнуться на обзорный проект. Выберите одну из подзадач.');
      }

      if (task.status !== 'open') {
        return sendError(res, 400, 'Эта задача уже недоступна для отклика');
      }

      const existingResponse = await db.get(
        'SELECT id FROM task_response_members WHERE taskId = ? AND studentId = ?',
        req.params.taskId,
        user.id,
      );

      if (existingResponse) {
        return sendError(res, 409, 'Вы уже откликались на эту задачу');
      }

      const responseId = randomUUID();
      const now = new Date().toISOString();

      await withTransaction(async () => {
        const txDb = await initDb();
        await txDb.run(
          `
            INSERT INTO task_responses (
              id, taskId, studentId, studentName, status, coverLetter, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            responseId,
            req.params.taskId,
            user.id,
            user.name,
            'accepted',
            String(coverLetter || '').trim(),
            now,
            now,
          ],
        );

        await txDb.run(
          `
            INSERT INTO task_response_members (
              id, responseId, taskId, studentId, studentName, role, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            randomUUID(),
            responseId,
            req.params.taskId,
            user.id,
            user.name,
            'leader',
            now,
          ],
        );

        await txDb.run(
          'UPDATE tasks SET status = ?, executorId = ? WHERE id = ?',
          'in_progress',
          user.id,
          req.params.taskId,
        );

        await txDb.run(
          `
            INSERT INTO notifications (id, userId, title, message, read, type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            randomUUID(),
            task.organizationId,
            'Новый исполнитель',
            `Студент "${user.name}" взял задачу "${task.title}" в работу.`,
            0,
            'info',
            now,
          ],
        );
      });

      if (task.parentTaskId) {
        await syncParentTaskStatus(task.parentTaskId);
      }

      const response = await db.get('SELECT * FROM task_responses WHERE id = ?', responseId);
      return res.status(201).json({
        response: mapTaskResponse(response, await getTaskResponseMembers(responseId)),
      });
    } catch (error) {
      console.error('Take task error:', error);
      return sendError(res, 500, 'Не удалось откликнуться на задачу');
    }
  },
);

app.post(
  '/api/task-responses/:responseId/team-members',
  requireRole(['student', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { studentId } = req.body || {};

      if (!studentId) {
        return sendError(res, 400, 'Не выбран участник команды');
      }

      const db = await initDb();
      const response = await db.get('SELECT * FROM task_responses WHERE id = ?', req.params.responseId);

      if (!response) {
        return sendError(res, 404, 'Отклик не найден');
      }

      const task = await db.get('SELECT * FROM tasks WHERE id = ?', response.taskId);

      if (!task) {
        return sendError(res, 404, 'Задача не найдена');
      }

      const currentUser = req.currentUser!;
      const isLeader = response.studentId === currentUser.id;
      if (currentUser.role !== 'admin' && !isLeader) {
        return sendError(res, 403, 'Добавлять участников может только лидер команды');
      }

      if (!canManageTaskResponseTeam(response.status)) {
        return sendError(res, 409, 'Состав команды нельзя менять на этом этапе');
      }

      if (String(studentId) === response.studentId) {
        return sendError(res, 409, 'Лидер уже находится в команде');
      }

      const student = await db.get(
        'SELECT * FROM users WHERE id = ? AND role = ?',
        String(studentId),
        'student',
      );

      if (!student) {
        return sendError(res, 404, 'Студент не найден');
      }

      const existingParticipation = await db.get(
        'SELECT id FROM task_response_members WHERE taskId = ? AND studentId = ?',
        response.taskId,
        String(studentId),
      );

      if (existingParticipation) {
        return sendError(res, 409, 'Этот студент уже участвует в задаче');
      }

      const teamSizeRow = await db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM task_response_members WHERE responseId = ?',
        response.id,
      );

      if (Number(teamSizeRow?.count || 0) >= MAX_TASK_TEAM_SIZE) {
        return sendError(
          res,
          409,
          `В одной команде может быть не более ${MAX_TASK_TEAM_SIZE} человек`,
        );
      }

      const now = new Date().toISOString();

      await withTransaction(async () => {
        const txDb = await initDb();
        await txDb.run(
          `
            INSERT INTO task_response_members (
              id, responseId, taskId, studentId, studentName, role, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            randomUUID(),
            response.id,
            response.taskId,
            student.id,
            mapUser(student)?.name || student.name || 'Студент',
            'member',
            now,
          ],
        );

        await txDb.run(
          `
            INSERT INTO notifications (id, userId, title, message, read, type, link, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            randomUUID(),
            student.id,
            'Вас добавили в команду',
            `Лидер команды добавил вас к задаче "${task.title}". Теперь она отображается в ваших текущих задачах.`,
            0,
            'info',
            taskPublicPath(task),
            now,
          ],
        );
      });

      const updated = await db.get('SELECT * FROM task_responses WHERE id = ?', response.id);
      return res.json({
        response: mapTaskResponse(updated, await getTaskResponseMembers(response.id)),
      });
    } catch (error) {
      console.error('Add team member error:', error);
      return sendError(res, 500, 'Не удалось добавить участника');
    }
  },
);

app.delete(
  '/api/task-responses/:responseId/team-members/:studentId',
  requireRole(['student', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const db = await initDb();
      const response = await db.get('SELECT * FROM task_responses WHERE id = ?', req.params.responseId);

      if (!response) {
        return sendError(res, 404, 'Отклик не найден');
      }

      const task = await db.get('SELECT * FROM tasks WHERE id = ?', response.taskId);

      if (!task) {
        return sendError(res, 404, 'Задача не найдена');
      }

      const currentUser = req.currentUser!;
      const isLeader = response.studentId === currentUser.id;
      if (currentUser.role !== 'admin' && !isLeader) {
        return sendError(res, 403, 'Убирать участников может только лидер команды');
      }

      if (!canManageTaskResponseTeam(response.status)) {
        return sendError(res, 409, 'Состав команды нельзя менять на этом этапе');
      }

      if (req.params.studentId === response.studentId) {
        return sendError(res, 409, 'Лидера команды удалить нельзя');
      }

      const member = await db.get(
        'SELECT * FROM task_response_members WHERE responseId = ? AND studentId = ?',
        response.id,
        req.params.studentId,
      );

      if (!member) {
        return sendError(res, 404, 'Участник команды не найден');
      }

      const now = new Date().toISOString();

      await withTransaction(async () => {
        const txDb = await initDb();
        await txDb.run(
          'DELETE FROM task_response_members WHERE responseId = ? AND studentId = ?',
          response.id,
          req.params.studentId,
        );

        await txDb.run(
          `
            INSERT INTO notifications (id, userId, title, message, read, type, link, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            randomUUID(),
            req.params.studentId,
            'Вас убрали из команды',
            `Вы больше не участвуете в задаче "${task.title}".`,
            0,
            'warning',
            '/студент',
            now,
          ],
        );
      });

      const updated = await db.get('SELECT * FROM task_responses WHERE id = ?', response.id);
      return res.json({
        response: mapTaskResponse(updated, await getTaskResponseMembers(response.id)),
      });
    } catch (error) {
      console.error('Remove team member error:', error);
      return sendError(res, 500, 'Не удалось удалить участника');
    }
  },
);

app.post(
  '/api/task-responses/:responseId/submit',
  requireRole(['student', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { submissionLink } = req.body || {};

      if (!submissionLink) {
        return sendError(res, 400, 'Ссылка на результат обязательна');
      }

      const db = await initDb();
      const response = await db.get(
        'SELECT * FROM task_responses WHERE id = ?',
        req.params.responseId,
      );

      if (!response) {
        return sendError(res, 404, 'Отклик не найден');
      }

      if (req.currentUser?.role !== 'admin' && response.studentId !== req.currentUser?.id) {
        return sendError(res, 403, 'Недостаточно прав');
      }

      const task = await db.get('SELECT * FROM tasks WHERE id = ?', response.taskId);
      if (!task) {
        return sendError(res, 404, 'Задача не найдена');
      }

      const now = new Date().toISOString();

      await withTransaction(async () => {
        const txDb = await initDb();
        await txDb.run(
          `
            UPDATE task_responses
            SET status = ?, submissionLink = ?, updated_at = ?
            WHERE id = ?
          `,
          'submitted',
          String(submissionLink).trim(),
          now,
          req.params.responseId,
        );

        await txDb.run('UPDATE tasks SET status = ? WHERE id = ?', 'review', task.id);

        await txDb.run(
          `
            INSERT INTO notifications (id, userId, title, message, read, type, link, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            randomUUID(),
            task.organizationId,
            'Работа отправлена на проверку',
            `По задаче "${task.title}" загружен результат. Требуется проверка.`,
            0,
            'warning',
            `/организация/задачи/${task.id}`,
            now,
          ],
        );
      });

      if (task.parentTaskId) {
        await syncParentTaskStatus(task.parentTaskId);
      }

      const updated = await db.get('SELECT * FROM task_responses WHERE id = ?', req.params.responseId);
      return res.json({
        response: mapTaskResponse(updated, await getTaskResponseMembers(req.params.responseId)),
      });
    } catch (error) {
      console.error('Submit task error:', error);
      return sendError(res, 500, 'Не удалось отправить работу');
    }
  },
);

app.post(
  '/api/task-responses/:responseId/review',
  requireRole(['organization', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { status, comment } = req.body || {};
      if (status !== 'completed' && status !== 'needs_revision') {
        return sendError(res, 400, 'Некорректный статус проверки');
      }

      const db = await initDb();
      const response = await db.get(
        'SELECT * FROM task_responses WHERE id = ?',
        req.params.responseId,
      );

      if (!response) {
        return sendError(res, 404, 'Отклик не найден');
      }

      const task = await db.get('SELECT * FROM tasks WHERE id = ?', response.taskId);

      if (!task) {
        return sendError(res, 404, 'Задача не найдена');
      }

      if (req.currentUser?.role !== 'admin' && task.organizationId !== req.currentUser?.id) {
        return sendError(res, 403, 'Недостаточно прав');
      }

      const student = await db.get('SELECT * FROM users WHERE id = ?', response.studentId);
      if (!student) {
        return sendError(res, 404, 'Студент не найден');
      }

      const teamMembers = await getTaskResponseMembers(req.params.responseId);
      const participants = teamMembers.length
        ? teamMembers
        : [
            {
              id: response.id,
              responseId: response.id,
              taskId: response.taskId,
              studentId: response.studentId,
              studentName: response.studentName,
              role: 'leader' as const,
              createdAt: normalizeDate(response.created_at),
            },
          ];

      const now = new Date().toISOString();

      await withTransaction(async () => {
        const txDb = await initDb();
        await txDb.run(
          `
            UPDATE task_responses
            SET status = ?, reviewComment = ?, updated_at = ?
            WHERE id = ?
          `,
          status,
          String(comment || '').trim(),
          now,
          req.params.responseId,
        );

        if (status === 'completed') {
          await txDb.run('UPDATE tasks SET status = ? WHERE id = ?', 'completed', task.id);

          if (response.status !== 'completed') {
            for (const participant of participants) {
              await txDb.run(
                'UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?',
                Number(task.pointsReward || 0),
                participant.studentId,
              );
            }
          }

          for (const participant of participants) {
            await txDb.run(
              `
                INSERT INTO notifications (id, userId, title, message, read, type, link, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `,
              [
                randomUUID(),
                participant.studentId,
                'Задача принята',
                `Командная работа по задаче "${task.title}" принята. Начислено ${task.pointsReward} баллов каждому участнику.`,
                0,
                'success',
                '/портфолио',
                now,
              ],
            );
          }
        } else {
          await txDb.run('UPDATE tasks SET status = ? WHERE id = ?', 'in_progress', task.id);
          for (const participant of participants) {
            await txDb.run(
              `
                INSERT INTO notifications (id, userId, title, message, read, type, link, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `,
              [
                randomUUID(),
                participant.studentId,
                'Требуется доработка',
                `По задаче "${task.title}" есть замечания. Команде нужно загрузить исправленный результат.`,
                0,
                'warning',
                taskPublicPath(task),
                now,
              ],
            );
          }
        }
      });

      if (task.parentTaskId) {
        await syncParentTaskStatus(task.parentTaskId);
      }

      const updated = await db.get('SELECT * FROM task_responses WHERE id = ?', req.params.responseId);
      return res.json({
        response: mapTaskResponse(updated, await getTaskResponseMembers(req.params.responseId)),
      });
    } catch (error) {
      console.error('Review task error:', error);
      return sendError(res, 500, 'Не удалось проверить работу');
    }
  },
);

app.post('/api/events', requireRole(['organization', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.currentUser!;
    const { title, description, date, location, coordinates, pointsReward, imageUrl } = req.body || {};

    if (!title || !description || !date || !location || !pointsReward) {
      return sendError(res, 400, 'Заполните обязательные поля мероприятия');
    }

    const numericPointsReward = Number(pointsReward);
    if (
      !Number.isFinite(numericPointsReward) ||
      numericPointsReward < EVENT_POINTS_MIN ||
      numericPointsReward > EVENT_POINTS_MAX
    ) {
      return sendError(
        res,
        400,
        `Для мероприятия можно указать от ${EVENT_POINTS_MIN} до ${EVENT_POINTS_MAX} баллов`,
      );
    }

    const db = await initDb();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    await db.run(
      `
        INSERT INTO events (
          id, title, description, organizationId, organizationName, date,
          location, coordinates, pointsReward, imageUrl, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        String(title).trim(),
        String(description).trim(),
        user.id,
        user.name,
        String(date),
        String(location).trim(),
        coordinates ? JSON.stringify(coordinates) : null,
        numericPointsReward,
        String(imageUrl || '').trim(),
        createdAt,
      ],
    );

    const row = await getEventRowById(id);
    return res.status(201).json({ event: mapEvent(row) });
  } catch (error) {
    console.error('Create event error:', error);
    return sendError(res, 500, 'Не удалось создать мероприятие');
  }
});

app.put(
  '/api/events/:eventId',
  requireRole(['organization', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.currentUser!;
      const { title, description, date, location, coordinates, pointsReward, imageUrl } = req.body || {};

      if (!title || !description || !date || !location || !pointsReward) {
        return sendError(res, 400, 'Заполните обязательные поля мероприятия');
      }

      const numericPointsReward = Number(pointsReward);
      if (
        !Number.isFinite(numericPointsReward) ||
        numericPointsReward < EVENT_POINTS_MIN ||
        numericPointsReward > EVENT_POINTS_MAX
      ) {
        return sendError(
          res,
          400,
          `Для мероприятия можно указать от ${EVENT_POINTS_MIN} до ${EVENT_POINTS_MAX} баллов`,
        );
      }

      const db = await initDb();
      const event = await db.get('SELECT * FROM events WHERE id = ?', req.params.eventId);

      if (!event) {
        return sendError(res, 404, 'Мероприятие не найдено');
      }

      if (user.role !== 'admin' && event.organizationId !== user.id) {
        return sendError(res, 403, 'Недостаточно прав');
      }

      await db.run(
        `
          UPDATE events
          SET title = ?, description = ?, organizationName = ?, date = ?, location = ?, coordinates = ?, pointsReward = ?, imageUrl = ?
          WHERE id = ?
        `,
        [
          String(title).trim(),
          String(description).trim(),
          user.role === 'organization' ? user.name : event.organizationName,
          String(date),
          String(location).trim(),
          coordinates ? JSON.stringify(coordinates) : null,
          numericPointsReward,
          String(imageUrl || '').trim(),
          req.params.eventId,
        ],
      );

      const updated = await getEventRowById(req.params.eventId);
      return res.json({ event: mapEvent(updated) });
    } catch (error) {
      console.error('Update event error:', error);
      return sendError(res, 500, 'Не удалось обновить мероприятие');
    }
  },
);

app.delete(
  '/api/events/:eventId',
  requireRole(['organization', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.currentUser!;
      const db = await initDb();
      const event = await db.get('SELECT * FROM events WHERE id = ?', req.params.eventId);

      if (!event) {
        return sendError(res, 404, 'Мероприятие не найдено');
      }

      if (user.role !== 'admin' && event.organizationId !== user.id) {
        return sendError(res, 403, 'Недостаточно прав');
      }

      await withTransaction(async () => {
        const txDb = await initDb();
        await txDb.run('DELETE FROM event_registrations WHERE eventId = ?', req.params.eventId);
        await txDb.run('DELETE FROM events WHERE id = ?', req.params.eventId);
      });

      return res.json({ ok: true });
    } catch (error) {
      console.error('Delete event error:', error);
      return sendError(res, 500, 'Не удалось удалить мероприятие');
    }
  },
);

app.post(
  '/api/events/:eventId/register',
  requireRole(['student', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.currentUser!;
      const db = await initDb();
      const event = await db.get('SELECT * FROM events WHERE id = ?', req.params.eventId);

      if (!event) {
        return sendError(res, 404, 'Мероприятие не найдено');
      }

      const existing = await db.get(
        'SELECT id FROM event_registrations WHERE eventId = ? AND studentId = ?',
        req.params.eventId,
        user.id,
      );

      if (existing) {
        return sendError(res, 409, 'Вы уже записаны на это мероприятие');
      }

      const id = randomUUID();
      const createdAt = new Date().toISOString();

      await db.run(
        `
          INSERT INTO event_registrations (id, eventId, studentId, created_at)
          VALUES (?, ?, ?, ?)
        `,
        [id, req.params.eventId, user.id, createdAt],
      );

      return res.status(201).json({
        registration: mapEventRegistration({
          id,
          eventId: req.params.eventId,
          studentId: user.id,
          created_at: createdAt,
        }),
      });
    } catch (error) {
      console.error('Register for event error:', error);
      return sendError(res, 500, 'Не удалось записаться на мероприятие');
    }
  },
);

app.post(
  '/api/products/:productId/buy',
  requireRole(['student', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.currentUser!;
      const db = await initDb();
      const product = await db.get('SELECT * FROM products WHERE id = ?', req.params.productId);

      if (!product) {
        return sendError(res, 404, 'Товар не найден');
      }

      if (Number(product.stock || 0) <= 0) {
        return sendError(res, 400, 'Товара нет в наличии');
      }

      if (Number(user.points || 0) < Number(product.price || 0)) {
        return sendError(res, 400, 'Недостаточно баллов');
      }

      const purchaseId = randomUUID();
      const createdAt = new Date().toISOString();

      await withTransaction(async () => {
        const txDb = await initDb();
        await txDb.run(
          `
            INSERT INTO purchases (id, productId, studentId, price, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            purchaseId,
            req.params.productId,
            user.id,
            Number(product.price || 0),
            'pending',
            createdAt,
          ],
        );

        await txDb.run(
          'UPDATE users SET points = COALESCE(points, 0) - ? WHERE id = ?',
          Number(product.price || 0),
          user.id,
        );

        await txDb.run(
          'UPDATE products SET stock = COALESCE(stock, 0) - 1 WHERE id = ?',
          req.params.productId,
        );

        await txDb.run(
          `
            INSERT INTO notifications (id, userId, title, message, read, type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            randomUUID(),
            user.id,
            'Покупка оформлена',
            `Товар "${product.title}" зарезервирован. Баллы будут списаны автоматически.`,
            0,
            'success',
            createdAt,
          ],
        );
      });

      const purchase = await db.get('SELECT * FROM purchases WHERE id = ?', purchaseId);
      return res.status(201).json({ purchase: mapPurchase(purchase) });
    } catch (error) {
      console.error('Buy product error:', error);
      return sendError(res, 500, 'Не удалось оформить покупку');
    }
  },
);

app.post(
  '/api/notifications/:notificationId/read',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const db = await initDb();
      const notification = await db.get(
        'SELECT * FROM notifications WHERE id = ?',
        req.params.notificationId,
      );

      if (!notification) {
        return sendError(res, 404, 'Уведомление не найдено');
      }

      if (notification.userId !== req.currentUser?.id) {
        return sendError(res, 403, 'Недостаточно прав');
      }

      await db.run(
        'UPDATE notifications SET read = 1 WHERE id = ?',
        req.params.notificationId,
      );

      return res.json({ ok: true });
    } catch (error) {
      console.error('Read notification error:', error);
      return sendError(res, 500, 'Не удалось отметить уведомление');
    }
  },
);

// Админ-панель (статистика, управление пользователями, апелляции)
app.use(
  '/api/admin',
  createAdminRouter({
    initDb,
    sendError,
    requireAuth,
    requireRole,
    mapUser,
  }),
);

// Апелляция (организация/админ может вернуть задачу на доработку)
app.post(
  '/api/task-responses/:responseId/appeal',
  requireRole(['organization', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { message } = req.body || {};
      const db = await initDb();
      const response = await db.get('SELECT * FROM task_responses WHERE id = ?', req.params.responseId);
      if (!response) {
        return sendError(res, 404, 'Отклик не найден');
      }
      await db.run('UPDATE task_responses SET appealed = 1, status = ?, updated_at = ? WHERE id = ?', 'needs_revision', new Date().toISOString(), req.params.responseId);
      await db.run('UPDATE tasks SET status = ? WHERE id = ?', 'in_progress', response.taskId);
      await db.run(
        `INSERT INTO notifications (id, userId, title, message, read, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), response.studentId, 'Апелляция по задаче', String(message || 'Работа возвращена на доработку.').trim(), 0, 'warning', new Date().toISOString()],
      );
      return res.json({ ok: true });
    } catch (e) {
      console.error('Appeal error:', e);
      return sendError(res, 500, 'Не удалось подать апелляцию');
    }
  },
);

// Мобильный REST API для Android-клиента (Bearer JWT, пагинация, точечные выборки).
app.use(
  '/api',
  createMobileApiRouter({
    initDb,
    sendError,
    requireAuth,
    requireRole,
    mapTask,
    mapTaskResponse,
    mapNotification,
    getTaskRowById,
    getTaskResponseMembers,
    taskSelectFields: TASK_SELECT_FIELDS,
  }),
);

async function syncTaskDerivedFields() {
  const db = await initDb();
  const tasks = await db.all<DbRow[]>(
    `
      SELECT
        id,
        title,
        slug,
        format,
        category,
        organizationId,
        pointsReward,
        workload,
        taskType,
        urgency,
        requiresOrgMaterials,
        requiresOnsiteCheck,
        pointsMin,
        pointsRecommended,
        pointsMax,
        pointsExplanation
      FROM tasks
    `,
  );

  for (const task of tasks) {
    const updates: string[] = [];
    const values: Array<string | number> = [];

    const normalizedFormat = normalizeTaskFormat(task.format);
    if (task.format !== normalizedFormat) {
      updates.push('format = ?');
      values.push(normalizedFormat);
    }

    if (!task.slug) {
      updates.push('slug = ?');
      values.push(await ensureUniqueTaskSlug(String(task.title || 'zadacha'), task.id));
    }

    const scoringInput = buildTaskScoringInput(task);
    const derivedCategory = deriveCategoryFromTaskType(scoringInput.taskType);
    if (task.category !== derivedCategory) {
      updates.push('category = ?');
      values.push(derivedCategory);
    }

    if (task.workload !== scoringInput.workload) {
      updates.push('workload = ?');
      values.push(scoringInput.workload);
    }

    if (task.taskType !== scoringInput.taskType) {
      updates.push('taskType = ?');
      values.push(scoringInput.taskType);
    }

    if (task.urgency !== scoringInput.urgency) {
      updates.push('urgency = ?');
      values.push(scoringInput.urgency);
    }

    const requiresOrgMaterials = scoringInput.requiresOrgMaterials ? 1 : 0;
    if (Number(task.requiresOrgMaterials || 0) !== requiresOrgMaterials) {
      updates.push('requiresOrgMaterials = ?');
      values.push(requiresOrgMaterials);
    }

    const requiresOnsiteCheck = scoringInput.requiresOnsiteCheck ? 1 : 0;
    if (Number(task.requiresOnsiteCheck || 0) !== requiresOnsiteCheck) {
      updates.push('requiresOnsiteCheck = ?');
      values.push(requiresOnsiteCheck);
    }

    const trustProfile = await getOrganizationTrustProfile(String(task.organizationId || ''));
    const scoringPreview = calculateTaskScorePreview(scoringInput, trustProfile);
    const storedExplanation = parseStringArray(task.pointsExplanation);

    if (Number(task.pointsMin || 0) !== scoringPreview.minimum) {
      updates.push('pointsMin = ?');
      values.push(scoringPreview.minimum);
    }

    if (Number(task.pointsRecommended || 0) !== scoringPreview.recommended) {
      updates.push('pointsRecommended = ?');
      values.push(scoringPreview.recommended);
    }

    if (Number(task.pointsMax || 0) !== scoringPreview.maximum) {
      updates.push('pointsMax = ?');
      values.push(scoringPreview.maximum);
    }

    if (JSON.stringify(storedExplanation) !== JSON.stringify(scoringPreview.explanation)) {
      updates.push('pointsExplanation = ?');
      values.push(JSON.stringify(scoringPreview.explanation));
    }

    if (updates.length > 0) {
      await db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, ...values, task.id);
    }
  }
}

async function startServer() {
  await initDb();
  await syncTaskDerivedFields();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(viteServer.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
