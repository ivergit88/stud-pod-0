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
DEPLOY_DOMAIN="${DEPLOY_DOMAIN:-}"
DEPLOY_EMAIL="${DEPLOY_EMAIL:-}"
DEPLOY_ALIAS_DOMAIN="${DEPLOY_ALIAS_DOMAIN:-}"

if [[ -z "${DEPLOY_DOMAIN}" || -z "${DEPLOY_EMAIL}" ]]; then
  echo "Заполни DEPLOY_DOMAIN и DEPLOY_EMAIL в ${CONFIG_FILE}"
  exit 1
fi

SSH_ARGS=(-p "${DEPLOY_PORT}")
if [[ -n "${DEPLOY_KEY_PATH}" ]]; then
  SSH_ARGS+=(-i "${DEPLOY_KEY_PATH}")
fi

TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"

if [[ -n "${DEPLOY_ALIAS_DOMAIN}" ]]; then
  ssh "${SSH_ARGS[@]}" "${TARGET}" \
    "cd /root/stud-pod && bash deploy/yandex-vm/configure-domain.sh ${DEPLOY_DOMAIN} ${DEPLOY_EMAIL} ${DEPLOY_ALIAS_DOMAIN}"
else
  ssh "${SSH_ARGS[@]}" "${TARGET}" \
    "cd /root/stud-pod && bash deploy/yandex-vm/configure-domain.sh ${DEPLOY_DOMAIN} ${DEPLOY_EMAIL}"
fi
