#!/usr/bin/env python3
"""Generate optimized WebP derivatives for the D-Team public site.

Reads supplied JPG/JPEG masters from public/ and writes responsive derivatives
into public/media/on-set/ (photo story) and public/media/site/ (hero + section
imagery). Re-run safely: outputs are overwritten, masters are never modified.

Usage: python3 scripts/generate-site-media.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
ON_SET_DIR = PUBLIC / "media" / "on-set"
SITE_DIR = PUBLIC / "media" / "site"

DERIVATIVE_WIDTHS = (480, 960, 1600)
QUALITY = {480: 72, 960: 78, 1600: 80}


def load_master(stem: str):
    for suffix in (".jpg", ".jpeg", ".JPG", ".JPEG"):
        path = PUBLIC / (stem + suffix)
        if path.is_file():
            return path
    raise FileNotFoundError(f"No master image for {stem!r}")


def convert(rgb, width: int):
    ratio = width / rgb.width
    height = max(1, round(rgb.height * ratio))
    resized = rgb.resize((min(width, rgb.width), min(height, rgb.height)), Image.LANCZOS)
    return resized, width, resized.height


def write_derivatives(stem: str, out_dir: Path, widths):
    master = load_master(stem)
    with Image.open(master) as im:
        rgb = im.convert("RGB")
    results = []
    for width in widths:
        resized, out_width, out_height = convert(rgb, width)
        target = out_dir / f"{stem}-{out_width}.webp"
        resized.save(target, "WEBP", quality=QUALITY.get(width, 76), method=6)
        results.append((target.name, out_width, out_height, target.stat().st_size))
    widest = max(results, key=lambda item: item[1])
    widest_width, widest_height = widest[1], widest[2]
    print(f"{stem}: master={master.name} -> " + ", ".join(
        f"{name} {w}x{h} ({size / 1024:.0f} KB)" for name, w, h, size in results
    ))
    return widest_width, widest_height


# Photo story: one entry per image, order matters (drives the slideshow).
ON_SET = [
    "cam",           # camera operator on the set
    "cam1",          # camera operator framing a shot outdoors
    "cam2",          # broadcast camera in use
    "maincameras",   # main camera bank on a live event
    "light1",        # lighting rig being adjusted
    "setup2",        # production setup wide
    "sound",         # sound setup on set
    "soundengineer", # sound engineer at the mixer
    "edit3",         # editor working at the machine
    "livestream1",   # live stream control desk
    "checkup",       # crew checking gear between takes
    "inhouse1",      # the in-house crew at work
]

# Site imagery: stem -> derivative widths (capped automatically at master size).
SITE = {
    "hero": [480, 960, 1600],          # hero.jpg is only 1002px wide; capped
    # intro mosaic
    "workdesk": [480, 960],
    "drone": [480, 960],
    "graphics": [480, 960],
    "cinematic": [480, 960],
    "pilot": [480, 960],
    "photoedit": [480, 960],
    "stream1": [480, 960],
    "editor": [480, 960],
    # event coverage/selected-work mosaic
    "work7": [480, 960],
    "work10": [480, 960],
    "work6": [480, 960],
    "work4": [480, 960],
    "church": [480, 960],
    "school": [480, 960],
    "outdoor2": [480, 960],
    # team/crew strip
    "team2": [480, 960],
    "editors": [480, 960],
    "teamdancing": [480, 960],
    # live production banners
    "livestream": [480, 960],
    "stream": [480, 960],
}


def main():
    ON_SET_DIR.mkdir(parents=True, exist_ok=True)
    SITE_DIR.mkdir(parents=True, exist_ok=True)

    print("== photo story (public/media/on-set) ==")
    manifest = []
    for stem in ON_SET:
        width, height = write_derivatives(stem, ON_SET_DIR, DERIVATIVE_WIDTHS)
        manifest.append((stem, width, height))

    print("== site imagery (public/media/site) ==")
    for stem, widths in SITE.items():
        write_derivatives(stem, SITE_DIR, widths)

    print("== on-set manifest (widest derivative sizes) ==")
    for stem, width, height in manifest:
        print(f"{stem} {width} {height}")


if __name__ == "__main__":
    main()
