import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { initDb } from '../database.ts';

const TOTAL_STUDENTS_TARGET = 64;
const ADMIN_EMAIL = 'ershovivan2802@yandex.ru';

async function main() {
  const db = await initDb();
  const hash = await bcrypt.hash('AdminPass2026!', 10);
  const now = new Date().toISOString();

  // Ensure admin exists
  await db.run(
    `INSERT OR IGNORE INTO users (id, email, password_hash, role, name, points, university, course, skills, firstName, lastName, middleName, description, status, created_at) VALUES (?, ?, ?, 'admin', ?, 0, '', null, '[]', ?, ?, '', '', 'active', ?)`,
    ['admin-main-001', ADMIN_EMAIL, hash, 'Иван Ершов', 'Иван', 'Ершов', now],
  );

  // Products
  for (const p of [
    { id: 'merch-hoodie-001', title: 'Худи «НЕЙМАРК Университет»', desc: 'Чёрная толстовка с белой эмблемой оленя и текстом «НЕЙМАРК Университет»', price: 1000, category: 'Мерч', imageUrl: '/rewards/partner-merch.png', stock: 25 },
    { id: 'merch-tshirt-001', title: 'Футболка «НЕЙМАРК Университет»', desc: 'Чёрная футболка с белой эмблемой оленя и текстом «НЕЙМАРК Университет»', price: 1000, category: 'Мерч', imageUrl: '/rewards/partner-merch.png', stock: 25 },
  ]) {
    await db.run(
      `INSERT OR IGNORE INTO products (id, title, description, price, category, imageUrl, stock, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.title, p.desc, p.price, p.category, p.imageUrl, p.stock, now],
    );
  }

  // Ensure appeals column
  await db.exec('ALTER TABLE task_responses ADD COLUMN appealed INTEGER DEFAULT 0');

  // Count current students
  const countRow = await db.get<{ total: number }>("SELECT COUNT(*) AS total FROM users WHERE role = 'student'");
  const current = Number(countRow?.total || 0);
  const needed = Math.max(0, TOTAL_STUDENTS_TARGET - current);
  console.log(`Current students: ${current}, adding ${needed} to reach ~${current + needed}`);

  // Generate extra students quickly
  const universities = ['ННГУ им. Лобачевского', 'НГТУ им. Алексеева', 'НГЛУ им. Добролюбова', 'НГПУ им. Минина', 'Университет Неймарк'];
  const skillsPool = ['Дизайн', 'Веб-разработка', 'Тексты и переводы', 'Программирование', 'Видео и аудио', 'Социальные сети', 'Оцифровка', 'Аналитика'];
  for (let i = 0; i < needed; i++) {
    const idx = current + i + 1;
    const email = `demo.student${String(idx).padStart(3, '0')}@demo.ru`;
    const first = 'Студент';
    const last = `Демо${String(idx).padStart(3, '0')}`;
    const univ = universities[i % universities.length];
    const course = 1 + (i % 3);
    const skills = skillsPool.slice(0, 1 + (i % 3));
    await db.run(
      `INSERT OR IGNORE INTO users (id, email, password_hash, role, name, points, university, course, skills, firstName, lastName, middleName, description, status, created_at) VALUES (?, ?, ?, 'student', ?, 0, ?, ?, ?, ?, ?, '', '', 'active', ?)`,
      [`demo-student-extra-${String(idx).padStart(3, '0')}`, email, hash, `${first} ${last}`, univ, course, JSON.stringify(skills), first, last, now],
    );
  }

  // Demo completed tasks (12) and responses linked to first 12 students
  const demoTaskNames = ['Оцифровка каталога музея', 'Создание лендинга выставки', 'Редизайн афиши мероприятия', 'Оформление постов в соцсети', 'Проверка мобильной версии', 'Перевод описания выставки', 'Создание презентации для занятий', 'Структурирование списка экспонатов', 'Дизайн баннера для сайта', 'Разработка простого бота FAQ', 'Сбор данных для отчёта', 'Редактура описаний экспонатов'];
  for (const [i, title] of demoTaskNames.entries()) {
    const taskId = `demo-task-${String(i + 1).padStart(3, '0')}`;
    const studentId = `demo-student-${String(i + 1).padStart(3, '0')}`;
    await db.run(
      `INSERT OR IGNORE INTO tasks (id, title, description, organizationId, organizationName, status, pointsReward, category, format, workload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [taskId, title, 'Описание задачи для демонстрации.', `org-${1 + (i % 3)}`, ['ННГУ им. Лобачевского', 'НГТУ им. Алексеева', 'Музей истории города'][i % 3], 'completed', 50 + (i * 10), 'Дизайн', 'online', 'one_day', now],
    );
    await db.run(
      `INSERT OR IGNORE INTO task_responses (id, taskId, studentId, studentName, status, coverLetter, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [`resp-completed-${String(i + 1).padStart(3, '0')}`, taskId, studentId, `Студент ${i + 1}`, 'completed', 'Выполнено в срок.', now, now],
    );
    await db.run(
      `INSERT OR IGNORE INTO task_response_members (id, responseId, taskId, studentId, studentName, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`member-completed-${String(i + 1).padStart(3, '0')}`, `resp-completed-${String(i + 1).padStart(3, '0')}`, taskId, studentId, `Студент ${i + 1}`, 'leader', now],
    );
  }

  // Stats
  const statsRow = await db.get(`SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
    (SELECT COUNT(*) FROM users WHERE role = 'organization') AS orgs,
    (SELECT COUNT(*) FROM tasks WHERE status = 'completed') AS completed,
    (SELECT COUNT(*) FROM tasks WHERE status IN ('open','in_progress','review')) AS active,
    (SELECT COUNT(*) FROM task_responses) AS responses,
    (SELECT COALESCE(SUM(points), 0) FROM users WHERE role = 'student') AS points`);
  console.log('Demo seed extra complete:', statsRow);
}
main().catch((e) => { console.error(e); process.exit(1); });
