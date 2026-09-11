import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve('.env');
if (!fs.existsSync(envPath)) process.exit(0);

const text = fs.readFileSync(envPath, 'utf8');
const match = text.match(/^ADMIN_SETUP_TOKEN=(.*)$/m);
if (match?.[1]?.trim()) process.exit(0);

const token = crypto.randomBytes(24).toString('base64url');
const next = match
  ? text.replace(/^ADMIN_SETUP_TOKEN=.*$/m, `ADMIN_SETUP_TOKEN=${token}`)
  : `${text.trimEnd()}\nADMIN_SETUP_TOKEN=${token}\n`;
fs.writeFileSync(envPath, next, { encoding: 'utf8', mode: 0o600 });
console.log('Создан локальный ADMIN_SETUP_TOKEN в .env. Он понадобится один раз на странице настройки администратора.');
