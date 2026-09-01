# Мобильный API «Студенческий подряд»

Контракт для Android-клиента (`android/`). Все эндпоинты живут в существующем
Express-монолите (`server.ts`) поверх той же SQLite-базы и той же бизнес-логики.
Дополнительный код вынесен в отдельный route-модуль `src/server/mobile-api.ts`,
чтобы не раздувать `server.ts`.

## Базовый URL

| Окружение | Базовый URL |
|---|---|
| Прод | `https://xn----gtbba2cfjcjk2l.xn--p1ai/api` (студ-подряд.рф) |
| Локальная разработка | `http://localhost:3000/api` |
| Android-эмулятор → dev-бэкенд | `http://10.0.2.2:3000/api` |

## Авторизация

Мобильный клиент использует **Bearer JWT**:

```
Authorization: Bearer <token>
```

- Токен выдаётся при `POST /api/auth/login` и `POST /api/auth/register` в поле `token`.
- Срок жизни — 30 дней (тот же JWT, что кладётся в httpOnly-cookie для сайта).
- Cookie-механика сохранена для веб-версии и не изменена.
- При 401 клиент очищает локальную сессию и возвращает пользователя на экран входа.

## Формат ошибок

Все ошибки отдаются в формате:

```json
{ "error": "Текст ошибки", "code": "optional-code" }
```

Статусы: `400` (валидация), `401` (нет авторизации), `403` (недостаточно прав),
`404` (не найдено), `409` (конфликт), `429` (слишком много попыток), `500`.

## Эндпоинты

### Auth

#### POST `/api/auth/login`
Тело:
```json
{ "email": "student@mail.ru", "password": "secret" }
```
Ответ `200`:
```json
{
  "user": { "id": "…", "role": "student", "name": "Иван Иванов", "points": 0, "skills": [] },
  "token": "eyJhbGciOi…"
}
```
Ошибки: `401` — неверный email/пароль; `403` — пользователь заблокирован;
`429` — лимит попыток.

#### POST `/api/auth/register`
Тело (роль `student`):
```json
{
  "role": "student",
  "additionalData": {
    "email": "student@mail.ru",
    "firstName": "Иван",
    "lastName": "Иванов",
    "middleName": null,
    "university": "МГИК",
    "course": 2,
    "skills": ["Дизайн", "Контент"]
  },
  "password": "secret"
}
```
Ответ `201`: `{ "user": …, "token": … }` (как в login).
Валидация: email, пароль ≥ 6 символов, курс 1–3, обязательные имя/фамилия/вуз.
`409` — email уже занят.

#### POST `/api/auth/logout`
Ответ: `{ "ok": true }`. Сервер сбрасывает только cookie; клиент удаляет токен локально.

#### GET `/api/auth/me`
Ответ: `{ "user": { … } }` или `{ "user": null }` при невалидном токене.

### Профиль

#### GET `/api/me`
Ответ: `{ "user": { … } }` — полный профиль текущего пользователя
(та же структура, что у `mapUser` на сервере).

### Каталог задач

#### GET `/api/tasks`
Пагинация и фильтры — query-параметры:

| Параметр | Значение | По умолчанию |
|---|---|---|
| `page` | ≥ 1 | 1 |
| `limit` | 1..50 | 20 |
| `status` | `open` / `in_progress` / `review` / `completed` / `cancelled` | `open` |
| `category` | категория (например `Дизайн`) | — |
| `format` | `online` / `hybrid` / `offline` | — |
| `query` | поиск по названию/описанию/требованиям | — |

Обзорные проекты (`taskKind = 'parent'`) в каталог не попадают.

Ответ `200`:
```json
{
  "tasks": [ { "id": "…", "title": "Сделать афишу", "status": "open", "pointsReward": 50 } ],
  "total": 137,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

#### GET `/api/tasks/:taskId`
Ответ: `{ "task": { … } }` — полная карточка задачи (все поля `mapTask`).

### Мои задачи и портфолио

#### GET `/api/my/tasks`
Отклики текущего студента вместе с задачами (по `task_response_members`).
Ответ:
```json
{
  "items": [
    {
      "task": { "id": "…", "title": "Сделать афишу" },
      "response": { "id": "…", "status": "accepted", "submissionLink": "", "teamMembers": [] }
    }
  ]
}
```
Доступ: роли `student`, `admin`.

#### GET `/api/my/portfolio`
Только выполненные кейсы (`response.status = 'completed'`). Та же структура.

### Уведомления

#### GET `/api/notifications?limit=50`
Ответ:
```json
{
  "items": [ { "id": "…", "title": "Новая задача", "message": "…", "read": false, "type": "info", "link": null } ],
  "unreadCount": 3
}
```

#### POST `/api/notifications/:notificationId/read`
Ответ: `{ "ok": true }`. Доступ: владелец уведомления.

#### POST `/api/notifications/read-all`
Пометить все прочитанными. Ответ: `{ "ok": true }`.

### Действия студента (существующие эндпоинты, без изменений)

#### POST `/api/tasks/:taskId/take`
Тело: `{ "coverLetter": "" }`. Взять задачу в работу.
Ответ `201`: `{ "response": { … } }` со статусом `accepted`.
Ошибки: `400` — задача не открыта/обзорный проект; `409` — уже откликались.

#### POST `/api/task-responses/:responseId/submit`
Тело: `{ "submissionLink": "https://…" }`. Отправить результат на проверку.
Ответ: `{ "response": { … } }` со статусом `submitted`.

### Файлы

#### GET `/api/tasks/:taskId/attachments/:attachmentId/download`
Скачивание вложения задачи (возвращает файл, `Content-Disposition: attachment`).
URL в объекте задачи относительный — клиент строит полный URL:
`<baseUrl>/api/tasks/…/download`.

## Что изменилось на backend

| Файл | Изменение |
|---|---|
| `server.ts` | `attachCurrentUser` принимает `Authorization: Bearer <token>` (cookie остался) |
| `server.ts` | `login`/`register` возвращают поле `token` в JSON (cookie выставляется как раньше) |
| `server.ts` | подключён роутер `createMobileApiRouter` на `/api` |
| `src/server/mobile-api.ts` | **новый** — мобильные эндпоинты (см. выше), переиспользует `mapTask`/`mapTaskResponse`/`mapNotification`/`TASK_SELECT_FIELDS` |

Изменения аддитивные: веб-версия работает без изменений.
База данных не менялась: новых таблиц и колонок нет.

## Аналитика мобильного клиента

Приложение логирует события `app_open`, `auth_login`, `auth_register`,
`task_view`, `task_apply`, `result_upload`, `portfolio_open`,
`notification_open` (см. `Analytics.kt`) — готово к подключению Yandex AppMetrica.

## Уведомления: этапы

1. In-app уведомления + фоновая синхронизация через WorkManager (реализовано).
2. Push через RuStore Push SDK: потребуется таблица `push_tokens`
   (userId, token, platform) и `POST /api/devices/register` — отдельный этап.
