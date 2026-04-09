@echo off
setlocal

if "%~4"=="" (
  echo Использование: scripts\windows\configure-domain.cmd USER HOST DOMAIN EMAIL [KEY_PATH] [ALIAS_DOMAIN]
  exit /b 1
)

where ssh >nul 2>nul
if errorlevel 1 (
  echo ssh не найден. Включите OpenSSH Client в параметрах Windows.
  exit /b 1
)

set USER_NAME=%~1
set HOST_NAME=%~2
set DOMAIN_NAME=%~3
set EMAIL=%~4
set KEY_PATH=%~5
set ALIAS_DOMAIN=%~6
set SSH_ARGS=

if not "%KEY_PATH%"=="" (
  set SSH_ARGS=-i "%KEY_PATH%"
)

if "%ALIAS_DOMAIN%"=="" (
  ssh %SSH_ARGS% %USER_NAME%@%HOST_NAME% "cd ~/stud-pod && bash deploy/yandex-vm/configure-domain.sh %DOMAIN_NAME% %EMAIL%"
) else (
  ssh %SSH_ARGS% %USER_NAME%@%HOST_NAME% "cd ~/stud-pod && bash deploy/yandex-vm/configure-domain.sh %DOMAIN_NAME% %EMAIL% %ALIAS_DOMAIN%"
)

endlocal
