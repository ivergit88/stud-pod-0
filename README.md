# Студенческий подряд

Портал для взаимодействия учреждений и студентов: учреждения публикуют задачи и проекты, студенты откликаются, выполняют работу, собирают команду, отправляют результат на проверку и получают подтверждённый кейс в портфолио.

Текущий стек:

- `React + Vite` — фронтенд
- `Express` — backend API и SSR-обвязка в dev/prod
- `SQLite` — база данных
- `YandexGPT` — ИИ-модуль для помощи с задачами и ИИ-помощник
- `Яндекс.Карты` — адреса, карта и подсказки

## Где находится проект

Основная рабочая папка:

```bash
/home/admin1/stud-pod
```

Если вы уже в WSL/Ubuntu, почти вся работа ведётся внутри этой директории.

## Быстрые команды

Основные команды сделаны короткими и понятными:

```bash
cd /home/admin1/stud-pod
npm run local
npm run check
npm run deploy
npm run fetchenv
npm run domain
```

Что означает каждая команда:

- `npm run local` — локальный запуск проекта
- `npm run check` — быстрая техническая проверка TypeScript
- `npm run deploy` — деплой на текущий VPS/Beget
- `npm run fetchenv` — скачать актуальный продовый `.env` с сервера
- `npm run domain` — настроить домен и HTTPS на сервере

Старые прямые команды тоже рабочие:

```bash
./scripts/deploy-beget.sh
./scripts/fetch-beget-env.sh
./scripts/configure-beget-domain.sh
```

## Что нужно для работы

Минимально нужно:

- `Node.js 22`
- `npm`
- доступ к папке проекта
- локальный файл `.env`
- для деплоя — доступ по SSH к VPS

На сервере деплой-скрипт сам устанавливает недостающие системные пакеты, `nginx` и при необходимости `Node.js`.

## Как устроен запуск

Проект работает через `server.ts`.

В dev-режиме:

- запускается `Express`
- внутри него поднимается `Vite` в middleware mode
- фронтенд и API работают через один процесс

В prod-режиме:

- сначала выполняется `vite build`
- затем `Express` раздаёт содержимое папки `dist`
- API продолжает работать из того же `server.ts`
- сверху стоит `nginx` как reverse proxy

То есть отдельный frontend-сервер и отдельный backend-сервер руками поднимать не нужно: основная точка входа у проекта одна — `server.ts`.

## Структура проекта

### Корень проекта

- `package.json` — npm-команды и зависимости
- `package-lock.json` — lock-файл зависимостей
- `server.ts` — основной backend, API, авторизация, маршруты, загрузка файлов, dev/prod запуск
- `database.ts` — инициализация SQLite, таблицы, добавление новых колонок
- `database.sqlite` — локальная база данных, если не задан `DATABASE_PATH`
- `vite.config.ts` — конфигурация Vite
- `tsconfig.json` — настройки TypeScript
- `index.html` — базовый HTML-шаблон фронтенда
- `.env.example` — шаблон переменных окружения
- `.deploy.env.example` — шаблон параметров деплоя
- `README.md` — эта инструкция
- `BEGET.md` — краткая инструкция по текущему VPS и домену

### Папка `src`

- `src/main.tsx` — вход фронтенда
- `src/App.tsx` — корневое приложение и маршрутизация
- `src/index.css` — глобальные стили, в том числе режимы ВДС

#### `src/pages`

Здесь лежат страницы сайта. Основные:

- `Home.tsx` — главная
- `TaskCatalog.tsx` — каталог задач
- `TaskDetails.tsx` — карточка задачи и полное ТЗ
- `CreateTask.tsx` — создание задачи/проекта
- `StudentDashboard.tsx` — кабинет студента
- `OrgDashboard.tsx` — кабинет организации
- `OrgManagement.tsx` — управление публикациями
- `TeamBuilder.tsx` — подбор сокомандников
- `Notifications.tsx` — уведомления
- `Events.tsx`, `CreateEvent.tsx` — мероприятия
- `Portfolio.tsx` — портфолио студента
- `Store.tsx` — магазин поощрений
- `Help.tsx` — помощь
- `Login.tsx`, `RegisterChoice.tsx`, `RegisterStudent.tsx`, `RegisterOrg.tsx` — вход и регистрация

#### `src/components`

Переиспользуемые блоки интерфейса:

- `Layout.tsx` — общий каркас страниц
- `AccessibilityPanel.tsx` — ВДС/панель доступности
- `ChatWidget.tsx` — ИИ-помощник в интерфейсе
- `TasksMap.tsx` — карта задач
- `AddressInput.tsx` — адреса и подсказки

#### `src/context`

- `AuthContext.tsx` — авторизация, текущий пользователь
- `DataContext.tsx` — загрузка и обновление основных данных платформы

