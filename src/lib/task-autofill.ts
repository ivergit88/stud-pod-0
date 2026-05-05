import type { TaskFormat } from './tasks';
import {
  TASK_TYPE_LABELS,
  TASK_URGENCY_LABELS,
  TASK_WORKLOAD_LABELS,
  type TaskType,
  type TaskUrgency,
  type TaskWorkload,
} from './task-scoring';

export interface TaskAutofillDraft {
  title: string;
  description: string;
  requirements: string;
  format: TaskFormat;
  workload: TaskWorkload;
  taskType: TaskType;
  urgency: TaskUrgency;
  requiresOrgMaterials: boolean;
  requiresOnsiteCheck: boolean;
  parameterReason: string;
  missingInputs: string[];
  confidence: number;
}

type TypeRule = {
  type: TaskType;
  keywords: string[];
  priority: number;
};

const TYPE_RULES: TypeRule[] = [
  {
    type: 'bot',
    priority: 9,
    keywords: ['чат-бот', 'чатбот', 'бот', 'telegram', 'телеграм', 'вконтакте', 'вк', 'автоответ', 'частые вопросы'],
  },
  {
    type: 'website',
    priority: 8,
    keywords: ['сайт', 'страниц', 'лендинг', 'html', 'css', 'форма обратной связи', 'веб', 'верст', 'адаптив', 'мобильная версия'],
  },
  {
    type: 'design',
    priority: 7,
    keywords: ['афиш', 'макет', 'баннер', 'буклет', 'презентац', 'дизайн', 'обложк', 'плакат', 'шаблон', 'визуал'],
  },
  {
    type: 'digitization',
    priority: 6,
    keywords: ['оцифр', 'архив', 'скан', 'таблиц', 'каталогиз', 'экспонат', 'перенести данные', 'фотоархив'],
  },
  {
    type: '3d',
    priority: 6,
    keywords: ['3d', '3д', 'модель', 'трехмер', 'трехмер', 'печать'],
  },
  {
    type: 'setup',
    priority: 5,
    keywords: ['настро', 'подключ', 'аккаунт', 'рассылк', 'qr', 'куар', 'виджет', 'метрика', 'карта', '2гис'],
  },
  {
    type: 'analytics',
    priority: 5,
    keywords: ['анализ', 'исслед', 'отчет', 'статистик', 'опрос', 'аудит', 'проверить', 'чек-лист', 'чеклист'],
  },
  {
    type: 'content',
    priority: 4,
    keywords: ['текст', 'описан', 'анонс', 'новост', 'публикац', 'пост', 'сценарий', 'faq', 'материал для сайта'],
  },
];

