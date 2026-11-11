@echo off
chcp 65001 >nul
title 電子徽章 (JetBadge) 管理控制台
echo 正在啟動 電子徽章 (JetBadge) 管理控制台...
cd /d "%~dp0"
python server.py
pause
