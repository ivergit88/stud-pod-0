#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-3000}"

cd "${ROOT_DIR}"
node scripts/ensure-local-admin-token.mjs
printf '\nСайт запускается. Откройте ссылки:\n'
printf '  Главная:           http://localhost:%s/\n' "${PORT}"
printf '  Режим эксперта:    http://localhost:%s/эксперт\n' "${PORT}"
printf '  Вход администратора: http://localhost:%s/вход\n' "${PORT}"
printf '  Настройка администратора: http://localhost:%s/администратор/настройка\n\n' "${PORT}"

exec node --import tsx server.ts
