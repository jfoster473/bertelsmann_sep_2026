/* player.js – browser player: play/pause, scrubber, restart, mute, audio sync.
   The audio element is the master clock while playing; the canvas is drawn with
   the same pure E.render(ctx, t) that the frame exporter uses. */
(function (G) {
  'use strict';
  const E = G.E, TL = G.TIMELINE;
  const $ = (id) => document.getElementById(id);
  const canvas = $('c'), ctx = canvas.getContext('2d');
  const audio = $('audio'), playBtn = $('play'), muteBtn = $('mute'), scrub = $('scrub'), timeEl = $('time'), overlay = $('overlay');
  const exportMode = /[?&]export\b/.test(location.search);
  if (exportMode) document.body.classList.add('export');
  scrub.max = TL.duration;

  let playing = false, t = 0, clockT0 = 0, perf0 = 0, audioOk = true, scrubbing = false;

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
  function draw() {
    E.render(ctx, t);
    if (!scrubbing) scrub.value = t;
    timeEl.textContent = `${fmt(t)} / ${fmt(TL.duration)}`;
  }

  async function loadFonts() {
    const B = '"Bricolage Grotesque"';
    const specs = [`400 40px ${B}`, `500 40px ${B}`, `700 40px ${B}`, `800 40px ${B}`, '400 40px Lato', '700 40px Lato', '900 40px Lato', 'italic 900 40px Lato', '700 40px Caveat'];
    await Promise.all(specs.map((s) => document.fonts.load(s, 'ÄÖÜäöüß„“')));
    await document.fonts.ready;
  }

  function now() { return performance.now() / 1000; }
  function setTime(nt) {
    t = Math.max(0, Math.min(TL.duration, nt));
    clockT0 = t; perf0 = now();
    if (audioOk) { try { audio.currentTime = t; } catch (e) { /* not loaded yet */ } }
    draw();
  }
  function play() {
    if (t >= TL.duration - 0.05) setTime(0);
    playing = true; playBtn.textContent = '❚❚'; playBtn.setAttribute('aria-label', 'Pause');
    clockT0 = t; perf0 = now();
    if (audioOk) {
      try { audio.currentTime = t; } catch (e) {}
      const p = audio.play();
      if (p && p.catch) p.catch(() => { audioOk = false; });
    }
    overlay.classList.add('hidden');
    requestAnimationFrame(loop);
  }
  function pause() {
    playing = false; playBtn.textContent = '▶'; playBtn.setAttribute('aria-label', 'Abspielen');
    audio.pause();
    draw();
  }
  function loop() {
    if (!playing) return;
    let nt = clockT0 + (now() - perf0);
    // audio is the master clock: resync when drifting
    if (audioOk && !audio.paused && audio.readyState >= 2) {
      const at = audio.currentTime;
      if (Math.abs(at - nt) > 0.06) { clockT0 = at; perf0 = now(); nt = at; }
    }
    t = nt;
    if (t >= TL.duration) { t = TL.duration; draw(); pause(); return; }
    draw();
    requestAnimationFrame(loop);
  }

  playBtn.onclick = () => (playing ? pause() : play());
  $('restart').onclick = () => { setTime(0); if (!playing) play(); };
  muteBtn.onclick = () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', audio.muted ? 'Ton an' : 'Ton aus');
  };
  scrub.addEventListener('input', () => { scrubbing = true; setTime(parseFloat(scrub.value)); scrubbing = false; });
  overlay.onclick = () => play();
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT' && e.code !== 'Space') return;
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    else if (e.key === 'm' || e.key === 'M') muteBtn.onclick();
    else if (e.key === 'r' || e.key === 'R') $('restart').onclick();
    else if (e.key === 'ArrowRight') setTime(t + 1);
    else if (e.key === 'ArrowLeft') setTime(t - 1);
  });
  audio.addEventListener('error', () => { audioOk = false; });

  // expose for the frame exporter (tools/export.js)
  G.__render = (tt) => { E.render(ctx, tt); };
  G.__ready = (async () => {
    await loadFonts();
    await E.loadBrand(); // gen now logos (engine/brand.js)
    E.prewarm();
    t = exportMode ? 0 : 0.0;
    draw();
    overlay.querySelector('span').textContent = '▶ Abspielen';
    return true;
  })();
})(window);
