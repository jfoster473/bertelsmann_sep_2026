/* paper.js – procedural paper textures and sprites (torn strips, tape, stamps,
   cardboard, backgrounds, sheet wipes). All randomness is seeded, and every sprite
   is baked once into an offscreen canvas and cached. */
(function (G) {
  'use strict';
  const E = G.E;

  E.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  };
  E.clone = function (src) {
    const c = E.canvas(src.width, src.height);
    c.getContext('2d').drawImage(src, 0, 0);
    return c;
  };

  // ---- 2D value noise -------------------------------------------------------
  function n2(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = E.h01(xi, yi, seed), b = E.h01(xi + 1, yi, seed);
    const c = E.h01(xi, yi + 1, seed), d = E.h01(xi + 1, yi + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  E.noise2 = n2;

  // ---- grain texture (tileable-ish, 512²), neutral grey for soft-light -------
  let GRAIN = null;
  E.grain = function () {
    if (GRAIN) return GRAIN;
    const S = 512, c = E.canvas(S, S), ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S), d = img.data;
    const r = E.rng('grain');
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        // periodic sampling so the tile repeats without seams
        const fx = x / S, fy = y / S;
        const low =
          (n2(fx * 8, fy * 8, 3) + n2((fx + 1) * 8 - 8, fy * 8, 3)) * 0.5; // mottling
        const mid = n2(x / 6, y / 6, 7);
        const fine = r();
        const v = 128 + (low - 0.5) * 26 + (mid - 0.5) * 20 + (fine - 0.5) * 34;
        const i = (y * S + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = E.clamp(v, 0, 255);
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // paper fibres
    for (let i = 0; i < 380; i++) {
      const x = r() * S, y = r() * S, len = 6 + r() * 22, a = r() * Math.PI * 2;
      ctx.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.14)';
      ctx.lineWidth = 0.6 + r() * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(a + 0.6) * len * 0.5, y + Math.sin(a + 0.6) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
    GRAIN = c;
    return c;
  };

  /** Apply paper grain inside the existing alpha of canvas c. */
  E.texturize = function (c, strength = 0.55, seed = 0) {
    const ctx = c.getContext('2d');
    const mask = E.clone(c);
    const g = E.grain();
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = strength;
    const ox = -((seed * 97) % 512), oy = -((seed * 61) % 512);
    for (let y = oy; y < c.height; y += 512) for (let x = ox; x < c.width; x += 512) ctx.drawImage(g, x, y);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.globalAlpha = 1;
    ctx.drawImage(mask, 0, 0);
    ctx.restore();
    return c;
  };

  /** Blurred dark silhouette for drop shadows. */
  E.makeShadow = function (c, blur = 9) {
    const P = blur * 3;
    const tmp = E.clone(c), t = tmp.getContext('2d');
    t.globalCompositeOperation = 'source-in';
    t.fillStyle = 'rgb(38,26,14)';
    t.fillRect(0, 0, tmp.width, tmp.height);
    const sh = E.canvas(c.width + 2 * P, c.height + 2 * P), s = sh.getContext('2d');
    s.filter = `blur(${blur}px)`;
    s.drawImage(tmp, P, P);
    s.filter = 'none';
    return sh;
  };

  /** Add a pale "paper core" rim around the silhouette (torn-edge look). */
  E.addRim = function (c, px = 2.5, color = '#F3EDE0', seed = 1) {
    const sil = E.clone(c), s = sil.getContext('2d');
    s.globalCompositeOperation = 'source-in';
    s.fillStyle = color;
    s.fillRect(0, 0, sil.width, sil.height);
    const out = E.canvas(c.width, c.height), o = out.getContext('2d');
    const r = E.rng('rim' + seed);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + r() * 0.3;
      const d = px * (0.6 + r() * 0.6);
      o.drawImage(sil, Math.cos(a) * d, Math.sin(a) * d);
    }
    o.drawImage(c, 0, 0);
    return out;
  };

  // ---- torn rectangle geometry -------------------------------------------------
  /** Returns {outer, inner} polygons (arrays of [x,y]) around a w×h box centred at 0,0. */
  E.tornRect = function (w, h, seed, o = {}) {
    const amp = o.amp != null ? o.amp : 2.4;       // long edges
    const endAmp = o.endAmp != null ? o.endAmp : 5.5; // short (torn) ends
    const step = o.step || 3;
    const rimMin = o.rimMin != null ? o.rimMin : 1.2, rimMax = o.rimMax != null ? o.rimMax : 5.5;
    const outer = [], inner = [];
    const sd = E.hashStr('torn' + seed) % 100000;
    const edges = [
      { x0: -w / 2, y0: -h / 2, x1: w / 2, y1: -h / 2, nx: 0, ny: -1, a: amp },
      { x0: w / 2, y0: -h / 2, x1: w / 2, y1: h / 2, nx: 1, ny: 0, a: endAmp },
      { x0: w / 2, y0: h / 2, x1: -w / 2, y1: h / 2, nx: 0, ny: 1, a: amp },
      { x0: -w / 2, y0: h / 2, x1: -w / 2, y1: -h / 2, nx: -1, ny: 0, a: endAmp },
    ];
    let sAcc = 0;
    edges.forEach((e, ei) => {
      const len = Math.hypot(e.x1 - e.x0, e.y1 - e.y0);
      const n = Math.max(2, Math.round(len / step));
      for (let i = 0; i < n; i++) {
        const f = i / n, s = sAcc + f * len;
        const bx = E.lerp(e.x0, e.x1, f), by = E.lerp(e.y0, e.y1, f);
        const big = E.fbm1(s / 55, sd + ei, 3) * e.a;
        const jag = (E.h01(i, ei, sd) - 0.5) * e.a * 0.55;
        const off = big + jag;
        const rim = rimMin + (rimMax - rimMin) * E.clamp(E.noise1(s / 23, sd + 9) * 1.6 - 0.45);
        outer.push([bx + e.nx * off, by + e.ny * off]);
        inner.push([bx + e.nx * (off - rim), by + e.ny * (off - rim)]);
      }
      sAcc += len;
    });
    return { outer, inner };
  };
  E.polyPath = function (ctx, pts, ox = 0, oy = 0) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0] + ox, pts[0][1] + oy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + ox, pts[i][1] + oy);
    ctx.closePath();
  };

  // ---- fonts / styles -------------------------------------------------------------
  E.FONTS = {
    headline: { family: '"Playfair Display"', weight: 900, style: 'normal', size: 84, lh: 1.08 },
    headlineItalic: { family: '"Playfair Display"', weight: 900, style: 'italic', size: 74, lh: 1.1 },
    serifSmall: { family: '"Playfair Display"', weight: 700, style: 'normal', size: 48, lh: 1.15 },
    shout: { family: 'Anton', weight: 400, style: 'normal', size: 72, lh: 1.08, upper: true, ls: 1 },
    number: { family: 'Anton', weight: 400, style: 'normal', size: 150, lh: 1.0, ls: 1 },
    body: { family: 'Inter', weight: 700, style: 'normal', size: 40, lh: 1.22 },
    small: { family: 'Inter', weight: 700, style: 'normal', size: 32, lh: 1.25 },
    kicker: { family: 'Inter', weight: 800, style: 'normal', size: 30, lh: 1.2, upper: true, ls: 2.5 },
    typed: { family: '"Courier Prime"', weight: 700, style: 'normal', size: 36, lh: 1.22 },
    hand: { family: 'Caveat', weight: 700, style: 'normal', size: 58, lh: 1.05 },
    caption: { family: 'Inter', weight: 700, style: 'normal', size: 42, lh: 1.25 },
  };
  E.fontStr = function (f, size) {
    return `${f.style} ${f.weight} ${size || f.size}px ${f.family}`;
  };

  E.COLORS = {
    cream: { bg: '#EEE7D8', fg: '#1E1B18' },
    white: { bg: '#F7F3EA', fg: '#1E1B18' },
    red: { bg: '#C8483C', fg: '#FBF3E6' },
    blue: { bg: '#A4C6E4', fg: '#1B2230' },
    mustard: { bg: '#DDB654', fg: '#1E1B18' },
    pink: { bg: '#EDBDB4', fg: '#2A1A18' },
    lemon: { bg: '#F2DC7A', fg: '#2A2410' },
    mint: { bg: '#CDE3C8', fg: '#16261A' },
    charcoal: { bg: '#2E2B28', fg: '#F4EEE2' },
    teal: { bg: '#2F6F69', fg: '#F4EEE2' },
    lined: { bg: '#F8F5EE', fg: '#1D2D6B' },
  };

  // ---- sprite cache -------------------------------------------------------------
  const CACHE = new Map();
  E.cached = function (key, build) {
    let v = CACHE.get(key);
    if (!v) { v = build(); CACHE.set(key, v); }
    return v;
  };
  E.clearCache = () => CACHE.clear();

  function finishSprite(c, shadowBlur = 9) {
    return { c, sh: E.makeShadow(c, shadowBlur), w: c.width, h: c.height };
  }

  /** Measure multi-line text. */
  E.measureLines = function (ctx, lines, f, size) {
    ctx.font = E.fontStr(f, size);
    if ('letterSpacing' in ctx) ctx.letterSpacing = (f.ls || 0) + 'px';
    return lines.map((l) => ctx.measureText(l).width);
  };

  /**
   * Torn paper strip with text.
   * o: {text, font, size, color, pad:[x,y], seed, align, minW, textDx, ink}
   */
  E.makeStrip = function (o) {
    const key = 'strip|' + JSON.stringify(o);
    return E.cached(key, () => {
      const f = E.FONTS[o.font || 'headline'];
      const size = o.size || f.size;
      const col = E.COLORS[o.color || 'cream'];
      let text = String(o.text);
      if (f.upper) text = text.toUpperCase();
      const lines = text.split('\n');
      const tmp = E.canvas(4, 4).getContext('2d');
      const widths = E.measureLines(tmp, lines, f, size);
      const capH = (() => { tmp.font = E.fontStr(f, size); const m = tmp.measureText('HÄg'); return { a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent }; })();
      const lineH = size * f.lh;
      const padX = o.pad ? o.pad[0] : Math.round(size * 0.42);
      const padY = o.pad ? o.pad[1] : Math.round(size * 0.26);
      const tw = Math.max(...widths);
      const w = Math.max(o.minW || 0, tw + padX * 2);
      const h = lines.length * lineH + padY * 2;
      const M = 14;
      const c = E.canvas(w + M * 2, h + M * 2), ctx = c.getContext('2d');
      const geo = E.tornRect(w, h, o.seed || o.text, { amp: o.amp != null ? o.amp : 2.2, endAmp: o.endAmp != null ? o.endAmp : 5 });
      ctx.translate(c.width / 2, c.height / 2);
      ctx.fillStyle = o.rim || '#F4EFE4';
      E.polyPath(ctx, geo.outer); ctx.fill();
      ctx.fillStyle = col.bg;
      E.polyPath(ctx, geo.inner); ctx.fill();
      if (o.color === 'lined') {
        ctx.save(); E.polyPath(ctx, geo.inner); ctx.clip();
        ctx.strokeStyle = 'rgba(80,120,190,0.45)'; ctx.lineWidth = 2;
        for (let y = -h / 2 + 10; y < h / 2; y += Math.max(26, lineH / 1.6)) { ctx.beginPath(); ctx.moveTo(-w / 2, y); ctx.lineTo(w / 2, y); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(210,70,70,0.55)'; ctx.beginPath(); ctx.moveTo(-w / 2 + 22, -h / 2); ctx.lineTo(-w / 2 + 22, h / 2); ctx.stroke();
        ctx.restore();
      }
      // subtle uneven colour
      const r = E.rng('tone' + (o.seed || o.text));
      for (let i = 0; i < 5; i++) {
        const gx = (r() - 0.5) * w, gy = (r() - 0.5) * h, gr = Math.max(w, h) * (0.3 + r() * 0.5);
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        const light = r() < 0.5;
        g.addColorStop(0, light ? 'rgba(255,255,255,0.07)' : 'rgba(60,40,20,0.06)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        E.polyPath(ctx, geo.inner); ctx.fill();
      }
      // text
      ctx.font = E.fontStr(f, size);
      if ('letterSpacing' in ctx) ctx.letterSpacing = (f.ls || 0) + 'px';
      ctx.fillStyle = o.ink || col.fg;
      ctx.textBaseline = 'alphabetic';
      const align = o.align || 'center';
      ctx.textAlign = align;
      const blockH = lines.length * lineH;
      lines.forEach((l, i) => {
        const cy = -blockH / 2 + i * lineH + lineH / 2;
        const base = cy + (capH.a - capH.d * 0.35) / 2 - (f === E.FONTS.shout || f === E.FONTS.number ? 0 : size * 0.02);
        const x = align === 'left' ? -w / 2 + padX : align === 'right' ? w / 2 - padX : 0;
        ctx.fillText(l, x + (o.textDx || 0), base);
      });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      E.texturize(c, 0.6, E.hashStr(o.seed || o.text) % 997);
      const spr = finishSprite(c, 8);
      spr.boxW = w; spr.boxH = h;
      return spr;
    });
  };

  /** Plain torn paper card (no text) – used for notes, chart backs, bars. */
  E.makeCard = function (o) {
    const key = 'card|' + JSON.stringify(o);
    return E.cached(key, () => {
      const w = o.w, h = o.h, M = 16;
      const c = E.canvas(w + 2 * M, h + 2 * M), ctx = c.getContext('2d');
      const geo = E.tornRect(w, h, o.seed || 'card', { amp: o.amp != null ? o.amp : 2, endAmp: o.endAmp != null ? o.endAmp : 4 });
      ctx.translate(c.width / 2, c.height / 2);
      if (o.rim !== false) { ctx.fillStyle = o.rim || '#F4EFE4'; E.polyPath(ctx, geo.outer); ctx.fill(); }
      ctx.fillStyle = o.color;
      E.polyPath(ctx, o.rim !== false ? geo.inner : geo.outer); ctx.fill();
      if (o.lined) {
        ctx.save(); E.polyPath(ctx, geo.inner); ctx.clip();
        ctx.strokeStyle = 'rgba(80,120,190,0.35)'; ctx.lineWidth = 2;
        for (let y = -h / 2 + 70; y < h / 2; y += 44) { ctx.beginPath(); ctx.moveTo(-w / 2, y); ctx.lineTo(w / 2, y); ctx.stroke(); }
        ctx.restore();
      }
      if (o.draw) o.draw(ctx, w, h);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      E.texturize(c, o.tex != null ? o.tex : 0.6, E.hashStr(o.seed || 'c') % 997);
      const s = finishSprite(c, o.blur || 9);
      s.boxW = w; s.boxH = h;
      return s;
    });
  };

  /** Masking tape piece with zig-zag ends. */
  E.makeTape = function (w = 150, h = 44, seed = 't') {
    return E.cached('tape|' + w + '|' + h + '|' + seed, () => {
      const c = E.canvas(w + 8, h + 8), ctx = c.getContext('2d');
      ctx.translate(4, 4);
      const r = E.rng('tape' + seed);
      ctx.beginPath();
      const teeth = Math.round(h / 7);
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);
      for (let i = 0; i < teeth; i++) {
        ctx.lineTo(w - 3 - r() * 5, ((i + 0.5) / teeth) * h);
        ctx.lineTo(w, ((i + 1) / teeth) * h);
      }
      ctx.lineTo(0, h);
      for (let i = teeth; i > 0; i--) {
        ctx.lineTo(3 + r() * 5, ((i - 0.5) / teeth) * h);
        ctx.lineTo(0, ((i - 1) / teeth) * h);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(232,219,178,0.82)';
      ctx.fill();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3;
      for (let x = -h; x < w + h; x += 11) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, 2, w, 4);
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      E.texturize(c, 0.5, 11);
      return finishSprite(c, 4);
    });
  };

  /** Rubber stamp: outlined box + text with broken ink. */
  E.makeStamp = function (text, color = '#2E7D4F', size = 64, seed = 's') {
    return E.cached('stamp|' + text + color + size + seed, () => {
      const tmp = E.canvas(4, 4).getContext('2d');
      tmp.font = `400 ${size}px Anton`;
      if ('letterSpacing' in tmp) tmp.letterSpacing = '2px';
      const tw = tmp.measureText(text).width;
      const w = tw + size * 0.9, h = size * 1.45, M = 10;
      const c = E.canvas(w + 2 * M, h + 2 * M), ctx = c.getContext('2d');
      ctx.translate(c.width / 2, c.height / 2);
      ctx.strokeStyle = color; ctx.fillStyle = color;
      const rr = size * 0.18;
      const box = (inset, lw) => {
        ctx.lineWidth = lw;
        const x = -w / 2 + inset, y = -h / 2 + inset, ww = w - 2 * inset, hh = h - 2 * inset;
        ctx.beginPath();
        ctx.moveTo(x + rr, y); ctx.arcTo(x + ww, y, x + ww, y + hh, rr); ctx.arcTo(x + ww, y + hh, x, y + hh, rr);
        ctx.arcTo(x, y + hh, x, y, rr); ctx.arcTo(x, y, x + ww, y, rr); ctx.closePath(); ctx.stroke();
      };
      box(3, size * 0.09);
      box(size * 0.17, size * 0.035);
      ctx.font = `400 ${size}px Anton`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, size * 0.04);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // broken ink
      const r = E.rng('stampink' + seed + text);
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < (w * h) / 55; i++) {
        const x = r() * c.width, y = r() * c.height;
        ctx.globalAlpha = 0.25 + r() * 0.7;
        ctx.beginPath(); ctx.arc(x, y, 0.6 + r() * r() * 3.2, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 6; i++) {
        const x = r() * c.width, y = r() * c.height, rad = 10 + r() * 30;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      return { c, sh: null, w: c.width, h: c.height };
    });
  };

  /** Kraft cardboard panel. */
  E.makeCardboard = function (w, h, seed = 'cb') {
    return E.cached('cardboard|' + w + '|' + h + '|' + seed, () => {
      const M = 6, c = E.canvas(w + 2 * M, h + 2 * M), ctx = c.getContext('2d');
      ctx.translate(M, M);
      const r = E.rng('cb' + seed);
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#C1945F'); g.addColorStop(1, '#AE8250');
      ctx.fillStyle = g;
      ctx.beginPath();
      // slightly irregular cut edges
      const pts = [[0, r() * 3], [w, r() * 3], [w - r() * 3, h], [r() * 3, h]];
      E.polyPath(ctx, pts); ctx.fill();
      ctx.save(); E.polyPath(ctx, pts); ctx.clip();
      // corrugation shading
      for (let x = 0; x < w; x += 9) {
        ctx.fillStyle = 'rgba(90,60,30,0.07)'; ctx.fillRect(x, 0, 4, h);
      }
      for (let i = 0; i < 260; i++) {
        ctx.strokeStyle = r() < 0.5 ? 'rgba(80,50,20,0.25)' : 'rgba(240,210,160,0.25)';
        ctx.lineWidth = 0.8;
        const x = r() * w, y = r() * h, l = 4 + r() * 14, a = r() * 6.28;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
      }
      // cut edge highlight
      ctx.strokeStyle = 'rgba(240,215,170,0.6)'; ctx.lineWidth = 3;
      E.polyPath(ctx, pts); ctx.stroke();
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      E.texturize(c, 0.7, 5);
      return finishSprite(c, 10);
    });
  };

  /** Generic cut-out: drawFn(ctx) draws flat shapes centred in a w×h box. */
  E.makeCutout = function (key, w, h, drawFn, o = {}) {
    return E.cached('cut|' + key, () => {
      const M = 10;
      let c = E.canvas(w + 2 * M, h + 2 * M);
      const ctx = c.getContext('2d');
      ctx.translate(M + w / 2, M + h / 2);
      drawFn(ctx, w, h);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (o.rim) c = E.addRim(c, o.rim, o.rimColor || '#F3EDE0', key.length);
      E.texturize(c, o.tex != null ? o.tex : 0.55, E.hashStr(key) % 997);
      return finishSprite(c, o.blur || 6);
    });
  };

  /**
   * Draw a sprite centred at x,y with rotation (rad), scale, alpha and "lift"
   * (0 = lying on the paper, 1 = held above it: larger, softer, offset shadow).
   */
  E.drawSprite = function (ctx, spr, x, y, o = {}) {
    const rot = o.rot || 0, sx = (o.s != null ? o.s : 1) * (o.sx != null ? o.sx : 1), sy = (o.s != null ? o.s : 1) * (o.sy != null ? o.sy : 1);
    const alpha = o.alpha != null ? o.alpha : 1;
    const lift = o.lift || 0;
    if (alpha <= 0.002 || Math.abs(sx) < 0.002 || Math.abs(sy) < 0.002) return;
    if (spr.sh && o.shadow !== false) {
      const dx = 4 + lift * 26, dy = 7 + lift * 34;
      ctx.save();
      ctx.globalAlpha = alpha * (o.shadowAlpha != null ? o.shadowAlpha : 0.4) * (1 - 0.35 * E.clamp(lift));
      ctx.translate(x + dx, y + dy);
      ctx.rotate(rot);
      ctx.scale(sx * (1 + 0.03 * lift), sy * (1 + 0.03 * lift));
      ctx.drawImage(spr.sh, -spr.sh.width / 2, -spr.sh.height / 2);
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sx, sy);
    ctx.drawImage(spr.c, -spr.w / 2, -spr.h / 2);
    ctx.restore();
  };

  // ---- backgrounds -------------------------------------------------------------------
  E.BG = {
    beige: '#D9CDB5',
    blue: '#8FADC6',
    mustard: '#D4B872',
    salmon: '#D9A391',
    sage: '#9DB184',
    charcoal: '#2A2724',
    cream: '#E3D8C2',
  };
  E.bgOverscan = 60;
  E.makeBackground = function (name, W, H) {
    return E.cached('bg|' + name + W + 'x' + H, () => {
      const O = E.bgOverscan, w = W + 2 * O, h = H + 2 * O;
      const c = E.canvas(w, h), ctx = c.getContext('2d');
      const base = E.BG[name] || name;
      const dark = name === 'charcoal';
      ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
      const r = E.rng('bg' + name);
      for (let i = 0; i < 38; i++) {
        const x = r() * w, y = r() * h, rad = 120 + r() * 520;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        const light = r() < 0.5;
        g.addColorStop(0, light ? `rgba(255,250,235,${dark ? 0.03 : 0.07})` : `rgba(60,40,20,${dark ? 0.1 : 0.06})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
      const gr = E.grain();
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = dark ? 0.5 : 0.75;
      for (let y = 0; y < h; y += 512) for (let x = 0; x < w; x += 512) ctx.drawImage(gr, x, y);
      ctx.restore();
      // vignette
      const vg = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.18, w / 2, h / 2, h * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, dark ? 'rgba(0,0,0,0.55)' : 'rgba(40,25,10,0.30)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
      return c;
    });
  };

  /**
   * Sheet wipe: draws background `bg` (canvas with overscan) covering the part
   * of the frame "behind" a torn leading edge. dir = side the sheet comes from.
   * p = 0 (off-screen) .. 1 (fully covering).
   */
  E.drawSheet = function (ctx, bg, p, dir, seed, W, H, cam) {
    if (p <= 0) return;
    const O = E.bgOverscan;
    const vertical = dir === 'top' || dir === 'bottom';
    const span = vertical ? H : W;
    const edgeAmp = 26, jag = 4;
    const extra = edgeAmp * 2 + 30;
    const pos = (span + extra) * p - extra / 2; // how far the edge travelled in
    const sd = E.hashStr('sheet' + seed) % 10000;
    const pts = [];
    const len = vertical ? W : H;
    const N = Math.ceil(len / 5) + 1;
    const edgeAt = (i) => {
      const s = (i / (N - 1)) * len;
      return E.fbm1(s / 140, sd, 3) * edgeAmp + (E.h01(i, sd) - 0.5) * jag * 2;
    };
    // polygon in "sheet" coordinates: edge line then far side
    const P = (a, b) => {
      // a = along-edge coordinate, b = depth coordinate from the entering side
      if (dir === 'right') return [W - b, a];
      if (dir === 'left') return [b, a];
      if (dir === 'top') return [a, b];
      return [a, H - b]; // bottom
    };
    for (let i = 0; i < N; i++) pts.push(P((i / (N - 1)) * (len + 40) - 20, pos + edgeAt(i)));
    pts.push(P(len + 40, -80), P(-40, -80));
    const rimPts = [];
    for (let i = 0; i < N; i++) rimPts.push(P((i / (N - 1)) * (len + 40) - 20, pos + edgeAt(i) + 3 + E.noise1(i * 0.21, sd + 3) * 5));
    rimPts.push(P(len + 40, -80), P(-40, -80));
    ctx.save();
    // shadow + pale fibrous rim
    ctx.shadowColor = 'rgba(30,20,10,0.38)';
    ctx.shadowBlur = 34;
    const so = 12;
    ctx.shadowOffsetX = dir === 'right' ? -so : dir === 'left' ? so : 0;
    ctx.shadowOffsetY = dir === 'top' ? so : dir === 'bottom' ? -so : 0;
    ctx.fillStyle = bg === null ? '#000' : '#EFE8DA';
    E.polyPath(ctx, rimPts); ctx.fill();
    ctx.restore();
    ctx.save();
    E.polyPath(ctx, pts); ctx.clip();
    const cx = cam ? cam.x * 0.35 : 0, cy = cam ? cam.y * 0.35 : 0;
    ctx.drawImage(bg, -O + cx, -O + cy);
    ctx.restore();
  };
})(typeof window !== 'undefined' ? window : globalThis);
