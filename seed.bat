@echo off
echo Seeding database...
cd /d "%~dp0server"
node --experimental-sqlite src/database/seed.js
pause
