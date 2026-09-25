# Assets, sources and licences

## Visuals

All illustrations are drawn procedurally in code (Canvas 2D, seeded RNG): paper textures, torn edges, tape, stamps, cardboard, the paper-doll character, crowd figures, icons, charts and confetti. No image files, no stock art, no AI image generation. There is no Metriq Body branding, logo or content; the reference video was used only to analyse the format (see `docs/style_analysis.md`).

## Fonts (all SIL Open Font License 1.1)

Embedded locally as woff2 (latin subset, which covers ä ö ü Ä Ö Ü ß „ “ – …). The licence texts are in `project/assets/fonts/LICENSE-*.txt`.

| Font | Use | Source |
|---|---|---|
| Playfair Display 700 / 900 / 900 italic | headlines | npm `@fontsource/playfair-display` (upstream: github.com/clauseggers/Playfair) |
| Anton 400 | big numbers, shouty labels | npm `@fontsource/anton` (upstream: github.com/googlefonts/AntonFont) |
| Inter 500 / 700 / 800 | captions, small text | npm `@fontsource/inter` (upstream: github.com/rsms/inter) |
| Caveat 700 | handwriting | npm `@fontsource/caveat` (upstream: github.com/googlefonts/caveat) |
| Courier Prime 700 | typed notes | npm `@fontsource/courier-prime` (upstream: quoteunquoteapps.com/courierprime) |

## Music and sound effects

**Original, synthesised in code**: `tools/audio/synth.py` (numpy/scipy). No samples and no third-party recordings.

- Music: 120 BPM, C major. Karplus-Strong ukulele strums, marimba melody, plucked bass, soft kick, claps, shaker, glockenspiel, and a riser into the "good news" section. Structure: intro/hook, groove, thoughtful B-section (barriers), stop-time twist, build, bright final section, final chord.
- SFX: light soft thumps for landing text, gentle air swishes (slides, flips, captions), page-turn tear / sheet slide / whoosh, stamp, pen tick and scribble, pops, count ticks, bar "rise", confetti. All are procedural, timed from `project/assets/audio/cues.json`, which is generated from the same timeline as the visuals.
- Licence: made for this project; no third-party rights involved.

## Tools

- Playwright-core (Apache-2.0) drives headless Chromium for frame export.
- FFmpeg (LGPL/GPL build from Ubuntu) handles H.264 (libx264) and AAC encoding.
- Python: numpy, scipy, soundfile, pyloudnorm (all open source).

## Source material

- Bertelsmann Stiftung (2026): *Gründungsaufbruch der jungen Generation*, DOI 10.11586/2026127. The PDF was **not reachable** from the build environment (network policy); see `docs/facts.md` for how the figures were verified.
- Global Entrepreneurship Monitor (GEM) Deutschland 2025/26, via RKW Kompetenzzentrum / presseportal.de.
- Young Founders Network: youngfounders.network (content verified via search-index excerpts; the site itself was not reachable).