#### `src/lib`

Вспомогательная бизнес-логика:

- `api.ts` — клиентская работа с API
- `tasks.ts` — вспомогательная логика по задачам
- `task-scoring.ts` — расчёт и предпросмотр баллов
- `task-projects.ts` — логика больших проектов и автодекомпозиции на подзадачи
- `task-responses.ts` — логика откликов и командной работы
- `utils.ts` — общие хелперы

### Папка `scripts`

Служебные скрипты:

- `scripts/deploy-beget.sh` — основной деплой на текущий VPS
- `scripts/fetch-beget-env.sh` — забрать `.env` с сервера
- `scripts/configure-beget-domain.sh` — настройка домена и HTTPS
- `scripts/import-firebase-export.ts` — импорт старых данных из JSON

### Папка `deploy`

- `deploy/yandex-vm/install-app.sh` — серверная установка приложения, systemd и nginx
- `deploy/yandex-vm/configure-domain.sh` — настройка `certbot`/домена на сервере

### Папка `docs`

- `docs/migration-rf.md` — отдельные заметки по российской сборке и миграции

## Какие файлы за что отвечают на практике

Если нужно быстро понять, куда лезть:

- меняется интерфейс страницы — `src/pages/...`
- меняется общий UI-компонент — `src/components/...`
- проблемы с ВДС/контрастом/режимами — чаще всего `src/index.css` и `src/components/AccessibilityPanel.tsx`
- ломается логика входа/роли — `src/context/AuthContext.tsx` и `server.ts`
- ломается получение/обновление данных — `src/context/DataContext.tsx`, `src/lib/api.ts`, `server.ts`
- меняется схема БД — `database.ts`
- меняется логика API, файлов, откликов, задач, ИИ — `server.ts`
- меняется логика автодекомпозиции проекта — `src/lib/task-projects.ts` и связанные эндпоинты в `server.ts`

## Переменные окружения

Основной шаблон лежит в:

```bash
/home/admin1/stud-pod/.env.example
```

Ключевые переменные:

- `PORT` — порт Express-сервера
- `JWT_SECRET` — секрет для сессий/токенов; в `NODE_ENV=production` обязателен
- `COOKIE_SECURE` — secure-cookie режим
- `CORS_ORIGINS` — дополнительные разрешённые домены через запятую, если сайт открывается не только с `https://студ-подряд.рф`
- `CLIENT_ORIGIN` / `PUBLIC_ORIGIN` — один дополнительный публичный адрес фронта или прокси
- `TRUST_PROXY` — настройка доверия к reverse proxy; по умолчанию в production включён первый proxy, для отключения поставить `false`
- `YANDEXGPT_API_KEY` — ключ YandexGPT
- `YANDEX_FOLDER_ID` — folder id для YandexGPT
- `VITE_YANDEX_MAPS_API_KEY` — ключ JS API Яндекс.Карт
- `VITE_YANDEX_MAPS_SUGGEST_API_KEY` — ключ Suggest API
- `MIGRATION_DEFAULT_PASSWORD` — временный пароль для импорта старых пользователей

Дополнительно для продакшена используются:

- `DATABASE_PATH` — путь до SQLite-базы
- `UPLOADS_DIR` — путь до загружаемых файлов
- `NODE_ENV=production` — prod-режим

## Где лежат данные

### Локально

Если `DATABASE_PATH` не задан, локальная база лежит здесь:

```bash
/home/admin1/stud-pod/database.sqlite
```

Файлы вложений по умолчанию складываются рядом с базой в подпапку `uploads`.

### На сервере

Текущий деплой ставит приложение в:

```bash
/root/stud-pod
```

База на сервере хранится отдельно от кода, чтобы не теряться при перевыкатке:

```bash
/root/stud-pod-data/database.sqlite
```

Вложения по умолчанию:

```bash
/root/stud-pod-data/uploads
```

Это важно: папка с кодом при каждом деплое пересоздаётся, а папка с данными должна жить отдельно.

## Локальный запуск с нуля

### 1. Перейти в проект

```bash
cd /home/admin1/stud-pod
```

### 2. Установить зависимости

```bash
npm install
```

Если вдруг обычная установка не проходит, можно использовать тот же флаг, что и на сервере:

```bash
npm install --legacy-peer-deps
```

### 3. Создать `.env`

Если файла ещё нет:

```bash
cp .env.example .env
```

После этого заполнить нужные ключи.

Если нужен именно продовый `.env`, а не пустой шаблон:

```bash
npm run fetchenv
```

### 4. Запустить локально

```bash
npm run local
```

После старта открыть:

```text
http://localhost:3000
```

## Ежедневный рабочий цикл

Обычный сценарий разработки такой:

