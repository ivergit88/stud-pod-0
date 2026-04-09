#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
SERVICE_NAME="stud-pod"
NODE_MAJOR="22"
CURRENT_USER="$(whoami)"
DATA_DIR="${DATA_DIR:-${HOME}/stud-pod-data}"
DATABASE_PATH="${DATABASE_PATH:-${DATA_DIR}/database.sqlite}"
if [[ "${CURRENT_USER}" == "root" ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

wait_for_apt() {
  while pgrep -x apt >/dev/null 2>&1 \
    || pgrep -x apt-get >/dev/null 2>&1 \
    || pgrep -x dpkg >/dev/null 2>&1 \
    || pgrep -x unattended-upgr >/dev/null 2>&1; do
    echo "Жду завершения фоновых обновлений Ubuntu..."
    sleep 5
  done
}

if [[ ! -f "${APP_DIR}/.env" ]]; then
  echo ".env не найден в ${APP_DIR}"
  exit 1
fi

wait_for_apt
${SUDO} apt-get update
wait_for_apt
${SUDO} apt-get install -y ca-certificates curl gnupg build-essential nginx

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v${NODE_MAJOR}* ]]; then
  if [[ -z "${SUDO}" ]]; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  else
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | ${SUDO} -E bash -
  fi
  wait_for_apt
  ${SUDO} apt-get install -y nodejs
fi

cd "${APP_DIR}"

if ! swapon --show | grep -q .; then
  total_mem_kb="$(awk '/MemTotal/ { print $2 }' /proc/meminfo)"
  if [[ "${total_mem_kb}" -lt 1500000 ]]; then
    ${SUDO} fallocate -l 2G /swapfile || ${SUDO} dd if=/dev/zero of=/swapfile bs=1M count=2048
    ${SUDO} chmod 600 /swapfile
    ${SUDO} mkswap /swapfile
    ${SUDO} swapon /swapfile
    if ! grep -q '^/swapfile ' /etc/fstab; then
      echo '/swapfile none swap sw 0 0' | ${SUDO} tee -a /etc/fstab >/dev/null
    fi
  fi
fi

if [[ -f package-lock.json ]]; then
  npm ci --legacy-peer-deps
else
  npm install --legacy-peer-deps
fi
npm run build
mkdir -p "${DATA_DIR}"

${SUDO} tee "/etc/systemd/system/${SERVICE_NAME}.service" >/dev/null <<EOF
[Unit]
Description=Student Podryad portal
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATABASE_PATH=${DATABASE_PATH}
ExecStart=/usr/bin/env npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

if [[ ! -f "/etc/nginx/sites-available/${SERVICE_NAME}" ]]; then
  ${SUDO} tee "/etc/nginx/sites-available/${SERVICE_NAME}" >/dev/null <<'EOF'
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
fi

${SUDO} ln -sf "/etc/nginx/sites-available/${SERVICE_NAME}" "/etc/nginx/sites-enabled/${SERVICE_NAME}"
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  ${SUDO} rm -f /etc/nginx/sites-enabled/default
fi

${SUDO} nginx -t
${SUDO} systemctl daemon-reload
${SUDO} systemctl enable "${SERVICE_NAME}"
${SUDO} systemctl restart "${SERVICE_NAME}"
${SUDO} systemctl restart nginx

echo "Развертывание завершено. Откройте http://IP_ВАШЕЙ_ВМ"
