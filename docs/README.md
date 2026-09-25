# How to edit, re-render and remix

Everything is plain vanilla JavaScript (Canvas 2D) plus a Python audio script. There is no build step for the player.

```
project/
  index.html              browser player (play/pause, scrubber, restart, mute)
  src/data/timeline.js    ← ALL scene timings, on-screen text, positions, character moves
  src/engine/core.js      seeded RNG, noise, easing, springs
  src/engine/paper.js     paper grain, torn strips, tape, stamps, cardboard, backgrounds, sheet wipes
  src/engine/character.js paper-doll character (brass split-pin joints, poses) + crowd figures
  src/engine/items.js     generic animated items (strips, captions, stamps, handwriting)
  src/scenes.js           scene-specific animation (survey card, crowd, bar chart, GEM chart, confetti)
  src/render.js           render(ctx, t) – the single pure render function – and SFX cue list
  src/player.js           player UI + audio sync
  assets/fonts/           OFL fonts (woff2) + licences
  assets/audio/           music.wav, sfx.wav (stems), mix.wav (master), mix.mp3 (player), cues.json
tools/
  serve.js                local web server (fonts need http://)
  export.js               frame-accurate MP4 export (headless Chromium → ffmpeg)
  build_single.js         builds export/player.html (everything inlined)
  cues.js                 writes the SFX cue list from the timeline
  audio/synth.py          synthesises music + SFX, mixes and masters
  pace.js                 spoken-rhythm timing of each slide's lines (--write updates timeline.js)
  copy_doc.js             regenerates docs/copy.md (DE + EN with timings)
  qa.js                   reading-time + safe-zone check → docs/qa_pacing.md
  check_numbers.js        every on-screen number vs. docs/facts.md
  test_player.js          automated test of player controls + audio sync
  snap.js                 render stills at given times
```

## Setup (once)

```bash
cd tools && npm install          # playwright-core (+ @fontsource packages, which only supplied the fonts)
pip install numpy scipy soundfile pyloudnorm
# ffmpeg must be on PATH. Chromium: set CHROMIUM_PATH if it isn't at /opt/pw-browsers/chromium
```

## Watch it

```bash
node tools/serve.js 8080     # then open http://localhost:8080/
```

Or open `export/player.html` directly: it's a single self-contained file that also works offline. Keys: Space = play/pause, M = mute, R = restart, ←/→ = ±1 s.

## Edit text and timing

Open `project/src/data/timeline.js`:

- **Text**: change `text:` of any item. `\n` is a line break. Strips shrink their font automatically to stay inside the safe area.
- **Timing**: `in` / `out` per item (seconds); `scenes[].start/end` per scene. Scene-specific timings (crowd sorting, chart bars, carry-overs) are in the `study`, `crowd`, `barriers`, `gem` and `end` blocks.
- **Figures**: crowd groups (`crowd.groups`), barrier bars (`barriers.rows`: `value` = bar length, `text` = printed label) and GEM bars (`gem.bars`).
- **Character**: the `character` keyframes (position, scale, pose, mouth, brows, flip).
- **Length**: `duration` (the brief allows 40–55 s).

Re-flow the timings so the lines arrive at a spoken rhythm (optional, but recommended after text changes):

```bash
node tools/pace.js            # shows the proposed schedule per slide
node tools/pace.js --write    # writes the in/out times (and dependent events) into timeline.js
node tools/copy_doc.js        # refreshes docs/copy.md
```

The reading order per slide is in `ORDER` at the top of `tools/pace.js`.

Then run the checks:

```bash
node tools/qa.js              # reading time (words ÷ 3 + 0.5 s) and safe zones, 0 issues expected
node tools/check_numbers.js   # every on-screen number must be listed in docs/facts.md
```

## Re-render

```bash
node tools/cues.js                 # SFX cues follow the new timings
python3 tools/audio/synth.py       # music + SFX + master (-14 LUFS)
node tools/export.js               # → export/video.mp4 (about 3 min; --workers 3 by default)
node tools/build_single.js         # → export/player.html
node tools/test_player.js          # optional: controls + sync test
```

`render(ctx, t)` is a pure function of time: all textures come from a seeded RNG and are cached. The exporter steps `t = frame / 30` and doesn't record in real time, so the player and the MP4 are identical.

## Remix audio

`tools/audio/synth.py` is the whole audio pipeline:

- **Music balance**: in `main()`, `music *= db(-20 - lm)` sets the music bed and `sfx *= db(-21.5 - ls)` the SFX (before the master gain).
- **Arrangement**: `arrangement()` lists, bar by bar (2 s per bar at 120 BPM), the chord and which parts play. Sections follow the slide markers in `cues.json` (barriers, money twist, good news, last slide). The last slide plays the finale (`FINALE_MEL`, F → G → final C). Chord voicings are in `CH` and melodies in `MEL`.
- **SFX**: each cue type maps to a generator in the `SFX` table (`s_thump` for landing text, `s_softswish`, `s_tear` for page turns, …) and a level in `SFX_LEVEL`.
- **Master**: the target is -14 LUFS integrated, and `CEILING_DBTP = -3.0` gives the lossy encoders headroom. The final MP4 measures -2.6 dBTP.

## Add narration later

1. Put voice files in `project/assets/audio/vo/`.
2. List them in `timeline.js` → `audio.narration`, e.g. `{ file: 'assets/audio/vo/01.wav', at: 0.4, gainDb: 0 }`.
3. Stretch the `in`/`out` times of the matching text beats if needed; `node tools/qa.js` still checks the reading times.
4. Run `node tools/cues.js && python3 tools/audio/synth.py`. The music is ducked automatically under the narration, and the scenes don't need to be rebuilt.
