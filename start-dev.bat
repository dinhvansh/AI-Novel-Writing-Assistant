@echo off
title AI Novel Writing Assistant - Dev Server
cd /d "d:\AI Novel Production Engine"
echo Starting AI Novel Writing Assistant dev server...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo.
echo Press Ctrl+C to stop
echo.
call pnpm dev
pause
