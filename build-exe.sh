#!/bin/bash

echo "========================================"
echo "   Roashetta Server - Build Executable"
echo "========================================"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "[1/6] Installing dependencies..."
npm install
cd backend
npm install
npm install pkg --save-dev

echo ""
echo "[2/6] Building frontend..."
cd "$SCRIPT_DIR"
npm run build

echo ""
echo "[3/6] Copying frontend to backend..."
rm -rf backend/public
mkdir -p backend/public
cp -r dist/* backend/public/

echo ""
echo "[4/6] Building backend TypeScript..."
cd backend
npm run build

echo ""
echo "[5/6] Creating executable..."

# Detect OS and build accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Building for macOS..."
    npm run build:exe:mac
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Building for Linux..."
    npm run build:exe:linux
else
    echo "Building for Windows..."
    npm run build:exe:win
fi

echo ""
echo "[6/6] Copying required files to release..."
cp node_modules/sql.js/dist/sql-wasm.wasm release/
cp .env.production.example release/.env.example

echo ""
echo "========================================"
echo "   Build Complete!"
echo "========================================"
echo ""
echo "Your files are in: backend/release/"
echo ""
echo "Contents:"
echo "  - RoashettaServer (main application)"
echo "  - sql-wasm.wasm (database engine)"
echo "  - .env.example (configuration template)"
echo ""
echo "To run the server:"
echo "  1. Copy the 'release' folder to your target computer"
echo "  2. Rename .env.example to .env and update JWT_SECRET"
echo "  3. Run ./RoashettaServer (Mac/Linux) or RoashettaServer.exe (Windows)"
echo "  4. Open browser to http://localhost:3000"
echo ""
