#!/usr/bin/env bash
#
# release.sh — build a new Roashetta Windows release and produce manifest.json
#
# Usage:   ./release.sh <version> [download-url-base]
# Example: ./release.sh 1.1.0 https://github.com/you/roashetta/releases/download/v1.1.0
#
# What it does:
#   1. Builds the frontend (vite) and copies it into backend/public
#   2. Compiles the backend TypeScript
#   3. Packages the Windows executable via pkg
#   4. Computes SHA-256 of the new exe
#   5. Writes backend/release/manifest.json with the version, URL, hash
#   6. Bumps the APP_VERSION constant in backend/src/utils/version.ts
#
# You still need to upload the exe + manifest.json to your host.

set -euo pipefail

VERSION="${1:-}"
URL_BASE="${2:-}"

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version> [download-url-base]"
    echo "Example: $0 1.1.0 https://github.com/you/roashetta/releases/download/v1.1.0"
    exit 1
fi

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> Bumping APP_VERSION to $VERSION"
sed -i.bak "s/export const APP_VERSION = '.*';/export const APP_VERSION = '$VERSION';/" \
    backend/src/utils/version.ts
rm -f backend/src/utils/version.ts.bak

echo "==> Building frontend"
npm run build

echo "==> Copying frontend into backend/public"
rm -rf backend/public
cp -r dist backend/public

echo "==> Building backend TypeScript"
(cd backend && npm run build)

echo "==> Packaging Windows executable"
(cd backend && npm run build:exe:win)

EXE="backend/release/RoashettaServer.exe"
if [ ! -f "$EXE" ]; then
    echo "Error: $EXE not found after build"
    exit 1
fi

echo "==> Computing SHA-256"
if command -v shasum >/dev/null 2>&1; then
    HASH=$(shasum -a 256 "$EXE" | awk '{print $1}')
else
    HASH=$(sha256sum "$EXE" | awk '{print $1}')
fi
echo "    sha256: $HASH"

DOWNLOAD_URL="${URL_BASE:+$URL_BASE/}RoashettaServer.exe"

echo "==> Writing manifest"
MANIFEST="backend/release/manifest.json"
cat > "$MANIFEST" <<JSON
{
  "version": "$VERSION",
  "downloadUrl": "$DOWNLOAD_URL",
  "sha256": "$HASH",
  "releasedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "notes": "Release $VERSION"
}
JSON
echo "    wrote $MANIFEST"

echo ""
echo "Release $VERSION built successfully."
echo "Next steps:"
echo "  1. Upload $EXE to your host"
echo "  2. Upload $MANIFEST to the URL configured in UPDATE_MANIFEST_URL"
echo "     (clinics will check this URL for updates)"
