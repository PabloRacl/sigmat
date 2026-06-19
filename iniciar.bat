@echo off
title ATLAS - Iniciando Servidores
echo ============================================
echo         ATLAS - Iniciando Servidores
echo ============================================
echo.

echo [1/2] Iniciando BACKEND (porta 3000)...
start "ATLAS Backend" cmd /c "cd /d %~dp0atlas-backend && npm run start:dev"

echo [2/2] Iniciando FRONTEND (porta 4200)...
start "ATLAS Frontend" cmd /c "cd /d %~dp0atlas-frontend && npm start"

echo.
echo ============================================
echo  Servidores iniciados!
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:4200
echo ============================================
echo.
echo  Pressione qualquer tecla para fechar esta janela...
pause >nul
