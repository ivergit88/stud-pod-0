@echo off
setlocal

set ROOT_DIR=%~dp0\..\..\
cd /d "%ROOT_DIR%"

if not exist ".env" (
  copy /Y ".env.example" ".env" >nul
  echo Создан файл .env из шаблона .env.example
)

npm install --legacy-peer-deps

endlocal
