# Prompt and feedback (verbatim)

This file holds the original brief exactly as given (the uploaded style reference was attached as `CMAF_1080.mp4`), followed by the feedback rounds and what changed in response.

---

## Original brief

> # Task: German Instagram explainer video, paper-collage style (no narration)
>
> Create a finished 40–55 second vertical (1080×1920, 30 fps) animated explainer in GERMAN about a youth entrepreneurship study. Build it in pure vanilla JavaScript (Canvas 2D, no frameworks) and render it to MP4. There is no voiceover: the story is told entirely through animated on-screen text, illustrations, music and sound effects. Quality matters more than speed. Work autonomously through to completion; I will be away. Make reasonable decisions yourself and report any real limitations honestly at the end.
>
> ## Audience and purpose
> Instagram Reels, which are often watched with the sound off. Primary audience: university students in Germany. It should also work for capable high-school students and young professionals. Viewers should come away knowing the key findings, seeing how they apply to their own lives, and knowing one concrete next step: the Young Founders Network.
>
> ## Visual style: follow the reference closely
> I have uploaded a style reference video myself. Find it first: look for any .mp4 file in the repository (it is probably `CMAF_1080.mp4` in the root) or among the files attached to this conversation. Copy it to `reference/style_reference.mp4`. It is a video-only file (no audio track): a 48-second paper-collage ad for an unrelated app. If you cannot find a readable video, stop and ask me to upload it rather than continuing without it.
>
> Copy its FORMAT, not its content or branding. Before designing anything:
> 1. Extract frames (e.g. 4 fps) and contact sheets. Study them carefully.
> 2. Write `docs/style_analysis.md` covering palette logic, paper and cardboard textures, torn-edge labels, tape pieces, drop shadows, the cut-out character, typography (bold serif on torn paper strips, sans-serif for small text), scene-colour changes, and motion (springy pop-in with overshoot, slight rotation, stacking labels, parallax, elements that carry across and transform between scenes instead of hard cuts, confetti).
> 3. Match that feel. Everything should keep moving naturally: idle wobble, breathing, subtle drift. There should never be a static slide.
>
> Draw all illustrations procedurally in code: torn paper, cardboard, tape, a cut-out young character (reuse and pose them throughout), crowds of small figures, icons, and animated collage charts. Do not use AI image generation, and do not use Metriq Body branding, its logo or any of its content.
>
> ## Source material (verify everything against these)
> - Full study PDF: https://www.bertelsmann-stiftung.de/fileadmin/files/user_upload/Gruendungsaufbruch_der_jungen_Generation_2026_1.pdf
>   (Bertelsmann Stiftung, "Gründungsaufbruch der jungen Generation: Hohes Interesse und Rekordaktivität trotz Barrieren", Andrade, Bürger, Heck, 15.09.2026, DOI 10.11586/2026127)
> - Press article: https://www.bertelsmann-stiftung.de/de/unsere-projekte/junge-menschen-und-wirtschaft/projektnachrichten/gruendungsaufbruch-der-jungen-generation
> - Young Founders Network: https://youngfounders.network/
>
> Download and read the PDF first. If a download is blocked by network restrictions, tell me which domain needs allowing. Save a fact sheet (`docs/facts.md`) with every figure you use, its exact wording in German, its base group, and its page reference.
>
> Key findings from the article (confirm each against the PDF):
> - Survey of 14–25-year-olds, representative: 1,763 young people plus 1,325 apprentices, conducted online from March to mid-April 2026.
> - 9% firmly intend to become self-employed by age 30; 28% can imagine it but aren't sure; 31% rather not but don't rule it out; 29% say it's no option. Together, nearly 4 in 10 can imagine founding.
> - Among those who CAN'T imagine founding: 60% find self-employment too insecure and prefer employment; 48% know too little about founding (especially school pupils); 39% fear too much stress (mostly school leavers). Fewer than 1 in 10 worry about start-up capital. Check the exact base group in the PDF. These are likely multiple-choice answers, so never add them up.
> - Education gap: 42% of those at or with Gymnasium/Abitur can imagine founding, versus 27% with Hauptschule; half of the latter rule it out, compared with a fifth of the former. 14–20-year-olds are more open than 21–25-year-olds.
> - Real world (a separate source, the Global Entrepreneurship Monitor, cited in the article): the share of founders aged 18–24 in Germany nearly doubled from 2024 to 2025, from just under 13% to over 23%. Label this source correctly on screen.
> - Recommendations: entrepreneurial thinking in school regardless of school type, workshops and student companies, founder information via social media, and resilience and stress support (e.g. free counselling from the Agentur für Arbeit or Jugendberufshilfe, stress-prevention courses and apps from health insurers).
>
> Accuracy rules: use exact figures; keep "can imagine" distinct from "will found"; don't imply causation; don't invent statistics, quotes or claims about the Young Founders Network. Check its website and describe it only as the site supports (the article says the Bertelsmann Stiftung supports it).
>
> ## Story and on-screen copy (you write it, in German)
> Write the on-screen copy in informal du-form: energetic and warm, the way a smart friend explains something, without cringe or slang overload. Headlines should be short and punchy on torn paper strips, with the numbers big and animated. Suggested arc (improve it if you can):
> 1. Hook: a relatable moment ("Eigene Firma? Ich doch nicht…" or better).
> 2. The big number: nearly 4 in 10 can imagine it, visualised as a crowd of cut-out figures sorting into the four groups.
> 3. What holds people back: insecurity, too little knowledge, stress. Then the twist: money is barely the problem.
> 4. The real-world payoff: two of the three biggest hurdles (knowledge and stress) are fixable, and young founders are already on the rise (GEM figure).
> 5. Optionally, the education gap, briefly and without stigma.
> 6. Ending: the Young Founders Network as the concrete next step, with its URL on screen.
>
> Keep the source credit visible near the end: "Quelle: Bertelsmann Stiftung (2026), Gründungsaufbruch der jungen Generation; GEM 2025". Use "Gründer:innen" for gender-inclusive wording.
>
> Pacing: every text beat must stay fully readable for at least (word count ÷ 3) seconds plus 0.5 s, at phone size. Hold the final screen with the network's URL for at least 3 seconds.
>
> ## Music and sound design
> Upbeat, light, playful, low-key (plucky, ukulele/marimba/claps feel). Prefer original music you generate or synthesise yourself. Otherwise use CC0 or clearly licensed tracks, and document the source URL and licence. Paper sound effects (rustle, tear, tape, pop, whoosh, slide) should be synthesised or CC0, timed to the on-screen pops, tears and transitions. Master to about −14 LUFS integrated, true peak ≤ −1 dBTP. Export the music and SFX stems plus the full mix.
>
> ## Technical
> - One timeline-driven vanilla JS engine: `render(ctx, t)` is a pure function of time, so browser playback and frame export are identical. Use a seeded RNG for all procedural textures.
> - Keep all scene timings and on-screen text in one editable data file, so a narration track can be added in a later version without rebuilding the scenes.
> - Browser player with play/pause, scrubber, restart and mute, with the audio in sync.
> - Frame-accurate export via headless Chrome (Playwright or Puppeteer, stepping time rather than recording in real time), then ffmpeg to H.264/AAC MP4 (yuv420p, faststart).
> - Use open-licensed fonts (OFL) with full German glyph support (ä, ö, ü, ß, „ “), embedded locally.
> - Instagram safe zones: keep key text clear of roughly the top 250 px and bottom 380 px, and away from the right-hand edge where the Reels buttons sit.
>
> ## Deliverables
> 1. `export/video.mp4`: 1080×1920, 40–55 seconds.
> 2. An editable vanilla JS project with player and controls.
> 3. A self-contained single-file HTML player (fonts, audio and code inlined), if practical.
> 4. `docs/`: on-screen copy (German plus an English translation), fact sheet with page references, style analysis, asset and licence sources, and a short README on how to edit text and timing, re-render and remix audio.
> 5. Audio stems and all source assets.
> 6. A ZIP of the complete project.
>
> ## QA before delivering (revise anything that falls short)
> - Contact sheets of the final export; check every scene for legibility on a phone, safe zones, overlaps and flicker.
> - Check reading time for every text beat against the pacing rule.
> - Check smooth transitions with no dead or static moments, and that SFX land on the visual events.
> - Report the LUFS and peak values of the final audio.
> - Check every on-screen number against `docs/facts.md`.
> - Play back the HTML player and confirm the controls and audio sync work.
>
> ## Delivery
> Commit and push all deliverables to the working branch (or pull request, if that is how this session delivers). Keep each file under 100 MB (lower the bitrate if needed). Put the final MP4, HTML player and ZIP in `export/` so I can download them from GitHub on my phone.
>
> At the end, give me a short summary: music source, runtime, what was verified, and any limitations.

