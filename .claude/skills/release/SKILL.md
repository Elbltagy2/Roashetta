---
description: Build and release a new version of Roashetta for Windows. Compiles TypeScript, builds frontend, packages exe, updates manifest, commits, pushes, and creates GitHub release.
---

# Release Roashetta

This skill builds a production-ready Windows exe and publishes it as a GitHub release.

## What it does (in order)

1. Bump `APP_VERSION` in `backend/src/utils/version.ts`
2. Compile TypeScript backend: `cd backend && npm run build`  ← **critical, was missing before**
3. Build frontend: `npm run build` (root)
4. Copy `dist/` → `backend/public/`
5. Build Windows exe: `cd backend && npm run build:exe:win`
6. Verify the exe contains the correct version string
7. Compute SHA256 of the exe
8. Update `backend/release/manifest.json`
9. Commit all changes and push to main
10. Create GitHub release with exe + manifest assets

## How to invoke

```
/release
```

Or ask: "build and release a new version" / "deploy new version"

## Steps

### Step 1 — Determine new version

Read current version from `backend/src/utils/version.ts`. Ask user what to bump (patch/minor/major) or accept a specific version like `1.1.21`.

### Step 2 — Compile TypeScript (MUST do before pkg)

```bash
cd backend && npm run build
```

Verify compiled version:
```bash
cat backend/dist/utils/version.js | grep APP_VERSION
```
Must show the new version. If not, STOP — do not build exe.

### Step 3 — Build frontend

```bash
npm run build
```

### Step 4 — Copy frontend to backend

```bash
rm -rf backend/public/* && cp -r dist/* backend/public/
```

### Step 5 — Build exe

```bash
cd backend && npm run build:exe:win
```

### Step 6 — Verify exe version

```bash
strings backend/release/RoashettaServer.exe | grep -E "^1\.[0-9]+\.[0-9]+$" | sort -u
```

Must show the new version. If it shows `1.1.10` or old version → TypeScript was not compiled correctly. STOP and re-run step 2.

### Step 7 — SHA256 + manifest

```bash
shasum -a 256 backend/release/RoashettaServer.exe
```

Update `backend/release/manifest.json`:
```json
{
  "version": "X.X.XX",
  "downloadUrl": "https://github.com/Elbltagy2/Roashetta/releases/latest/download/RoashettaServer.exe",
  "sha256": "<sha256 from above>",
  "releasedAt": "<current datetime ISO>",
  "notes": "<release notes>"
}
```

### Step 8 — Commit and push

```bash
git add backend/src/utils/version.ts backend/dist/ backend/public/ backend/release/manifest.json src/
git commit -m "chore: release vX.X.XX\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
```

### Step 9 — GitHub release

```bash
gh release create vX.X.XX \
  backend/release/RoashettaServer.exe \
  backend/release/manifest.json \
  --title "vX.X.XX — <title>" \
  --notes "<release notes>"
```

## Checklist before releasing

- [ ] TypeScript compiled (`dist/` files newer than source changes)
- [ ] `dist/utils/version.js` shows new version
- [ ] Exe verified with `strings` — shows new version, not `1.1.10`
- [ ] SHA256 in manifest matches exe
- [ ] `backend/public/` has fresh frontend build
- [ ] All changes committed and pushed
- [ ] GitHub release created with both assets (exe + manifest.json)

## Common mistakes (what went wrong before)

- **Forgot `npm run build` in backend** → exe always had old code from May 18
- **Replaced only the frontend** → backend code unchanged
- **Forgot to copy dist/ to backend/public/** → frontend in exe was old
- **Checked version.ts only** → compiled dist/ still had old version
