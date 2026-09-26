# QA report (gen now version, final export)

File: `export/video.mp4`

## Technical

| Check | Result |
|---|---|
| Resolution / frame rate | 1080×1920, 30 fps, 1620 frames ✅ |
| Duration | 54.0 s ✅ |
| Video / audio | H.264 High, yuv420p, CRF 18 / AAC-LC 256 kbit/s, 48 kHz ✅ |
| Faststart | `moov` before `mdat` ✅ |
| File size | 36.8 MB (< 100 MB) ✅ |
| **Integrated loudness** (ffmpeg ebur128, on the MP4) | **−14.0 LUFS** ✅ |
| **True peak** (on the MP4) | **−2.7 dBTP** (≤ −1 dBTP) ✅ |
| Loudness range | 3.6 LU |
| Master WAV | −14.0 LUFS, −3.0 dBTP (`project/assets/audio/master_report.json`) |

Full ebur128 summary: `docs/loudness_final.txt`.

## Visual

| Check | Method | Result |
|---|---|---|
| Brand colours | background averages measured in the browser | each sheet averages to its exact brand colour (see `docs/brand.md`) ✅ |
| Safe zones and reading time | `node tools/qa.js` → `docs/qa_pacing.md` | 0 issues. The wider Bricolage font first pushed 7 labels and stamps past the edges; they were resized or moved ✅ |
| Legibility on a phone | stills at 390 px wide (`docs/qa/phone_size_preview.jpg`) | all text readable ✅ |
| Overlaps | contact sheets from the MP4, 1 frame per second (`docs/qa/contact_sheet_1–2.jpg`) | no text covered; the logo card sits clear of the source line ✅ |
| Flicker | frame-to-frame luminance over all 1620 frames | 0 A-B-A flicker frames. The largest jump is frame 15, where the blue opening sheet tears away (intended) ✅ |
| Numbers | `node tools/check_numbers.js` | 0 unapproved numbers ✅ |

The corner logo (y 169–231) sits inside the top 250 px band on purpose: that band is kept free of *key text*, and a small brand mark is the usual thing to put there. On some phones the Instagram "Reels" header may partly overlap it.

## Player

`node tools/test_player.js` passed on both `project/index.html` and the single-file `export/player.html`: play, pause, mute/unmute, scrub, resume, restart, space bar, audio duration 54 s, audio–picture offset ≤ 0.033 s, no page errors ✅
