@echo off
setlocal

set "PROJECT_ROOT=%USERPROFILE%\Documents\GitHub\LaerlingeStatus"

echo Starter backend...
start cmd /k "cd /d %PROJECT_ROOT%\backend && node index.js"

timeout /t 2 >nul

echo Starter frontend...
start cmd /k "cd /d %PROJECT_ROOT%\frontend && ng serve"

timeout /t 3 >nul

echo Åbner website...
start http://localhost:4200/

endlocal
