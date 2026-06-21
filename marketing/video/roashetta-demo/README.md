# Roashetta — Vertical Product Demo (9:16)

Egyptian-Arabic voiceover + screen recordings + programmatic overlays.
~43s, 1080×1920, for TikTok / Reels / Shorts. Built with **Hyperframes** (HTML composition → MP4).

## How it works

`index.html` is one Hyperframes composition. Each scene = timed `class="clip"` elements
(`data-start` / `data-duration` / `data-track-index`); GSAP drives entrances. Captions and the
voiceover live inside the composition, so the render is one self-contained file — no post step.

- **Cards** (scenes 1, 2, 8, 9) — full HTML on `card-bg`.
- **Screen-rec scenes** (3–7) — your recording as a `<video>` background + Arabic callout on top.
- **Captions** — RTL Arabic clip divs (track 3), timed to each scene.
- **Voiceover** — `<audio id="vo">` → `audio/vo-ar.m4a`.
- **Font** — Cairo, captured locally in `assets/fonts/` (offline-safe; no Google Fonts request).

## Files

| Path | What |
|------|------|
| `index.html` | The composition. **Edit `:root` BRAND colors + scene text here.** |
| `script-ar.md` | Egyptian-Arabic VO script + storyboard. Record from this. |
| `recordings/` | **You drop** `scene3.mp4 … scene7.mp4` (9:16). |
| `audio/vo-ar.m4a` | **You drop** the recorded/TTS voiceover. |
| `assets/fonts/` | Local Cairo woff2 + `cairo.css`. |
| `make-placeholders.sh` | Generates colored stand-in clips + silent VO so render works before assets exist. |
| `meta.json` | Project id/name. |
| `out/` | Render output. |

## Quick start

```bash
cd marketing/video/roashetta-demo
npm install                 # already done
npm run placeholders        # stand-in clips + silent VO  (skip once real assets are in)
npm run check               # lint (must be 0 errors)
npm run render:draft        # fast preview → out/draft.mp4
```

A draft render is already in `out/draft.mp4` (placeholder visuals, silent).

## Produce the real cut

1. **Record app flows** (run repo root `npm run dev`, port 8080; screen-record, crop to 9:16):
   - `recordings/scene3.mp4` — Patients → New Patient → open visit
   - `recordings/scene4.mp4` — prescription drawing canvas (pen strokes)
   - `recordings/scene5.mp4` — Queue drag-drop, status change
   - `recordings/scene6.mp4` — Analytics charts
   - `recordings/scene7.mp4` — toggle EN → AR (RTL flip)
   - Match each clip's length to its `data-duration` in `index.html` (6, 7, 5, 5, 4s).
2. **Record the VO** from `script-ar.md` → `audio/vo-ar.m4a` (one file, scene order). Or ElevenLabs (Arabic voice).
3. **Final render:**
   ```bash
   npm run render               # → out/roashetta-demo-ar.mp4  (high quality, png frame extraction)
   ```

## Live editing

```bash
npm run dev    # Hyperframes preview studio at http://localhost:3002 — run in background
```

## Tuning

- **Brand colors**: `:root` vars at the top of `index.html`. Pull the real `--primary` from the app's `src/index.css`.
- **Timing**: change a scene's `data-start`/`data-duration` (and the matching caption + `STARTS[]` array in the script block). Keep total at `data-duration="43"` on `#root` or bump it.
- **English version**: duplicate `index.html`, set `dir="ltr"` on `<html>`, swap caption text + VO.

## Notes

- ffmpeg in this environment has **no `drawtext`** (no freetype) — placeholder clips are solid colors, not labeled. Real recordings replace them anyway.
- Docker not installed → renders use local mode (fine). `--docker` gives deterministic fonts for production if you install it.
- AI models can't render readable Arabic reliably — all text here is programmatic HTML/CSS (per the video skill's guidance).
