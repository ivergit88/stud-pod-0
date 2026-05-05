import type { TaskFormat } from './tasks';

export type TaskWorkload =
  | 'up_to_3_hours'
  | 'one_day'
  | 'two_to_three_days'
  | 'more_than_three_days';

export type TaskType =
  | 'content'
  | 'design'
  | 'website'
  | 'bot'
  | 'digitization'
  | '3d'
  | 'setup'
  | 'analytics'
  | 'other';

export type TaskUrgency = 'normal' | 'urgent';
export type OrganizationTrustLevel = 'new' | 'verified' | 'partner';

export interface TaskScoringInput {
  format: TaskFormat;
  workload: TaskWorkload;
  taskType: TaskType;
  urgency: TaskUrgency;
  requiresOrgMaterials: boolean;
  requiresOnsiteCheck: boolean;
}

export interface OrganizationTrustTaskSnapshot {
  status?: string;
}

export interface OrganizationTrustResponseSnapshot {
  status?: string;
  reviewComment?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface TaskScoreBreakdownItem {
  label: string;
  points: number;
  description: string;
}

export interface OrganizationTrustProfile {
  score: number;
  level: OrganizationTrustLevel;
  label: string;
  description: string;
  maxMultiplier: number;
  maxExtraPercent: number;
  completedTasks: number;
  confirmedResultRate: number;
  feedbackRate: number;
  cancellationRate: number;
  conflictRate: number;
  onTimeRatio: number;
}

export interface TaskScorePreview {
  minimum: number;
  recommended: number;
  maximum: number;
  allowedMaximum: number;
  breakdown: TaskScoreBreakdownItem[];
  explanation: string[];
}

export const TASK_WORKLOAD_LABELS: Record<TaskWorkload, string> = {
  up_to_3_hours: 'До 3 часов',
  one_day: '1 день',
  two_to_three_days: '2-3 дня',
  more_than_three_days: 'Более 3 дней',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  content: 'Контент',
  design: 'Дизайн',
  website: 'Сайт',
  bot: 'Бот',
  digitization: 'Оцифровка',
  '3d': '3D',
  setup: 'Настройка',
  analytics: 'Аналитика',
  other: 'Другое',
};

export const TASK_URGENCY_LABELS: Record<TaskUrgency, string> = {
  normal: 'Обычная',
  urgent: 'Срочная',
};

export const TASK_WORKLOAD_OPTIONS = [
  { value: 'up_to_3_hours' as const, label: TASK_WORKLOAD_LABELS.up_to_3_hours },
  { value: 'one_day' as const, label: TASK_WORKLOAD_LABELS.one_day },
  { value: 'two_to_three_days' as const, label: TASK_WORKLOAD_LABELS.two_to_three_days },
  { value: 'more_than_three_days' as const, label: TASK_WORKLOAD_LABELS.more_than_three_days },
];

export const TASK_TYPE_OPTIONS = [
  { value: 'content' as const, label: TASK_TYPE_LABELS.content },
  { value: 'design' as const, label: TASK_TYPE_LABELS.design },
  { value: 'website' as const, label: TASK_TYPE_LABELS.website },
  { value: 'bot' as const, label: TASK_TYPE_LABELS.bot },
  { value: 'digitization' as const, label: TASK_TYPE_LABELS.digitization },
  { value: '3d' as const, label: TASK_TYPE_LABELS['3d'] },
  { value: 'setup' as const, label: TASK_TYPE_LABELS.setup },
  { value: 'analytics' as const, label: TASK_TYPE_LABELS.analytics },
  { value: 'other' as const, label: TASK_TYPE_LABELS.other },
];

export const TASK_URGENCY_OPTIONS = [
  { value: 'normal' as const, label: TASK_URGENCY_LABELS.normal },
  { value: 'urgent' as const, label: TASK_URGENCY_LABELS.urgent },
];

const FORMAT_POINTS: Record<TaskFormat, number> = {
  online: 0,
  hybrid: 15,
  offline: 30,
};

const WORKLOAD_POINTS: Record<TaskWorkload, number> = {
  up_to_3_hours: 0,
  one_day: 20,
  two_to_three_days: 45,
  more_than_three_days: 80,
};

const TASK_TYPE_POINTS: Record<TaskType, number> = {
  content: 0,
  design: 10,
  website: 30,
  bot: 35,
  digitization: 15,
  '3d': 40,
  setup: 20,
  analytics: 25,
  other: 10,
};

const URGENCY_POINTS: Record<TaskUrgency, number> = {
  normal: 0,
  urgent: 15,
};

const BASE_POINTS = 40;
const MATERIALS_POINTS = 10;
const ONSITE_POINTS = 20;
const STALE_RESPONSE_HOURS = 72;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundToTens(value: number) {
  return Math.round(value / 10) * 10;
}

function normalizePercent(value: number) {
  return clamp(Number.isFinite(value) ? value : 0, 0, 1);
}

export function normalizeTaskWorkload(value?: string | null): TaskWorkload {
  switch (value) {
    case 'one_day':
    case 'two_to_three_days':
    case 'more_than_three_days':
      return value;
    default:
      return 'up_to_3_hours';
  }
}

export function normalizeTaskType(value?: string | null): TaskType {
  switch (value) {
    case 'content':
    case 'design':
    case 'website':
    case 'bot':
    case 'digitization':
    case '3d':
    case 'setup':
    case 'analytics':
      return value;
    default:
      return 'other';
  }
}

export function normalizeTaskUrgency(value?: string | null): TaskUrgency {
  return value === 'urgent' ? 'urgent' : 'normal';
}

export function getTaskWorkloadLabel(value?: string | null) {
  return TASK_WORKLOAD_LABELS[normalizeTaskWorkload(value)];
}

export function getTaskTypeLabel(value?: string | null) {
  return TASK_TYPE_LABELS[normalizeTaskType(value)];
}

export function getTaskUrgencyLabel(value?: string | null) {
  return TASK_URGENCY_LABELS[normalizeTaskUrgency(value)];
}

export function deriveCategoryFromTaskType(taskType: TaskType) {
  return TASK_TYPE_LABELS[taskType];
}

export function inferTaskTypeFromCategory(category?: string | null): TaskType {
  const normalized = String(category || '').trim().toLowerCase();

  if (!normalized) {
    return 'other';
  }

  if (normalized.includes('диз')) {
    return 'design';
  }
  if (normalized.includes('текст') || normalized.includes('контент') || normalized.includes('перевод')) {
    return 'content';
  }
  if (normalized.includes('сайт') || normalized.includes('it') || normalized.includes('разработ')) {
    return 'website';
  }
  if (normalized.includes('бот')) {
    return 'bot';
  }
  if (normalized.includes('оциф')) {
    return 'digitization';
  }
  if (normalized.includes('3d')) {
    return '3d';
  }
  if (normalized.includes('настрой')) {
    return 'setup';
  }
  if (normalized.includes('аналит')) {
    return 'analytics';
  }

  return 'other';
}

export function inferTaskWorkloadFromPoints(pointsReward?: number | null): TaskWorkload {
  const points = Number(pointsReward || 0);

  if (points >= 180) {
    return 'more_than_three_days';
  }
  if (points >= 120) {
    return 'two_to_three_days';
  }
  if (points >= 70) {
    return 'one_day';
  }

  return 'up_to_3_hours';
}

export function inferTaskScoringInputFromLegacyTask(task: {
  category?: string | null;
  format?: string | null;
  pointsReward?: number | null;
}) {
  const format = task.format === 'hybrid' || task.format === 'offline' ? task.format : 'online';

  return {
    format,
    workload: inferTaskWorkloadFromPoints(task.pointsReward),
    taskType: inferTaskTypeFromCategory(task.category),
    urgency: 'normal' as const,
    requiresOrgMaterials: false,
    requiresOnsiteCheck: format !== 'online',
  };
}

export function calculateOrganizationTrust(
  tasks: OrganizationTrustTaskSnapshot[],
  responses: OrganizationTrustResponseSnapshot[],
  now = new Date(),
): OrganizationTrustProfile {
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const reviewedResponses = responses.filter(
    (response) =>
      response.status === 'completed' ||
      response.status === 'needs_revision' ||
      response.status === 'rejected',
  );
  const confirmedResults = reviewedResponses.filter((response) => response.status === 'completed').length;
  const feedbackCount = reviewedResponses.filter((response) =>
    String(response.reviewComment || '').trim(),
  ).length;
  const cancelledTasks = tasks.filter((task) => task.status === 'cancelled').length;
  const conflictCount = reviewedResponses.filter(
    (response) => response.status === 'needs_revision' || response.status === 'rejected',
  ).length;
  const submittedResponses = responses.filter((response) => response.status === 'submitted');
  const staleSubmittedResponses = submittedResponses.filter((response) => {
    const value = response.updatedAt || response.createdAt;
    const timestamp = value ? new Date(value).getTime() : NaN;
    if (!Number.isFinite(timestamp)) {
      return false;
    }

    return now.getTime() - timestamp > STALE_RESPONSE_HOURS * 60 * 60 * 1000;
  }).length;

  const confirmedResultRate = reviewedResponses.length
    ? confirmedResults / reviewedResponses.length
    : 0;
  const feedbackRate = reviewedResponses.length ? feedbackCount / reviewedResponses.length : 0;
  const cancellationRate = totalTasks ? cancelledTasks / totalTasks : 0;
  const conflictRate = reviewedResponses.length ? conflictCount / reviewedResponses.length : 0;
  const onTimeRatio = submittedResponses.length
    ? 1 - staleSubmittedResponses / submittedResponses.length
    : reviewedResponses.length > 0
      ? 1
      : 0;

  const score = clamp(
    Math.round(
      Math.min(completedTasks / 8, 1) * 35 +
        normalizePercent(confirmedResultRate) * 20 +
        normalizePercent(feedbackRate) * 15 +
        (totalTasks > 0 ? 1 - normalizePercent(cancellationRate) : 0) * 15 +
        (reviewedResponses.length > 0 ? 1 - normalizePercent(conflictRate) : 0) * 10 +
        normalizePercent(onTimeRatio) * 5,
    ),
    0,
    100,
  );

  let level: OrganizationTrustLevel = 'new';
  if (completedTasks >= 8 && score >= 82) {
    level = 'partner';
  } else if (completedTasks >= 3 && score >= 60) {
    level = 'verified';
  }

  if (level === 'partner') {
    return {
      score,
      level,
      label: 'Надежный партнер',
      description: 'История завершенных задач позволяет поднять верхнюю границу до +15%.',
      maxMultiplier: 1.15,
      maxExtraPercent: 15,
      completedTasks,
      confirmedResultRate: normalizePercent(confirmedResultRate),
      feedbackRate: normalizePercent(feedbackRate),
      cancellationRate: normalizePercent(cancellationRate),
      conflictRate: normalizePercent(conflictRate),
      onTimeRatio: normalizePercent(onTimeRatio),
    };
  }

  if (level === 'verified') {
    return {
      score,
      level,
      label: 'Проверенная организация',
      description: 'Система допускает аккуратное расширение верхней границы до +10%.',
      maxMultiplier: 1.1,
      maxExtraPercent: 10,
      completedTasks,
      confirmedResultRate: normalizePercent(confirmedResultRate),
      feedbackRate: normalizePercent(feedbackRate),
      cancellationRate: normalizePercent(cancellationRate),
      conflictRate: normalizePercent(conflictRate),
      onTimeRatio: normalizePercent(onTimeRatio),
    };
  }

  return {
    score,
    level: 'new',
    label: 'Новая организация',
    description: 'Доступен только системный диапазон без расширения верхней границы.',
    maxMultiplier: 1,
    maxExtraPercent: 0,
    completedTasks,
    confirmedResultRate: normalizePercent(confirmedResultRate),
    feedbackRate: normalizePercent(feedbackRate),
    cancellationRate: normalizePercent(cancellationRate),
    conflictRate: normalizePercent(conflictRate),
    onTimeRatio: normalizePercent(onTimeRatio),
  };
}

export function calculateTaskScorePreview(
  input: TaskScoringInput,
  trustProfile: OrganizationTrustProfile,
): TaskScorePreview {
  const breakdown: TaskScoreBreakdownItem[] = [
    {
      label: 'Базовая сложность',
      points: BASE_POINTS,
      description: 'Минимальный вес цифровой задачи с понятным результатом.',
    },
    {
      label: `Формат: ${input.format === 'online' ? 'онлайн' : input.format === 'hybrid' ? 'смешанная' : 'очная'}`,
      points: FORMAT_POINTS[input.format],
      description:
        input.format === 'online'
          ? 'Без обязательного выезда.'
          : input.format === 'hybrid'
            ? 'Есть очная часть или координация на месте.'
            : 'Нужен выезд или работа на площадке.',
    },
    {
      label: `Трудоемкость: ${TASK_WORKLOAD_LABELS[input.workload]}`,
      points: WORKLOAD_POINTS[input.workload],
      description: 'Чем больше времени занимает задача, тем выше рекомендуемая стоимость.',
    },
    {
      label: `Тип: ${TASK_TYPE_LABELS[input.taskType]}`,
      points: TASK_TYPE_POINTS[input.taskType],
      description: 'Сложные цифровые типы задач получают дополнительный вес.',
    },
    {
      label: `Срочность: ${TASK_URGENCY_LABELS[input.urgency]}`,
      points: URGENCY_POINTS[input.urgency],
      description:
        input.urgency === 'urgent'
          ? 'Сжатые сроки добавляют нагрузку на исполнителя.'
          : 'Стандартный срок без дополнительной надбавки.',
    },
    {
      label: 'Материалы от организации',
      points: input.requiresOrgMaterials ? MATERIALS_POINTS : 0,
      description:
        input.requiresOrgMaterials
          ? 'Нужна дополнительная координация с заказчиком и получение исходников.'
          : 'Исходники не требуются.',
    },
    {
      label: 'Очная проверка или выезд',
      points: input.requiresOnsiteCheck ? ONSITE_POINTS : 0,
      description:
        input.requiresOnsiteCheck
          ? 'Нужно учитывать коммуникацию и проверку на месте.'
          : 'Дополнительный выезд не нужен.',
    },
  ];

  const recommended = roundToTens(
    breakdown.reduce((sum, item) => sum + item.points, 0),
  );

  let spread = 10;
  if (input.workload === 'one_day') {
    spread = 20;
  } else if (input.workload === 'two_to_three_days') {
    spread = 30;
  } else if (input.workload === 'more_than_three_days') {
    spread = 40;
  }

  if (input.urgency === 'urgent') {
    spread += 10;
  }
  if (input.requiresOnsiteCheck) {
    spread += 10;
  }

  const minimum = Math.max(20, roundToTens(recommended - spread));
  const maximum = Math.max(minimum, roundToTens(recommended + spread));
  const allowedMaximum = Math.max(maximum, roundToTens(maximum * trustProfile.maxMultiplier));

  const explanation = breakdown.map((item) =>
    `${item.label}: ${item.points > 0 ? '+' : ''}${item.points} баллов. ${item.description}`,
  );

  if (trustProfile.maxExtraPercent > 0) {
    explanation.push(
      `${trustProfile.label}: верхнюю границу можно расширить до ${allowedMaximum} баллов.`,
    );
  } else {
    explanation.push(`Для новой организации верхняя граница не расширяется: максимум ${maximum} баллов.`);
  }

  return {
    minimum,
    recommended,
    maximum,
    allowedMaximum,
    breakdown,
    explanation,
  };
}
