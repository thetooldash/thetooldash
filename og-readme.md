# OG Image Spec — /og.png

**Required output:** `og.png` at repo root, 1200 × 630 px.

## Visual spec

| Layer | Value |
|---|---|
| Background | `#060608` solid fill |
| Blob top-left | `radial-gradient(ellipse, rgba(0,229,160,0.18) 0%, transparent 55%)` — 60 % width, offset top-left |
| Blob bottom-right | `radial-gradient(ellipse, rgba(77,158,255,0.14) 0%, transparent 55%)` — 55 % width, offset bottom-right |
| Badge | Pill shape, `background: rgba(0,229,160,0.12)`, `border: 1px solid rgba(0,229,160,0.28)`, text `PROTOCOL STACK v2.0` in DM Mono 500, 13 px, `#00e5a0`, with a 6 × 6 px green dot on the left |
| H1 line 1 | `"Los suplementos"` — Syne 800, ~72 px, `color: #ffffff` |
| H1 line 2 | `"Definitivos."` — Syne 800, ~72 px, gradient `linear-gradient(90deg, #00e5a0, #00c9ff)` via background-clip |
| Subtitle | `"// Stack de suplementación · HSN Raw & Sport Series"` — DM Mono 400, 16 px, `rgba(240,240,240,0.45)` |
| Bottom-right | Small DM Mono text `"thetooldash.com"`, 13 px, `rgba(240,240,240,0.22)` |

## Generation options

### Option A — satori (Node ≥ 18)
```bash
npm install satori @resvg/resvg-js
node generate-og.js
```
Use the satori JSX API with the spec above. Output via `resvg-js` to PNG.

### Option B — Figma / Sketch
Import fonts from Google Fonts (Syne 800, DM Mono 400/500) and recreate layers per spec. Export as PNG 1200 × 630.

### Option C — html2canvas local preview
Open a local HTML page matching the spec, screenshot at 2× and crop to 1200 × 630.

## Acceptance criteria
- Exactly 1200 × 630 px
- File size < 200 KB (compress with `pngquant --quality=65-80 og.png`)
- No EXIF / metadata strip: `exiftool -all= og.png`
- Validate with: https://opengraph.xyz/?url=https://thetooldash.com/