const TYPE_META: Record<TaskType, { title: string; outcome: string; requirements: string[] }> = {
  content: {
    title: 'Подготовить текст или публикацию для учреждения',
    outcome: 'готовый текст, описание, анонс или набор публикаций, который можно согласовать и использовать в цифровых каналах учреждения',
    requirements: [
      'Проверить факты, даты, имена и названия по материалам учреждения.',
      'Подготовить текст без канцелярита, грамматических ошибок и лишних технических терминов.',
      'Передать итог в редактируемом формате или ссылкой, чтобы учреждение могло быстро внести правки.',
    ],
  },
  design: {
    title: 'Подготовить визуальный материал для учреждения',
    outcome: 'макет афиши, баннера, поста, презентации или другого визуального материала в согласованном формате',
    requirements: [
      'Сохранить читаемость текста и не перегружать макет декоративными элементами.',
      'Использовать логотипы, фотографии и фирменные материалы только после передачи учреждением.',
      'Передать итоговый файл для публикации и редактируемый исходник, если он создавался.',
    ],
  },
  website: {
    title: 'Оформить страницу или небольшой веб-раздел',
    outcome: 'рабочая страница, форма, блок сайта или набор правок, которые можно проверить на компьютере и телефоне',
    requirements: [
      'Не ломать существующую структуру сайта и согласовать способ внесения правок.',
      'Проверить результат на компьютере и мобильном экране.',
      'Передать ссылку, скриншоты или список выполненных изменений через платформу.',
    ],
  },
  bot: {
    title: 'Подготовить чат-бота или сценарий ответов',
    outcome: 'понятный сценарий диалога, база ответов или настроенный бот для типовых вопросов посетителей',
    requirements: [
      'Согласовать список частых вопросов и ответов с учреждением.',
      'Не запрашивать у посетителей лишние персональные данные.',
      'Передать сценарий, инструкцию по проверке и ссылку на тестовый результат.',
    ],
  },
  digitization: {
    title: 'Оцифровать и структурировать материалы учреждения',
    outcome: 'упорядоченная таблица, папка файлов, набор карточек или цифровой архив с понятными названиями и описаниями',
    requirements: [
      'Сохранять исходную структуру материалов и не удалять оригиналы.',
      'Заполнять названия, даты, авторов и описания единообразно.',
      'Передать итоговую таблицу, папку или архив со структурой, понятной учреждению.',
    ],
  },
  '3d': {
    title: 'Подготовить 3D-материалы для учреждения',
    outcome: '3D-модель, макет, визуализация или подготовленные файлы для дальнейшего согласования',
    requirements: [
      'Уточнить формат итогового файла и ограничения по размеру.',
      'Согласовать исходные фотографии, размеры или референсы до начала работы.',
      'Передать результат, превью и краткое описание использованных инструментов.',
    ],
  },
  setup: {
    title: 'Настроить цифровой сервис учреждения',
    outcome: 'настроенный аккаунт, виджет, форма, карта, QR-сценарий или инструкция, которую учреждение сможет использовать дальше',
    requirements: [
      'Не менять доступы и настройки без согласования с учреждением.',
      'Фиксировать внесенные изменения и передать короткую инструкцию.',
      'Проверить результат на рабочем примере и приложить подтверждение.',
    ],
  },
  analytics: {
    title: 'Проверить и описать цифровой сервис учреждения',
    outcome: 'понятный список выводов, ошибок, рекомендаций или улучшений с приоритетами',
    requirements: [
      'Проверять только согласованные страницы, материалы или сервисы учреждения.',
      'Описывать проблемы простым языком и прикладывать скриншоты, если они нужны для понимания.',
      'Разделить рекомендации на срочные исправления и улучшения на будущее.',
    ],
  },
  other: {
    title: 'Выполнить цифровую микро-задачу учреждения',
    outcome: 'проверяемый цифровой результат, который можно принять или вернуть на доработку через платформу',
    requirements: [
      'Уточнить ожидаемый результат до начала работы.',
      'Согласовать формат передачи результата.',
      'Передать итог через платформу вместе с коротким пояснением, что было сделано.',
    ],
  },
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const hasKeyword = (text: string, keyword: string) => {
  const normalizedKeyword = normalizeText(keyword);
  const wordChar = 'а-яa-z0-9';

  if (!normalizedKeyword.includes(' ') && normalizedKeyword.length <= 2) {
    return new RegExp(
      `(^|[^${wordChar}])${escapeRegExp(normalizedKeyword)}([^${wordChar}]|$)`,
      'i',
    ).test(text);
  }

  if (!normalizedKeyword.includes(' ') && normalizedKeyword.length <= 5) {
    return new RegExp(`(^|[^${wordChar}])${escapeRegExp(normalizedKeyword)}`, 'i').test(text);
  }

  return text.includes(normalizedKeyword);
};

const findKeywords = (text: string, keywords: string[]) =>
  keywords.filter((keyword) => hasKeyword(text, keyword));

const capitalize = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? `${trimmed[0].toUpperCase()}${trimmed.slice(1)}` : trimmed;
};

const trimToLength = (value: string, maxLength: number) => {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const clipped = normalized.slice(0, maxLength - 1);
  const lastSpaceIndex = clipped.lastIndexOf(' ');

  return `${clipped.slice(0, lastSpaceIndex > 40 ? lastSpaceIndex : clipped.length).trim()}...`;
};

const stripRequestPrefix = (prompt: string) =>
  prompt
    .replace(/^[\s,.;:!?-]*(срочно|пожалуйста)?\s*(нам|мне|учреждению|библиотеке|музею|дк|дому культуры)?\s*(нужно|нужна|нужен|надо|требуется|хотим|хотелось бы|необходимо|пожалуйста)\s*/i, '')
    .replace(/^[\s,.;:!?-]+/, '')
    .trim();

