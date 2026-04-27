import type { TaskFormat } from './tasks';
import type { TaskType, TaskUrgency, TaskWorkload } from './task-scoring';

export interface StarterTaskIdea {
  id: string;
  category: string;
  title: string;
  duration: string;
  complexity: 'Стартовый' | 'Базовый';
  outcome: string;
  institutionProvides: string;
}

export const STARTER_TASK_BANK: StarterTaskIdea[] = [
  {
    id: 'feedback-form',
    category: 'Сайт',
    title: 'Исправить форму обратной связи на существующем сайте',
    duration: '5-10 часов',
    complexity: 'Стартовый',
    outcome: 'Рабочая форма, которая принимает обращения и не теряет заявки.',
    institutionProvides: 'Доступ к сайту, адрес почты, пример ошибки.',
  },
  {
    id: 'vk-widget',
    category: 'Сайт',
    title: 'Добавить на главную страницу виджет VK или блок с актуальными новостями',
    duration: '3-5 часов',
    complexity: 'Стартовый',
    outcome: 'Сайт автоматически показывает свежие публикации учреждения.',
    institutionProvides: 'Ссылку на сообщество и доступ к сайту.',
  },
  {
    id: 'faq-page',
    category: 'Контент',
    title: 'Собрать и оформить страницу с частыми вопросами посетителей',
    duration: '5-8 часов',
    complexity: 'Стартовый',
    outcome: 'Готовая страница FAQ или блок вопросов для сайта и соцсетей.',
    institutionProvides: 'Список типовых вопросов и контакты для проверки ответов.',
  },
  {
    id: 'event-posts',
    category: 'Контент',
    title: 'Подготовить пакет из 5 публикаций о мероприятии или выставке',
    duration: '5-8 часов',
    complexity: 'Стартовый',
    outcome: 'Набор коротких текстов для публикации по плану.',
    institutionProvides: 'Факты о событии, даты, фотографии или ссылки на материалы.',
  },
  {
    id: 'certificate-template',
    category: 'Дизайн',
    title: 'Сделать шаблон сертификата, грамоты или благодарности',
    duration: '4-6 часов',
    complexity: 'Стартовый',
    outcome: 'Редактируемый шаблон в едином стиле учреждения.',
    institutionProvides: 'Логотип, фирменные цвета и пример текста.',
  },
  {
    id: 'event-poster-pack',
    category: 'Дизайн',
    title: 'Собрать комплект афиши: A4, пост для VK и stories-версию',
    duration: '8-12 часов',
    complexity: 'Базовый',
    outcome: 'Набор макетов под печать и публикацию в цифровых каналах.',
    institutionProvides: 'Текст анонса, фото, логотип и дату мероприятия.',
  },
  {
    id: 'directory-cards',
    category: 'Оцифровка',
    title: 'Описать 50-100 единиц фотоархива или экспонатов в таблице',
    duration: '8-12 часов',
    complexity: 'Стартовый',
    outcome: 'Упорядоченная таблица с названием, датой, автором и кратким описанием.',
    institutionProvides: 'Папку с файлами и поля, которые важно заполнить.',
  },
  {
    id: 'map-points',
    category: 'Оцифровка',
    title: 'Нанести на карту связанные с учреждением точки и краткие описания',
    duration: '5-8 часов',
    complexity: 'Стартовый',
    outcome: 'Готовый список точек для сайта, афиши или туристического маршрута.',
    institutionProvides: 'Черновой список адресов и справочную информацию.',
  },
  {
    id: 'business-listing',
    category: 'Присутствие в сети',
    title: 'Обновить карточки учреждения в Яндекс Картах, 2ГИС и справочниках',
    duration: '2-4 часа',
    complexity: 'Стартовый',
    outcome: 'Актуальные часы работы, контакты, ссылки и описание площадки.',
    institutionProvides: 'Подтвержденные контакты и доступ к карточкам или владельцу аккаунта.',
  },
  {
    id: 'mobile-qa',
    category: 'Сайт',
    title: 'Проверить мобильную версию 1-2 страниц и оформить список правок',
    duration: '4-6 часов',
    complexity: 'Стартовый',
    outcome: 'Понятный список ошибок и базовых исправлений для мобильных экранов.',
    institutionProvides: 'Ссылки на страницы и контакт для согласования правок.',
  },
  {
    id: 'qr-pack',
    category: 'Навигация',
    title: 'Подготовить QR-коды на афишу, билеты, карту и форму обратной связи',
    duration: '1-3 часа',
    complexity: 'Стартовый',
    outcome: 'Готовый набор QR-кодов для печати и публикаций.',
    institutionProvides: 'Рабочие ссылки и перечень мест, где QR будут использоваться.',
  },
  {
    id: 'analytics-setup',
    category: 'Аналитика',
    title: 'Подключить Яндекс Метрику и сделать короткую инструкцию для сотрудников',
    duration: '3-5 часов',
    complexity: 'Базовый',
    outcome: 'Сайт считает посещения, а команда понимает, где смотреть статистику.',
    institutionProvides: 'Доступ к сайту и учетной записи Метрики.',
  },
];

