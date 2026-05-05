import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { initDb } from '../database.ts';

type DemoStudent = {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  university: string;
  course: number;
  skills: string[];
  description: string;
};

const students: DemoStudent[] = [
  { firstName: 'Иван', lastName: 'Петров', middleName: 'Алексеевич', email: 'ivan.petrov26@mail.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 2, skills: ['HTML/CSS', 'лендинги', 'тестирование'], description: 'Интересуется веб-страницами для культурных событий и проверкой интерфейсов.' },
  { firstName: 'Анна', lastName: 'Соколова', middleName: 'Игоревна', email: 'anna.sokolova.media@yandex.ru', university: 'Университет Неймарк', course: 1, skills: ['SMM', 'тексты', 'Canva'], description: 'Готова помогать с публикациями, афишами и описаниями мероприятий.' },
  { firstName: 'Максим', lastName: 'Кузнецов', middleName: 'Денисович', email: 'max.kuznetsov.it@mail.ru', university: 'НГТУ им. Р. Е. Алексеева', course: 3, skills: ['React', 'формы', 'адаптивная верстка'], description: 'Делает простые веб-формы, карточки событий и исправления мобильной версии.' },
  { firstName: 'Дарья', lastName: 'Морозова', middleName: 'Сергеевна', email: 'daria.morozova.design@yandex.ru', university: 'НГПУ им. К. Минина', course: 2, skills: ['дизайн афиш', 'Figma', 'соцсети'], description: 'Работает с визуальными материалами для библиотек, музеев и домов культуры.' },
  { firstName: 'Артем', lastName: 'Васильев', middleName: 'Олегович', email: 'artem.vasiliev.dev@mail.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 2, skills: ['JavaScript', 'чат-боты', 'интеграции'], description: 'Хочет брать задачи по ботам, виджетам и небольшим автоматизациям.' },
  { firstName: 'Мария', lastName: 'Новикова', middleName: 'Павловна', email: 'maria.novikova.content@mail.ru', university: 'Университет Неймарк', course: 1, skills: ['копирайтинг', 'редактура', 'структура ТЗ'], description: 'Помогает превращать сырые материалы учреждения в понятные тексты.' },
  { firstName: 'Никита', lastName: 'Смирнов', middleName: 'Андреевич', email: 'nikita.smirnov.web@yandex.ru', university: 'НГТУ им. Р. Е. Алексеева', course: 3, skills: ['верстка', 'Git', 'доступность'], description: 'Берет задачи по страницам мероприятий, исправлению верстки и контраста.' },
  { firstName: 'Екатерина', lastName: 'Орлова', middleName: 'Викторовна', email: 'ekaterina.orlova.smm@mail.ru', university: 'НГЛУ им. Н. А. Добролюбова', course: 2, skills: ['SMM', 'презентации', 'тексты'], description: 'Готовит посты, презентации и понятные карточки для посетителей.' },
  { firstName: 'Даниил', lastName: 'Федоров', middleName: 'Ильич', email: 'danil.fedorov.code@yandex.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 1, skills: ['Python', 'таблицы', 'обработка данных'], description: 'Интересуется оцифровкой списков, таблицами и простыми скриптами.' },
  { firstName: 'Полина', lastName: 'Егорова', middleName: 'Романовна', email: 'polina.egorova.design@mail.ru', university: 'НГПУ им. К. Минина', course: 3, skills: ['Figma', 'брендинг', 'афиши'], description: 'Прорабатывает визуальный стиль афиш, баннеров и карточек мероприятий.' },
  { firstName: 'Кирилл', lastName: 'Попов', middleName: 'Максимович', email: 'kirill.popov.web@yandex.ru', university: 'Университет Неймарк', course: 2, skills: ['HTML/CSS', 'адаптив', 'лендинги'], description: 'Готов делать небольшие страницы и проверять их отображение на телефоне.' },
  { firstName: 'Алина', lastName: 'Зайцева', middleName: 'Дмитриевна', email: 'alina.zaitseva.media@mail.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 1, skills: ['контент', 'интервью', 'соцсети'], description: 'Помогает оформлять новости, описания выставок и материалы для VK.' },
  { firstName: 'Глеб', lastName: 'Николаев', middleName: 'Станиславович', email: 'gleb.nikolaev.qa@yandex.ru', university: 'НГТУ им. Р. Е. Алексеева', course: 2, skills: ['тестирование', 'чек-листы', 'мобильная проверка'], description: 'Проверяет сайты учреждений, формы заявок и понятность интерфейса.' },
  { firstName: 'Софья', lastName: 'Крылова', middleName: 'Артемовна', email: 'sofia.krylova.art@mail.ru', university: 'НГПУ им. К. Минина', course: 2, skills: ['иллюстрации', 'афиши', 'Canva'], description: 'Создает визуальные материалы для анонсов, кружков и выставок.' },
  { firstName: 'Роман', lastName: 'Андреев', middleName: 'Евгеньевич', email: 'roman.andreev.bot@yandex.ru', university: 'Университет Неймарк', course: 3, skills: ['чат-боты', 'JavaScript', 'API'], description: 'Готов собирать простых помощников для FAQ и записи на мероприятия.' },
  { firstName: 'Виктория', lastName: 'Белова', middleName: 'Александровна', email: 'vika.belova.content@mail.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 1, skills: ['тексты', 'редактура', 'презентации'], description: 'Структурирует описания проектов, мероприятий и музейных материалов.' },
  { firstName: 'Степан', lastName: 'Громов', middleName: 'Никитич', email: 'stepan.gromov.data@yandex.ru', university: 'НГТУ им. Р. Е. Алексеева', course: 3, skills: ['Excel', 'таблицы', 'аналитика'], description: 'Берет задачи по структуре данных, спискам и отчетным таблицам.' },
  { firstName: 'Ксения', lastName: 'Тихонова', middleName: 'Олеговна', email: 'ksenia.tihonova.smm@mail.ru', university: 'НГЛУ им. Н. А. Добролюбова', course: 2, skills: ['SMM', 'план публикаций', 'визуал'], description: 'Помогает с контент-планами, текстами и оформлением постов.' },
  { firstName: 'Илья', lastName: 'Лебедев', middleName: 'Валерьевич', email: 'ilya.lebedev.front@yandex.ru', university: 'Университет Неймарк', course: 2, skills: ['React', 'верстка', 'UI'], description: 'Интересуется интерфейсами, карточками задач и страницами мероприятий.' },
  { firstName: 'Елизавета', lastName: 'Гусева', middleName: 'Михайловна', email: 'liza.guseva.design@mail.ru', university: 'НГПУ им. К. Минина', course: 1, skills: ['дизайн', 'баннеры', 'типографика'], description: 'Делает аккуратные макеты афиш, буклетов и постов для соцсетей.' },
  { firstName: 'Тимофей', lastName: 'Семенов', middleName: 'Петрович', email: 'tim.semenov.qa@mail.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 2, skills: ['тестирование', 'документация', 'формы'], description: 'Проверяет пользовательские сценарии и описывает ошибки понятным языком.' },
  { firstName: 'Анастасия', lastName: 'Козлова', middleName: 'Ильинична', email: 'nastya.kozlova.media@yandex.ru', university: 'Университет Неймарк', course: 3, skills: ['монтаж', 'соцсети', 'презентации'], description: 'Готовит короткие видео, обложки и презентационные материалы.' },
  { firstName: 'Матвей', lastName: 'Соловьев', middleName: 'Романович', email: 'matvey.soloviev.web@mail.ru', university: 'НГТУ им. Р. Е. Алексеева', course: 1, skills: ['HTML', 'CSS', 'лендинги'], description: 'Берет простые задачи по верстке блоков и страниц событий.' },
  { firstName: 'Варвара', lastName: 'Макарова', middleName: 'Денисовна', email: 'varvara.makarova.text@yandex.ru', university: 'НГЛУ им. Н. А. Добролюбова', course: 2, skills: ['редактура', 'английский', 'анонсы'], description: 'Помогает с текстами для афиш, страниц и информационных материалов.' },
  { firstName: 'Павел', lastName: 'Иванов', middleName: 'Сергеевич', email: 'pavel.ivanov.dev@mail.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 3, skills: ['Node.js', 'API', 'формы'], description: 'Интересуется небольшими сервисами, формами обратной связи и интеграциями.' },
  { firstName: 'Юлия', lastName: 'Алексеева', middleName: 'Николаевна', email: 'yulia.alekseeva.design@yandex.ru', university: 'НГПУ им. К. Минина', course: 1, skills: ['Canva', 'Figma', 'афиши'], description: 'Готова оформлять визуальные материалы под события учреждений.' },
  { firstName: 'Дмитрий', lastName: 'Михайлов', middleName: 'Артурович', email: 'dmitry.mikhailov.it@mail.ru', university: 'Университет Неймарк', course: 2, skills: ['Python', 'таблицы', 'скрипты'], description: 'Автоматизирует повторяющиеся задачи и помогает с обработкой материалов.' },
  { firstName: 'Надежда', lastName: 'Романова', middleName: 'Владимировна', email: 'nadezhda.romanova.smm@yandex.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 2, skills: ['контент-план', 'соцсети', 'тексты'], description: 'Готовит контент для групп учреждений и описания мероприятий.' },
  { firstName: 'Владислав', lastName: 'Комаров', middleName: 'Игоревич', email: 'vlad.komarov.web@mail.ru', university: 'НГТУ им. Р. Е. Алексеева', course: 1, skills: ['адаптив', 'CSS', 'тестирование'], description: 'Исправляет мобильное отображение и проверяет страницы на разных экранах.' },
  { firstName: 'Ольга', lastName: 'Павлова', middleName: 'Евгеньевна', email: 'olga.pavlova.content@yandex.ru', university: 'НГЛУ им. Н. А. Добролюбова', course: 3, skills: ['тексты', 'перевод', 'редактура'], description: 'Помогает с информационными текстами и структурой описаний.' },
  { firstName: 'Егор', lastName: 'Тарасов', middleName: 'Андреевич', email: 'egor.tarasov.bot@mail.ru', university: 'Университет Неймарк', course: 2, skills: ['боты VK', 'JavaScript', 'FAQ'], description: 'Делает простых ботов для частых вопросов посетителей.' },
  { firstName: 'Милана', lastName: 'Фролова', middleName: 'Станиславовна', email: 'milana.frolova.media@yandex.ru', university: 'НГПУ им. К. Минина', course: 1, skills: ['медиа', 'афиши', 'презентации'], description: 'Оформляет презентации, карточки мероприятий и визуальные анонсы.' },
  { firstName: 'Александр', lastName: 'Воробьев', middleName: 'Максимович', email: 'alex.vorobev.qa@mail.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 2, skills: ['QA', 'чек-листы', 'UX'], description: 'Проверяет сценарии пользователей и пишет понятные рекомендации.' },
  { firstName: 'Таисия', lastName: 'Захарова', middleName: 'Олеговна', email: 'taisia.zaharova.design@yandex.ru', university: 'НГПУ им. К. Минина', course: 3, skills: ['визуальный стиль', 'Figma', 'афиши'], description: 'Разрабатывает шаблоны постов, баннеры и материалы для печати.' },
  { firstName: 'Михаил', lastName: 'Борисов', middleName: 'Дмитриевич', email: 'mikhail.borisov.data@mail.ru', university: 'НГТУ им. Р. Е. Алексеева', course: 1, skills: ['Excel', 'данные', 'оцифровка'], description: 'Готов переносить архивные списки в таблицы и приводить данные в порядок.' },
  { firstName: 'Арина', lastName: 'Виноградова', middleName: 'Игоревна', email: 'arina.vinogradova.text@yandex.ru', university: 'НГЛУ им. Н. А. Добролюбова', course: 2, skills: ['редактура', 'описания', 'интервью'], description: 'Пишет описания выставок, кружков и культурных событий.' },
  { firstName: 'Ярослав', lastName: 'Ковалев', middleName: 'Павлович', email: 'yaroslav.kovalev.front@mail.ru', university: 'Университет Неймарк', course: 3, skills: ['React', 'доступность', 'верстка'], description: 'Делает интерфейсные правки и следит за читаемостью на сайте.' },
  { firstName: 'Вероника', lastName: 'Медведева', middleName: 'Александровна', email: 'veronika.medvedeva.smm@yandex.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 1, skills: ['SMM', 'обложки', 'тексты'], description: 'Готовит публикации и визуальные материалы для анонсов.' },
  { firstName: 'Лев', lastName: 'Осипов', middleName: 'Романович', email: 'lev.osipov.dev@mail.ru', university: 'НГТУ им. Р. Е. Алексеева', course: 2, skills: ['JavaScript', 'формы', 'виджеты'], description: 'Берет задачи по интерактивным элементам и простым веб-виджетам.' },
  { firstName: 'Кристина', lastName: 'Сергеева', middleName: 'Денисовна', email: 'kristina.sergeeva.design@yandex.ru', university: 'НГПУ им. К. Минина', course: 2, skills: ['брендинг', 'презентации', 'Figma'], description: 'Оформляет презентационные материалы и единый стиль событий.' },
  { firstName: 'Руслан', lastName: 'Мельников', middleName: 'Ильич', email: 'ruslan.melnikov.web@mail.ru', university: 'Университет Неймарк', course: 1, skills: ['HTML/CSS', 'адаптив', 'страницы'], description: 'Готов делать простые посадочные страницы для мероприятий.' },
  { firstName: 'Светлана', lastName: 'Фомина', middleName: 'Петровна', email: 'svetlana.fomina.content@yandex.ru', university: 'НГЛУ им. Н. А. Добролюбова', course: 3, skills: ['тексты', 'структура', 'редактура'], description: 'Помогает учреждениям упаковывать материалы в понятные описания.' },
  { firstName: 'Денис', lastName: 'Савельев', middleName: 'Викторович', email: 'denis.savelev.qa@mail.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 2, skills: ['тестирование', 'мобильная версия', 'формы'], description: 'Проверяет формы записи, ссылки, кнопки и мобильное отображение.' },
  { firstName: 'Диана', lastName: 'Киселева', middleName: 'Максимовна', email: 'diana.kiseleva.media@mail.ru', university: 'НГПУ им. К. Минина', course: 1, skills: ['видео', 'обложки', 'соцсети'], description: 'Создает короткие медиа-материалы и оформление для постов.' },
  { firstName: 'Богдан', lastName: 'Ефимов', middleName: 'Сергеевич', email: 'bogdan.efimov.data@yandex.ru', university: 'НГТУ им. Р. Е. Алексеева', course: 3, skills: ['таблицы', 'Python', 'парсинг'], description: 'Работает с таблицами, списками и первичной обработкой данных.' },
  { firstName: 'Валерия', lastName: 'Панова', middleName: 'Артемовна', email: 'valeria.panova.design@mail.ru', university: 'Университет Неймарк', course: 2, skills: ['Figma', 'UI', 'афиши'], description: 'Готовит макеты экранов, карточек и материалов для мероприятий.' },
  { firstName: 'Константин', lastName: 'Лазарев', middleName: 'Игоревич', email: 'konstantin.lazarev.dev@yandex.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 1, skills: ['JavaScript', 'боты', 'документация'], description: 'Интересуется простыми ботами и понятной технической документацией.' },
  { firstName: 'Маргарита', lastName: 'Быкова', middleName: 'Романовна', email: 'margarita.bykova.smm@mail.ru', university: 'НГЛУ им. Н. А. Добролюбова', course: 2, skills: ['SMM', 'тексты', 'контент-план'], description: 'Помогает учреждениям планировать публикации и оформлять тексты.' },
  { firstName: 'Савелий', lastName: 'Гаврилов', middleName: 'Павлович', email: 'saveliy.gavrilov.web@yandex.ru', university: 'НГТУ им. Р. Е. Алексеева', course: 3, skills: ['верстка', 'React', 'Git'], description: 'Берет задачи по интерфейсам, исправлению блоков и публикации страниц.' },
  { firstName: 'Ульяна', lastName: 'Маслова', middleName: 'Дмитриевна', email: 'ulyana.maslova.media@mail.ru', university: 'НГПУ им. К. Минина', course: 1, skills: ['презентации', 'дизайн', 'иллюстрации'], description: 'Оформляет понятные презентации, карточки и визуальные схемы.' },
  { firstName: 'Федор', lastName: 'Давыдов', middleName: 'Алексеевич', email: 'fedor.davydov.it@yandex.ru', university: 'Университет Неймарк', course: 2, skills: ['API', 'формы', 'автоматизация'], description: 'Готов помогать с небольшими автоматизациями и настройкой форм.' },
  { firstName: 'Яна', lastName: 'Баранова', middleName: 'Олеговна', email: 'yana.baranova.content@mail.ru', university: 'ННГУ им. Н. И. Лобачевского', course: 3, skills: ['редактура', 'музейные тексты', 'структура'], description: 'Структурирует тексты о выставках, мероприятиях и учреждениях.' },
];

async function main() {
  const db = await initDb();
  const passwordHash = await bcrypt.hash('Student2026!', 10);
  const createdAt = new Date().toISOString();

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
        stock = excluded.stock
    `,
    [
      'partner-merch-hoodie-2026',
      'Партнерский мерч проекта',
      'Брендированный мерч партнерского контура для активных участников платформы.',
      50000,
      'Мерч от партнера',
      '/rewards/partner-merch.png',
      25,
      createdAt,
    ],
  );

  let inserted = 0;
  for (const [index, student] of students.entries()) {
    const id = `demo-student-${String(index + 1).padStart(3, '0')}`;
    const result = await db.run(
      `
        INSERT OR IGNORE INTO users (
          id, email, password_hash, role, name, points, university, course, skills,
          firstName, lastName, middleName, description, status, created_at
        )
        VALUES (?, ?, ?, 'student', ?, 0, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
      `,
      [
        id,
        student.email,
        passwordHash,
        `${student.firstName} ${student.lastName}`,
        student.university,
        student.course,
        JSON.stringify(student.skills),
        student.firstName,
        student.lastName,
        student.middleName || '',
        student.description,
        createdAt,
      ],
    );

    inserted += result.changes || 0;
  }

  const studentCount = await db.get<{ total: number }>(
    "SELECT COUNT(*) as total FROM users WHERE role = 'student'",
  );
  console.log(
    `Demo data ready: added ${inserted} students, total students ${studentCount?.total ?? 0}, product partner-merch-hoodie-2026 upserted.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