const pickTaskType = (text: string) => {
  const scored = TYPE_RULES.map((rule) => {
    const matched = findKeywords(text, rule.keywords);
    return {
      type: rule.type,
      matched,
      score: matched.length * 10 + (matched.length > 0 ? rule.priority : 0),
    };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];

  return {
    taskType: best && best.score > 0 ? best.type : ('content' as TaskType),
    matchedKeywords: best?.matched || [],
    matchScore: best?.score || 0,
  };
};

const pickFormat = (text: string): TaskFormat => {
  const offline = findKeywords(text, [
    'очно',
    'на месте',
    'в учреждении',
    'в библиотеке',
    'в музее',
    'в доме культуры',
    'приехать',
    'выезд',
    'съемка',
    'съёмка',
    'снять фото',
    'интервью на месте',
  ]);
  const hybrid = findKeywords(text, ['смешан', 'часть очно', 'частично очно', 'после встречи']);

  if (hybrid.length > 0) {
    return 'hybrid';
  }

  if (offline.length > 0) {
    return 'offline';
  }

  return 'online';
};

const pickWorkload = (text: string, taskType: TaskType): TaskWorkload => {
  const largeSignals = findKeywords(text, [
    'сайт с нуля',
    'полностью',
    'мобильное приложение',
    'приложение',
    'база данных',
    'несколько страниц',
    'много материалов',
    'большой архив',
    'комплекс',
    'серия из',
    '100',
  ]);
  const mediumSignals = findKeywords(text, [
    'лендинг',
    'форма обратной связи',
    'буклет',
    'презентац',
    'таблиц',
    'архив',
    'каталог',
    'несколько',
    'пакет',
    'бот',
    'чат-бот',
  ]);
  const smallSignals = findKeywords(text, [
    'проверить',
    'исправить',
    'коротк',
    'один пост',
    'одну афиш',
    'одна афиш',
    'описание',
    'qr',
    'куар',
    'чек-лист',
    'чеклист',
  ]);

  if (largeSignals.length > 0) {
    return 'more_than_three_days';
  }

  if (
    smallSignals.length > 0 &&
    findKeywords(text, ['полностью', 'весь сайт', 'вся страница', 'несколько', 'много материалов']).length === 0
  ) {
    return 'up_to_3_hours';
  }

  if (mediumSignals.length > 0 || ['website', 'bot', 'digitization', '3d'].includes(taskType)) {
    return 'two_to_three_days';
  }

  if (smallSignals.length > 0) {
    return 'up_to_3_hours';
  }

  return 'one_day';
};

const pickUrgency = (text: string): TaskUrgency =>
  findKeywords(text, ['срочно', 'завтра', 'сегодня', 'как можно быстрее', 'горит', 'до вечера']).length > 0
    ? 'urgent'
    : 'normal';

const hasDeadlineHint = (text: string) =>
  /\bдо\s+\d{1,2}\b/i.test(text) ||
  findKeywords(text, [
    'дедлайн',
    'срок',
    'к пятнице',
    'до пятницы',
    'к понедельнику',
    'до понедельника',
    'до вторника',
    'до среды',
    'до четверга',
    'до субботы',
    'до воскресенья',
    'до выходных',
    'к выходным',
    'на этой неделе',
    'на следующей неделе',
    'завтра',
    'сегодня',
  ]).length > 0;

const hasMaterialsHint = (text: string) =>
  findKeywords(text, [
    'материал',
    'фото',
    'фотографии',
    'логотип',
    'исходник',
    'исходный текст',
    'готовый текст',
    'тексты есть',
    'текст есть',
    'архив',
    'таблица',
    'ссылка',
    'референс',
    'доступ',
  ]).length > 0;

const buildTitle = (prompt: string, taskType: TaskType) => {
  const firstSentenceRaw =
    stripRequestPrefix(prompt)
      .replace(/^(срочно|пожалуйста)\s+/i, '')
      .split(/[.!?]/)[0]?.trim() || '';
  const firstSentence = (firstSentenceRaw.split(',')[0] || firstSentenceRaw).trim();
  const normalizedFirstSentence = normalizeText(firstSentence);
  const startsWithAction = [
    'сделать',
    'подготовить',
    'оформить',
    'настроить',
    'проверить',
    'создать',
    'разработать',
    'обновить',
    'собрать',
    'оцифровать',
    'перенести',
    'исправить',
    'написать',
    'сверстать',
    'нарисовать',
  ].some((action) => normalizedFirstSentence.startsWith(action));

  if (normalizedFirstSentence.startsWith('афиш')) {
    const titleObject = firstSentence.toLowerCase().startsWith('афиша')
      ? `афишу${firstSentence.slice('афиша'.length)}`
      : firstSentence;
    return trimToLength(capitalize(`Подготовить ${titleObject}`), 86);
  }

  if (normalizedFirstSentence.startsWith('макет') || normalizedFirstSentence.startsWith('баннер')) {
    return trimToLength(capitalize(`Подготовить ${firstSentence}`), 86);
  }

  if (normalizedFirstSentence.startsWith('страниц') || normalizedFirstSentence.startsWith('лендинг')) {
    const titleObject = firstSentence.toLowerCase().startsWith('страница')
      ? `страницу${firstSentence.slice('страница'.length)}`
      : firstSentence;
    return trimToLength(capitalize(`Оформить ${titleObject}`), 86);
  }

  if (normalizedFirstSentence.startsWith('форм')) {
    const titleObject = firstSentence.toLowerCase().startsWith('форма')
      ? `форму${firstSentence.slice('форма'.length)}`
      : firstSentence;
    return trimToLength(capitalize(`Настроить ${titleObject}`), 86);
  }

  if (firstSentence.length >= 16 && firstSentence.length <= 86) {
    return trimToLength(capitalize(startsWithAction ? firstSentence : `${TYPE_META[taskType].title.split(' ')[0]} ${firstSentence}`), 86);
  }

  return TYPE_META[taskType].title;
};

const buildMissingInputs = (
  text: string,
  taskType: TaskType,
  format: TaskFormat,
  requiresOrgMaterials: boolean,
) => {
  const missingInputs: string[] = [];

  if (!hasDeadlineHint(text)) {
    missingInputs.push('Укажите дедлайн: система не ставит срок сама, чтобы не исказить ожидания учреждения.');
  }

  if (requiresOrgMaterials && !hasMaterialsHint(text)) {
    missingInputs.push('Добавьте исходные материалы или ссылку на облако, если студенту нужны фото, тексты, логотипы или архивы.');
  }

  if (format !== 'online' && findKeywords(text, ['адрес', 'место', 'локация', 'в учреждении', 'в библиотеке', 'в музее']).length === 0) {
    missingInputs.push('Укажите место проведения очной части задачи.');
  }

  if (['website', 'bot', 'setup'].includes(taskType) && findKeywords(text, ['ссылка', 'доступ', 'страница', 'сайт', 'аккаунт']).length === 0) {
    missingInputs.push('Добавьте ссылку на существующую страницу, аккаунт или сервис, если задача связана с уже работающей площадкой.');
  }

  if (text.length < 35) {
    missingInputs.push('Если возможно, добавьте 1-2 предложения о результате: что должно получиться и где это будет использоваться.');
  }

  return missingInputs.slice(0, 4);
};

export function buildTaskAutofillDraft(simplePrompt: string): TaskAutofillDraft {
  const prompt = simplePrompt.replace(/\s+/g, ' ').trim();
  const text = normalizeText(prompt);
  const { taskType, matchedKeywords, matchScore } = pickTaskType(text);
  const format = pickFormat(text);
  const workload = pickWorkload(text, taskType);
  const urgency = pickUrgency(text);
  const requiresOrgMaterials =
    ['content', 'design', 'digitization', 'website', 'bot', '3d', 'setup'].includes(taskType) || hasMaterialsHint(text);
  const requiresOnsiteCheck = format !== 'online';
  const title = buildTitle(prompt || TYPE_META[taskType].title, taskType);
  const meta = TYPE_META[taskType];
  const missingInputs = buildMissingInputs(text, taskType, format, requiresOrgMaterials);
  const confidence = Math.min(
    0.95,
    Math.max(0.45, 0.45 + Math.min(matchScore, 35) / 100 + Math.min(prompt.length, 180) / 600),
  );

  return {
    title,
    description: [
      `Исходный запрос учреждения: ${prompt || 'описание пока не указано'}.`,
      `Ожидаемый результат: ${meta.outcome}.`,
      'Студент выполняет задачу индивидуально или с командой, передаёт результат через платформу, а учреждение принимает работу или возвращает её на доработку.',
    ].join('\n\n'),
    requirements: [
      ...meta.requirements,
      requiresOrgMaterials
        ? 'До начала работы сверить исходные материалы учреждения и уточнить, каких файлов не хватает.'
        : 'Если в процессе понадобятся дополнительные материалы, запросить их у учреждения до выполнения.',
      'Передать результат через платформу вместе с коротким пояснением, что именно сделано.',
    ].join('\n'),
    format,
    workload,
    taskType,
    urgency,
    requiresOrgMaterials,
    requiresOnsiteCheck,
    parameterReason: [
      `Тип задачи: ${TASK_TYPE_LABELS[taskType]}${matchedKeywords.length > 0 ? ` по словам "${matchedKeywords.slice(0, 3).join('", "')}"` : ''}.`,
      `Формат: ${format === 'online' ? 'онлайн' : format === 'hybrid' ? 'смешанный' : 'очный'}.`,
      `Трудоёмкость: ${TASK_WORKLOAD_LABELS[workload]}, срочность: ${TASK_URGENCY_LABELS[urgency].toLowerCase()}.`,
      'Баллы пересчитаны по системным правилам, а не выставлены вручную.',
    ].join(' '),
    missingInputs,
    confidence,
  };
}
