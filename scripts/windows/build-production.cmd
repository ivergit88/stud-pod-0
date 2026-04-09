@echo off
setlocal

set ROOT_DIR=%~dp0\..\..\
cd /d "%ROOT_DIR%"

if not exist ".env" (
  echo Файл .env не найден. Сначала создайте и заполните .env
  exit /b 1
)

npm run build

endlocal
