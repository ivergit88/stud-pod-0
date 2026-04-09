# Переезд на российский стек

## Что уже заменено в коде

- `Firebase Auth` -> собственная авторизация на `Express + SQLite + httpOnly cookie`
- `Firestore` -> локальная база `SQLite`
- `Google Gemini` -> `YandexGPT` через серверный API
- `Google Fonts` -> локальный системный стек шрифтов
- `Nominatim / OpenStreetMap geocoding` -> `Яндекс.Карты`
- `Firebase Hosting / AI Studio` -> единый Node-сервер, который можно держать на российской ВМ

## Итоговая архитектура

- фронтенд: `React + Vite`
- бэкенд: `Express`
- база: `SQLite`
- ИИ: `YandexGPT`
- карты: `Яндекс.Карты`
- прод: одна российская ВМ с `Node.js + nginx`

Это самый спокойный вариант для текущего проекта: одна машина, одна база, минимум внешних зависимостей и минимум ручной поддержки.

## Что нужно от вас один раз

### 1. Подготовить аккаунты и ключи

1. Зарегистрируйтесь в `Yandex Cloud`.
2. Подключите платежный аккаунт.
3. Создайте каталог и папку проекта.
4. Выпустите API-ключ для `YandexGPT`.
5. Скопируйте `Folder ID`.
6. Выпустите ключ `JavaScript API и HTTP Геокодер` для Яндекс.Карт.
7. При необходимости выпустите отдельный ключ для `Suggest API`.

### 2. Заполнить `.env`

1. Откройте файл `.env`.
2. Вставьте:
   - `JWT_SECRET`
   - `YANDEXGPT_API_KEY`
   - `YANDEX_FOLDER_ID`
   - `VITE_YANDEX_MAPS_API_KEY`
   - `VITE_YANDEX_MAPS_SUGGEST_API_KEY`
3. Для локального запуска оставьте `COOKIE_SECURE=false`.

### 3. Локально проверить проект на Windows

В `cmd`:

```cmd
scripts\windows\install-node.cmd
scripts\windows\setup-project.cmd
scripts\windows\run-local.cmd
```

После запуска откройте:

```text
http://localhost:3000
```

## Выкладка на российскую ВМ

### Быстрый путь

1. Создайте Linux ВМ в `Yandex Cloud`.
2. Возьмите внешний IP.
3. Убедитесь, что по SSH вы можете зайти на ВМ.
4. На своей Windows-машине из `cmd` выполните:

```cmd
scripts\windows\deploy-to-yandex-vm.cmd USER HOST
```

Где:

- `USER` - пользователь на ВМ, обычно `ubuntu`
- `HOST` - внешний IP ВМ

Скрипт сам:

- соберет архив проекта
- загрузит его на ВМ
- поставит `Node.js`, `nginx`
- соберет фронтенд
- поднимет systemd-сервис
- настроит проксирование через `nginx`

## Импорт старых данных

Если в старой системе есть полезные данные, подготовьте JSON-файлы и положите их в:

```text
migration/firebase-export
```

Далее:

```cmd
npm run import:firebase -- migration/firebase-export
```

Поддерживаются файлы:

- `users.json`
- `tasks.json`
- `taskResponses.json`
- `events.json`
- `eventRegistrations.json`
- `products.json`
- `purchases.json`
- `notifications.json`

Важно:

- импортированные пользователи получают временный пароль из `MIGRATION_DEFAULT_PASSWORD`
- если в старой системе были только тестовые аккаунты, импорт пользователей лучше пропустить и начать с чистой базы

## После первой выкладки

Сразу сделайте еще 3 вещи:

1. Поменяйте `JWT_SECRET` на длинное случайное значение.
2. На сервере включите `COOKIE_SECURE=true`.
3. Привяжите домен и затем поставьте HTTPS.

## Что больше не нужно

- `Firebase`
- `Firestore rules`
- `Google Gemini`
- `Google Fonts`
- любые серверлесс-заготовки под старую схему хранения
