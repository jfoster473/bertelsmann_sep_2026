# „Gründen? Ich doch nicht …": Instagram explainer (paper-collage style)

A 54-second vertical explainer (1080×1920, 30 fps, German, no narration) about the Bertelsmann Stiftung study *Gründungsaufbruch der jungen Generation* (2026). It ends on the Young Founders Network as a concrete next step.

## Downloads (`export/`)

| File | What |
|---|---|
| `export/video.mp4` | final video, H.264/AAC, −14 LUFS, 42.6 MB |
| `export/player.html` | self-contained player (fonts, audio and code inlined), opens offline on any device |
| `export/project.zip` | complete editable project (without the MP4 and the reference video) |

## Docs (`docs/`)

- `copy.md`: on-screen copy, German + English
- `facts.md`: every figure with wording, base group, source and **verification status** (read the note at the top)
- `style_analysis.md`: analysis of the reference video's format
- `assets_licenses.md`: fonts (OFL), original synthesised music/SFX, tools
- `README.md`: how to edit text and timing, re-render and remix audio (plus how to add narration later)
- `qa_report.md` + `qa_pacing.md` + `qa/`: QA results and contact sheets

## Quick start

```bash
cd tools && npm install && cd ..
node tools/serve.js 8080        # open http://localhost:8080/
node tools/export.js            # re-render export/video.mp4
```

The project code is in `project/` (vanilla JS, Canvas 2D). All text and timings are in `project/src/data/timeline.js`. `reference/style_reference.mp4` is the style reference, used for analysis only.