export interface TaskProjectBreakdownInput {
  projectTitle: string;
  projectBrief: string;
  desiredResult?: string;
  sourceMaterials?: string;
  constraints?: string;
  deadline?: string;
  format?: TaskFormat;
  location?: string;
}

export interface GeneratedProjectSubtask {
  title: string;
  description: string;
  requirements: string;
  taskType: TaskType;
  workload: TaskWorkload;
  urgency: TaskUrgency;
  requiresOrgMaterials: boolean;
  requiresOnsiteCheck: boolean;
  studentProfile: string;
  deliverable: string;
  deadline: string;
  format: TaskFormat;
  location?: string;
  pointsReward?: number;
}

export interface GeneratedProjectPlan {
  summary: string;
  rationale: string;
  subtasks: GeneratedProjectSubtask[];
}

type ProjectTrack = 'website' | 'content' | 'design' | 'digitization' | 'mixed';

type TrackTemplate = Omit<
  GeneratedProjectSubtask,
  'deadline' | 'format' | 'location' | 'pointsReward' | 'requiresOnsiteCheck'
>;

const TRACK_TEMPLATES: Record<ProjectTrack, TrackTemplate[]> = {
  website: [
    {
      title: 'Собрать материалы и структуру для обновления сайта',
      description:
        'Подготовить перечень страниц, блоков, ссылок и материалов, которые относятся к проекту. Зафиксировать, чего не хватает, а что уже готово к размещению.',
      requirements:
        'Нужна аккуратная работа с таблицей или документом, умение структурировать информацию и проверять ссылки.',
      taskType: 'content',
      workload: 'up_to_3_hours',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту, который умеет разбираться в структуре сайта и приводить материалы в порядок.',
      deliverable: 'Таблица со страницами, материалами, ссылками и замечаниями по наполнению.',
    },
    {
      title: 'Исправить одну ключевую страницу или форму на сайте',
      description:
        'Внести ограниченный набор правок на существующем сайте: починить форму, обновить блок контактов, добавить FAQ или скорректировать один раздел.',
      requirements:
        'Базовые навыки HTML/CSS/конструктора сайта, внимательность и умение не ломать существующие страницы.',
      taskType: 'website',
      workload: 'one_day',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту с базовой веб-практикой, которому комфортно вносить небольшие изменения.',
      deliverable: 'Рабочая страница или форма с коротким списком внесенных правок.',
    },
    {
      title: 'Проверить мобильную версию и внести базовые правки',
      description:
        'Проверить 1-2 ключевые страницы на телефоне, найти проблемные блоки и поправить базовую адаптивность без полной переработки сайта.',
      requirements:
        'Нужно уметь открывать devtools, проверять переносы, кнопки, отступы и критичные ошибки интерфейса.',
      taskType: 'website',
      workload: 'one_day',
      urgency: 'normal',
      requiresOrgMaterials: false,
      studentProfile: 'Студенту с вниманием к интерфейсам и базовыми навыками вёрстки.',
      deliverable: 'Исправленные мобильные экраны и список того, что было скорректировано.',
    },
    {
      title: 'Подключить аналитику и финально проверить публикацию',
      description:
        'Подключить счётчик аналитики, проверить основные ссылки, формы и целевые страницы после внесённых изменений.',
      requirements:
        'Нужны аккуратность, базовые навыки настройки счётчиков и понимание, как проверить результат после публикации.',
      taskType: 'setup',
      workload: 'up_to_3_hours',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту, который может довести публикацию до рабочего состояния и провести простую проверку.',
      deliverable: 'Подключенная аналитика и чек-лист итоговой проверки.',
    },
  ],
  content: [
    {
      title: 'Собрать фактуру и структуру контент-пакета',
      description:
        'Разобрать исходные материалы по проекту, выделить ключевые темы, даты, цитаты и факты, чтобы дальше на их основе готовить публикации.',
      requirements:
        'Нужна внимательная работа с текстами, файлами и комментариями от организации.',
      taskType: 'content',
      workload: 'up_to_3_hours',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту, который умеет быстро разбираться в теме и собирать рабочую фактуру.',
      deliverable: 'Структурированный бриф или таблица с ключевыми сообщениями проекта.',
    },
    {
      title: 'Подготовить пакет текстов для сайта и соцсетей',
      description:
        'Сделать короткие тексты для публикаций, описаний, анонсов или карточек в рамках одного проекта вместо одного длинного текста.',
      requirements:
        'Нужны грамотность, умение писать кратко и следовать тону учреждения.',
      taskType: 'content',
      workload: 'one_day',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту, который силён в текстах, редактуре и упаковке информации.',
      deliverable: 'Набор готовых текстов с пометкой, куда и как их публиковать.',
    },
    {
      title: 'Оформить карточки, FAQ или поясняющие материалы',
      description:
        'Собрать дополнительный слой контента: ответы на частые вопросы, карточки экспонатов, справочный блок или инструкции для посетителей.',
      requirements:
        'Нужна аккуратность, единый стиль и умение работать по заданному формату.',
      taskType: 'content',
      workload: 'one_day',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту, который умеет переводить большой объём информации в короткий и понятный формат.',
      deliverable: 'Набор карточек, FAQ или справочных материалов в согласованном шаблоне.',
    },
    {
      title: 'Проверить публикацию и подготовить короткий отчёт',
      description:
        'Проверить, что материалы опубликованы без ошибок, и собрать короткий отчёт: что подготовлено, что размещено и что осталось на следующий этап.',
      requirements:
        'Нужны внимательность к деталям и умение коротко фиксировать результат.',
      taskType: 'analytics',
      workload: 'up_to_3_hours',
      urgency: 'normal',
      requiresOrgMaterials: false,
      studentProfile: 'Студенту, который может завершить контур задачи и подготовить понятный отчёт для команды.',
      deliverable: 'Короткий итоговый отчёт с перечнем готовых материалов и ссылками.',
    },
  ],
  design: [
    {
      title: 'Собрать бриф и референсы для визуального пакета',
      description:
        'Собрать в один документ исходные требования, примеры, тексты, логотипы и ограничения, чтобы не распыляться на полный бренд-проект.',
      requirements:
        'Нужно уметь системно собирать требования и аккуратно оформлять их в одном месте.',
      taskType: 'design',
      workload: 'up_to_3_hours',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту, который умеет оформлять понятный бриф и работать с исходниками.',
      deliverable: 'Краткий дизайн-бриф с референсами и списком обязательных материалов.',
    },
    {
      title: 'Сделать основной макет для проекта',
      description:
        'Подготовить основной макет: афишу, карточку, баннер или шаблон публикации, который станет базой для остальных материалов.',
      requirements:
        'Нужны базовые навыки работы в редакторе, аккуратная композиция и соблюдение фирменного стиля.',
      taskType: 'design',
      workload: 'one_day',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту с базовыми навыками графического дизайна и умением работать по шаблону.',
      deliverable: 'Основной макет в редактируемом формате и экспорт для публикации.',
    },
    {
      title: 'Адаптировать макет под разные носители',
      description:
        'На основе основного макета сделать дополнительные версии: для соцсетей, stories, печати или электронных писем.',
      requirements:
        'Нужно уметь переносить один визуальный стиль на несколько форматов и не терять читаемость.',
      taskType: 'design',
      workload: 'one_day',
      urgency: 'normal',
      requiresOrgMaterials: false,
      studentProfile: 'Студенту, который умеет быстро адаптировать готовый шаблон под несколько размеров.',
      deliverable: 'Набор адаптированных макетов под нужные площадки.',
    },
    {
      title: 'Подготовить финальный комплект и инструкцию по использованию',
      description:
        'Собрать финальные файлы, подписать версии, подготовить короткую памятку для сотрудников: какой файл куда использовать.',
      requirements:
        'Нужны аккуратность в сборке файлов и умение сделать короткую понятную инструкцию.',
      taskType: 'setup',
      workload: 'up_to_3_hours',
      urgency: 'normal',
      requiresOrgMaterials: false,
      studentProfile: 'Студенту, который доводит дизайн-задачу до удобного для команды результата.',
      deliverable: 'Папка с файлами и памятка по их использованию.',
    },
  ],
  digitization: [
    {
      title: 'Подготовить схему учёта и шаблон описания материалов',
      description:
        'Собрать поля, по которым будут описываться архивные материалы, и подготовить единый шаблон таблицы или карточки учёта.',
      requirements:
        'Нужны внимательность, аккуратная работа с таблицами и понимание структуры описания объектов.',
      taskType: 'digitization',
      workload: 'up_to_3_hours',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту, который умеет аккуратно структурировать данные и работать с каталогами.',
      deliverable: 'Готовый шаблон таблицы и правила заполнения.',
    },
    {
      title: 'Оцифровать и первично описать первую партию материалов',
      description:
        'Внести первую партию фото, документов или аудиозаписей в цифровой каталог, не пытаясь сразу закрыть весь архив.',
      requirements:
        'Нужны усидчивость, внимательность и готовность работать по единому шаблону.',
      taskType: 'digitization',
      workload: 'one_day',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту, который хорошо справляется с монотонной, но важной цифровой работой.',
      deliverable: 'Первая заполненная партия карточек или записей в каталоге.',
    },
    {
      title: 'Добавить метаданные и проверить качество описаний',
      description:
        'Проверить заполненные карточки, добавить недостающие даты, авторов, подписи и короткие пояснения.',
      requirements:
        'Нужна внимательность к деталям и способность вычищать неоднородные данные.',
      taskType: 'digitization',
      workload: 'one_day',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту, который силён в порядке, проверке качества и чистоте данных.',
      deliverable: 'Проверенный набор описаний без критичных пропусков.',
    },
    {
      title: 'Собрать итоговый реестр и рекомендации на следующий этап',
      description:
        'Подвести итог по первой партии материалов и зафиксировать, как удобно продолжать оцифровку следующими блоками.',
      requirements:
        'Нужно уметь коротко описать результат и предложить понятный следующий шаг.',
      taskType: 'analytics',
      workload: 'up_to_3_hours',
      urgency: 'normal',
      requiresOrgMaterials: false,
      studentProfile: 'Студенту, который может завершить оцифровочный этап не только данными, но и понятным отчётом.',
      deliverable: 'Итоговый реестр и рекомендации по следующей волне оцифровки.',
    },
  ],
  mixed: [
    {
      title: 'Собрать и структурировать исходные материалы проекта',
      description:
        'Разложить большую задачу на понятные блоки: какие материалы уже есть, чего не хватает и какие результаты нужны от каждой части проекта.',
      requirements:
        'Нужны аккуратность, умение работать с таблицей и превращать хаотичные вводные в понятный план.',
      taskType: 'content',
      workload: 'up_to_3_hours',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту, который умеет быстро наводить порядок в информации и материалах.',
      deliverable: 'Структурированный рабочий план и перечень исходников.',
    },
    {
      title: 'Подготовить основной содержательный пакет по проекту',
      description:
        'Собрать тексты, описания, короткие пояснения или карточки, которые нужны для дальнейшей публикации и оформления результата.',
      requirements:
        'Нужны грамотность, внимательность к деталям и умение собирать понятные материалы по заданной теме.',
      taskType: 'content',
      workload: 'one_day',
      urgency: 'normal',
      requiresOrgMaterials: true,
      studentProfile: 'Студенту, который уверенно работает с текстами и может быстро подготовить черновой пакет материалов.',
      deliverable: 'Набор структурированных материалов для следующего этапа проекта.',
    },
    {
      title: 'Оформить результат в удобный цифровой формат',
      description:
        'Подготовить публикационный или визуальный слой: карточки, шаблоны, страницу, таблицу или иной удобный формат выдачи результата.',
      requirements:
        'Нужны базовые навыки работы в редакторах, конструкторах или табличных сервисах.',
      taskType: 'design',
      workload: 'one_day',
      urgency: 'normal',
      requiresOrgMaterials: false,
      studentProfile: 'Студенту, который может превратить содержательный блок в удобный для использования результат.',
      deliverable: 'Готовый цифровой формат результата: шаблон, карточки, таблица или страница.',
    },
    {
      title: 'Проверить итог и собрать короткий отчёт по выполнению',
      description:
        'Проверить, что материалы собраны, оформлены и могут быть переданы в работу учреждению без дополнительного разбора.',
      requirements:
        'Нужны внимательность и умение оформить простой финальный отчёт без бюрократии.',
      taskType: 'analytics',
      workload: 'up_to_3_hours',
      urgency: 'normal',
      requiresOrgMaterials: false,
      studentProfile: 'Студенту, который умеет аккуратно завершать задачу и сдавать понятный результат.',
      deliverable: 'Финальный отчёт с файлами, ссылками и кратким описанием результата.',
    },
  ],
};

