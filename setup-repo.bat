@echo off
REM setup-repo.bat - Initialize a new bare repository with post-receive hook (Windows)

if "%1"=="" (
  echo Usage: setup-repo.bat ^<repo-name^>
  exit /b 1
)

set REPO_NAME=%1
set REPO_PATH=git\projects\%REPO_NAME%.git
set HOOK_TEMPLATE_JS=git\hooks\post-receive.js
set HOOK_TEMPLATE_BAT=git\hooks\post-receive.bat

echo Creating bare repository: %REPO_PATH%
git init --bare "%REPO_PATH%"

echo Installing post-receive hooks...
copy "%HOOK_TEMPLATE_JS%" "%REPO_PATH%\hooks\post-receive.js" >nul
copy "%HOOK_TEMPLATE_BAT%" "%REPO_PATH%\hooks\post-receive.bat" >nul

REM Git on Windows can use .bat or wrapper
echo @echo off > "%REPO_PATH%\hooks\post-receive"
echo node "%%~dp0post-receive.js" >> "%REPO_PATH%\hooks\post-receive"

echo.
echo [32m✓ Repository created successfully![0m
echo.
echo Clone with:
echo   git clone %CD%\%REPO_PATH%
echo.

exit /b 0
