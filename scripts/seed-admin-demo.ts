import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { initDb } from '../database.ts';

async function main() {
  const db = await initDb();
  const passwordHash = await bcrypt.hash('AdminPass2026!', 10);
  const createdAt = new Date().toISOString();

  // Admin user
  await db.run(
    `INSERT OR IGNORE INTO users (id, email, password_hash, role, name, points, university, course, skills, firstName, lastName, middleName, description, status, created_at) VALUES (?, ?, ?, 'admin', ?, 0, '', null, '[]', ?, ?, '', '', 'active', ?)`,
    [
      'admin-main-001',
      'ershovivan2802@yandex.ru',
      passwordHash,
      'Иван Ершов',
      'Иван',
      'Ершов',
      '',
      createdAt,
    ],
  );

  // Merchandise products
  for (const prod of [
    { id: 'merch-hoodie-001', title: 'Худи «НЕЙМАРК Университет»', desc: 'Чёрная толстовка с белой эмблемой оленя и текстом «НЕЙМАРК Университет»', price: 1000, category: 'Мерч', imageUrl: '/merch/hoodie.jpg', stock: 25 },
    { id: 'merch-tshirt-001', title: 'Футболка «НЕЙМАРК Университет»', desc: 'Чёрная футболка с белой эмблемой оленя и текстом «НЕЙМАРК Университет»', price: 1000, category: 'Мерч', imageUrl: '/merch/tshirt.jpg', stock: 25 },
  ]) {
    await db.run(
      `INSERT OR IGNORE INTO products (id, title, description, price, category, imageUrl, stock, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [prod.id, prod.title, prod.desc, prod.price, prod.category, prod.imageUrl, prod.stock, createdAt],
    );
  }

  // Ensure appeal column exists (for task_responses)
  await db.exec('ALTER TABLE task_responses ADD COLUMN appealed INTEGER DEFAULT 0');

  // Add extra demo students to reach ~64 total (existing seed has ~30)
  const extraNames = [
    'Андрей Смирнов', 'Валерия Павлова', 'Дмитрий Ковалев', 'Елена Федорова',
    'Григорий Нестеров', 'Инна Романова', 'Кирилл Беляев', 'Людмила Кузьмина',
    'Михаил Тарасов', 'Наталья Борисова', 'Олег Захаров', 'Петр Лебедев',
    'Раиса Громова', 'Станислав Мельников', 'Тамара Осипова', 'Ульяна Медведева',
    'Федор Давыдов', 'Ярослав Ковалев', 'Алина Морозова', 'Борис Фролов',
    'Виктория Панова', 'Глеб Федоров', 'Дарья Морозова', 'Зинаида Кириллова',
    'Игорь Соловьев', 'Константин Лазарев', 'Лариса Фомина', 'Максим Попов',
    'Николай Иванов', 'Ольга Павлова', 'Павел Лебедев', 'Роман Андреев',
    'Сергей Гаврилов', 'Тимофей Смирнов', 'Ульяна Маслова', 'Федор Соловьев',
  ];
  for (let i = 0; i < extraNames.length; i++) {
    const [first, last] = extraNames[i].split(' ');
    const id = `demo-student-extra-${String(i + 31).padStart(3, '0')}`;
    const email = `extra.${String(i + 31)}@demo.ru`;
    await db.run(
      `INSERT OR IGNORE INTO users (id, email, password_hash, role, name, points, university, course, skills, firstName, lastName, middleName, description, status, created_at) VALUES (?, ?, ?, 'student', ?, 0, 'ННГУ им. Лобачевского', 2, '[]', ?, ?, '', '', 'active', ?)`,
      [id, email, passwordHash, extraNames[i], first, last, createdAt],
    );
  }

  // Demo completed responses (12) linked to demo students and open/organization tasks
  const completedIds = [
    'resp-completed-001', 'resp-completed-002', 'resp-completed-003',
    'resp-completed-004', 'resp-completed-005', 'resp-completed-006',
    'resp-completed-007', 'resp-completed-008', 'resp-completed-009',
    'resp-completed-010', 'resp-completed-011', 'resp-completed-012',
  ];
  for (const [i, respId] of completedIds.entries()) {
    const taskId = `demo-task-${String(i + 1).padStart(3, '0')}`;
    await db.run(
      `INSERT OR IGNORE INTO task_responses (id, taskId, studentId, studentName, status, coverLetter, submissionLink, reviewComment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        respId,
        taskId,
        `demo-student-${String(i + 1).padStart(3, '0')}`,
        `Студент ${i + 1}`,
        'completed',
        'Работа выполнена в срок.',
        'https://example.com/result',
        'Отлично выполнено.',
        createdAt,
        createdAt,
      ],
    );
    await db.run(
      `INSERT OR IGNORE INTO task_response_members (id, responseId, taskId, studentId, studentName, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `member-${respId}`,
        respId,
        taskId,
        `demo-student-${String(i + 1).padStart(3, '0')}`,
        `Студент ${i + 1}`,
        'leader',
        createdAt,
      ],
    );
    // Set corresponding task status to completed
    await db.run(
      `UPDATE tasks SET status = 'completed' WHERE id = ?`,
      [taskId],
    );
  }

  console.log('Admin/demo seed complete: admin user, 2 merch products, extra students, 12 completed responses, appeal column added.');
}

main().catch((e) => { console.error(e); process.exit(1); });
