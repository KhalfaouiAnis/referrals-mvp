@echo off
:: minikube-teardown.bat
:: Launcher for minikube-teardown.ps1
::
:: Usage:
::   minikube-teardown.bat                  (delete namespace only)
::   minikube-teardown.bat --delete-cluster (delete namespace + cluster)

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%minikube-teardown.ps1"

set "EXTRA_ARGS="
if /i "%~1"=="--delete-cluster" set "EXTRA_ARGS=-DeleteCluster"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %EXTRA_ARGS%

if %ERRORLEVEL% neq 0 (
    echo.
    echo [error] Teardown failed with exit code %ERRORLEVEL%.
    pause
    exit /b %ERRORLEVEL%
)

pause
