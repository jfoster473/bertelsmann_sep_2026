/* brand.js – gen now branding (this version only): the gen now logo drawn from
   its SVG paths, the Bertelsmann Stiftung wordmark, the opening sheet, the small
   corner logo and the logo card on the last slide.
   Logo sources and colours: see brand_assets.js and docs/brand.md. */
(function (G) {
  'use strict';
  const E = G.E, A = G.BRAND_ASSETS;

  E.BRAND = {
    beige: '#F3E8DC', blue: '#0C55A6', sky: '#1EB4FF', skyDark: '#0084CB',
    green: '#7EEAAC', greenDark: '#58DE91', pink: '#F782C3', pinkDark: '#EC57AA',
    lilac: '#CDB7EC', purple: '#8C47ED', yellow: '#FCDF48', ink: '#141414',
  };

  let GEN = null, NOW = null, BST = null;
  /** Build the logo paths and decode the wordmark image (call before prewarm). */
  E.loadBrand = function () {
    GEN = A.genNow.gen.map((d) => new Path2D(d));
    NOW = A.genNow.now.map((d) => new Path2D(d));
    BST = new Image();
    BST.src = A.bstPng;
    return BST.decode().catch(() => {});
  };

  E.genNowWidth = (h) => (h * A.genNow.viewBox[0]) / A.genNow.viewBox[1];

  /**
   * gen now logo, left edge at x, vertically centred on y, height h (viewBox height).
   * o.gen / o.now = colours; o.reveal (0..1) writes the "now" on from left to right.
   */
  E.drawGenNow = function (ctx, x, y, h, o = {}) {
    if (!GEN) E.loadBrand();
    const [vw, vh] = A.genNow.viewBox, k = h / vh;
    ctx.save();
    ctx.translate(x, y - h / 2);
    ctx.scale(k, k);
    ctx.fillStyle = o.gen || E.BRAND.ink;
    GEN.forEach((p) => ctx.fill(p));
    const rv = o.reveal == null ? 1 : o.reveal;
    if (rv > 0) {
      ctx.save();
      if (rv < 1) { ctx.beginPath(); ctx.rect(60, 0, (vw - 60) * rv, vh); ctx.clip(); }
      ctx.fillStyle = o.now || E.BRAND.blue;
      NOW.forEach((p) => ctx.fill(p));
      ctx.restore();
    }
    ctx.restore();
    return vw * k;
  };

  /** Bertelsmann Stiftung wordmark, left edge at x, centred on y, width w. */
  E.drawBst = function (ctx, x, y, w) {
    if (!BST) E.loadBrand();
    const [iw, ih] = A.bstSize, h = (w * ih) / iw;
    if (BST.complete && BST.naturalWidth) ctx.drawImage(BST, x, y - h / 2, w, h);
    return h;
  };

  // ---- opening sheet: brand blue with the logo, torn away at the start ---------
  E.makeOpenSheet = function (W, H) {
    return E.cached('bg|open' + W + 'x' + H, () => {
      const base = E.makeBackground('blue', W, H);
      const c = E.clone(base), ctx = c.getContext('2d');
      const O = E.bgOverscan, h = 250, w = E.genNowWidth(h);
      E.drawGenNow(ctx, O + (W - w) / 2, O + 700, h, { gen: '#FFFFFF', now: E.BRAND.yellow });
      return c;
    });
  };

  // ---- last slide: torn white card with both logos -----------------------------
  E.makeLogoCard = function (it) {
    const w = it.w || 430, h = it.h || 250;
    return E.makeCard({ w, h, color: '#FFFFFF', seed: 'logocard' + it.id, tex: 0.35, draw: (ctx) => {
      ctx.fillStyle = E.BRAND.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = E.fontStr(E.FONTS.small, 27);
      ctx.fillText(it.lead || 'unterstützt von', 0, -h / 2 + 34);
      const lh = 92, lw = E.genNowWidth(lh);
      E.drawGenNow(ctx, -lw / 2 + 6, -h / 2 + 108, lh);
      ctx.font = E.fontStr(E.FONTS.small, 22);
      ctx.fillStyle = '#3A3A3A';
      ctx.fillText('Ein Projekt der', 0, h / 2 - 72);
      const bw = w - 90;
      E.drawBst(ctx, -bw / 2, h / 2 - 36, bw);
    } });
  };

  // ---- small corner logo (top-left, above the Reels UI safe area) -----------------
  E.drawWatermark = function (ctx, t, TL) {
    const wm = TL.brand && TL.brand.watermark;
    if (!wm || t < wm.in || t >= wm.out) return;
    const a = E.clamp((t - wm.in) / 0.35) * (1 - E.clamp((t - (wm.out - 0.35)) / 0.35));
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a * (wm.alpha != null ? wm.alpha : 1);
    // soft white glow keeps the logo legible on every sheet colour
    ctx.shadowColor = 'rgba(255,255,255,0.55)'; ctx.shadowBlur = 10;
    E.drawGenNow(ctx, wm.x, wm.y, wm.h);
    ctx.restore();
  };
})(typeof window !== 'undefined' ? window : globalThis);
