# gen now version: „Gründen? Ich doch nicht …"

The same 54-second vertical explainer as the original (1080×1920, 30 fps, German, no narration), restyled in the **gen now** brand from https://gennow.de/ (the Bertelsmann Stiftung's youth project). The story, figures, timings and music are unchanged. The colours, fonts, logo and last slide are gen now's.

The original version is untouched at the repository root (`/project`, `/export`, `/docs`, `/tools`).

## Downloads (`export/`)

| File | What |
|---|---|
| `export/video.mp4` | final video, H.264/AAC, −14 LUFS, 36.8 MB |
| `export/player.html` | self-contained player (fonts, logos, audio and code inlined), works offline |
| `export/project.zip` | this version's complete editable project (without the MP4) |

## What changed compared with the original

- **Colours:** each scene is a gen now section colour (beige, sky, yellow, pink, green, lilac, blue), and the strips, charts, crowd and confetti use the same palette.
- **Fonts:** Bricolage Grotesque for headlines and numbers, Lato for text (both used on gennow.de, both OFL).
- **Logo:** the video opens on a blue sheet with the gen now logo, and a small gen now logo sits top-left until the last slide.
- **Last slide:** it still points to the Young Founders Network. The Bertelsmann line became a logo card: "unterstützt von gen now · Ein Projekt der Bertelsmann Stiftung".
- **Character:** yellow hoodie and blue trousers, echoing the site's hero collage.

Details and sources: `docs/brand.md`.

## Docs (`docs/`)

- `prompt.md`: the request for this version, the questions asked, and the answers
- `brand.md`: what was taken from gennow.de and where it went
- `copy.md`: on-screen copy, German + English
- `facts.md`: fact sheet (copied from the original, plus Y5 for the gen now line)
- `assets_licenses.md`: fonts, logos, audio
- `qa_report.md`, `qa_pacing.md`, `loudness_final.txt`, `qa/`: QA results and contact sheets
- For editing, re-rendering and remixing, the original `docs/README.md` (at the repository root) applies unchanged. Run the same commands from this folder.

## Rebuild this version

```bash
cd versions/gennow
cd tools && npm install && cd ..       # once (or reuse the root tools/node_modules)
pip install numpy scipy soundfile pyloudnorm   # once; ffmpeg must be on PATH

node tools/serve.js 8080               # preview at http://localhost:8080/
node tools/qa.js                       # reading time + safe zones (0 issues expected)
node tools/check_numbers.js            # every on-screen number vs docs/facts.md
node tools/cues.js                     # SFX cues from the timeline
python3 tools/audio/synth.py           # music + SFX + master (-14 LUFS)
node tools/export.js                   # → export/video.mp4 (about 2.5 min)
node tools/build_single.js             # → export/player.html
node tools/test_player.js              # optional: controls + sync test
```

The tools in `versions/gennow/tools/` are a copy of the root tools. They work on `versions/gennow/project/` and write to `versions/gennow/export/` and `versions/gennow/docs/`, so running them here never touches the original.

## Where things are

- Brand colours and fonts: `project/src/engine/paper.js` (`E.FONTS`, `E.COLORS`, `E.BG`)
- Logos, opening sheet, corner logo, logo card: `project/src/engine/brand.js` + `brand_assets.js`
- Text, timings, scene colours, corner-logo position: `project/src/data/timeline.js`
