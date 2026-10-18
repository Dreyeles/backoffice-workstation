@echo off
chcp 65001 >nul
echo ============================================================
echo   WORKSTATION - ROLLBACK DE EMERGENCIA (GIT REVERT)
echo ============================================================
echo.
echo ADVERTENCIA: Esta acción revertirá todos los archivos al commit
echo inmediatamente anterior en Git (HEAD~1).
echo.
echo Presiona Ctrl+C para cancelar o cualquier tecla para continuar...
pause >nul
echo.
echo Revertiendo archivos al commit anterior...
git checkout HEAD~1
echo.
echo ============================================================
echo   Listo. Los archivos han sido revertidos al commit anterior.
echo   Recarga la página en tu navegador (F5 o Ctrl+F5).
echo ============================================================
echo.
pause
