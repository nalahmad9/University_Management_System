@echo off
title UniHub Launcher
echo ============================================================
echo   Starting UniHub - University Management System
echo   Backend API : http://localhost:5000
echo   Frontend    : http://localhost:5173
echo   (Two windows will open. Close them to stop the servers.)
echo ============================================================
start "UniHub Backend :5000" /D "%~dp0backend" cmd /k "npm run dev"
start "UniHub Frontend :5173" /D "%~dp0" cmd /k "npm run dev"
timeout /t 2 >nul
exit
