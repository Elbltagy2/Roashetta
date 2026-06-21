#!/usr/bin/env bash
# Generate placeholder assets so `npm run render` works BEFORE you have real
# screen recordings / voiceover. Replace these with the real files later.
#   recordings/scene3..7.mp4  — colored 1080x1920 clips with a label
#   audio/vo-ar.m4a           — 43s of silence (so the <audio> element resolves)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p recordings audio

gen() { # gen <n> <seconds> <hexcolor>
  local n="$1" dur="$2" col="$3"
  echo "→ recordings/scene${n}.mp4 (${dur}s, solid ${col})"
  # Solid-color stand-in (this ffmpeg build has no drawtext/freetype).
  ffmpeg -y -f lavfi -i "color=c=${col}:s=1080x1920:d=${dur}:r=30" \
    -c:v libx264 -pix_fmt yuv420p -an "recordings/scene${n}.mp4" -loglevel error
}

gen 3 6 "0x1e293b"
gen 4 7 "0x3b2f0b"
gen 5 5 "0x0b2f2e"
gen 6 5 "0x1b2a4a"
gen 7 4 "0x2a1b3a"

echo "→ audio/vo-ar.m4a (43s silent stand-in)"
ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -t 43 -c:a aac -b:a 128k audio/vo-ar.m4a -loglevel error

echo "Done. Now: npm run render"
