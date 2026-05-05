#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="${ROOT_DIR}/.deploy.env"

if [[ -f "${CONFIG_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${CONFIG_FILE}"
fi

DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_HOST="${DEPLOY_HOST:-159.194.208.82}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_KEY_PATH="${DEPLOY_KEY_PATH:-}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/root/stud-pod}"
REMOTE_ARCHIVE="${REMOTE_ARCHIVE:-/root/stud-pod-deploy.tar.gz}"

SSH_ARGS=(-p "${DEPLOY_PORT}")
SCP_ARGS=(-P "${DEPLOY_PORT}")
if [[ -n "${DEPLOY_KEY_PATH}" ]]; then
  SSH_ARGS+=(-i "${DEPLOY_KEY_PATH}")
  SCP_ARGS+=(-i "${DEPLOY_KEY_PATH}")
fi

TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
ARCHIVE_PATH="$(mktemp /tmp/stud-pod-deploy.XXXXXX.tar.gz)"

cleanup() {
  rm -f "${ARCHIVE_PATH}"
}
trap cleanup EXIT

if [[ ! -f "${ROOT_DIR}/.env" ]]; then
  echo "Не найден ${ROOT_DIR}/.env"
  echo "Скопируй .env.example в .env и заполни секреты перед деплоем."
  exit 1
fi

echo "Собираю архив проекта..."
tar -czf "${ARCHIVE_PATH}" \
  -C "${ROOT_DIR}" \
  .env \
  .env.example \
  .gitignore \
  README.md \
  package.json \
  package-lock.json \
  database.ts \
  server.ts \
  tsconfig.json \
  vite.config.ts \
  index.html \
  public \
  src \
  scripts \
  deploy \
  docs

echo "Загружаю архив на ${TARGET}..."
scp "${SCP_ARGS[@]}" "${ARCHIVE_PATH}" "${TARGET}:${REMOTE_ARCHIVE}"

echo "Обновляю приложение на сервере..."
ssh "${SSH_ARGS[@]}" "${TARGET}" \
  "rm -rf ${REMOTE_APP_DIR} && mkdir -p ${REMOTE_APP_DIR} && tar -xzf ${REMOTE_ARCHIVE} -C ${REMOTE_APP_DIR} && cd ${REMOTE_APP_DIR} && bash deploy/yandex-vm/install-app.sh"

echo "Деплой завершён: ${TARGET}"
