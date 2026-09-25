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
| File size | 41.2 MB (< 100 MB) ✅ |
| **Integrated loudness** (ffmpeg ebur128, on the MP4) | **−14.0 LUFS** ✅ |
| **True peak** (ffmpeg ebur128 peak=true, on the MP4) | **−2.6 dBTP** (≤ −1 dBTP) ✅ |
| Loudness range | 3.5 LU |
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
| No static moments | same analysis (final export) | no pauses: at most isolated single frames with very subtle change (idle wobble, breathing, blinking and camera drift always run). The longest stretch of low motion is about 2 s, during the GEM slide's closing hold, where the idle motion continues. The opening dark sheet starts tearing on frame 1 ✅ |
| Transitions | contact sheets | torn-paper sheet wipes (right/top/left/right/bottom/top), tear-open intro, carry-over elements (money note hook → barriers, survey card → crowd, barrier labels → good-news strips, character throughout) ✅ |

## Reading time (words ÷ 3 + 0.5 s)

`tools/qa.js`, full table in `docs/qa_pacing.md`: **0 issues**. It counts every text beat, including counters and chart labels. The readable window starts once the entrance animation has settled and ends when the item exits or is covered. The final URL stays on screen for about 3.6 s (≥ 3 s required; `tools/pace.js` enforces at least 3.2 s).

## Pacing (revision 3)

Feedback: lines popped in quickly and then sat on screen. `tools/pace.js` now places each slide's lines one after another at a spoken rhythm (words ÷ 2.6 words/s + 0.35 s pause). The rhythm is scaled so the lines spread across the whole slide and only the last line's reading time is left as a hold at the end. Dependent events move with the lines: character poses, stamps, card ticks, crowd sorting, the money note's return, the chart arrow and the confetti.

- Slide lengths: 7 / 6 / 10.5 / 10.5 / 8 / 6 / 6 s. The last slide went from 7.5 s to 6 s, and that time went to the crowd, good-news and GEM slides. The total is still 54 s.
- Each slide's closing caption stays on top while the next sheet slides in (as in the reference video), then fades.
- The study note was split into two short strips, so the slide can end on the one-word stamp instead of a 9-word line.
- The source credit on the last slide is fine print, visible for the whole slide.

## Music (revision 3)

Music sections now follow the slides via markers in `cues.json`: the stop-time bar falls on the money twist, the riser leads into the good news, and the good-news section starts on the home chord. The last slide gets its own **finale**: a vi–IV–V–I run (Am → F → G → C), four-on-the-floor soft kick, 16th-note shaker, bouncing octave bass, and a marimba melody doubled by glockenspiel that climbs up into the final chord. A marimba pickup leads into it. The level lift is small (about +0.2 LU, then +1.6 LU on the bar before the end), so it isn't a crescendo. The final chord and glockenspiel ding are unchanged.

## SFX timing

- Cues come from the same `timeline.js` that drives the visuals (`tools/cues.js` → `cues.json`) and are placed sample-accurately. Drop-in thumps are timed to the spring's landing frame (`E.dropLand`), and slide-in thumps to the frame where the slide settles (`E.slideLand`).
- Cross-check against the export (`docs/qa/sfx_visual_sync.txt`): see that file for the count of transient cues that coincide with visible motion within ±2 frames. The only exceptions are tiny pen ticks on the survey card, which are visible but below the frame-difference threshold at the downscaled resolution.
- Revision 2 (feedback): text landings now use a **light, soft thump** (low body plus a muffled tap, 0 % of its energy above 2 kHz) instead of the ripping paper slap. Slide-ins also get a thump at the frame where they settle. Tape, card flip, caption and small swishes are now smooth air swishes with no paper crackle. The paper-tear/rustle texture is kept only for the page turns (opening tear, sheet wipes). The SFX bus sits 1.5 LU under the music.

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
