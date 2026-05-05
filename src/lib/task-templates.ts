export type TaskTemplateId =
  | 'visitor-assistant'
  | 'event-page'
  | 'visual-style'
  | 'archive-cards'
  | 'application-form'
  | 'digital-audit';

export interface TaskTemplatePreset {
  id: TaskTemplateId;
  label: string;
  prompt: string;
}

export const TASK_TEMPLATE_STORAGE_KEY = 'studPod.pendingTaskTemplate';

export const TASK_TEMPLATE_PRESETS: Record<TaskTemplateId, TaskTemplatePreset> = {
  'visitor-assistant': {
    id: 'visitor-assistant',
    label: 'Умный помощник для посетителей',
    prompt:
      'Нужен чат-бот или FAQ-блок для посетителей учреждения. Он должен отвечать на частые вопросы: часы работы, адрес, как записаться на мероприятие, контакты, стоимость или правила посещения. Учреждение готово предоставить список вопросов, ответы, ссылки и контакты. Итог: сценарий ответов, база частых вопросов и инструкция, как проверить работу помощника.',
  },
  'event-page': {
    id: 'event-page',
    label: 'Страница мероприятия или выставки',
    prompt:
      'Нужно подготовить страницу мероприятия или выставки: краткое описание, дата, место, программа, фотографии, контакты и кнопка записи. Учреждение предоставит текст, фото и данные для записи. Итог: понятная страница или макет страницы, который можно проверить на компьютере и телефоне.',
  },
  'visual-style': {
    id: 'visual-style',
    label: 'Единый стиль афиш и постов',
    prompt:
      'Нужно подготовить единый стиль афиш и постов для учреждения: шаблон афиши, поста и объявления для социальных сетей. Учреждение предоставит логотип, цвета при наличии, текст мероприятия, фотографии и примеры прошлых публикаций. Итог: готовые макеты для публикации и редактируемые исходники.',
  },
  'archive-cards': {
    id: 'archive-cards',
    label: 'Карточки экспонатов и архивных материалов',
    prompt:
      'Нужно структурировать архивные материалы или карточки экспонатов: фотографии, документы, описания и ссылки нужно перенести в таблицу или каталог с едиными полями. Учреждение предоставит папку с материалами и пример заполнения. Итог: аккуратная таблица или каталог, который можно использовать для сайта или внутреннего учета.',
  },
  'application-form': {
    id: 'application-form',
    label: 'Запись, обратная связь и сбор заявок',
    prompt:
      'Нужна форма записи, обратной связи или сбора заявок от посетителей. В форме должны быть нужные поля, уведомления на почту и итоговая таблица заявок. Учреждение предоставит список полей, текст согласия, почту для уведомлений и правила обработки заявок. Итог: рабочая форма и короткая инструкция по использованию.',
  },
  'digital-audit': {
    id: 'digital-audit',
    label: 'Проверка сайта, мобильной версии и публикаций',
    prompt:
      'Нужно проверить сайт, мобильную версию страницы или публикации учреждения: найти ошибки в отображении, ссылках, текстах и понятности навигации. Учреждение предоставит ссылки на страницы и при наличии доступ к статистике. Итог: список проблем со скриншотами и рекомендации, что исправить в первую очередь.',
  },
};

export function getTaskTemplatePreset(id?: string | null) {
  if (!id) {
    return null;
  }

  return TASK_TEMPLATE_PRESETS[id as TaskTemplateId] || null;
}

export function getTaskTemplateCreatePath(id: TaskTemplateId) {
  return `/организация/задачи/новая?template=${encodeURIComponent(id)}`;
}

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}

export function savePendingTaskTemplate(id: TaskTemplateId) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(TASK_TEMPLATE_STORAGE_KEY, id);
}

export function readPendingTaskTemplateId() {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  return storage.getItem(TASK_TEMPLATE_STORAGE_KEY);
}

export function clearPendingTaskTemplate() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(TASK_TEMPLATE_STORAGE_KEY);
}

export function getPendingTaskTemplateCreatePath() {
  const pendingId = readPendingTaskTemplateId();
  const preset = getTaskTemplatePreset(pendingId);

  return preset ? getTaskTemplateCreatePath(preset.id) : null;
}
