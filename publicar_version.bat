@echo off
chcp 65001 >nul
title Publicador de Versiones - WorkStation BackOffice
echo ============================================================
echo   WORKSTATION - PUBLICAR NUEVA VERSION EN GIT
echo ============================================================
echo.
node "%~dp0scripts\release_version.js"
echo.
pause

