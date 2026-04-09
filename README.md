# Студенческий подряд

Российская сборка портала без Firebase и Google-сервисов.

Текущий стек:

- `React + Vite` для интерфейса
- `Express + SQLite` для API, авторизации и хранения данных
- `YandexGPT` для ИИ-помощника и генерации ТЗ
- `Яндекс.Карты` для адресов и отображения задач

## Быстрый старт на Windows

1. Запустите `scripts\windows\install-node.cmd`.
2. Скопируйте `.env.example` в `.env`.
3. Заполните в `.env` ключи `YANDEXGPT_API_KEY`, `YANDEX_FOLDER_ID`, `VITE_YANDEX_MAPS_API_KEY`.
4. При необходимости задайте `VITE_YANDEX_MAPS_SUGGEST_API_KEY`.
5. Запустите `scripts\windows\setup-project.cmd`.
6. Запустите `scripts\windows\run-local.cmd`.
7. Откройте `http://localhost:3000`.

## Импорт старых данных

Если у вас есть JSON-выгрузка из старой системы, положите файлы в папку `migration/firebase-export` и выполните:

```bash
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

Для импортированных пользователей будет установлен временный пароль из `MIGRATION_DEFAULT_PASSWORD`.

## Прод-развертывание

Для выкладки на российскую ВМ используйте:

- `deploy/yandex-vm/install-app.sh`
- `scripts/windows/deploy-to-yandex-vm.cmd`

Полная инструкция лежит в `docs/migration-rf.md`.
