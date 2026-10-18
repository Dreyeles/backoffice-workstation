@echo off
chcp 65001 >nul
echo ============================================================
echo   WORKSTATION - ACTUALIZAR VERSIÓN DE SEGURIDAD (RESPALDO)
echo ============================================================
echo.
echo Sincronizando archivos actuales a la carpeta version_anterior/...
node scripts/sync_version_anterior.js --from-current
echo.
echo ============================================================
echo   Listo. La carpeta version_anterior/ ha sido actualizada.
echo ============================================================
echo.
pause