function normalizeText(value?: string) {
  return String(value || '').trim();
}

export function detectProjectTrack(text: string): ProjectTrack {
  const normalized = text.toLowerCase();

  if (
    normalized.includes('архив') ||
    normalized.includes('оцифр') ||
    normalized.includes('скан') ||
    normalized.includes('метадан') ||
    normalized.includes('каталог')
  ) {
    return 'digitization';
  }

  if (
    normalized.includes('афиш') ||
    normalized.includes('дизайн') ||
    normalized.includes('макет') ||
    normalized.includes('баннер') ||
    normalized.includes('презентац')
  ) {
    return 'design';
  }

  if (
    normalized.includes('сайт') ||
    normalized.includes('страниц') ||
    normalized.includes('форм') ||
    normalized.includes('лендинг') ||
    normalized.includes('метрик')
  ) {
    return 'website';
  }

  if (
    normalized.includes('контент') ||
    normalized.includes('пост') ||
    normalized.includes('текст') ||
    normalized.includes('описан') ||
    normalized.includes('vk') ||
    normalized.includes('соцсет')
  ) {
    return 'content';
  }

  return 'mixed';
}

export function buildFallbackProjectPlan(
  input: TaskProjectBreakdownInput,
): GeneratedProjectPlan {
  const projectTitle = normalizeText(input.projectTitle) || 'Проект';
  const projectBrief = normalizeText(input.projectBrief);
  const desiredResult = normalizeText(input.desiredResult);
  const sourceMaterials = normalizeText(input.sourceMaterials);
  const constraints = normalizeText(input.constraints);
  const format: TaskFormat =
    input.format === 'hybrid' || input.format === 'offline' ? input.format : 'online';
  const deadline = normalizeText(input.deadline);
  const location = format === 'online' ? '' : normalizeText(input.location);
  const projectTrack = detectProjectTrack(
    [projectTitle, projectBrief, desiredResult, sourceMaterials].join(' '),
  );

  const subtasks = TRACK_TEMPLATES[projectTrack].map((template) => ({
    ...template,
    deadline,
    format,
    location,
    requiresOnsiteCheck: format !== 'online',
  }));

  const summaryParts = [
    `Проект "${projectTitle}" публикуется как один родительский блок с отдельными исполнимыми мини-задачами.`,
    projectBrief ? `Суть проекта: ${projectBrief}` : '',
    desiredResult ? `Ожидаемый итог: ${desiredResult}` : '',
    sourceMaterials ? `Что уже есть у организации: ${sourceMaterials}` : '',
    constraints ? `Ограничения: ${constraints}` : '',
  ].filter(Boolean);

  return {
    summary: summaryParts.join(' '),
    rationale:
      'Система разложила большую задачу на отдельные проверяемые результаты: подготовка материалов, содержательная часть, оформление и финальная проверка. Это уменьшает порог входа для студентов и снимает с организации ручной расчёт баллов.',
    subtasks,
  };
}
