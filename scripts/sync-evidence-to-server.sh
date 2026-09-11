#!/usr/bin/env bash
set -euo pipefail

# Синхронизация доказательной базы пилота с продакшн-сервером:
# заливает консолидированные XLSX и запускает идемпотентный импорт на сервере.
# Данные участников и учреждений обновляются по принципу upsert,
# админ и реальные регистрации на сервере не затрагиваются.

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
REMOTE_SRC_DIR="${REMOTE_SRC_DIR:-/root/evidence-source}"
DEFAULT_SOURCE="/mnt/c/Users/Administrator/Downloads/Доказательная_база_Студенческий_подряд_2026_ГОТОВО/Доказательная_база_Студенческий_подряд_2026/02_RAW_НЕ_ИЗМЕНЯТЬ/02_КОНСОЛИДИРОВАННЫЕ_30-08"
SOURCE_DIR="${1:-${DEFAULT_SOURCE}}"
REMOTE_DATA_DIR="${REMOTE_DATA_DIR:-/root/stud-pod-data}"

SSH_ARGS=(-p "${DEPLOY_PORT}")
SCP_ARGS=(-P "${DEPLOY_PORT}")
if [[ -n "${DEPLOY_KEY_PATH}" ]]; then
  SSH_ARGS+=(-i "${DEPLOY_KEY_PATH}")
  SCP_ARGS+=(-i "${DEPLOY_KEY_PATH}")
fi

TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Не найдена папка с консолидированными XLSX: ${SOURCE_DIR}"
  echo "Передайте путь первым аргументом: $0 <путь к 02_КОНСОЛИДИРОВАННЫЕ_30-08>"
  exit 1
fi

ARCHIVE_PATH="$(mktemp /tmp/evidence-src.XXXXXX.tar.gz)"
cleanup() { rm -f "${ARCHIVE_PATH}"; }
trap cleanup EXIT

echo "Собираю архив исходников из ${SOURCE_DIR}..."
tar -czf "${ARCHIVE_PATH}" -C "$(dirname "${SOURCE_DIR}")" "$(basename "${SOURCE_DIR}")"

echo "Загружаю на ${TARGET}..."
scp "${SCP_ARGS[@]}" "${ARCHIVE_PATH}" "${TARGET}:${REMOTE_SRC_DIR}.tar.gz"

echo "Импортирую на сервере (идемпотентно, без удаления существующих данных)..."
ssh "${SSH_ARGS[@]}" "${TARGET}" "
  set -e
  mkdir -p '${REMOTE_SRC_DIR}' '${REMOTE_DATA_DIR}'
  rm -rf '${REMOTE_SRC_DIR}'/*
  tar -xzf '${REMOTE_SRC_DIR}.tar.gz' -C '${REMOTE_SRC_DIR}' --strip-components=1
  rm -f '${REMOTE_SRC_DIR}.tar.gz'
  command -v python3 >/dev/null || apt-get update && apt-get install -y python3 python3-pip
  python3 -m pip install --break-system-packages --quiet openpyxl==3.1.5 bcrypt==4.2.1 2>/dev/null || pip3 install --break-system-packages --quiet openpyxl==3.1.5 bcrypt==4.2.1
  cd /root/stud-pod
  python3 scripts/import-evidence-data.py \
    --database '${REMOTE_DATA_DIR}/database.sqlite' \
    --source '${REMOTE_SRC_DIR}' \
    --credentials-file '${REMOTE_DATA_DIR}/imported-user-credentials.csv' \
    --apply
  echo 'Готово. Проверьте цифры на сайте: 64 участника, 5 учреждений, 12 задач (12 выполнено), 3 мероприятия.'
"
