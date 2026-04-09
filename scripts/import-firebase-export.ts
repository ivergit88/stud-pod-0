import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { initDb } from '../database';

type ExportDocument = {
  id: string;
  data: Record<string, any>;
};

function loadJsonFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function normalizeCollection(input: unknown): ExportDocument[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const objectItem = item as Record<string, any>;
        const explicitId =
          objectItem.id || objectItem.docId || objectItem.uid || objectItem._id;
        const payload =
          objectItem.data && typeof objectItem.data === 'object'
            ? objectItem.data
            : objectItem;

        if (!explicitId) {
          return null;
        }

        return {
          id: String(explicitId),
          data: payload,
        };
      })
      .filter(Boolean) as ExportDocument[];
  }

  if (input && typeof input === 'object') {
    return Object.entries(input as Record<string, any>).map(([id, data]) => ({
      id,
      data: data && typeof data === 'object' ? data : {},
    }));
  }

  return [];
}

function getCollection(exportDir: string, fileName: string) {
  return normalizeCollection(loadJsonFile(path.join(exportDir, fileName)));
}

async function upsertUser(
  user: ExportDocument,
  temporaryPasswordHash: string,
) {
  const db = await initDb();
  const data = user.data;
  const email = String(data.email || '').trim().toLowerCase();

  if (!email) {
    return false;
  }

  const name =
    String(data.name || '').trim() ||
    `${String(data.firstName || '').trim()} ${String(data.lastName || '').trim()}`.trim() ||
    email;

  await db.run(
    `
      INSERT INTO users (
        id, email, password_hash, role, name, points, university, course, skills,
        firstName, lastName, middleName, description, inn, address, contactPerson,
        phone, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        password_hash = excluded.password_hash,
        role = excluded.role,
        name = excluded.name,
        points = excluded.points,
        university = excluded.university,
        course = excluded.course,
        skills = excluded.skills,
        firstName = excluded.firstName,
        lastName = excluded.lastName,
        middleName = excluded.middleName,
        description = excluded.description,
        inn = excluded.inn,
        address = excluded.address,
        contactPerson = excluded.contactPerson,
        phone = excluded.phone,
        status = excluded.status,
        created_at = excluded.created_at
    `,
    [
      user.id,
      email,
      temporaryPasswordHash,
      data.role || 'student',
      name,
      Number(data.points || 0),
      data.university || '',
      data.course ? Number(data.course) : null,
      JSON.stringify(Array.isArray(data.skills) ? data.skills : []),
      data.firstName || '',
      data.lastName || '',
      data.middleName || '',
      data.description || '',
      data.inn || '',
      data.address || '',
      data.contactPerson || '',
      data.phone || '',
      data.status || (data.role === 'organization' ? 'moderation' : 'active'),
      data.createdAt || new Date().toISOString(),
    ],
  );

  return true;
}

async function upsertTask(task: ExportDocument) {
  const db = await initDb();
  const data = task.data;

  await db.run(
    `
      INSERT INTO tasks (
        id, title, description, requirements, organizationId, organizationName,
        category, pointsReward, deadline, status, location, executorId, coordinates, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        requirements = excluded.requirements,
        organizationId = excluded.organizationId,
        organizationName = excluded.organizationName,
        category = excluded.category,
        pointsReward = excluded.pointsReward,
        deadline = excluded.deadline,
        status = excluded.status,
        location = excluded.location,
        executorId = excluded.executorId,
        coordinates = excluded.coordinates,
        created_at = excluded.created_at
    `,
    [
      task.id,
      data.title || 'Без названия',
      data.description || '',
      data.requirements || '',
      data.organizationId || '',
      data.organizationName || '',
      data.category || 'Другое',
      Number(data.pointsReward || 0),
      data.deadline || '',
      data.status || 'open',
      data.location || '',
      data.executorId || null,
      null,
      data.createdAt || new Date().toISOString(),
    ],
  );
}

async function upsertTaskResponse(response: ExportDocument) {
  const db = await initDb();
  const data = response.data;

  await db.run(
    `
      INSERT INTO task_responses (
        id, taskId, studentId, studentName, status, coverLetter, submissionLink,
        reviewComment, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        taskId = excluded.taskId,
        studentId = excluded.studentId,
        studentName = excluded.studentName,
        status = excluded.status,
        coverLetter = excluded.coverLetter,
        submissionLink = excluded.submissionLink,
        reviewComment = excluded.reviewComment,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
    `,
    [
      response.id,
      data.taskId || '',
      data.studentId || '',
      data.studentName || '',
      data.status || 'submitted',
      data.coverLetter || '',
      data.submissionLink || '',
      data.reviewComment || '',
      data.createdAt || new Date().toISOString(),
      data.updatedAt || data.createdAt || new Date().toISOString(),
    ],
  );
}

