@echo off
setlocal

set ROOT_DIR=%~dp0\..\..\
cd /d "%ROOT_DIR%"

if not exist ".env" (
  echo Файл .env не найден. Сначала запустите scripts\windows\setup-project.cmd
  exit /b 1
)

npm run dev

endlocal
