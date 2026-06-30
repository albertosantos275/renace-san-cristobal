@echo off
echo ==========================================
echo  Renace San Cristobal 2028 - Iniciando
echo ==========================================
echo.
echo Iniciando Backend (puerto 3001)...
start cmd /k "cd /d "%~dp0backend" && npm run dev"
echo.
echo Iniciando Frontend (puerto 5173)...
start cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo.
echo ==========================================
echo  Abrir en el navegador:
echo  Sitio publico:  http://localhost:5173
echo  Admin:          http://localhost:5173/admin
echo  API Backend:    http://localhost:3001/api/health
echo ==========================================
echo.
timeout /t 5
start http://localhost:5173