```bash
cd /home/admin1/stud-pod
npm run local
```

После изменений:

```bash
npm run check
```

Если всё нормально, можно деплоить:

```bash
npm run deploy
```

## Как работает деплой на текущий VPS

Основной скрипт деплоя:

```bash
/home/admin1/stud-pod/scripts/deploy-beget.sh
```

Сейчас он деплоит на VPS Beget с публичным IP `159.194.208.82`.

Что делает деплой по шагам:

1. Проверяет, что локально существует `.env`.
2. Собирает архив проекта.
3. Загружает архив на сервер по `scp`.
4. Подключается по `ssh`.
5. Полностью пересоздаёт директорию приложения на сервере.
6. Распаковывает код.
7. Запускает `deploy/yandex-vm/install-app.sh`.
8. На сервере ставятся системные пакеты, `nginx`, `Node.js 22` при необходимости.
9. Устанавливаются npm-зависимости.
10. Выполняется `npm run build`.
11. Создаётся/обновляется systemd-сервис `stud-pod`.
12. Перезапускаются `stud-pod` и `nginx`.

## Команды деплоя

Короткая команда:

```bash
npm run deploy
```

Прямая команда:

```bash
./scripts/deploy-beget.sh
```

Если потребуется предварительно подтянуть продовый `.env`:

```bash
npm run fetchenv
```

## Настройки деплоя

Файл настроек:

```bash
/home/admin1/stud-pod/.deploy.env
```

Основные поля там:

- `DEPLOY_USER`
- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_KEY_PATH`
- `REMOTE_APP_DIR`
- `REMOTE_ARCHIVE`
- `DEPLOY_DOMAIN`
- `DEPLOY_EMAIL`
- `DEPLOY_ALIAS_DOMAIN`

Если `.deploy.env` потерян, можно восстановить по шаблону:

```bash
cp .deploy.env.example .deploy.env
```

## Настройка домена и HTTPS

После того как домен уже указывает на сервер, запускается:

```bash
npm run domain
```

Или напрямую:

```bash
./scripts/configure-beget-domain.sh
```

Перед этим в `.deploy.env` должны быть заполнены:

- `DEPLOY_DOMAIN`
- `DEPLOY_EMAIL`
- `DEPLOY_ALIAS_DOMAIN` — если нужен алиас

## Что происходит на сервере после деплоя

После успешной выкладки:

- `nginx` принимает внешний трафик на `80`/`443`
- `nginx` проксирует запросы в `http://127.0.0.1:3000`
- приложение работает как systemd-сервис `stud-pod`
- backend и frontend обслуживаются одним Node-процессом

## Полезные серверные команды

Эти команды выполняются уже на VPS:

Проверить статус сервиса:

```bash
systemctl status stud-pod
```

Посмотреть логи приложения:

```bash
journalctl -u stud-pod -n 200 --no-pager
```

Посмотреть логи в реальном времени:

```bash
journalctl -u stud-pod -f
```

Проверить конфиг nginx:

```bash
nginx -t
```

Перезапустить приложение:

```bash
systemctl restart stud-pod
```

Перезапустить nginx:

```bash
systemctl restart nginx
```

## Как понять, что сломалось

### Если сайт не открывается

Проверить по порядку:

1. Запущен ли `stud-pod`
2. Нет ли ошибки в `journalctl -u stud-pod`
3. Проходит ли `nginx -t`
4. Не сломался ли `.env`
5. Есть ли папка `dist` после сборки

### Если не запускается локально

Чаще всего проблема одна из этих:

- не установлен `node`
- не поставлены зависимости
- отсутствует `.env`
- занят порт `3000`
- сломался TypeScript после правок

Быстрая проверка:

```bash
npm run check
```

## Импорт старых данных

Если есть JSON-выгрузка старой системы, файлы кладутся в:

```bash
migration/firebase-export
```

Команда импорта:

```bash
npm run import:firebase -- migration/firebase-export
```

Поддерживаются:

- `users.json`
- `tasks.json`
- `taskResponses.json`
- `events.json`
- `eventRegistrations.json`
- `products.json`
- `purchases.json`
- `notifications.json`

## Что важно не забывать

- перед деплоем должен существовать локальный `.env`
- продовая база хранится отдельно от кода
- продовые вложения тоже должны храниться отдельно от кода
- `npm run check` желательно гонять перед каждым деплоем
- если правится что-то связанное с ВДС, визуально проверять режимы доступности после выкладки
- если правится логика задач, проверять обе роли: студент и организация

## Самый короткий сценарий обслуживания

Если совсем коротко, ежедневная схема такая:

```bash
cd /home/admin1/stud-pod
npm run local
npm run check
npm run deploy
```

Этого достаточно для основной работы над проектом.
