import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type AppDatabase = Database<sqlite3.Database, sqlite3.Statement>;

let dbPromise: Promise<AppDatabase> | null = null;

async function ensureColumn(
  db: AppDatabase,
  tableName: string,
  columnName: string,
  definition: string,
) {
  const columns = await db.all<{ name: string }[]>(`PRAGMA table_info(${tableName})`);
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function createDb() {
  const databasePath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(__dirname, 'database.sqlite');

  const db = await open({
    filename: databasePath,
    driver: sqlite3.Database,
  });

  await db.exec('PRAGMA foreign_keys = ON');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      university TEXT,
      course INTEGER,
      skills TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      organizationId TEXT NOT NULL,
      organizationName TEXT NOT NULL,
      category TEXT NOT NULL,
      format TEXT DEFAULT 'online',
      workload TEXT DEFAULT 'up_to_3_hours',
      taskType TEXT DEFAULT 'other',
      urgency TEXT DEFAULT 'normal',
      requiresOrgMaterials INTEGER DEFAULT 0,
      requiresOnsiteCheck INTEGER DEFAULT 0,
      slug TEXT,
      pointsReward INTEGER NOT NULL,
      pointsMin INTEGER,
      pointsRecommended INTEGER,
      pointsMax INTEGER,
      pointsExplanation TEXT,
      taskKind TEXT DEFAULT 'single',
      parentTaskId TEXT,
      childOrder INTEGER DEFAULT 0,
      deadline TEXT NOT NULL,
      status TEXT NOT NULL,
      location TEXT,
      materialsLink TEXT,
      coordinates TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS task_responses (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      status TEXT NOT NULL,
      coverLetter TEXT,
      submissionLink TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES tasks(id),
      FOREIGN KEY (studentId) REFERENCES users(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS task_response_members (
      id TEXT PRIMARY KEY,
      responseId TEXT NOT NULL,
      taskId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (responseId) REFERENCES task_responses(id),
      FOREIGN KEY (taskId) REFERENCES tasks(id),
      FOREIGN KEY (studentId) REFERENCES users(id),
      UNIQUE (responseId, studentId),
      UNIQUE (taskId, studentId)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      organizationId TEXT NOT NULL,
      organizationName TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      coordinates TEXT,
      pointsReward INTEGER NOT NULL,
      imageUrl TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (eventId) REFERENCES events(id),
      FOREIGN KEY (studentId) REFERENCES users(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      imageUrl TEXT,
      stock INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      price INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (productId) REFERENCES products(id),
      FOREIGN KEY (studentId) REFERENCES users(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  await ensureColumn(db, 'users', 'firstName', 'TEXT');
  await ensureColumn(db, 'users', 'lastName', 'TEXT');
  await ensureColumn(db, 'users', 'middleName', 'TEXT');
  await ensureColumn(db, 'users', 'description', 'TEXT');
  await ensureColumn(db, 'users', 'inn', 'TEXT');
  await ensureColumn(db, 'users', 'address', 'TEXT');
  await ensureColumn(db, 'users', 'contactPerson', 'TEXT');
  await ensureColumn(db, 'users', 'phone', 'TEXT');
  await ensureColumn(db, 'users', 'status', "TEXT DEFAULT 'active'");

  await ensureColumn(db, 'tasks', 'requirements', 'TEXT');
  await ensureColumn(db, 'tasks', 'executorId', 'TEXT');
  await ensureColumn(db, 'tasks', 'attachments', 'TEXT');
  await ensureColumn(db, 'tasks', 'materialsLink', 'TEXT');
  await ensureColumn(db, 'tasks', 'format', "TEXT DEFAULT 'online'");
  await ensureColumn(db, 'tasks', 'workload', "TEXT DEFAULT 'up_to_3_hours'");
  await ensureColumn(db, 'tasks', 'taskType', "TEXT DEFAULT 'other'");
  await ensureColumn(db, 'tasks', 'urgency', "TEXT DEFAULT 'normal'");
  await ensureColumn(db, 'tasks', 'requiresOrgMaterials', 'INTEGER DEFAULT 0');
  await ensureColumn(db, 'tasks', 'requiresOnsiteCheck', 'INTEGER DEFAULT 0');
  await ensureColumn(db, 'tasks', 'slug', 'TEXT');
  await ensureColumn(db, 'tasks', 'pointsMin', 'INTEGER');
  await ensureColumn(db, 'tasks', 'pointsRecommended', 'INTEGER');
  await ensureColumn(db, 'tasks', 'pointsMax', 'INTEGER');
  await ensureColumn(db, 'tasks', 'pointsExplanation', 'TEXT');
  await ensureColumn(db, 'tasks', 'taskKind', "TEXT DEFAULT 'single'");
  await ensureColumn(db, 'tasks', 'parentTaskId', 'TEXT');
  await ensureColumn(db, 'tasks', 'childOrder', 'INTEGER DEFAULT 0');

  await ensureColumn(db, 'task_responses', 'reviewComment', 'TEXT');
  await ensureColumn(db, 'task_responses', 'updated_at', 'DATETIME');
  await ensureColumn(db, 'events', 'coordinates', 'TEXT');

  await ensureColumn(db, 'notifications', 'link', 'TEXT');
  await ensureColumn(db, 'notifications', 'type', "TEXT DEFAULT 'info'");

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organizationId);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parentTaskId);
    CREATE INDEX IF NOT EXISTS idx_tasks_kind ON tasks(taskKind);
    CREATE INDEX IF NOT EXISTS idx_task_responses_task ON task_responses(taskId);
    CREATE INDEX IF NOT EXISTS idx_task_responses_student ON task_responses(studentId);
    CREATE INDEX IF NOT EXISTS idx_task_response_members_response ON task_response_members(responseId);
    CREATE INDEX IF NOT EXISTS idx_task_response_members_task_student ON task_response_members(taskId, studentId);
    CREATE INDEX IF NOT EXISTS idx_task_response_members_student ON task_response_members(studentId);
    CREATE INDEX IF NOT EXISTS idx_events_org ON events(organizationId);
    CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(eventId);
    CREATE INDEX IF NOT EXISTS idx_event_registrations_student ON event_registrations(studentId);
    CREATE INDEX IF NOT EXISTS idx_purchases_student ON purchases(studentId);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
  `);

  await db.exec(`
    INSERT INTO task_response_members (id, responseId, taskId, studentId, studentName, role, created_at)
    SELECT
      lower(hex(randomblob(16))),
      tr.id,
      tr.taskId,
      tr.studentId,
      tr.studentName,
      'leader',
      COALESCE(tr.created_at, CURRENT_TIMESTAMP)
    FROM task_responses tr
    WHERE NOT EXISTS (
      SELECT 1
      FROM task_response_members trm
      WHERE trm.responseId = tr.id
        AND trm.studentId = tr.studentId
    )
  `);

  return db;
}

export async function initDb() {
  if (!dbPromise) {
    dbPromise = createDb();
  }

  return dbPromise;
}
