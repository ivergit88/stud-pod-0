#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
PORT="3217"
BASE_URL="http://127.0.0.1:${PORT}"
SETUP_TOKEN="smoke-admin-setup-token-0123456789"
PID=""

cleanup() {
  if [[ -n "${PID}" ]]; then
    kill "${PID}" 2>/dev/null || true
  fi
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

cd "${ROOT_DIR}"
PORT="${PORT}" \
DATABASE_PATH="${TMP_DIR}/test.sqlite" \
UPLOADS_DIR="${TMP_DIR}/uploads" \
JWT_SECRET="smoke-test-jwt-secret-0123456789" \
ADMIN_SETUP_TOKEN="${SETUP_TOKEN}" \
YANDEXGPT_API_KEY= \
YANDEX_FOLDER_ID= \
NODE_ENV=development \
COOKIE_SECURE=false \
node --import tsx server.ts >"${TMP_DIR}/server.log" 2>&1 &
PID=$!

for _ in $(seq 1 30); do
  if curl -fsS "${BASE_URL}/api/health" >/dev/null; then
    break
  fi
  sleep 1
done

curl -fsS -c "${TMP_DIR}/cookies" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"ershovivan2802@yandex.ru\",\"password\":\"SmokeAdmin123!\",\"setupToken\":\"${SETUP_TOKEN}\"}" \
  "${BASE_URL}/api/auth/admin-setup" | grep -q '"role":"admin"'

curl -fsS -b "${TMP_DIR}/cookies" "${BASE_URL}/api/admin/overview" | grep -q '"auditLog"'
curl -fsS -b "${TMP_DIR}/cookies" "${BASE_URL}/api/admin/overview" | grep -q '"registeredParticipants":64'
curl -fsS "${BASE_URL}/api/health" | grep -q '"fallbackAvailable":true'

curl -fsS -b "${TMP_DIR}/cookies" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Цифровой архив","projectBrief":"Нужно собрать страницу архива выпусков районной газеты с поиском по годам.","projectSummary":"Адаптивная HTML-страница архива с понятной навигацией.","projectRequirements":"Использовать только материалы учреждения.","format":"online","deadline":"2026-12-31"}' \
  "${BASE_URL}/api/ai/task-breakdown" | grep -q '"subtasks"'

curl -fsS \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","text":"Как создать задачу?"}]}' \
  "${BASE_URL}/api/chat" | grep -q '"reply"'

curl -fsS -H 'Content-Type: application/json' \
  -d '{"role":"student","additionalData":{"email":"smoke-student@example.test","firstName":"Smoke","lastName":"Student","university":"Test","course":1},"password":"Student123!"}' \
  "${BASE_URL}/api/auth/register" >/dev/null

USER_ID="$(DATABASE_PATH="${TMP_DIR}/test.sqlite" node --import tsx --input-type=module -e "import { initDb } from './database.ts'; const db = await initDb(); const row = await db.get('SELECT id FROM users WHERE email = ?', 'smoke-student@example.test'); process.stdout.write(row.id); await db.close();")"

curl -fsS -b "${TMP_DIR}/cookies" \
  -H 'Content-Type: application/json' \
  -X PATCH \
  -d '{"status":"blocked"}' \
  "${BASE_URL}/api/admin/users/${USER_ID}/status" | grep -q '"status":"blocked"'

ORG_ID="smoke-org"
TASK_ID="smoke-task"
RESPONSE_ID="smoke-response"
STUDENT_ID="$(DATABASE_PATH="${TMP_DIR}/test.sqlite" node --import tsx --input-type=module -e "import { initDb } from './database.ts'; const db = await initDb(); const student = await db.get('SELECT id FROM users WHERE email = ?', 'smoke-student@example.test'); await db.run(\"UPDATE users SET status = 'active', points = 40 WHERE id = ?\", student.id); await db.run(\"INSERT INTO users (id,email,password_hash,role,name,status) VALUES (?,?,?,?,?,?)\", '${ORG_ID}', 'org@example.test', 'disabled', 'organization', 'Smoke Org', 'active'); await db.run(\"INSERT INTO tasks (id,title,description,organizationId,organizationName,category,pointsReward,deadline,status) VALUES (?,?,?,?,?,?,?,?,?)\", '${TASK_ID}', 'Smoke task', 'Smoke task', '${ORG_ID}', 'Smoke Org', 'Test', 40, '2026-12-31', 'completed'); await db.run(\"INSERT INTO task_responses (id,taskId,studentId,studentName,status,created_at) VALUES (?,?,?,?,?,?)\", '${RESPONSE_ID}', '${TASK_ID}', student.id, 'Smoke Student', 'completed', new Date().toISOString()); await db.run(\"INSERT INTO task_response_members (id,responseId,taskId,studentId,studentName,role) VALUES (?,?,?,?,?,?)\", 'smoke-member', '${RESPONSE_ID}', '${TASK_ID}', student.id, 'Smoke Student', 'leader'); process.stdout.write(student.id); await db.close();")"

ADMIN_ID="$(DATABASE_PATH="${TMP_DIR}/test.sqlite" node --import tsx --input-type=module -e "import { initDb } from './database.ts'; const db = await initDb(); const row = await db.get(\"SELECT id FROM users WHERE role = 'admin'\"); process.stdout.write(row.id); await db.close();")"
DATABASE_PATH="${TMP_DIR}/test.sqlite" node --import tsx --input-type=module -e "import { initDb } from './database.ts'; const db = await initDb(); await db.run(\"UPDATE tasks SET organizationId = ? WHERE id = ?\", '${ADMIN_ID}', '${TASK_ID}'); await db.close();"

curl -fsS -b "${TMP_DIR}/cookies" \
  -H 'Content-Type: application/json' \
  -d '{"reason":"Результат требует исправления после повторной проверки"}' \
  "${BASE_URL}/api/task-responses/${RESPONSE_ID}/appeal" | grep -q '"status":"needs_revision"'

DATABASE_PATH="${TMP_DIR}/test.sqlite" node --import tsx --input-type=module -e "import { initDb } from './database.ts'; const db = await initDb(); const student = await db.get('SELECT points FROM users WHERE id = ?', '${STUDENT_ID}'); const task = await db.get('SELECT status FROM tasks WHERE id = ?', '${TASK_ID}'); if (student.points !== 0 || task.status !== 'in_progress') process.exit(1); await db.close();"

echo 'admin smoke: ok'
