@echo off
chcp 65001 >nul
title JetBadge Web E-Badge Console
cd /d "%~dp0"
echo Starting JetBadge Web E-Badge Console...
call python -c "import sys; sys.exit(0 if sys.version_info.major >= 3 else 1)" >nul 2>nul
if %errorlevel%==0 (
    call python server.py
) else (
    call py -3 server.py
)
pause
