@echo off
echo ==========================================
echo  SETUP - Renace San Cristobal 2028
echo ==========================================
echo.

echo [1/4] Instalando dependencias del Backend...
cd /d "%~dp0backend"
call npm install
if %errorlevel% neq 0 (echo ERROR instalando backend && pause && exit /b 1)

echo.
echo [2/4] Generando cliente Prisma y creando base de datos...
call npx prisma generate
call npx prisma db push
if %errorlevel% neq 0 (echo ERROR con Prisma && pause && exit /b 1)

echo.
echo [3/4] Cargando datos iniciales...
call npx tsx src/seed.ts
if %errorlevel% neq 0 (echo ERROR en seed && pause && exit /b 1)

echo.
echo [4/4] Instalando dependencias del Frontend...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (echo ERROR instalando frontend && pause && exit /b 1)

echo.
echo ==========================================
echo  SETUP COMPLETADO EXITOSAMENTE!
echo ==========================================
echo.
echo  Para iniciar la aplicacion, ejecuta:
echo  start.bat
echo.
echo  Credenciales:
echo  Admin:    admin@renace2028.do / admin2028
echo  Promotor: luis@renace2028.do / promotor2028
echo ==========================================
pause
