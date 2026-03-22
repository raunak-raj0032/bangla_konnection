@echo off
setlocal

if not exist "%AppData%\npm\shopify.cmd" (
  echo Shopify CLI was not found at "%AppData%\npm\shopify.cmd".
  exit /b 1
)

if exist "C:\Program Files\Git\cmd\git.exe" (
  set "PATH=C:\Program Files\Git\bin;C:\Program Files\Git\cmd;%PATH%"
)

"%AppData%\npm\shopify.cmd" theme pull --environment default %*
