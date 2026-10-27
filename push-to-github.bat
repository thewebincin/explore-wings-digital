@echo off
echo ========================================================
echo  Explore Wings Digital - Connect to GitHub Repository
echo ========================================================
echo.
echo This script will connect your local project to your GitHub repository
echo and push all files (branch: main).
echo.
set /p REPO_URL="Enter your GitHub repository URL (e.g. https://github.com/username/explore-wings.git): "
if "%REPO_URL%"=="" (
    echo.
    echo [ERROR] No repository URL provided. Aborted.
    echo.
    pause
    exit /b 1
)

echo.
echo Configuring remote 'origin' to %REPO_URL%...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  [SUCCESS] Successfully pushed to GitHub!
    echo ========================================================
) else (
    echo.
    echo [NOTE] If GitHub asked for authentication, make sure you are logged in
    echo with your GitHub Personal Access Token or SSH key.
)
echo.
pause
