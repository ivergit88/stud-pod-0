#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: bash deploy/yandex-vm/configure-domain.sh DOMAIN EMAIL [ALIAS_DOMAIN]"
  exit 1
fi

DOMAIN="$1"
EMAIL="$2"
ALIAS_DOMAIN="${3:-}"
SERVICE_NAME="stud-pod"
NGINX_SITE="/etc/nginx/sites-available/${SERVICE_NAME}"

if [[ "$(whoami)" == "root" ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

if [[ ! -f "${NGINX_SITE}" ]]; then
  echo "nginx config ${NGINX_SITE} not found"
  exit 1
fi

SERVER_NAMES="${DOMAIN}"
if [[ -n "${ALIAS_DOMAIN}" ]]; then
  SERVER_NAMES="${SERVER_NAMES} ${ALIAS_DOMAIN}"
fi

export SERVER_NAMES
python3 - <<'PY'
from pathlib import Path
import os

path = Path("/etc/nginx/sites-available/stud-pod")
text = path.read_text()
needle = "    server_name _;"
replacement = f"    server_name {os.environ['SERVER_NAMES']};"
if needle in text:
    text = text.replace(needle, replacement, 1)
else:
    import re
    text, count = re.subn(r"^\s*server_name\s+.*?;$", replacement, text, count=1, flags=re.M)
    if count == 0:
        raise SystemExit("server_name directive not found")
path.write_text(text)
PY

${SUDO} nginx -t
${SUDO} systemctl reload nginx

${SUDO} apt-get update
${SUDO} apt-get install -y snapd

if ! command -v certbot >/dev/null 2>&1; then
  ${SUDO} snap install --classic certbot
  ${SUDO} ln -sf /snap/bin/certbot /usr/local/bin/certbot
fi

CERTBOT_ARGS=(--nginx -d "${DOMAIN}" --agree-tos -m "${EMAIL}" --redirect --non-interactive)
if [[ -n "${ALIAS_DOMAIN}" ]]; then
  CERTBOT_ARGS+=(-d "${ALIAS_DOMAIN}")
fi

${SUDO} certbot "${CERTBOT_ARGS[@]}"
${SUDO} certbot renew --dry-run

echo "Domain configured: ${SERVER_NAMES}"
