import dotenv from 'dotenv';
import { initDb } from '../database';

dotenv.config();

type Row = Record<string, unknown>;

const [, , command = 'help', ...args] = process.argv;

function usage() {
  console.log(`
Управление базой "Студенческого подряда"

Команды:
  stats                         общая статистика платформы
  users [поиск]                 список пользователей, можно искать по ФИО/email/роли/статусу
  products                      список товаров магазина
  block <email|id>              заблокировать пользователя
  unblock <email|id>            разблокировать пользователя

Примеры:
  npm run db -- stats
  npm run db -- users student
  npm run db -- block ivan.petrov@example.ru
  npm run db -- unblock demo-student-001

Важно для сервера:
  DATABASE_PATH=/root/stud-pod-data/database.sqlite npm run db -- stats
`.trim());
}

function printTable(rows: Row[]) {
  if (rows.length === 0) {
    console.log('Записей не найдено.');
    return;
  }

  console.table(rows);
}

async function findUser(identifier: string) {
  const db = await initDb();
  const normalized = identifier.trim().toLowerCase();

  return db.get(
    `
      SELECT id, email, role, name, status, points, created_at
      FROM users
      WHERE id = ? OR lower(email) = ?
      LIMIT 1
    `,
    [identifier.trim(), normalized],
  );
}

async function showStats() {
  const db = await initDb();
  const stats = await db.get(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
      (SELECT COUNT(*) FROM users WHERE role = 'organization') AS organizations,
      (SELECT COUNT(*) FROM users WHERE status = 'blocked') AS blockedUsers,
      (SELECT COUNT(*) FROM tasks WHERE status IN ('open', 'in_progress', 'review')) AS activeTasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'completed') AS completedTasks,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM purchases) AS purchases
  `);

  printTable([stats]);
}

async function showUsers(search?: string) {
  const db = await initDb();
  const query = String(search || '').trim().toLowerCase();

  const rows = query
    ? await db.all(
        `
          SELECT id, name, email, role, status, points, university, course, created_at
          FROM users
          WHERE lower(name) LIKE ?
            OR lower(email) LIKE ?
            OR lower(role) LIKE ?
            OR lower(COALESCE(status, '')) LIKE ?
          ORDER BY created_at DESC
          LIMIT 100
        `,
        [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`],
      )
    : await db.all(
        `
          SELECT id, name, email, role, status, points, university, course, created_at
          FROM users
          ORDER BY created_at DESC
          LIMIT 100
        `,
      );

  printTable(rows);
}

async function showProducts() {
  const db = await initDb();
  const rows = await db.all(
    `
      SELECT id, title, price, category, stock, imageUrl, created_at
      FROM products
      ORDER BY created_at DESC
    `,
  );

  printTable(rows);
}

async function setUserStatus(identifier: string | undefined, status: 'active' | 'blocked') {
  if (!identifier) {
    throw new Error(`Укажите email или id пользователя для статуса "${status}".`);
  }

  const db = await initDb();
  const user = await findUser(identifier);

  if (!user) {
    throw new Error(`Пользователь не найден: ${identifier}`);
  }

  await db.run('UPDATE users SET status = ? WHERE id = ?', [status, user.id]);
  const updated = await db.get(
    'SELECT id, name, email, role, status, points, created_at FROM users WHERE id = ?',
    user.id,
  );

  printTable([updated]);
}

async function main() {
  switch (command) {
    case 'stats':
      await showStats();
      break;
    case 'users':
      await showUsers(args.join(' '));
      break;
    case 'products':
      await showProducts();
      break;
    case 'block':
      await setUserStatus(args[0], 'blocked');
      break;
    case 'unblock':
      await setUserStatus(args[0], 'active');
      break;
    case 'help':
    case '--help':
    case '-h':
      usage();
      break;
    default:
      usage();
      throw new Error(`Неизвестная команда: ${command}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
