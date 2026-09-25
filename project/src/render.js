/* render.js – the one entry point: E.render(ctx, t) draws the frame at time t.
   Pure function of t (all procedural assets are seeded and cached), so browser
   playback and frame export are identical. Also exports E.collectCues() – the
   list of sound-effect cues derived from the same timeline. */
(function (G) {
  'use strict';
  const E = G.E;

  E.camera = function (t) {
    return {
      x: 9 * E.wob(t, 0.09, 21),
      y: 11 * E.wob(t, 0.08, 22),
      z: 1.012 + 0.01 * Math.sin(t * 0.23),
    };
  };

  function sceneIndexAt(TL, t) {
    let k = 0;
    TL.scenes.forEach((s, i) => { if (t >= s.start) k = i; });
    return k;
  }

  function withCam(ctx, cam, f, W, H, fn) {
    ctx.save();
    ctx.translate(W / 2 + cam.x * f, H / 2 + cam.y * f);
    const z = 1 + (cam.z - 1) * f;
    ctx.scale(z, z);
    ctx.translate(-W / 2, -H / 2);
    fn();
    ctx.restore();
  }

  function drawBgFull(ctx, TL, sc, cam) {
    const bg = E.makeBackground(sc.bg, TL.width, TL.height);
    const O = E.bgOverscan;
    ctx.drawImage(bg, -O + cam.x * 0.35, -O + cam.y * 0.35);
  }

  function drawSceneLayer(ctx, TL, sc, t) {
    const W = TL.width;
    const S = E.SCENES[sc.id];
    if (S && S.draw) S.draw(ctx, t);
    for (const it of TL.items) {
      if (it.scene !== sc.id || it.top || it.type === 'caption') continue;
      E.drawItem(ctx, it, t, W);
    }
  }

  /** Draw the frame at time t (seconds). */
  E.render = function (ctx, t) {
    const TL = G.TIMELINE;
    const W = TL.width, H = TL.height;
    t = Math.max(0, Math.min(TL.duration - 1e-6, t));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const cam = E.camera(t);
    const k = sceneIndexAt(TL, t);
    const sc = TL.scenes[k];
    const tr = sc.transition || { dur: 0 };
    const inTrans = t < sc.start + tr.dur;

    if (tr.type === 'sheet' && inTrans && k > 0) {
      const prev = TL.scenes[k - 1];
      drawBgFull(ctx, TL, prev, cam);
      withCam(ctx, cam, 1, W, H, () => drawSceneLayer(ctx, TL, prev, t));
      const p = E.easeInOut((t - sc.start) / tr.dur);
      E.drawSheet(ctx, E.makeBackground(sc.bg, W, H), p, tr.from, sc.id, W, H, cam);
    } else {
      drawBgFull(ctx, TL, sc, cam);
    }
    withCam(ctx, cam, 1, W, H, () => drawSceneLayer(ctx, TL, sc, t));

    // opening: dark sheet tears away upwards
    if (tr.type === 'tearOpen' && inTrans) {
      const p = 1 - E.easeInCubic(0.2 + 0.8 * ((t - sc.start) / tr.dur));
      E.drawSheet(ctx, E.makeBackground('charcoal', W, H), p, 'top', 'open', W, H, cam);
    }

    // foreground: character, carry-over items, scene top layers, captions
    withCam(ctx, cam, 1.15, W, H, () => {
      const cs = E.charState(TL.character, t);
      E.drawCharacter(ctx, cs, t);
      for (const it of TL.items) if (it.top && it.type !== 'caption') E.drawItem(ctx, it, t, W);
      TL.scenes.forEach((s) => { const S = E.SCENES[s.id]; if (S && S.drawTop) S.drawTop(ctx, t); });
      for (const it of TL.items) if (it.type === 'caption') E.drawItem(ctx, it, t, W);
    });
  };

  /** Pre-build all cached sprites (call once fonts are loaded). */
  E.prewarm = function () {
    const TL = G.TIMELINE;
    TL.scenes.forEach((s) => E.makeBackground(s.bg, TL.width, TL.height));
    E.makeBackground('charcoal', TL.width, TL.height);
    TL.items.forEach((it) => E.itemSprite(it));
    for (let t = 0; t < TL.duration; t += 0.5) {
      // rendering once every 0.5 s touches every lazily built sprite
      try { E.render(E._scratch || (E._scratch = E.canvas(TL.width, TL.height).getContext('2d')), t); } catch (e) { console.error(e); }
    }
  };

  // ======================================================== AUDIO CUES ======
  /**
   * Sound-effect cue list derived from the timeline, so SFX always land on the
   * visual events. {t, type, pan(-1..1), gain(dB), dur?}
   */
  E.collectCues = function (TL) {
    TL = TL || G.TIMELINE;
    const cues = [];
    const pan = (x) => E.clamp(((x || 540) - 540) / 540, -1, 1) * 0.6;
    const add = (t, type, x, gain = 0, extra = {}) => cues.push(Object.assign({ t: +t.toFixed(3), type, pan: +pan(x).toFixed(2), gain }, extra));
    const land = E.dropLand;

    TL.scenes.forEach((s) => {
      const tr = s.transition || {};
      if (tr.type === 'tearOpen') add(s.start + 0.02, 'tear', 540, 0, { dur: tr.dur });
      if (tr.type === 'sheet') {
        const x = tr.from === 'right' ? 900 : tr.from === 'left' ? 180 : 540;
        add(s.start - 0.05, 'whoosh', x, -1, { dur: tr.dur + 0.1 });
        add(s.start + 0.05, 'sheet', x, -3, { dur: tr.dur });
      }
    });
    TL.items.forEach((it) => {
      const x = it.anchor === 'left' ? (it.x || 80) + 300 : it.x;
      const enter = it.enter || (it.type === 'caption' ? 'caption' : it.type === 'stamp' ? 'stamp' : 'drop');
      if (it.type === 'hand') add(it.in, 'scribble', x, -4, { dur: Math.min(1.1, it.text.length * 0.045) });
      else if (it.type === 'credit') { /* silent */ }
      else if (it.type === 'caption') add(it.in, 'swish', 540, -9);
      else if (enter === 'stamp') add(it.in + 0.11, 'stamp', x, 0);
      else if (enter === 'drop') add(it.in + land, it.font === 'headline' || it.font === 'shout' || it.font === 'headlineItalic' ? 'slap' : 'slapSmall', x, 0);
      else if (enter === 'slideL' || enter === 'slideR') { add(it.in, 'slide', enter === 'slideL' ? 200 : 880, -8); add(it.in + E.slideLand, 'slapSmall', x, -2); }
      else if (enter === 'flip') add(it.in - 0.05, 'flip', x, -2);
      if (it.tape) add(it.in + 0.18, 'tape', x, -4);
      if (it.exit === 'fly') add(it.out - 0.4, 'whooshSmall', x, -6);
      if (it.path) {
        for (let i = 0; i < it.path.length - 1; i++) {
          const a = it.path[i], b = it.path[i + 1];
          if (a.x !== b.x || a.y !== b.y) add(a.t, 'whooshSmall', b.x, -5, { dur: b.t - a.t });
          if (i === it.path.length - 2) add(b.t - 0.02, 'slap', b.x, -1);
        }
      }
    });
    // character
    const ch = TL.character;
    ch.forEach((k, i) => {
      if (i === 0) add(k.t, 'pop', k.x, -3);
      else {
        const p = ch[i - 1];
        if (k.vis === 0) return;
        if (p.vis === 0) add(k.t, 'pop', k.x, -3);
        else if (p.x !== k.x || p.y !== k.y) { add(k.t, 'hop', k.x, -5); add(k.t + (k.move || 0.5) - 0.03, 'land', k.x, -6); }
        else if (p.pose !== k.pose) add(k.t, 'rustleSmall', k.x, -10);
      }
    });
    // study card
    const st = TL.study;
    add(st.card.in + land, 'slap', st.card.x, -1);
    add(st.card.in + 0.2, 'tape', st.card.x, -5);
    st.card.ticks.forEach((tt) => add(tt, 'tick', st.card.x - 100, -6));
    add(st.burst.move, 'whoosh', st.card.x, -4, { dur: st.burst.at - st.burst.move });
    add(st.burst.at, 'burst', 540, -1);
    // crowd
    const cr = TL.crowd;
    add(cr.appear + 0.05, 'popCascade', 540, -5, { dur: 1.0 });
    add(cr.sort, 'shuffle', 540, -4, { dur: 1.0 });
    cr.tagsIn.forEach((tt, gi) => { add(tt + land, 'slapSmall', 200, -2); add(tt + 0.05, 'count', 200, -9, { dur: 0.6 }); });
    add(cr.highlight, 'cheer', 600, -6);
    // barriers
    const b = TL.barriers;
    b.rows.forEach((r) => { add(r.in, 'pop', 120, -6); add(r.in + land, 'slapSmall', 300, -2); add(r.in + 0.15, 'slide', 400, -4, { dur: 0.7 }); add(r.in + 0.35, 'count', 700, -9, { dur: 0.6 }); });
    add(b.carryAt, 'whooshSmall', 500, -5, { dur: 0.8 });
    // gem
    const gm = TL.gem;
    add(gm.bars[0].in - 0.35 + land, 'slap', 540, -2);
    gm.bars.forEach((bar, i) => { add(bar.in, 'rise', 300 + i * 300, -3, { dur: 0.8 }); add(bar.in + 0.55 + land, 'slapSmall', 300 + i * 300, -2); });
    add(gm.arrowAt, 'scribble', 450, -5, { dur: 0.5 });
    if (b.strike) add(b.strike.at, 'scribble', 720, -3, { dur: 0.3 });
    // end
    add(TL.end.confettiAt, 'confetti', 540, -3, { dur: 4 });
    // good-news icons
    const good = TL.scenes.find((s) => s.id === 'good');
    cues.sort((a, b) => a.t - b.t);
    return cues;
  };
})(typeof window !== 'undefined' ? window : globalThis);
