@echo off
title TimeIn - Startup
echo.
echo  ████████╗██╗███╗   ███╗███████╗██╗███╗   ██╗
echo     ██╔══╝██║████╗ ████║██╔════╝██║████╗  ██║
echo     ██║   ██║██╔████╔██║█████╗  ██║██╔██╗ ██║
echo     ██║   ██║██║╚██╔╝██║██╔══╝  ██║██║╚██╗██║
echo     ██║   ██║██║ ╚═╝ ██║███████╗██║██║ ╚████║
echo     ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝
echo.
echo  מפעיל את מערכת TimeIn...
echo.

echo  [1/2] מפעיל שרת Backend (פורט 3001)...
start "TimeIn Server - Backend" cmd /k "title TimeIn Backend && cd /d "%~dp0server" && node --experimental-sqlite src/index.js"

timeout /t 2 /nobreak > nul

echo  [2/2] מפעיל Client (פורט 5173)...
start "TimeIn Client - Frontend" cmd /k "title TimeIn Frontend && cd /d "%~dp0client" && npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo  ✓ המערכת מוכנה!
echo.
echo  פתח בדפדפן:  http://localhost:5173
echo.
echo  משתמשי דמו (סיסמה: password123):
echo    admin@timeln.com   - אדמין
echo    sara@timeln.com    - מנהלת
echo    david@timeln.com   - עובד
echo    michal@timeln.com  - עובדת
echo.
echo  לחץ על כל קישור בדפדפן לכניסה מהירה
echo.

start http://localhost:5173

pause
