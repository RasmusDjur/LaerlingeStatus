@echo off
setlocal

REM Set the project path 
set "PROJECT_ROOT=%USERPROFILE%\Documents\Github\LaerlingeStatus"

echo Starter backend...
REM Backend will listen on all network interfaces (important for remote access)
start cmd /k "cd /d %PROJECT_ROOT%\backend && node index.js"

timeout /t 2 >nul

echo Starter frontend...
REM Frontend will bind to 0.0.0.0 so it's reachable from outside VM
start cmd /k "cd /d %PROJECT_ROOT%\frontend && ng serve --host 0.0.0.0 --port 4200"

timeout /t 3 >nul

echo Åbner website i browser...
REM IMPORTANT: Use VM IP instead of localhost so it opens for external access
start http://10.0.1.210:4200/

endlocal 
