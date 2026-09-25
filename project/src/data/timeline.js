/* =============================================================================
   timeline.js – THE editable data file.
   All scene timings, all on-screen text, positions and the character's moves
   live here. Scenes (src/scenes.js) only read from this object.

   Times are in seconds. Coordinates are in the 1080×1920 frame.
   Item fields:
     id      unique id
     scene   scene id the item belongs to (it is covered by the next scene's sheet)
     type    'strip' (torn paper label) | 'caption' (charcoal bar, lower third)
             | 'hand' (handwriting) | 'stamp' | 'note' (typed paper card)
     text    on-screen text; '\n' = line break
     font    headline | headlineItalic | serifSmall | shout | number | body | small
             | kicker | typed | hand | caption            (see engine/paper.js)
     size    font size in px (optional, default per font)
     color   cream | white | red | blue | mustard | pink | lemon | mint | charcoal | teal | lined
     x, y    centre position; with anchor:'left', x is the left edge
     rot     rotation in degrees
     in/out  appear / disappear time
     enter   drop (slams in from the camera) | pop | slideL | slideR | slideUp | flip | none
     exit    cover (just stays until the next sheet covers it) | fly | shrink | flip | fall
     top     true = drawn above sheets & character (for elements that carry over)
     path    optional keyframes [{t,x,y,rot,s}] to move an item across scenes
     maxW    auto-shrink font so the strip is at most this wide (default: ends by x≈850)
   Future narration: add entries to `narration` (see bottom); the audio pipeline
   (tools/audio/synth.py) will mix any file listed there.
============================================================================= */
(function (G) {
  'use strict';
  const TL = {
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 54,
    bpm: 120, // music grid: scene starts sit on beats (0.5 s)

    // Safe zones (Instagram Reels UI): keep key text inside this box.
    safe: { top: 250, bottom: 1540, left: 50, right: 940 },

    // ---------------------------------------------------------------- scenes --
    // transition: how this scene's paper sheet arrives (from which side)
    scenes: [
      { id: 'hook', start: 0.0, end: 7.0, bg: 'beige', transition: { type: 'tearOpen', dur: 0.55 } },
      { id: 'study', start: 7.0, end: 13.0, bg: 'blue', transition: { type: 'sheet', from: 'right', dur: 0.6 } },
      { id: 'crowd', start: 13.0, end: 23.0, bg: 'mustard', transition: { type: 'sheet', from: 'top', dur: 0.6 } },
      { id: 'barriers', start: 23.0, end: 33.5, bg: 'salmon', transition: { type: 'sheet', from: 'left', dur: 0.6 } },
      { id: 'good', start: 33.5, end: 41, bg: 'sage', transition: { type: 'sheet', from: 'right', dur: 0.6 } },
      { id: 'gem', start: 41, end: 46.5, bg: 'cream', transition: { type: 'sheet', from: 'bottom', dur: 0.6 } },
      { id: 'end', start: 46.5, end: 54, bg: 'charcoal', transition: { type: 'sheet', from: 'top', dur: 0.65 } },
    ],

    // ------------------------------------------------------------------ items --
    items: [
      // ===== 1 HOOK ===========================================================
      { id: 'd1', scene: 'hook', type: 'strip', text: 'Zu unsicher!', font: 'shout', size: 64, color: 'red', x: 252, y: 630, rot: -5, in: 0.7, out: 7.6, enter: 'drop' },
      { id: 'd2', scene: 'hook', type: 'strip', text: 'Keine Ahnung,\nwie das geht …', font: 'hand', size: 52, color: 'lined', x: 775, y: 660, rot: 4, in: 1.05, out: 7.6, enter: 'drop' },
      { id: 'd3', scene: 'hook', type: 'strip', text: 'Viel zu\nviel Stress', font: 'headlineItalic', size: 50, color: 'pink', x: 215, y: 835, rot: 3, in: 1.4, out: 7.6, enter: 'drop' },
      { id: 'money', scene: 'hook', type: 'strip', text: 'Dafür brauchst\ndu viel Geld!', font: 'typed', size: 36, color: 'lemon', x: 765, y: 850, rot: -3, in: 1.75, out: 33.75, enter: 'drop', exit: 'fly', top: true,
        // carries over: flies off after the hook, comes back for the twist in scene 4
        path: [
          { t: 6.55, x: 765, y: 850, rot: -3, s: 1 },
          { t: 7.05, x: 1320, y: 760, rot: 28, s: 1 },
          { t: 28.3, x: 1320, y: 1300, rot: 28, s: 1 },
          { t: 28.85, x: 690, y: 1206, rot: -4, s: 1.1 },
        ] },
      { id: 'd5', scene: 'hook', type: 'strip', text: 'Das machen\ndoch nur andere.', font: 'serifSmall', size: 42, color: 'blue', x: 240, y: 1235, rot: -2, in: 2.1, out: 7.6, enter: 'drop' },
      { id: 'h1', scene: 'hook', type: 'strip', text: 'Eigene Firma gründen?', font: 'headline', size: 78, color: 'cream', x: 80, anchor: 'left', y: 350, rot: -2, in: 2.75, out: 7.6, enter: 'drop' },
      { id: 'h2', scene: 'hook', type: 'strip', text: 'Ich doch nicht …', font: 'headlineItalic', size: 70, color: 'red', x: 130, anchor: 'left', y: 465, rot: 1.5, in: 3.45, out: 7.6, enter: 'drop' },
      { id: 'c1', scene: 'hook', type: 'caption', text: 'Kommt dir bekannt vor?', in: 4.1, out: 6.95 },

      // ===== 2 STUDY ==========================================================
      { id: 's_k', scene: 'study', type: 'strip', text: 'Neue Studie · Bertelsmann Stiftung', font: 'kicker', color: 'charcoal', x: 80, anchor: 'left', y: 330, rot: -1, in: 7.35, out: 13.6, enter: 'slideL' },
      { id: 's_h1', scene: 'study', type: 'strip', text: 'Was denken', font: 'headline', color: 'cream', x: 80, anchor: 'left', y: 440, rot: -1.5, in: 7.7, out: 13.6, enter: 'drop' },
      { id: 's_h2', scene: 'study', type: 'strip', text: '14- bis 25-Jährige', font: 'headline', color: 'mustard', x: 100, anchor: 'left', y: 548, rot: 1, in: 8.0, out: 13.6, enter: 'drop' },
      { id: 's_h3', scene: 'study', type: 'strip', text: 'übers Gründen?', font: 'headline', color: 'cream', x: 80, anchor: 'left', y: 656, rot: -1, in: 8.3, out: 13.6, enter: 'drop' },
      { id: 's_n', scene: 'study', type: 'strip', text: '1.763 junge Menschen + 1.325 Azubis\nonline befragt, Frühjahr 2026', font: 'typed', size: 33, color: 'white', x: 80, anchor: 'left', y: 790, rot: 0.8, in: 8.85, out: 13.6, enter: 'slideL', align: 'left' },
      { id: 's_stamp', scene: 'study', type: 'stamp', text: 'REPRÄSENTATIV', ink: '#B8342A', size: 54, x: 715, y: 1175, rot: -9, in: 10.0, out: 12.55 },

      // ===== 3 CROWD ==========================================================
      { id: 'q_h', scene: 'crowd', type: 'strip', text: 'Selbstständig bis 30?', font: 'headline', color: 'cream', x: 80, anchor: 'left', y: 330, rot: -1.5, in: 13.6, out: 18.25, enter: 'drop', exit: 'fly' },
      { id: 'c2', scene: 'crowd', type: 'caption', text: 'Stell dir 100 junge Menschen vor:', in: 13.9, out: 17.0 },
      { id: 'q_big', scene: 'crowd', type: 'strip', text: 'Fast 4 von 10', font: 'shout', size: 104, color: 'red', x: 80, anchor: 'left', y: 350, rot: -2, in: 18.35, out: 23.6, enter: 'drop' },
      { id: 'q_sub', scene: 'crowd', type: 'strip', text: 'können sich vorstellen, zu gründen.', font: 'serifSmall', size: 44, color: 'cream', x: 110, anchor: 'left', y: 458, rot: 1, in: 18.75, out: 23.6, enter: 'drop' },
      { id: 'c3', scene: 'crowd', type: 'caption', text: 'Vorstellen heißt nicht gründen –\naber es ist ein Anfang.', in: 18.85, out: 22.95 },

      // ===== 4 BARRIERS =======================================================
      { id: 'b_h', scene: 'barriers', type: 'strip', text: 'Was hält die anderen ab?', font: 'headline', size: 76, color: 'cream', x: 80, anchor: 'left', y: 320, rot: -1.5, in: 23.35, out: 34.1, enter: 'drop' },
      { id: 'b_base', scene: 'barriers', type: 'strip', text: 'Befragte, die sich Gründen nicht vorstellen können', font: 'small', size: 30, color: 'charcoal', x: 90, anchor: 'left', y: 412, rot: 0.8, in: 23.8, out: 34.1, enter: 'slideL' },
      { id: 'b_multi', scene: 'barriers', type: 'hand', text: 'Mehrfachnennungen möglich', size: 46, color: '#3A1F18', x: 520, y: 1030, rot: -3, in: 27.1, out: 34.1 },
      { id: 'b_tw', scene: 'barriers', type: 'strip', text: 'Und Geld? Kaum ein Problem.', font: 'headline', size: 64, color: 'mint', x: 70, anchor: 'left', y: 1112, rot: -1.5, in: 28.45, out: 34.1, enter: 'drop' },
      { id: 'b_stamp', scene: 'barriers', type: 'stamp', text: 'UNTER 10 %', ink: '#B8342A', size: 60, x: 735, y: 1302, rot: -7, in: 29.0, out: 33.75, exit: 'fly', top: true },
      { id: 'c4', scene: 'barriers', type: 'caption', text: 'Startkapital nennt nicht mal\njede:r Zehnte.', in: 29.35, out: 33.45 },

      // ===== 5 GOOD NEWS ======================================================
      { id: 'g_h', scene: 'good', type: 'strip', text: 'Die gute Nachricht:', font: 'headlineItalic', size: 76, color: 'mustard', x: 80, anchor: 'left', y: 335, rot: -1.5, in: 33.85, out: 41.6, enter: 'drop' },
      { id: 'g_a', scene: 'good', type: 'strip', text: 'Wissen kann man lernen.', font: 'headline', size: 66, color: 'cream', x: 80, anchor: 'left', y: 455, rot: 1, in: 34.35, out: 41.6, enter: 'flip' },
      { id: 'g_a_st', scene: 'good', type: 'stamp', text: 'LÖSBAR', ink: '#1C5A33', size: 50, x: 815, y: 590, rot: 9, in: 34.85, out: 41.6 },
      { id: 'g_a1', scene: 'good', type: 'strip', text: 'Workshops & Schülerfirmen', font: 'typed', size: 31, color: 'white', x: 120, anchor: 'left', y: 568, rot: -1, in: 35.15, out: 41.6, enter: 'slideL', tape: true },
      { id: 'g_a2', scene: 'good', type: 'strip', text: 'Gründungs-Infos über Social Media', font: 'typed', size: 31, color: 'white', x: 120, anchor: 'left', y: 650, rot: 1, in: 35.5, out: 41.6, enter: 'slideL', tape: true },
      { id: 'g_b', scene: 'good', type: 'strip', text: 'Stress kann man managen.', font: 'headline', size: 66, color: 'cream', x: 80, anchor: 'left', y: 800, rot: -1, in: 36.0, out: 41.6, enter: 'flip' },
      { id: 'g_b_st', scene: 'good', type: 'stamp', text: 'LÖSBAR', ink: '#1C5A33', size: 50, x: 815, y: 955, rot: -7, in: 36.5, out: 41.6 },
      { id: 'g_b1', scene: 'good', type: 'strip', text: 'Kostenlose Beratung, z. B.\nAgentur für Arbeit,\nJugendberufshilfe', font: 'typed', size: 31, color: 'white', x: 120, anchor: 'left', y: 952, rot: -0.8, in: 36.75, out: 41.6, enter: 'slideL', tape: true, align: 'left' },
      { id: 'g_b2', scene: 'good', type: 'strip', text: 'Anti-Stress-Kurse & Apps\nder Krankenkassen', font: 'typed', size: 31, color: 'white', x: 120, anchor: 'left', y: 1112, rot: 1, align: 'left', in: 37.1, out: 41.6, enter: 'slideL', tape: true },
      { id: 'c5', scene: 'good', type: 'caption', text: 'Die Studie empfiehlt: unter-\nnehmerisches Denken in\njeder Schulform.', in: 36.9, out: 40.95 },

      // ===== 6 GEM ============================================================
      { id: 'm_h', scene: 'gem', type: 'strip', text: 'Und junge Leute legen los:', font: 'headline', size: 76, color: 'cream', x: 80, anchor: 'left', y: 320, rot: -1.5, in: 41.35, out: 47.2, enter: 'drop' },
      { id: 'm_sub', scene: 'gem', type: 'strip', text: 'Anteil der 18- bis 24-Jährigen, die gerade\ngründen oder kürzlich gegründet haben', font: 'small', size: 29, color: 'charcoal', x: 90, anchor: 'left', y: 435, rot: 0.6, in: 41.65, out: 47.2, enter: 'slideL', align: 'left' },
      { id: 'm_src', scene: 'gem', type: 'strip', text: 'Quelle: Global Entrepreneurship Monitor (GEM) 2025/26', font: 'small', size: 28, color: 'white', x: 90, anchor: 'left', y: 1338, rot: -0.5, in: 42.1, out: 47.2, enter: 'slideL' },
      { id: 'c6', scene: 'gem', type: 'caption', text: 'Fast verdoppelt – in nur einem Jahr.', in: 43.3, out: 46.45 },

      // ===== 7 END ============================================================
      { id: 'e_k', scene: 'end', type: 'strip', text: 'Dein nächster Schritt:', font: 'headlineItalic', size: 66, color: 'mustard', x: 80, anchor: 'left', y: 330, rot: -2, in: 46.95, out: 99, enter: 'drop' },
      { id: 'e_t', scene: 'end', type: 'strip', text: 'Young Founders\nNetwork', font: 'headline', size: 96, color: 'cream', x: 80, anchor: 'left', y: 520, rot: 1, in: 47.4, out: 99, enter: 'drop' },
      { id: 'e_s', scene: 'end', type: 'strip', text: 'Community für junge Gründer:innen unter 25', font: 'body', size: 36, color: 'white', x: 90, anchor: 'left', y: 700, rot: -1, in: 47.9, out: 99, enter: 'slideL' },
      { id: 'e_b', scene: 'end', type: 'strip', text: 'unterstützt von der Bertelsmann Stiftung', font: 'small', size: 29, color: 'charcoal', rim: '#8C857A', x: 100, anchor: 'left', y: 775, rot: 0.8, in: 48.25, out: 99, enter: 'slideL' },
      { id: 'e_url', scene: 'end', type: 'strip', text: 'youngfounders.network', font: 'headline', size: 76, color: 'mustard', x: 520, y: 925, rot: -2.5, in: 48.8, out: 99, enter: 'drop', tape: true },
      { id: 'e_hand', scene: 'end', type: 'hand', text: 'schau vorbei!', size: 62, color: '#F2DC7A', x: 690, y: 1150, rot: -6, in: 49.5, out: 99, arrow: { x0: 700, y0: 1100, x1: 640, y1: 1010, bend: -0.3 } },
      { id: 'e_src', scene: 'end', type: 'credit', text: 'Quelle: Bertelsmann Stiftung (2026), Gründungsaufbruch\nder jungen Generation; GEM 2025', x: 540, y: 1482, in: 49.05, out: 99 },
    ],

    // ---------------------------------------------- scene-specific animation --
    study: {
      card: { x: 720, y: 1085, w: 380, h: 430, rot: 4, in: 8.75, title: 'FRAGEBOGEN', ticks: [9.3, 9.55, 9.8] },
      // survey card flies to the centre and bursts into the crowd
      burst: { move: 12.45, at: 13.25, x: 540, y: 880 },
    },
    crowd: {
      appear: 13.3,          // figures burst out of the survey card
      sort: 15.0,            // figures run into their groups
      tagsIn: [15.55, 15.95, 16.35, 16.75, 17.15],
      highlight: 18.5,       // "Fast 4 von 10": the first two groups hop, others dim
      top: 520,              // y of the first group
      left: 350,             // x where the figure rows start
      perRow: 16,
      groups: [
        // value = share in %, one figure = 1 %
        { value: 9, n: 9, label: 'haben es fest vor', color: 'red', text: '9 %' },
        { value: 28, n: 28, label: 'vorstellbar, aber noch unsicher', color: 'mustard', text: '28 %' },
        { value: 31, n: 31, label: 'eher nicht, aber nicht ausgeschlossen', color: 'cream', text: '31 %' },
        { value: 29, n: 29, label: 'keine Option', color: 'cream', text: '29 %' },
        { value: 3, n: 3, label: 'haben’s schon gemacht', color: 'charcoal', text: '3 %' },
      ],
    },
    barriers: {
      rows: [
        // value: bar length in %; text: what is printed (see docs/facts.md F8 for "rund 60 %")
        { value: 60, text: 'rund 60 %', label: 'zu unsicher – lieber angestellt', icon: 'lock', color: '#C8483C', in: 24.4 },
        { value: 48, text: '48 %', label: 'zu wenig Wissen übers Gründen', icon: 'question', color: '#3F7FA8', in: 25.3, carry: 'g_a' },
        { value: 39, text: '39 %', label: 'Angst vor zu viel Stress', icon: 'bolt', color: '#D9A33A', in: 26.2, carry: 'g_b' },
      ],
      top: 520, rowH: 170, left: 90, full: 720, // bar of 100 % = 720 px
      carryAt: 33.55, // labels of rows 2+3 fly into the next scene and flip
      strike: { at: 29.25, x0: 548, y0: 1228, x1: 852, y1: 1174 }, // red line through the money myth
    },
    gem: {
      base: 1180, x0: 240, barW: 170, gap: 120, pxPerPct: 24,
      bars: [
        { year: '2024', value: 12.9, text: 'knapp 13 %', in: 42.05, color: '#9CC0E0' },
        { year: '2025', value: 23.2, text: 'über 23 %', in: 42.85, color: '#C8483C' },
      ],
      arrowAt: 43.5,
    },
    end: { confettiAt: 48.8 },

    // ------------------------------------------------------- the character --
    // pose: stand | shrug | think | point | pointSide | wave | cheer | hold | worried
    // mouth: neutral | smile | grin | o | frown | hmm; brows: '' | worried | raised
    character: [
      { t: 0.35, x: 540, y: 1400, s: 0.88, pose: 'stand', mouth: 'neutral' },
      { t: 1.5, x: 540, y: 1400, s: 0.88, pose: 'worried', mouth: 'hmm', brows: 'worried' },
      { t: 2.7, x: 540, y: 1400, s: 0.88, pose: 'shrug', mouth: 'frown', brows: 'worried' },
      { t: 4.3, x: 540, y: 1400, s: 0.88, pose: 'think', mouth: 'hmm' },
      { t: 6.7, x: 245, y: 1450, s: 0.78, pose: 'pointSide', mouth: 'smile', move: 0.55, hop: 90 },
      { t: 12.25, x: -260, y: 1450, s: 0.78, pose: 'stand', mouth: 'smile', move: 0.5, hop: 70 },
      { t: 12.8, x: -260, y: 1450, s: 0.78, pose: 'stand', vis: 0 },
      { t: 23.35, x: 185, y: 1570, s: 0.62, pose: 'think', mouth: 'hmm', brows: 'worried' },
      { t: 28.95, x: 185, y: 1570, s: 0.62, pose: 'shrug', mouth: 'o', brows: 'raised' },
      { t: 30.4, x: 185, y: 1570, s: 0.62, pose: 'stand', mouth: 'smile' },
      { t: 33.6, x: 800, y: 1480, s: 0.6, pose: 'cheer', mouth: 'grin', move: 0.6, hop: 120 },
      { t: 40.95, x: 885, y: 1525, s: 0.54, pose: 'pointSide', flip: true, mouth: 'smile', move: 0.6, hop: 110 },
      { t: 46.7, x: 250, y: 1400, s: 0.7, pose: 'wave', mouth: 'grin', move: 0.6, hop: 100 },
      { t: 49.2, x: 250, y: 1400, s: 0.7, pose: 'pointSide', mouth: 'smile' },
    ],

    // --------------------------------------------------------- audio notes --
    audio: {
      file: 'assets/audio/mix.mp3',
      // Narration placeholder for a later version: [{file:'vo/01.wav', at: 0.4, gainDb: 0}]
      narration: [],
    },
  };

  G.TIMELINE = TL;
  if (typeof module !== 'undefined') module.exports = TL;
})(typeof window !== 'undefined' ? window : globalThis);
