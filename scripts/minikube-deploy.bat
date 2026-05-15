@echo off
:: minikube-deploy.bat
:: Launcher for minikube-deploy.ps1
::
:: Usage:
::   minikube-deploy.bat           (normal deploy)
::   minikube-deploy.bat --reset   (wipe cluster first, then deploy)

:: Resolve the directory this .bat lives in so the script always finds
:: minikube-deploy.ps1 regardless of where it is called from.
set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%minikube-deploy.ps1"

:: Pass --reset through as the PowerShell -Reset switch if supplied
set "EXTRA_ARGS="
if /i "%~1"=="--reset" set "EXTRA_ARGS=-Reset"

:: -ExecutionPolicy Bypass lets the script run without permanently
:: changing the machine policy. -NoProfile speeds up startup.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %EXTRA_ARGS%

:: Pause so the window stays open when double-clicked from Explorer
@REM if %ERRORLEVEL% neq 0 (
@REM     echo.
@REM     echo [error] Deploy failed with exit code %ERRORLEVEL%.
@REM     pause
@REM     exit /b %ERRORLEVEL%
@REM )

@REM pause