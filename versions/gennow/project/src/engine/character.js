/* character.js – the reusable cut-out paper doll (brass split-pin joints),
   pose library + blending, and the small crowd figures. */
(function (G) {
  'use strict';
  const E = G.E;

  const C = {
    skin: '#C4895D', skinShade: '#B27A50',
    // gen now version: yellow hoodie (brand yellow #FCDF48), brand-blue trousers, pink sneaker stripe
    hoodie: '#FCDF48', hoodieDark: '#E9C832', string: '#FFFFFF',
    pants: '#0C55A6', pantsDark: '#0A4789',
    shoe: '#FFFFFF', sole: '#D9D2C8', stripe: '#EC57AA',
    hair: '#2B1D17', blush: 'rgba(226,120,110,0.45)', ink: '#1F1714',
  };
  E.CHAR_COLORS = C;

  // ---- geometry (feet at 0,0; y up is negative) ---------------------------------
  const GEO = {
    hipX: 33, hipY: -238, thigh: 106, shin: 104,
    shX: 80, shY: -414, upper: 96, fore: 88,
    headY: -520, headR: 66,
  };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // limb segment sprites are drawn hanging down from a pivot at their top
  function seg(key, w, len, color, extra) {
    const spr = E.makeCutout('char-' + key, w + 4, len + w, (ctx) => {
      ctx.translate(0, -(len + w) / 2 + w / 2);
      ctx.fillStyle = color;
      rr(ctx, -w / 2, -w / 2, w, len + w, w * 0.48);
      ctx.fill();
      if (extra) extra(ctx, w, len);
    }, { tex: 0.6, blur: 5 });
    spr.pivotY = 10 + w / 2; // cutout margin + cap radius
    return spr;
  }

  function parts() {
    return E.cached('char-parts', () => ({
      thigh: seg('thigh', 52, GEO.thigh, C.pants),
      shin: seg('shin', 48, GEO.shin, C.pants, (ctx, w, len) => {
        ctx.fillStyle = C.pantsDark; ctx.fillRect(-w / 2, len - 30, w, 8); // cuff
      }),
      upper: seg('upper', 46, GEO.upper, C.hoodie),
      fore: seg('fore', 42, GEO.fore, C.hoodie, (ctx, w, len) => {
        ctx.fillStyle = C.hoodieDark; ctx.fillRect(-w / 2, len - 18, w, 10); // sleeve cuff
        ctx.fillStyle = C.skin;
        ctx.beginPath(); ctx.arc(0, len + 4, 23, 0, Math.PI * 2); ctx.fill(); // hand
      }),
      shoe: E.makeCutout('char-shoe', 86, 38, (ctx) => {
        ctx.fillStyle = C.sole; rr(ctx, -40, 4, 82, 14, 7); ctx.fill();
        ctx.fillStyle = C.shoe;
        ctx.beginPath(); ctx.moveTo(-34, 8); ctx.lineTo(-30, -16); ctx.quadraticCurveTo(-10, -20, 6, -12);
        ctx.quadraticCurveTo(34, -6, 40, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = C.stripe; ctx.fillRect(-10, -8, 22, 5);
      }, { tex: 0.5, blur: 4 }),
      torso: E.makeCutout('char-torso', 200, 210, (ctx) => {
        // hood behind neck
        ctx.fillStyle = C.hoodieDark;
        ctx.beginPath(); ctx.ellipse(0, -92, 62, 26, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.hoodie;
        ctx.beginPath();
        ctx.moveTo(-84, -80); ctx.quadraticCurveTo(-92, -98, -60, -100);
        ctx.lineTo(60, -100); ctx.quadraticCurveTo(92, -98, 84, -80);
        ctx.lineTo(80, 92); ctx.quadraticCurveTo(80, 104, 66, 104);
        ctx.lineTo(-66, 104); ctx.quadraticCurveTo(-80, 104, -80, 92); ctx.closePath(); ctx.fill();
        // waistband
        ctx.fillStyle = C.hoodieDark; ctx.fillRect(-80, 84, 160, 18);
        // kangaroo pocket
        ctx.fillStyle = C.hoodieDark;
        ctx.beginPath(); ctx.moveTo(-50, 78); ctx.lineTo(-38, 30); ctx.lineTo(38, 30); ctx.lineTo(50, 78); ctx.closePath(); ctx.fill();
        // neckline + strings
        ctx.fillStyle = C.skinShade;
        ctx.beginPath(); ctx.ellipse(0, -98, 26, 10, 0, 0, Math.PI); ctx.fill();
        ctx.strokeStyle = C.string; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-12, -86); ctx.lineTo(-15, -40); ctx.moveTo(12, -86); ctx.lineTo(16, -44); ctx.stroke();
        ctx.fillStyle = C.string;
        ctx.beginPath(); ctx.arc(-15, -38, 5, 0, 7); ctx.arc(16, -42, 5, 0, 7); ctx.fill();
      }, { tex: 0.6, blur: 7 }),
      head: E.makeCutout('char-head', 190, 190, (ctx) => {
        const R = GEO.headR;
        // ears
        ctx.fillStyle = C.skin;
        ctx.beginPath(); ctx.arc(-R + 2, 6, 15, 0, 7); ctx.arc(R - 2, 6, 15, 0, 7); ctx.fill();
        ctx.fillStyle = C.skinShade;
        ctx.beginPath(); ctx.arc(-R + 2, 6, 7, 0, 7); ctx.arc(R - 2, 6, 7, 0, 7); ctx.fill();
        // face
        ctx.fillStyle = C.skin;
        ctx.beginPath(); ctx.ellipse(0, 4, R, R * 0.98, 0, 0, Math.PI * 2); ctx.fill();
        // curly hair: cluster of circles
        ctx.fillStyle = C.hair;
        const r = E.rng('hair');
        const curls = [];
        for (let i = 0; i < 17; i++) {
          const a = Math.PI + (i / 16) * Math.PI;
          curls.push([Math.cos(a) * (R - 6), Math.sin(a) * (R - 10) - 6, 21 + r() * 7]);
        }
        curls.push([-20, -58, 26], [14, -62, 27], [40, -48, 22], [-44, -44, 22], [0, -40, 22], [-58, -18, 16], [58, -18, 16]);
        curls.forEach(([x, y, rad]) => { ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill(); });
        // fringe curl
        ctx.beginPath(); ctx.arc(-22, -30, 16, 0, 7); ctx.arc(8, -34, 15, 0, 7); ctx.fill();
      }, { tex: 0.55, blur: 7 }),
      brad: E.cached('char-brad', () => {
        const c = E.canvas(22, 22), ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(8, 8, 1, 11, 11, 10);
        g.addColorStop(0, '#FFF1B8'); g.addColorStop(0.35, '#E3B64E'); g.addColorStop(1, '#8E6519');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(11, 11, 8, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(90,60,10,0.6)'; ctx.lineWidth = 1; ctx.stroke();
        return { c, sh: E.makeShadow(c, 2), w: 22, h: 22 };
      }),
    }));
  }

  // ---- poses (angles in radians, "outward" positive; e = elbow/knee relative) ----
  E.POSES = {
    stand: { aL: 0.12, eL: 0.1, aR: 0.12, eR: 0.1, hL: 0.03, kL: 0, hR: 0.03, kR: 0, head: 0, lean: 0, lift: 0 },
    shrug: { aL: 0.78, eL: 1.2, aR: 0.78, eR: 1.2, hL: 0.05, kL: 0, hR: 0.05, kR: 0, head: 0.13, lean: 0, lift: -6 },
    think: { aL: 0.1, eL: 0.2, aR: 0.42, eR: -2.55, hL: 0.03, kL: 0, hR: 0.06, kR: 0, head: -0.1, lean: -0.02, lift: 0 },
    point: { aL: 0.14, eL: 0.25, aR: 2.2, eR: 0.12, hL: 0.04, kL: 0, hR: 0.1, kR: 0, head: 0.08, lean: 0.03, lift: 0 },
    pointSide: { aL: 0.14, eL: 0.25, aR: 1.5, eR: 0.08, hL: 0.04, kL: 0, hR: 0.08, kR: 0, head: 0.06, lean: 0.02, lift: 0 },
    wave: { aL: 0.12, eL: 0.15, aR: 2.45, eR: -0.35, hL: 0.03, kL: 0, hR: 0.06, kR: 0, head: 0.08, lean: 0.02, lift: 0 },
    cheer: { aL: 2.55, eL: 0.35, aR: 2.55, eR: 0.35, hL: 0.2, kL: 0.05, hR: 0.2, kR: 0.05, head: -0.05, lean: 0, lift: -4 },
    hold: { aL: 0.42, eL: -1.5, aR: 0.42, eR: -1.5, hL: 0.03, kL: 0, hR: 0.03, kR: 0, head: 0.06, lean: 0, lift: 0 },
    worried: { aL: 0.3, eL: -1.8, aR: 0.3, eR: -1.8, hL: 0.02, kL: 0, hR: 0.02, kR: 0, head: -0.08, lean: 0, lift: 2 },
  };
  const POSE_KEYS = Object.keys(E.POSES.stand);

  /**
   * Resolve the character state at time t from a track:
   * track = [{t, x, y, s, pose, mouth, brows, vis, flip}] (sorted).
   */
  E.charState = function (track, t) {
    if (!track || !track.length) return null;
    let i = 0;
    while (i < track.length - 1 && track[i + 1].t <= t) i++;
    const cur = track[i], prev = track[Math.max(0, i - 1)];
    const since = t - cur.t;
    const blend = E.easeInOut(E.clamp(since / (cur.blend || 0.35)));
    const pa = E.POSES[prev.pose || 'stand'], pb = E.POSES[cur.pose || 'stand'];
    const pose = {};
    POSE_KEYS.forEach((k) => (pose[k] = i === 0 ? pb[k] : E.lerp(pa[k], pb[k], blend)));
    // position blends with its own (longer) duration and a little hop arc
    const mv = cur.move || 0.5;
    const pm = E.easeInOut(E.clamp(since / mv));
    const px = i === 0 ? cur.x : E.lerp(prev.x, cur.x, pm);
    const py = i === 0 ? cur.y : E.lerp(prev.y, cur.y, pm);
    const ps = i === 0 ? cur.s : E.lerp(prev.s, cur.s, pm);
    const moved = i > 0 && (prev.x !== cur.x || prev.y !== cur.y);
    const hop = moved ? Math.sin(Math.PI * E.clamp(since / mv)) * (cur.hop != null ? cur.hop : 60) : 0;
    // visibility: pop in (spring) / pop out
    let vis = 1;
    const firstVis = track.find((k) => k.vis !== 0);
    if (firstVis && t < firstVis.t) vis = 0;
    else if (cur.vis === 0) vis = 1 - E.easeInBack(E.clamp(since / 0.3));
    else if (firstVis && t - firstVis.t < 1.2 && track.indexOf(firstVis) === i) vis = E.spring(t - firstVis.t, 16, 0.4);
    // re-entry after vis 0
    if (cur.vis !== 0 && i > 0 && prev.vis === 0) vis = E.spring(since, 16, 0.4);
    return {
      x: px, y: py - hop, s: ps, pose, vis,
      mouth: blend < 0.5 && i > 0 ? prev.mouth || 'neutral' : cur.mouth || 'neutral',
      brows: blend < 0.5 && i > 0 ? prev.brows || '' : cur.brows || '',
      wave: cur.pose === 'wave' ? blend : 0,
      poseName: cur.pose, since, t, flip: blend < 0.5 && i > 0 ? !!prev.flip : !!cur.flip,
      hopping: moved && since < mv,
    };
  };

  function drawSeg(ctx, spr, x, y, ang, sh) {
    // pivot = centre of the top cap (see seg()); shadow canvas has 3*blur padding
    const pv = spr.pivotY, pad = (spr.sh.width - spr.w) / 2;
    if (sh) {
      ctx.save(); ctx.globalAlpha *= 0.32; ctx.translate(x + 4, y + 8); ctx.rotate(ang);
      ctx.drawImage(spr.sh, -spr.sh.width / 2, -pv - pad); ctx.restore();
    }
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.drawImage(spr.c, -spr.w / 2, -pv);
    ctx.restore();
  }

  function limbEnd(x, y, ang, len) {
    return [x - Math.sin(ang) * len, y + Math.cos(ang) * len];
  }

  /** Draw the doll. st from charState(). t = global time (for idle motion). */
  E.drawCharacter = function (ctx, st, t) {
    if (!st || st.vis <= 0.001) return;
    const P = parts();
    const p = st.pose;
    // idle: breathing, sway, blink
    const breathe = Math.sin(t * 2.6) * 0.012;
    const sway = E.wob(t, 0.35, 5) * 0.035;
    const bob = Math.sin(t * 2.6) * 2;
    const waveOsc = st.wave ? Math.sin(t * 11) * 0.38 * st.wave : 0;
    const cheerOsc = st.poseName === 'cheer' ? Math.sin(t * 8) * 0.12 : 0;
    const bounce = st.poseName === 'cheer' ? Math.abs(Math.sin(t * 4.2)) * 26 : 0;

    ctx.save();
    ctx.translate(st.x, st.y - bounce);
    const sc = st.s * (0.2 + 0.8 * st.vis);
    ctx.scale(st.flip ? -sc : sc, sc);
    ctx.globalAlpha *= E.clamp(st.vis * 1.5);
    ctx.rotate(sway * 0.35 + p.lean);

    // ground shadow
    ctx.save();
    ctx.globalAlpha *= 0.22 * (1 - bounce / 80);
    ctx.fillStyle = '#2a1a0c';
    ctx.beginPath(); ctx.ellipse(6, 8 + bounce, 115 - bounce * 0.6, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const hipY = GEO.hipY + bob * 0.3;
    const shY = GEO.shY + bob + p.lift;
    const brads = [];
    // legs
    [[-1, p.hL, p.kL], [1, p.hR, p.kR]].forEach(([side, h, k]) => {
      const hx = side * GEO.hipX, hy = hipY;
      const aH = side < 0 ? h : -h;
      const aK = aH + (side < 0 ? k : -k);
      drawSeg(ctx, P.thigh, hx, hy, aH, true);
      const [kx, ky] = limbEnd(hx, hy, aH, GEO.thigh);
      drawSeg(ctx, P.shin, kx, ky, aK, true);
      const [fx, fy] = limbEnd(kx, ky, aK, GEO.shin);
      ctx.save(); ctx.translate(fx + side * 12, fy + 22); ctx.scale(side, 1);
      ctx.drawImage(P.shoe.c, -P.shoe.w / 2, -P.shoe.h / 2); ctx.restore();
      brads.push([hx, hy + 8], [kx, ky]);
    });
    // torso (breathing)
    ctx.save();
    ctx.translate(0, (hipY + shY) / 2 + 12);
    ctx.scale(1 + breathe * 0.5, 1 + breathe);
    E.drawSprite(ctx, P.torso, 0, 0, { shadowAlpha: 0.3 });
    ctx.restore();
    // head
    const headX = Math.sin(p.head) * 12, headY = GEO.headY + bob * 1.2 + p.lift * 0.6;
    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(p.head + sway * 0.4);
    E.drawSprite(ctx, P.head, 0, 0, { shadowAlpha: 0.28 });
    drawFace(ctx, st, t);
    ctx.restore();
    // arms (in front of torso)
    [[-1, p.aL, p.eL], [1, p.aR + waveOsc * 0.2 + cheerOsc, p.eR + waveOsc]].forEach(([side, a, e]) => {
      const sx = side * GEO.shX, sy = shY;
      const aa = side < 0 ? a + cheerOsc * (side < 0 ? 1 : 0) : -a;
      const ae = aa + (side < 0 ? e : -e);
      drawSeg(ctx, P.upper, sx, sy, aa, true);
      const [ex, ey] = limbEnd(sx, sy, aa, GEO.upper);
      drawSeg(ctx, P.fore, ex, ey, ae, true);
      brads.push([sx, sy], [ex, ey]);
    });
    brads.forEach(([x, y]) => ctx.drawImage(P.brad.c, x - 11, y - 11));
    ctx.restore();
  };

  function drawFace(ctx, st, t) {
    // blink every ~3.2 s, deterministic
    const bt = (t + 0.7) % 3.3;
    const blink = bt < 0.12 ? Math.abs(Math.sin((bt / 0.12) * Math.PI)) : 0;
    const look = E.wob(t, 0.3, 9) * 4;
    ctx.fillStyle = C.ink;
    [-24, 24].forEach((ex) => {
      ctx.beginPath();
      ctx.ellipse(ex + look, 2, 7, 9 * (1 - 0.9 * blink), 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = C.blush;
    ctx.beginPath(); ctx.arc(-40, 26, 11, 0, 7); ctx.arc(40, 26, 11, 0, 7); ctx.fill();
    // brows
    ctx.strokeStyle = C.ink; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    if (st.brows === 'worried') {
      ctx.beginPath(); ctx.moveTo(-34, -18); ctx.lineTo(-16, -24); ctx.moveTo(34, -18); ctx.lineTo(16, -24); ctx.stroke();
    } else if (st.brows === 'raised') {
      ctx.beginPath(); ctx.moveTo(-33, -22); ctx.quadraticCurveTo(-24, -30, -15, -22); ctx.moveTo(15, -22); ctx.quadraticCurveTo(24, -30, 33, -22); ctx.stroke();
    }
    // mouth
    ctx.lineWidth = 4.5;
    const m = st.mouth;
    ctx.beginPath();
    if (m === 'smile') { ctx.arc(look * 0.5, 22, 15, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else if (m === 'grin') {
      ctx.fillStyle = '#3A1512';
      ctx.moveTo(-18 + look * 0.5, 24); ctx.quadraticCurveTo(look * 0.5, 50, 18 + look * 0.5, 24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#F4EEE2'; ctx.fillRect(-12 + look * 0.5, 24, 24, 5);
    } else if (m === 'o') { ctx.fillStyle = '#3A1512'; ctx.ellipse(look * 0.5, 32, 8, 10, 0, 0, 7); ctx.fill(); }
    else if (m === 'frown') { ctx.arc(look * 0.5, 44, 14, Math.PI + 0.45, -0.45); ctx.stroke(); }
    else if (m === 'hmm') { ctx.moveTo(-12, 32); ctx.quadraticCurveTo(0, 26, 14, 30); ctx.stroke(); }
    else { ctx.moveTo(-11 + look * 0.5, 30); ctx.lineTo(11 + look * 0.5, 30); ctx.stroke(); }
  }

  // ---- crowd figures --------------------------------------------------------------
  // gen now palette (no yellow: the crowd stands on the yellow sheet)
  const SHIRTS = ['#0C55A6', '#1EB4FF', '#F782C3', '#58DE91', '#8C47ED', '#FFFFFF', '#141414', '#CDB7EC', '#EC57AA', '#0084CB'];
  const SKINS = ['#F1CDAA', '#DDA87E', '#C4895D', '#9A6240', '#6B4129'];
  const HAIRS = ['#2B1D17', '#4A3020', '#8A5A30', '#D8B070', '#1A1A1A', '#A4432A'];
  E.CROWD_W = 44; E.CROWD_H = 84;
  E.crowdSprite = function (i) {
    const v = i % 24;
    return E.makeCutout('crowd' + v, 44, 84, (ctx) => {
      const r = E.rng('crowdv' + v);
      const shirt = SHIRTS[Math.floor(r() * SHIRTS.length)];
      const skin = SKINS[Math.floor(r() * SKINS.length)];
      const hair = HAIRS[Math.floor(r() * HAIRS.length)];
      const pants = r() < 0.5 ? '#1D2B4A' : r() < 0.5 ? '#3A3A40' : '#0A4789';
      // legs
      ctx.fillStyle = pants;
      rr(ctx, -12, 14, 10, 26, 4); ctx.fill(); rr(ctx, 2, 14, 10, 26, 4); ctx.fill();
      // body
      ctx.fillStyle = shirt; rr(ctx, -17, -14, 34, 34, 11); ctx.fill();
      // head
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, -26, 13.5, 0, 7); ctx.fill();
      // hair variants
      ctx.fillStyle = hair;
      const hv = Math.floor(r() * 4);
      ctx.beginPath();
      if (hv === 0) { ctx.arc(0, -30, 13.5, Math.PI, 0); ctx.fill(); }
      else if (hv === 1) { ctx.arc(0, -30, 14, Math.PI * 1.05, -0.05); ctx.fill(); ctx.fillRect(-14, -30, 5, 20); ctx.fillRect(9, -30, 5, 20); }
      else if (hv === 2) { for (let k = 0; k < 7; k++) { ctx.moveTo(0, 0); ctx.arc(-11 + k * 3.7, -37 + Math.sin(k) * 2, 6, 0, 7); } ctx.fill(); }
      else { ctx.arc(0, -31, 13, Math.PI * 1.1, -0.1); ctx.fill(); ctx.beginPath(); ctx.arc(10, -40, 6, 0, 7); ctx.fill(); }
      // eyes
      ctx.fillStyle = '#1F1714';
      ctx.beginPath(); ctx.arc(-4.5, -25, 1.8, 0, 7); ctx.arc(4.5, -25, 1.8, 0, 7); ctx.fill();
    }, { tex: 0.5, blur: 3 });
  };
})(typeof window !== 'undefined' ? window : globalThis);
