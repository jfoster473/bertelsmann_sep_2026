/* core.js – seeded randomness, noise, easing and spring helpers.
   Everything here is pure: same input -> same output. */
(function (G) {
  'use strict';
  const E = (G.E = G.E || {});

  // ---- hashing / seeded RNG -------------------------------------------------
  E.hashStr = function (s) {
    let h = 2166136261 >>> 0;
    s = String(s);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  E.mulberry32 = function (a) {
    a = a >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  /** rng(seed) -> function returning [0,1). Seed may be string or number. */
  E.rng = function (seed) {
    return E.mulberry32(typeof seed === 'number' ? seed : E.hashStr(seed));
  };
  /** Stateless random in [0,1) from integer inputs. */
  E.h01 = function (a, b = 0, c = 0) {
    let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };

  // ---- 1D value noise (smooth, periodic-free) -------------------------------
  E.noise1 = function (x, seed = 0) {
    const i = Math.floor(x), f = x - i;
    const a = E.h01(i, seed), b = E.h01(i + 1, seed);
    const u = f * f * (3 - 2 * f);
    return a + (b - a) * u; // 0..1
  };
  E.fbm1 = function (x, seed = 0, oct = 4) {
    let s = 0, amp = 0.5, fr = 1, n = 0;
    for (let o = 0; o < oct; o++) {
      s += amp * (E.noise1(x * fr, seed + o * 17) * 2 - 1);
      n += amp; amp *= 0.5; fr *= 2.07;
    }
    return s / n; // -1..1
  };
  /** Smooth wobble signal in -1..1 for idle motion. */
  E.wob = function (t, speed, seed) {
    return E.fbm1(t * speed + seed * 13.37, seed | 0, 3);
  };

  // ---- math -----------------------------------------------------------------
  E.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  E.lerp = (a, b, t) => a + (b - a) * t;
  E.inv = (a, b, x) => E.clamp((x - a) / (b - a));
  E.smooth = (t) => { t = E.clamp(t); return t * t * (3 - 2 * t); };
  E.easeOutCubic = (t) => { t = E.clamp(t); return 1 - Math.pow(1 - t, 3); };
  E.easeInCubic = (t) => { t = E.clamp(t); return t * t * t; };
  E.easeInOut = (t) => { t = E.clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  E.easeOutBack = (t, k = 1.7) => { t = E.clamp(t); const c3 = k + 1; return 1 + c3 * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); };
  E.easeInBack = (t, k = 1.7) => { t = E.clamp(t); return (k + 1) * t * t * t - k * t * t; };
  E.deg = (d) => (d * Math.PI) / 180;

  /** Damped spring step response: 0 at t<=0, overshoots, settles at 1. */
  E.spring = function (t, omega = 18, zeta = 0.42) {
    if (t <= 0) return 0;
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
  };

  /** Piecewise keyframe interpolation. keys: [{t, ...numbers}] sorted by t. */
  E.keyInterp = function (keys, t, prop, ease = E.easeInOut, dur = null) {
    if (!keys.length) return undefined;
    if (t <= keys[0].t) return keys[0][prop];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t < b.t) {
        const d = dur != null ? Math.min(dur, b.t - a.t) : b.t - a.t;
        const p = E.clamp((t - (b.t - d)) / d);
        const va = a[prop] !== undefined ? a[prop] : 0, vb = b[prop] !== undefined ? b[prop] : va;
        return E.lerp(va, vb, ease(p));
      }
    }
    return keys[keys.length - 1][prop];
  };

  /** Word count used for the reading-time rule. */
  E.wordCount = function (s) {
    return String(s).replace(/[–—·+|:*]/g, ' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  };

  // ---- colour helpers ---------------------------------------------------------
  E.hexToRgb = function (h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  E.rgba = function (hex, a) {
    const [r, g, b] = E.hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  E.shade = function (hex, f) {
    // f>0 lighten towards white, f<0 darken towards black
    const c = E.hexToRgb(hex).map((v) => Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  };
})(typeof window !== 'undefined' ? window : globalThis);
