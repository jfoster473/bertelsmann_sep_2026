/* items.js – generic animated collage items driven by TIMELINE.items:
   torn strips, captions, stamps, handwriting and credits. All motion is a pure
   function of time. */
(function (G) {
  'use strict';
  const E = G.E;

  /** Build (and cache) the sprite for an item. */
  E.itemSprite = function (it) {
    if (it.type === 'strip') {
      return E.makeStrip({ text: it.text, font: it.font, size: fitSize(it), color: it.color, seed: it.id, align: it.align, rim: it.rim });
    }
    if (it.type === 'caption') {
      return E.makeStrip({ text: it.text, font: 'caption', color: 'charcoal', seed: it.id, pad: [34, 18], rim: '#6E675E', amp: 1.6, endAmp: 3.5 });
    }
    if (it.type === 'stamp') return E.makeStamp(it.text, it.ink, it.size, it.id);
    return null;
  };

  // auto-fit: shrink the font until the strip fits maxW (left-anchored strips end by x≈850)
  function fitSize(it) {
    if (it._fit) return it._fit;
    const f = E.FONTS[it.font || 'headline'];
    let size = it.size || f.size;
    const maxW = it.maxW || (it.anchor === 'left' ? 850 - it.x : 820);
    const tmp = E.canvas(4, 4).getContext('2d');
    let text = f.upper ? it.text.toUpperCase() : it.text;
    for (let k = 0; k < 40; k++) {
      const w = Math.max(...E.measureLines(tmp, text.split('\n'), f, size)) + size * 0.84;
      if (w <= maxW) break;
      size -= 2;
    }
    it._fit = size;
    return size;
  }

  // time at which a "drop" entrance lands (first time the spring reaches 1)
  const DROP_W = 22, DROP_Z = 0.5;
  E.dropLand = (() => { for (let x = 0; x < 1; x += 0.002) if (E.spring(x, DROP_W, DROP_Z) >= 1) return x; return 0.1; })();

  /** Animated state of an item at time t (null = invisible). */
  E.itemState = function (it, t, W) {
    if (t < it.in || t >= it.out) return null;
    const spr = E.itemSprite(it);
    const seed = E.hashStr(it.id) % 1000;
    let x = it.x, y = it.y;
    if (it.anchor === 'left' && spr) x = it.x + (spr.boxW || spr.w) / 2;
    if (it.type === 'caption') { x = 540; y = E.CAPTION_Y + 44 - spr.boxH / 2; }
    let rot = E.deg(it.rot || 0), s = 1, sx = 1, alpha = 1, lift = 0;

    // path (carry-over between scenes)
    if (it.path && t >= it.path[0].t) {
      const k = it.path;
      x = E.keyInterp(k, t, 'x', E.easeInOut);
      y = E.keyInterp(k, t, 'y', E.easeInOut);
      rot = E.deg(E.keyInterp(k, t, 'rot', E.easeInOut));
      s = E.keyInterp(k, t, 's', E.easeInOut);
      for (let i = 0; i < k.length - 1; i++) {
        if (t >= k[i].t && t < k[i + 1].t && (k[i].x !== k[i + 1].x || k[i].y !== k[i + 1].y)) {
          lift = Math.sin(Math.PI * E.inv(k[i].t, k[i + 1].t, t)) * 1.1;
        }
      }
    }

    // idle life: wobble + drift, never fully still
    rot += E.deg(0.7) * E.wob(t, 0.45, seed);
    y += 2.5 * E.wob(t, 0.35, seed + 3);
    x += 1.5 * E.wob(t, 0.3, seed + 7);

    // entrance
    const d = t - it.in;
    const enter = it.enter || (it.type === 'caption' ? 'caption' : it.type === 'stamp' ? 'stamp' : 'drop');
    if (enter === 'drop') {
      const sp = E.spring(d, DROP_W, DROP_Z);
      s *= 1 + 0.42 * (1 - sp);
      alpha *= 0.3 + 0.7 * E.clamp(d / 0.12);
      rot += E.deg(9) * (1 - sp) * (seed % 2 ? 1 : -1);
      lift = Math.max(lift, E.clamp(1 - sp) * 1.3);
    } else if (enter === 'pop') {
      s *= E.spring(d, 18, 0.42);
    } else if (enter === 'slideL' || enter === 'slideR') {
      const sp = E.spring(d, 13, 0.62);
      x += (enter === 'slideL' ? -1 : 1) * (W * 0.95) * (1 - sp);
      rot += E.deg(6) * (1 - sp);
      lift = Math.max(lift, E.clamp(1 - sp) * 0.8);
    } else if (enter === 'slideUp') {
      const sp = E.spring(d, 13, 0.62);
      y += 400 * (1 - sp);
    } else if (enter === 'flip') {
      sx *= E.easeOutBack(E.clamp(d / 0.32), 2.2);
      lift = Math.max(lift, (1 - E.clamp(d / 0.32)) * 0.8);
    } else if (enter === 'caption') {
      const p = E.easeOutBack(E.clamp(d / 0.35), 1.4);
      y += 60 * (1 - p);
      alpha *= E.clamp(d / 0.18);
      rot += E.deg(3) * (1 - p);
    } else if (enter === 'stamp') {
      const p = E.clamp(d / 0.12);
      s *= p < 1 ? E.lerp(1.9, 0.94, E.easeInCubic(p)) : 1 - 0.06 * Math.exp(-(d - 0.12) * 18) * Math.cos((d - 0.12) * 40);
      alpha *= E.clamp(d / 0.08) * 0.92;
    }

    // exit
    const exit = it.exit || (it.type === 'caption' ? 'fade' : 'cover');
    const eDur = exit === 'fly' ? 0.4 : exit === 'fade' ? 0.22 : exit === 'shrink' ? 0.3 : exit === 'flip' ? 0.2 : 0;
    const e = eDur ? E.clamp((t - (it.out - eDur)) / eDur) : 0;
    if (e > 0) {
      if (exit === 'fly') { y -= 900 * E.easeInCubic(e); rot += E.deg(-18) * e; lift = Math.max(lift, e); }
      else if (exit === 'fade') { alpha *= 1 - e; y += 24 * e; }
      else if (exit === 'shrink') { s *= 1 - E.easeInBack(e); }
      else if (exit === 'flip') { sx *= 1 - E.easeInCubic(e); }
    }
    return { x, y, rot, s, sx, alpha, lift, spr };
  };

  E.drawTapeOn = function (ctx, st, it) {
    const spr = st.spr, bw = spr.boxW || spr.w;
    const tape = E.makeTape(it.id === 'e_url' ? 130 : 96, 40, it.id);
    const pts = it.id === 'e_url' ? [[-bw / 2 - 6, -spr.boxH / 2 + 2, -0.75], [bw / 2 + 6, -spr.boxH / 2 + 2, 0.75]] : [[-bw / 2 - 24, 0, -1.25]];
    pts.forEach(([dx, dy, r]) => {
      ctx.save();
      ctx.translate(st.x, st.y); ctx.rotate(st.rot); ctx.scale(st.s * st.sx, st.s);
      E.drawSprite(ctx, tape, dx, dy, { rot: r, alpha: st.alpha * E.clamp((st.t - it.in - 0.15) / 0.1), shadowAlpha: 0.2 });
      ctx.restore();
    });
  };

  /** Draw one item (strip / caption / stamp / hand / credit). */
  E.drawItem = function (ctx, it, t, W) {
    if (it.type === 'hand') return drawHand(ctx, it, t);
    if (it.type === 'credit') return drawCredit(ctx, it, t);
    const st = E.itemState(it, t, W);
    if (!st) return;
    st.t = t;
    E.drawSprite(ctx, st.spr, st.x, st.y, { rot: st.rot, s: st.s, sx: st.sx, alpha: st.alpha, lift: st.lift, shadow: it.type !== 'stamp' });
    if (it.tape) E.drawTapeOn(ctx, st, it);
  };

  // ---- handwriting: letters appear left to right; optional arrow -------------
  function drawHand(ctx, it, t) {
    if (t < it.in || t >= it.out) return;
    const d = t - it.in;
    const f = E.FONTS.hand, size = it.size || f.size;
    ctx.save();
    ctx.font = E.fontStr(f, size);
    const w = ctx.measureText(it.text).width;
    const writeDur = Math.min(1.1, it.text.length * 0.045);
    const p = E.clamp(d / writeDur);
    const seed = E.hashStr(it.id) % 1000;
    ctx.translate(it.x + E.wob(t, 0.4, seed) * 1.5, it.y + E.wob(t, 0.35, seed + 1) * 2);
    ctx.rotate(E.deg(it.rot || 0) + E.deg(0.6) * E.wob(t, 0.4, seed + 2));
    ctx.beginPath();
    ctx.rect(-w / 2 - 10, -size, (w + 20) * p, size * 2);
    ctx.clip();
    ctx.fillStyle = it.color || '#2A1C18';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(it.text, 0, 0);
    ctx.restore();
    if (it.arrow) {
      const a = it.arrow;
      const q = E.clamp((d - writeDur * 0.8) / 0.45);
      if (q > 0) E.drawHandArrow(ctx, a.x0, a.y0, a.x1, a.y1, q, it.color, 6, a.bend != null ? a.bend : 0.35);
    }
  }

  /** Hand-drawn curved arrow revealed by p (0..1). */
  E.drawHandArrow = function (ctx, x0, y0, x1, y1, p, color, lw = 6, bend = 0.35) {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const nx = -(y1 - y0), ny = x1 - x0;
    const cx = mx + nx * bend, cy = my + ny * bend;
    const N = 40, pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      pts.push([(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1]);
    }
    const n = Math.max(1, Math.floor(N * p));
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    if (p >= 1) {
      const [ax, ay] = pts[N], [bx, by] = pts[N - 4];
      const ang = Math.atan2(ay - by, ax - bx);
      ctx.beginPath();
      ctx.moveTo(ax - Math.cos(ang - 0.5) * 26, ay - Math.sin(ang - 0.5) * 26); ctx.lineTo(ax, ay);
      ctx.lineTo(ax - Math.cos(ang + 0.5) * 26, ay - Math.sin(ang + 0.5) * 26);
      ctx.stroke();
    }
    ctx.restore();
  };

  function drawCredit(ctx, it, t) {
    if (t < it.in || t >= it.out) return;
    const a = E.clamp((t - it.in) / 0.4);
    ctx.save();
    ctx.globalAlpha = a * 0.92;
    ctx.fillStyle = it.color || '#EDE4D3';
    ctx.font = E.fontStr(E.FONTS.small, it.size || 27);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    it.text.split('\n').forEach((l, i, arr) => ctx.fillText(l, it.x, it.y + (i - (arr.length - 1) / 2) * 36 + (1 - a) * 12));
    ctx.restore();
  }

  /** Caption position: centred, lower third, clear of the bottom UI zone. */
  E.CAPTION_Y = 1432;
})(typeof window !== 'undefined' ? window : globalThis);
