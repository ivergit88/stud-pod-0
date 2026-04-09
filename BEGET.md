# Быстрый путь: правка и деплой

Проект лежит здесь:

```bash
/home/admin1/stud-pod
```

## Самый короткий сценарий

1. Открыть проект в VS Code:

```bash
studpod
```

2. Отредактировать нужные файлы.

3. Если локально нет `.env`, один раз подтянуть его с сервера:

```bash
studpod-fetch-env
```

4. Задеплоить одной командой:

```bash
studpod-deploy
```

## Если запускаешь из терминала внутри проекта

```bash
./scripts/deploy-beget.sh
```

Prod `.env` можно скачать так:

```bash
./scripts/fetch-beget-env.sh
```

## Где что лежит

- `src/pages` - страницы сайта
- `src/components` - переиспользуемые компоненты
- `src/context` - данные и авторизация
- `server.ts` - backend API
- `database.ts` - SQLite схема и миграционные добавления колонок

## Настройки деплоя

Файл:

```bash
/home/admin1/stud-pod/.deploy.env
```

Там уже прописан сервер:

- `DEPLOY_USER=root`
- `DEPLOY_HOST=159.194.208.82`

## Важная проверка перед деплоем

Локально должен существовать файл:

```bash
/home/admin1/stud-pod/.env
```

Если его нет, deploy-скрипт остановится и попросит сначала заполнить секреты.

## HTTPS и домен

Когда домен уже указывает на сервер, запусти:

```bash
./scripts/configure-beget-domain.sh
```

Перед этим заполни в `.deploy.env`:

- `DEPLOY_DOMAIN`
- `DEPLOY_EMAIL`
- `DEPLOY_ALIAS_DOMAIN` при необходимости
