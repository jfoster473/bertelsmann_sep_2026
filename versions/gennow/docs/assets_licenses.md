# Assets, sources and licences (gen now version)

## Visuals

As in the original, all illustrations are drawn procedurally in code (Canvas 2D, seeded RNG): paper textures, torn edges, tape, stamps, cardboard, the paper-doll character, crowd figures, icons, charts and confetti. There is no stock art and no AI image generation.

**Brand assets (new in this version)**, taken from gennow.de on 26.09.2026 (copies in `docs/brand/`):

| Asset | Source file on gennow.de | Used as |
|---|---|---|
| gen now logo | `/wp-content/uploads/sites/28/2024/04/logo-gen-now.svg` | vector paths in `project/src/engine/brand_assets.js`, drawn with Canvas `Path2D` |
| Bertelsmann Stiftung wordmark | `/wp-content/uploads/sites/28/2024/04/logo-bst.png` (709 × 88) | base64 PNG in `brand_assets.js` |

Both logos are trademarks of the Bertelsmann Stiftung and are used only for this gen now-branded version. Colour values were read from the site's stylesheet, inline styles and images (see `docs/brand.md`).

## Fonts (all SIL Open Font License 1.1)

Embedded locally as woff2 (latin subset: ä ö ü Ä Ö Ü ß „ “ – …). The licence texts are in `project/assets/fonts/LICENSE-*.txt`.

| Font | Use | Source |
|---|---|---|
| Bricolage Grotesque 400 / 500 / 700 / 800 | headlines, numbers, stamps (gen now's display font) | npm `@fontsource/bricolage-grotesque` 5.3.0 (upstream: github.com/ateliertriay/bricolage) |
| Lato 400 / 700 / 900 / 900 italic | small text, captions, notes (gen now's text font) | npm `@fontsource/lato` 5.3.0 (upstream: latofonts.com) |
| Caveat 700 | handwriting | npm `@fontsource/caveat` (kept from the original) |

## Music and sound effects

The same original synthesised music and SFX as the original version (`tools/audio/synth.py`, no samples, no third-party recordings). The cue list was regenerated from this version's timeline. It differs only in small pan changes and in the logo card's drop sound, which replaces the old slide sound; the mix was then re-rendered.

## Tools

Playwright-core (Apache-2.0) with headless Chromium, FFmpeg (libx264, AAC), and Python (numpy, scipy, soundfile, pyloudnorm).

## Source material

Unchanged from the original; see `docs/facts.md`. In addition, `gennow.de/wirtschaft/young-founders-network/` was read for the last-slide wording (fact Y5).
