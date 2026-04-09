@echo off
setlocal

where winget >nul 2>nul
if errorlevel 1 (
  echo winget не найден. Установите App Installer из Microsoft Store и повторите.
  exit /b 1
)

winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements

endlocal
