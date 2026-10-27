#!/usr/bin/env bash
# Convert selected vertical D-Team clips into web-ready showreel assets.
#
# Inputs:  public/videos/IMG_52xx.MOV  (HEVC, portrait)
# Outputs: public/videos/reel-N.mp4     (H.264/AAC, 720x1280, faststart)
#          public/videos/reel-N.webm    (VP9/Opus, 720x1280)
#          public/videos/reel-N-poster.jpg (brightest sampled frame, 720 wide)
# Masters are never modified. Re-run safely: outputs are overwritten.
#
# Usage: bash scripts/generate-reel-videos.sh

set -euo pipefail
cd "$(dirname "$0")/.."

# IMG_5268 was rejected: recorded sideways with no rotation metadata.
clips=("IMG_5250" "IMG_5251" "IMG_5266")
n=0

for clip in "${clips[@]}"; do
  n=$((n + 1))
  src="public/videos/${clip}.MOV"
  mp4="public/videos/reel-${n}.mp4"
  webm="public/videos/reel-${n}.webm"
  poster="public/videos/reel-${n}-poster.jpg"
  echo "== ${clip} -> reel-${n} =="

  if [[ ! -f "$src" ]]; then
    echo "missing: $src" >&2
    exit 1
  fi

  duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  echo "duration: ${duration}s"

  # MP4 (primary): H.264 High / AAC, faststart for web streaming.
  ffmpeg -hide_banner -loglevel error -y -i "$src" \
    -vf "scale=720:-2,format=yuv420p" \
    -c:v libx264 -profile:v high -preset medium -crf 24 \
    -c:a aac -b:a 96k -movflags +faststart "$mp4"

  # WebM (fallback): VP9 / Opus.
  ffmpeg -hide_banner -loglevel error -y -i "$src" \
    -vf "scale=720:-2,format=yuv420p" \
    -c:v libvpx-vp9 -crf 34 -b:v 0 -deadline good -cpu-used 4 -row-mt 1 \
    -c:a libopus -b:a 96k "$webm"

  # Poster: sample four frames across the clip, keep the brightest one.
  candidates=()
  for fraction in 0.15 0.30 0.55 0.80; do
    at=$(awk -v d="$duration" -v f="$fraction" 'BEGIN { printf "%.2f", d * f }')
    c="/tmp/opencode/reel-${n}-${fraction}.png"
    ffmpeg -hide_banner -loglevel error -y -ss "$at" -i "$mp4" -frames:v 1 "$c"
    candidates+=("$c")
  done
  best=$(python3 - "${candidates[@]}" <<'PY'
import struct, sys, zlib
from pathlib import Path
from PIL import Image

scores = []
for name in sys.argv[1:]:
    with Image.open(name) as im:
        small = im.convert("L").resize((48, 48))
    px = list(small.getdata())
    scores.append((sum(px) / len(px), name))
best = max(scores, key=lambda item: item[0])
print(best[1])
PY
)
  ffmpeg -hide_banner -loglevel error -y -i "$best" -q:v 4 "$poster"
  rm -f "${candidates[@]}"

  for out in "$mp4" "$webm" "$poster"; do
    size_mb=$(du -m "$out" | cut -f1)
    dims=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$out")
    echo "$out: ${dims} ${size_mb}MB"
  done
done
