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

SCP_ARGS=(-P "${DEPLOY_PORT}")
if [[ -n "${DEPLOY_KEY_PATH}" ]]; then
  SCP_ARGS+=(-i "${DEPLOY_KEY_PATH}")
fi

TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
LOCAL_ENV_PATH="${ROOT_DIR}/.env"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [[ -f "${LOCAL_ENV_PATH}" ]]; then
  cp "${LOCAL_ENV_PATH}" "${LOCAL_ENV_PATH}.backup-${TIMESTAMP}"
  echo "Сделал резервную копию: ${LOCAL_ENV_PATH}.backup-${TIMESTAMP}"
fi

scp "${SCP_ARGS[@]}" "${TARGET}:${REMOTE_APP_DIR}/.env" "${LOCAL_ENV_PATH}"
echo "Скачал prod .env в ${LOCAL_ENV_PATH}"
