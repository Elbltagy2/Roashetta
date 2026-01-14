@echo off
echo ========================================
echo    Roashetta Server - Build .exe
echo ========================================
echo.

echo [1/6] Installing dependencies...
cd /d "%~dp0"
call npm install
cd backend
call npm install
call npm install pkg --save-dev

echo.
echo [2/6] Building frontend...
cd /d "%~dp0"
call npm run build

echo.
echo [3/6] Copying frontend to backend...
if exist "backend\public" rmdir /s /q "backend\public"
mkdir "backend\public"
xcopy "dist\*" "backend\public\" /E /I /Y

echo.
echo [4/6] Building backend TypeScript...
cd backend
call npm run build

echo.
echo [5/6] Creating .exe file...
call npm run build:exe:win

echo.
echo [6/6] Copying required files to release...
copy "node_modules\sql.js\dist\sql-wasm.wasm" "release\" /Y
copy ".env.production.example" "release\.env.example" /Y

echo.
echo ========================================
echo    Build Complete!
echo ========================================
echo.
echo Your files are in: backend\release\
echo.
echo Contents:
echo   - RoashettaServer.exe (main application)
echo   - sql-wasm.wasm (database engine)
echo   - .env.example (configuration template)
echo.
echo To run the server:
echo   1. Copy the 'release' folder to your target computer
echo   2. Rename .env.example to .env and update JWT_SECRET
echo   3. Double-click RoashettaServer.exe
echo   4. Open browser to http://localhost:3000
echo.
pause