async function upsertEvent(event: ExportDocument) {
  const db = await initDb();
  const data = event.data;

  await db.run(
    `
      INSERT INTO events (
        id, title, description, organizationId, organizationName, date,
        location, pointsReward, imageUrl, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        organizationId = excluded.organizationId,
        organizationName = excluded.organizationName,
        date = excluded.date,
        location = excluded.location,
        pointsReward = excluded.pointsReward,
        imageUrl = excluded.imageUrl,
        created_at = excluded.created_at
    `,
    [
      event.id,
      data.title || 'Без названия',
      data.description || '',
      data.organizationId || '',
      data.organizationName || '',
      data.date || '',
      data.location || '',
      Number(data.pointsReward || 0),
      data.imageUrl || '',
      data.createdAt || new Date().toISOString(),
    ],
  );
}

async function upsertEventRegistration(registration: ExportDocument) {
  const db = await initDb();
  const data = registration.data;

  await db.run(
    `
      INSERT INTO event_registrations (id, eventId, studentId, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        eventId = excluded.eventId,
        studentId = excluded.studentId,
        created_at = excluded.created_at
    `,
    [
      registration.id,
      data.eventId || '',
      data.studentId || '',
      data.createdAt || new Date().toISOString(),
    ],
  );
}

async function upsertProduct(product: ExportDocument) {
  const db = await initDb();
  const data = product.data;

  await db.run(
    `
      INSERT INTO products (id, title, description, price, category, imageUrl, stock, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        price = excluded.price,
        category = excluded.category,
        imageUrl = excluded.imageUrl,
        stock = excluded.stock,
        created_at = excluded.created_at
    `,
    [
      product.id,
      data.title || 'Без названия',
      data.description || '',
      Number(data.price || 0),
      data.category || 'Другое',
      data.imageUrl || '',
      Number(data.stock || 0),
      data.createdAt || new Date().toISOString(),
    ],
  );
}

async function upsertPurchase(purchase: ExportDocument) {
  const db = await initDb();
  const data = purchase.data;

  await db.run(
    `
      INSERT INTO purchases (id, productId, studentId, price, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        productId = excluded.productId,
        studentId = excluded.studentId,
        price = excluded.price,
        status = excluded.status,
        created_at = excluded.created_at
    `,
    [
      purchase.id,
      data.productId || '',
      data.studentId || '',
      Number(data.price || 0),
      data.status || 'pending',
      data.createdAt || new Date().toISOString(),
    ],
  );
}

async function upsertNotification(notification: ExportDocument) {
  const db = await initDb();
  const data = notification.data;

  await db.run(
    `
      INSERT INTO notifications (id, userId, title, message, read, type, link, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        userId = excluded.userId,
        title = excluded.title,
        message = excluded.message,
        read = excluded.read,
        type = excluded.type,
        link = excluded.link,
        created_at = excluded.created_at
    `,
    [
      notification.id,
      data.userId || '',
      data.title || 'Уведомление',
      data.message || '',
      data.read ? 1 : 0,
      data.type || 'info',
      data.link || '',
      data.createdAt || new Date().toISOString(),
    ],
  );
}

async function importCollection(
  name: string,
  records: ExportDocument[],
  handler: (record: ExportDocument) => Promise<boolean | void>,
) {
  let imported = 0;

  for (const record of records) {
    const result = await handler(record);
    if (result !== false) {
      imported += 1;
    }
  }

  console.log(`${name}: ${imported}`);
}

async function main() {
  const exportDir = path.resolve(
    process.cwd(),
    process.argv[2] || 'migration/firebase-export',
  );

  if (!fs.existsSync(exportDir)) {
    console.error(`Папка с экспортом не найдена: ${exportDir}`);
    process.exit(1);
  }

  const migrationPassword =
    process.env.MIGRATION_DEFAULT_PASSWORD || 'StudPod2026!';
  const temporaryPasswordHash = await bcrypt.hash(migrationPassword, 10);

  await initDb();

  console.log(`Импорт из: ${exportDir}`);
  console.log('Временный пароль для импортированных пользователей взят из MIGRATION_DEFAULT_PASSWORD');

  await importCollection('users', getCollection(exportDir, 'users.json'), (record) =>
    upsertUser(record, temporaryPasswordHash),
  );
  await importCollection('tasks', getCollection(exportDir, 'tasks.json'), upsertTask);
  await importCollection(
    'taskResponses',
    getCollection(exportDir, 'taskResponses.json'),
    upsertTaskResponse,
  );
  await importCollection('events', getCollection(exportDir, 'events.json'), upsertEvent);
  await importCollection(
    'eventRegistrations',
    getCollection(exportDir, 'eventRegistrations.json'),
    upsertEventRegistration,
  );
  await importCollection('products', getCollection(exportDir, 'products.json'), upsertProduct);
  await importCollection('purchases', getCollection(exportDir, 'purchases.json'), upsertPurchase);
  await importCollection(
    'notifications',
    getCollection(exportDir, 'notifications.json'),
    upsertNotification,
  );

  console.log('Импорт завершен.');
}

main().catch((error) => {
  console.error('Ошибка импорта:', error);
  process.exit(1);
});
