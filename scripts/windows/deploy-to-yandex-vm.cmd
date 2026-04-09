@echo off
setlocal

if "%~2"=="" (
  echo Использование: scripts\windows\deploy-to-yandex-vm.cmd USER HOST [KEY_PATH]
  exit /b 1
)

where ssh >nul 2>nul
if errorlevel 1 (
  echo ssh не найден. Включите OpenSSH Client в параметрах Windows.
  exit /b 1
)

where scp >nul 2>nul
if errorlevel 1 (
  echo scp не найден. Включите OpenSSH Client в параметрах Windows.
  exit /b 1
)

where tar >nul 2>nul
if errorlevel 1 (
  echo tar не найден. Нужен встроенный tar из Windows 10/11.
  exit /b 1
)

set USER_NAME=%~1
set HOST_NAME=%~2
set KEY_PATH=%~3
set ROOT_DIR=%~dp0\..\..\
set ARCHIVE=%TEMP%\stud-pod-deploy.tar.gz
set SSH_ARGS=

if not "%KEY_PATH%"=="" (
  set SSH_ARGS=-i "%KEY_PATH%"
)

cd /d "%ROOT_DIR%"

if not exist ".env" (
  echo Файл .env не найден. Сначала заполните .env
  exit /b 1
)

if exist "%ARCHIVE%" del /f /q "%ARCHIVE%"

tar -czf "%ARCHIVE%" .env .env.example .gitignore README.md package.json package-lock.json database.ts server.ts tsconfig.json vite.config.ts index.html src scripts deploy docs
if errorlevel 1 exit /b 1

scp %SSH_ARGS% "%ARCHIVE%" %USER_NAME%@%HOST_NAME%:~/stud-pod-deploy.tar.gz
if errorlevel 1 exit /b 1

ssh %SSH_ARGS% %USER_NAME%@%HOST_NAME% "rm -rf ~/stud-pod && mkdir -p ~/stud-pod && tar -xzf ~/stud-pod-deploy.tar.gz -C ~/stud-pod && cd ~/stud-pod && bash deploy/yandex-vm/install-app.sh"

endlocal