---

## Feedback round 1: sound

> Great, I have one piece of feedback and it's just with the sound. The sound when the text lands is a ripping sound, whereas it should be a very light thumping sound. Not heavy. The ripping when the page turns is fine, but you've made everything ripping and it's a bit jarring.

**Changed:** text landings (drop-ins, slide-ins, tape) became light, soft thumps with no high-frequency crackle. Flips, captions and small swishes became smooth air swishes. The tear texture stays only on page turns, and the SFX bus was lowered 2.5 dB. (Commit "Replace ripping text-landing sounds with light soft thumps".)

## Feedback round 2: timing and last-slide music

> Cool, that's really good. One issue I have now is the timing of the things that come up. Some things come up quite quickly and then stay on the screen for longer. What I'd like is the things to come up roughly in time with how long it would take someone to talk. Overall, I think the timing of the video is fine and each slide is fine, but we'll reduce the amount of time at the end. There'll still be a little bit, but more time to allow things to come up in the time that it takes to read, so it doesn't rush onto the screen so quickly.

> Additional to that, could you make the music for the last slide change a little bit to become just ever so slightly more upbeat so you feel like you're on this last slide? Maybe not quite a crescendo sense of things, but just a little bit. Maybe some notes that sort of indicate it's the last thing. You're smart, you'll work it out. I like the last final bit where it dings at the end, though. Could you do that alongside the timing that I've asked for?

**Changed:**
- `tools/pace.js` places each slide's lines one after another at a spoken rhythm, scaled to the slide, leaving only a short reading hold at the end.
- The last slide went from 7.5 s to 6 s; that time went to the crowd, good-news and GEM slides (total still 54 s).
- The music got a finale on the last slide: Am → F → G → C, a brighter groove, and a rising marimba/glockenspiel line into the unchanged final ding.

(Commit "Pace on-screen text at a spoken rhythm and add a finale to the last slide".)

## Feedback round 3: docs

> Did you update all of the readme/md files? And also, did you put the prompt in there?

**Changed:** this file was added, the README links to it, and the remaining stale notes in `docs/` were updated.
