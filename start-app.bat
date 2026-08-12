@echo off
title UniHub - University Management System (Dev Server)
cd /d "C:\Users\RSS\Claude\Projects\universtiy managment system"
echo ============================================================
echo   Starting UniHub University Management System...
echo   The app will open in your browser at http://localhost:5173
echo   Keep this window open. Close it to stop the server.
echo ============================================================
echo.
call npm run dev
pause
