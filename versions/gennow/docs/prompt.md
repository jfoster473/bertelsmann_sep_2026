# Prompt for this version (verbatim)

The original brief and its three feedback rounds are in `../../../docs/prompt.md`. This version was made from the finished original (commit `66d7c77`).

> Could you create another version of this video with the branding from https://gennow.de/
>
> Please keep the previous version and everything needed to replicate it.
>
> Please ask me any questions because I am not great at using Github

## Questions asked, and the answers

| Question | Answer |
|---|---|
| gennow.de was blocked by the environment's network policy. How should the brand be sourced? | "I'll unblock the site." gennow.de was then added to the allowed domains, and the logos, stylesheet and screenshots were taken from the live site. |
| How far should the branding go? | "Recolour + fonts + logo": keep the paper-collage style, animation, story and music; switch the palette and fonts to gen now's and add the gen now logo. |
| What should the last slide point to? | "Young Founders + gen now": keep the Young Founders Network as the next step and add gen now / Bertelsmann Stiftung. |

## What was done

- The original stays untouched in `project/`, `tools/`, `docs/` and `export/` at the repository root.
- This version lives in `versions/gennow/`: a self-contained copy of the project and tools, with its own docs and exports.
- Branding details and sources: `docs/brand.md`.
- The last-slide wording is "unterstützt von gen now · Ein Projekt der Bertelsmann Stiftung", not "eine Initiative von gen now", because gen now describes the network as a partner it supports (see `docs/brand.md`).
