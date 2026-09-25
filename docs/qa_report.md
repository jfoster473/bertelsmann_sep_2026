# QA report (final export)

File: `export/video.mp4`

## Technical

| Check | Result |
|---|---|
| Resolution / frame rate | 1080×1920, 30 fps, 1620 frames ✅ |
| Duration | 54.0 s (brief: 40–55 s) ✅ |
| Video | H.264 High, yuv420p, CRF 18, about 6 Mbit/s ✅ |
| Audio | AAC-LC 256 kbit/s, 48 kHz stereo ✅ |
| Faststart | `moov` atom before `mdat` ✅ |
| File size | 42.6 MB (< 100 MB) ✅ |
| **Integrated loudness** (ffmpeg ebur128, on the MP4) | **−14.0 LUFS** ✅ |
| **True peak** (ffmpeg ebur128 peak=true, on the MP4) | **−2.4 dBTP** (≤ −1 dBTP) ✅ |
| Loudness range | 4.0 LU |
| Master WAV | −14.0 LUFS, −3.0 dBTP (headroom for the AAC/MP3 encoders; at 192 kbit/s AAC the peak reached −1.1 dBTP, which is why 256 kbit/s is used) |
| Limiter | max. 2.8 dB gain reduction, never more than 3 dB (bus limiters on the stems take the transients) |

The full ebur128 summary is in `docs/loudness_final.txt`.

## Visual

| Check | Method | Result |
|---|---|---|
| Legibility on a phone | stills downscaled to 390 px wide (`docs/qa/phone_size_preview.jpg`) | all text readable. The smallest texts (crowd row labels 28 px, GEM source 28 px, handwriting 46 px) are small but legible ✅ |
| Safe zones (top 250 px, bottom 380 px, right-edge Reels UI) | `tools/qa.js` computes each rotated text box at rest | 0 violations; all key text inside x 50–940, y 250–1540 ✅ |
| Overlaps | contact sheets (`docs/qa/contact_sheet_1–4.jpg`, 2 fps) | fixed during QA: stamps hiding text, the character over labels, the caption over a stamp, tape over letters ✅ |
| Flicker | frame-to-frame luminance difference across all 1620 frames | 0 isolated flash frames, 0 A-B-A flicker ✅ |
| No static moments | same analysis | only 4 frames at the very start (dark opening sheet) had < 0.05 mean change; fixed so the tear starts moving at once. Elsewhere, idle wobble, breathing, blinking and camera drift keep every frame moving ✅ |
| Transitions | contact sheets | torn-paper sheet wipes (right/top/left/right/bottom/top), tear-open intro, carry-over elements (money note hook → barriers, survey card → crowd, barrier labels → good-news strips, character throughout) ✅ |

## Reading time (words ÷ 3 + 0.5 s)

`tools/qa.js`, full table in `docs/qa_pacing.md`: **0 issues**. It counts every text beat, including counters and chart labels. The readable window starts once the entrance animation has settled and ends when the item exits or is covered. The final URL stays on screen for 4.9 s (≥ 3 s required).

## SFX timing

- Cues come from the same `timeline.js` that drives the visuals (`tools/cues.js` → `cues.json`) and are placed sample-accurately. Drop-in slaps are timed to the spring's landing frame (`E.dropLand`).
- Cross-check against the export (`docs/qa/sfx_visual_sync.txt`): 51 of 53 transient cues coincide with visible motion within ±2 frames. The two exceptions are tiny pen ticks on the survey card, which are visible but below the frame-difference threshold at the downscaled resolution.

## Figures

`tools/check_numbers.js` (`docs/qa/numbers_check.md`): every number on screen maps to a row in `docs/facts.md`; 0 unapproved numbers. The crowd adds up to 100 figures (9 + 28 + 31 + 29 + 3), and bar lengths equal the printed values. ⚠️ The PDF itself could not be accessed, so page numbers are still missing (see `docs/facts.md`).

## Player

`tools/test_player.js`, run against both `project/index.html` (served) and `export/player.html` (opened as file://):

| Test | Result |
|---|---|
| play → audio runs, picture follows | PASS |
| max. audio-picture offset over 3 s of playback | 0.036–0.047 s (about 1 frame) PASS |
| mute / unmute | PASS |
| pause | PASS |
| scrub to 30 s (audio seeks along) | PASS |
| resume from 30 s | PASS |
| restart | PASS |
| keyboard (space) | PASS |
| embedded fonts load in the single-file player | PASS (all 6 families) |
| page errors | none |
