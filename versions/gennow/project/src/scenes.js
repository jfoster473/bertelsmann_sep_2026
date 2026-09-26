/* scenes.js – scene-specific animation that goes beyond generic items:
   survey card, crowd sorting, barrier bar chart, GEM chart, confetti.
   Each scene may define draw(ctx,t) (inside its paper layer) and
   drawTop(ctx,t) (above sheets and the character, for carry-over elements). */
(function (G) {
  'use strict';
  const E = G.E;
  const S = (E.SCENES = {});

  // ---------------------------------------------------------------- icons ----
  E.icon = function (name, size = 70) {
    return E.makeCutout('icon-' + name + size, size, size, (ctx) => {
      const k = size / 70;
      ctx.scale(k, k);
      if (name === 'lock') {
        ctx.strokeStyle = '#141414'; ctx.lineWidth = 9;
        ctx.beginPath(); ctx.arc(0, -8, 16, Math.PI, 0); ctx.lineTo(16, 4); ctx.moveTo(-16, -8); ctx.lineTo(-16, 4); ctx.stroke();
        ctx.fillStyle = '#0C55A6'; ctx.beginPath(); ctx.roundRect(-26, -2, 52, 38, 7); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 13, 6, 0, 7); ctx.fill(); ctx.fillRect(-3, 14, 6, 12);
      } else if (name === 'question') {
        ctx.fillStyle = '#1EB4FF'; ctx.beginPath(); ctx.arc(0, 0, 32, 0, 7); ctx.fill();
        ctx.fillStyle = '#141414'; ctx.font = '800 46px "Bricolage Grotesque"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 3);
      } else if (name === 'bolt') {
        ctx.fillStyle = '#FCDF48';
        ctx.beginPath(); ctx.moveTo(8, -34); ctx.lineTo(-20, 6); ctx.lineTo(-2, 6); ctx.lineTo(-10, 34); ctx.lineTo(22, -8); ctx.lineTo(4, -8); ctx.closePath(); ctx.fill();
      } else if (name === 'bulb') {
        ctx.fillStyle = '#FCDF48'; ctx.beginPath(); ctx.arc(0, -8, 24, 0, 7); ctx.fill();
        ctx.fillStyle = '#8F8A80'; ctx.fillRect(-12, 14, 24, 16);
      } else if (name === 'heart') {
        ctx.fillStyle = '#EC57AA'; ctx.beginPath(); ctx.moveTo(0, 26); ctx.bezierCurveTo(-40, 0, -24, -34, 0, -12); ctx.bezierCurveTo(24, -34, 40, 0, 0, 26); ctx.fill();
      }
    }, { rim: 3, tex: 0.5, blur: 5 });
  };

  // generic entrance helpers for scene elements
  function dropState(d) {
    const sp = E.spring(d, 22, 0.5);
    return { s: 1 + 0.4 * (1 - sp), a: 0.3 + 0.7 * E.clamp(d / 0.12), lift: E.clamp(1 - sp) * 1.3, r: E.deg(7) * (1 - sp) };
  }
  E.dropState = dropState;

  // ================================================================ STUDY ====
  function surveyCard() {
    const c = G.TIMELINE.study.card;
    return E.makeCard({ w: c.w, h: c.h, color: '#FFFFFF', seed: 'survey', lined: true, draw: (ctx, w, h) => {
      ctx.fillStyle = '#141414'; ctx.font = '800 38px "Bricolage Grotesque"'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(c.title, -w / 2 + 34, -h / 2 + 44);
      ctx.fillStyle = '#EC57AA'; ctx.fillRect(-w / 2 + 34, -h / 2 + 70, 120, 5);
      for (let i = 0; i < 3; i++) {
        const y = -h / 2 + 130 + i * 88;
        ctx.strokeStyle = '#141414'; ctx.lineWidth = 4; ctx.strokeRect(-w / 2 + 38, y - 18, 36, 36);
        ctx.fillStyle = 'rgba(12,85,166,0.45)';
        ctx.fillRect(-w / 2 + 96, y - 12, 200 - i * 30, 10);
        ctx.fillRect(-w / 2 + 96, y + 6, 140 + i * 20, 8);
      }
    } });
  }
  function cardPose(t) {
    const st = G.TIMELINE.study, c = st.card, b = st.burst;
    if (t < c.in) return null;
    const ds = dropState(t - c.in);
    let x = c.x, y = c.y, rot = E.deg(c.rot) + ds.r, s = ds.s, lift = ds.lift;
    rot += E.deg(0.8) * E.wob(t, 0.4, 3); y += 2 * E.wob(t, 0.3, 4);
    if (t >= b.move) {
      const p = E.easeInOut(E.inv(b.move, b.at - 0.1, t));
      x = E.lerp(c.x, b.x, p); y = E.lerp(c.y, b.y, p) - Math.sin(Math.PI * p) * 120;
      rot = E.lerp(E.deg(c.rot), E.deg(-14), p) + E.deg(20) * Math.sin(Math.PI * p);
      s = E.lerp(1, 0.55, p); lift = Math.sin(Math.PI * p) * 1.2 + p * 0.3;
      if (t > b.at - 0.1) s *= 1 - E.easeInBack(E.inv(b.at - 0.1, b.at + 0.12, t), 2.5);
    }
    return { x, y, rot, s, a: ds.a, lift };
  }
  function drawCard(ctx, t) {
    const P = cardPose(t);
    if (!P || P.s <= 0.01) return;
    const c = G.TIMELINE.study.card;
    E.drawSprite(ctx, surveyCard(), P.x, P.y, { rot: P.rot, s: P.s, alpha: P.a, lift: P.lift });
    ctx.save();
    ctx.translate(P.x, P.y); ctx.rotate(P.rot); ctx.scale(P.s, P.s);
    // tape on top
    E.drawSprite(ctx, E.makeTape(140, 42, 'survey'), 0, -c.h / 2 + 4, { rot: 0.08, alpha: P.a, shadowAlpha: 0.2 });
    // animated hand-drawn ticks in the boxes
    c.ticks.forEach((tt, i) => {
      const p = E.clamp((t - tt) / 0.22);
      if (p <= 0) return;
      const bx = -c.w / 2 + 56, by = -c.h / 2 + 130 + i * 88;
      ctx.strokeStyle = '#0C55A6'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      const p1 = E.clamp(p / 0.4), p2 = E.clamp((p - 0.4) / 0.6);
      ctx.moveTo(bx - 14, by);
      ctx.lineTo(bx - 14 + 12 * p1, by + 14 * p1);
      if (p2 > 0) ctx.lineTo(bx - 2 + 30 * p2, by + 14 - 36 * p2);
      ctx.stroke();
    });
    ctx.restore();
  }
  S.study = {
    draw(ctx, t) { if (t < G.TIMELINE.study.burst.move) drawCard(ctx, t); },
    drawTop(ctx, t) { if (t >= G.TIMELINE.study.burst.move) drawCard(ctx, t); },
  };

  // ================================================================ CROWD ====
  let CROWD = null;
  function crowdLayout() {
    if (CROWD) return CROWD;
    const cr = G.TIMELINE.crowd;
    const total = cr.groups.reduce((a, g) => a + g.n, 0);
    const r = E.rng('crowd-assign');
    const order = [...Array(total).keys()];
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const figs = [];
    let yCur = cr.top;
    const groupsGeo = cr.groups.map((g, gi) => {
      const rows = Math.ceil(g.n / cr.perRow);
      const geo = { top: yCur, labelY: yCur + 16, figTop: yCur + 44, rows, h: 44 + rows * 56 + 22 };
      yCur += geo.h + 14;
      return geo;
    });
    let k = 0;
    cr.groups.forEach((g, gi) => {
      for (let j = 0; j < g.n; j++) {
        const idx = order[k++];
        const col = idx % 10, row = Math.floor(idx / 10);
        const gg = groupsGeo[gi];
        const rr = Math.floor(j / cr.perRow), cc = j % cr.perRow;
        figs.push({
          i: idx, g: gi, j,
          gx: 540 + (col - 4.5) * 60, gy: 640 + row * 70,
          tx: cr.left + cc * 34 + 17 + (rr % 2) * 8, ty: gg.figTop + 70 + rr * 56,
          delay: E.h01(idx, 5) * 0.25, spr: E.crowdSprite(idx * 7 + 3),
        });
      }
    });
    CROWD = { figs, groupsGeo };
    return CROWD;
  }
  E.crowdLayout = crowdLayout;

  function figPos(f, t) {
    const cr = G.TIMELINE.crowd, b = G.TIMELINE.study.burst;
    const tA = cr.appear + f.i * 0.009;
    if (t < tA) return null;
    const pa = E.clamp((t - tA) / 0.55);
    let x = E.lerp(b.x, f.gx, E.easeOutCubic(pa));
    let y = E.lerp(b.y, f.gy, E.easeOutCubic(pa)) - Math.sin(Math.PI * pa) * 160;
    let s = 0.2 + 0.8 * E.easeOutBack(pa, 2), rot = (1 - pa) * (E.h01(f.i, 2) - 0.5) * 3;
    const tS = cr.sort + f.g * 0.1 + f.delay;
    const ps = E.clamp((t - tS) / 0.65);
    if (ps > 0) {
      const e = E.easeInOut(ps);
      x = E.lerp(f.gx, f.tx, e); y = E.lerp(f.gy, f.ty, e) - Math.sin(Math.PI * ps) * 70;
      rot = Math.sin(ps * Math.PI * 4) * 0.12 * (1 - ps);
      s = E.lerp(1, 0.86, e);
    }
    // idle life
    const hopT = cr.highlight + f.j * 0.012;
    let hop = 0, alpha = 1;
    if (t > hopT) {
      if (f.g <= 1) { const q = (t - hopT) % 0.55; const n = Math.floor((t - hopT) / 0.55); if (n < 2) hop = Math.sin(Math.PI * q / 0.55) * 34; }
      else alpha = E.lerp(1, 0.4, E.clamp((t - hopT) / 0.4));
    }
    y += Math.sin(t * 5 + f.i) * 1.5 - hop;
    rot += 0.05 * Math.sin(t * 3 + f.i * 1.7);
    return { x, y, s, rot, alpha };
  }

  function drawTags(ctx, t) {
    const cr = G.TIMELINE.crowd, L = crowdLayout();
    cr.groups.forEach((g, gi) => {
      const tin = cr.tagsIn[gi];
      if (t < tin) return;
      const gg = L.groupsGeo[gi];
      const d = t - tin;
      const ds = dropState(d);
      // counting number
      const cnt = Math.round(g.value * E.easeOutCubic(E.clamp(d / 0.6)));
      const final = E.makeStrip({ text: g.text, font: 'number', size: 84, color: g.color === 'cream' ? 'white' : g.color, seed: 'tag' + gi });
      const spr = E.makeStrip({ text: cnt + ' %', font: 'number', size: 84, color: g.color === 'cream' ? 'white' : g.color, seed: 'tag' + gi, minW: final.boxW });
      const cy = gg.top + gg.h / 2 - 6;
      const hl = gi <= 1 && t > cr.highlight ? 1 + 0.08 * Math.sin(Math.min(1, (t - cr.highlight) / 0.4) * Math.PI) : 1;
      const dim = gi >= 2 && t > cr.highlight ? E.lerp(1, 0.72, E.clamp((t - cr.highlight) / 0.4)) : 1;
      E.drawSprite(ctx, spr, 90 + final.boxW / 2 + 40, cy + E.wob(t, 0.4, gi) * 2, { rot: E.deg(-3 + gi * 1.3) + ds.r + E.deg(0.6) * E.wob(t, 0.5, gi + 9), s: ds.s * hl, alpha: ds.a * dim, lift: ds.lift });
      // descriptor strip above the figures
      const lab = E.makeStrip({ text: g.label, font: 'small', size: 28, color: 'white', seed: 'lab' + gi, pad: [14, 6] });
      const dl = d - 0.15;
      if (dl > 0) {
        const sp = E.spring(dl, 14, 0.6);
        E.drawSprite(ctx, lab, cr.left + lab.boxW / 2 + (1 - sp) * 500, gg.labelY + E.wob(t, 0.4, gi + 4) * 1.5, { rot: E.deg(gi % 2 ? 0.8 : -0.8), alpha: E.clamp(dl / 0.15) * dim, lift: (1 - sp) * 0.6 });
      }
    });
  }

  S.crowd = {
    draw(ctx, t) {
      const L = crowdLayout();
      const list = [];
      L.figs.forEach((f) => { const p = figPos(f, t); if (p) list.push([p, f]); });
      list.sort((a, b) => a[0].y - b[0].y);
      list.forEach(([p, f]) => {
        E.drawSprite(ctx, f.spr, p.x, p.y - E.CROWD_H / 2 * p.s, { s: p.s, rot: p.rot, alpha: p.alpha, lift: 0.1 });
      });
      drawTags(ctx, t);
    },
  };

  // ============================================================= BARRIERS ====
  function barrierGeo(ri) {
    const b = G.TIMELINE.barriers;
    const y0 = b.top + ri * b.rowH;
    return { labelY: y0, barY: y0 + 78 };
  }
  function barrierLabel(row, ri) {
    return E.makeStrip({ text: row.label, font: 'body', size: 36, color: 'cream', seed: 'blab' + ri });
  }
  function barrierLabelPos(row, ri, t) {
    const b = G.TIMELINE.barriers, g = barrierGeo(ri);
    const spr = barrierLabel(row, ri);
    return { x: b.left + 86 + spr.boxW / 2, y: g.labelY, spr };
  }
  function drawBarrierRow(ctx, t, row, ri, withLabel) {
    const b = G.TIMELINE.barriers, g = barrierGeo(ri);
    const d = t - row.in;
    if (d < 0) return;
    const ds = dropState(d);
    // icon
    E.drawSprite(ctx, E.icon(row.icon, 66), b.left + 36, g.labelY + E.wob(t, 0.5, ri) * 2, { s: E.spring(d, 16, 0.4), rot: E.deg(6) * E.wob(t, 0.6, ri + 3) });
    // label
    if (withLabel) {
      const lp = barrierLabelPos(row, ri, t);
      E.drawSprite(ctx, lp.spr, lp.x, lp.y + E.wob(t, 0.35, ri + 5) * 2, { rot: E.deg(ri % 2 ? 1 : -1) + ds.r + E.deg(0.5) * E.wob(t, 0.4, ri + 11), s: ds.s, alpha: ds.a, lift: ds.lift });
    }
    // bar: torn paper strip unrolling from the left
    const L = (b.full * row.value) / 100;
    const bar = E.makeCard({ w: L, h: 62, color: row.color, seed: 'bar' + ri, amp: 2, endAmp: 6 });
    const gp = E.easeOutCubic(E.clamp((d - 0.15) / 0.7));
    if (gp > 0) {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, g.barY - 80, b.left + L * gp + 8, 160); ctx.clip();
      E.drawSprite(ctx, bar, b.left + L / 2, g.barY + E.wob(t, 0.3, ri + 7) * 1.5, { rot: E.deg(0.4) * E.wob(t, 0.4, ri + 1) });
      ctx.restore();
      // counting number at the bar end
      const nd = d - 0.35;
      if (nd > 0) {
        const val = Math.round(row.value * E.easeOutCubic(E.clamp(nd / 0.6)));
        const txt = row.text.replace(/\d+/, String(val));
        const fin = E.makeStrip({ text: row.text, font: 'number', size: 64, color: 'white', seed: 'bnum' + ri });
        const spr = E.makeStrip({ text: txt, font: 'number', size: 64, color: 'white', seed: 'bnum' + ri, minW: fin.boxW });
        const pp = E.spring(nd, 16, 0.45);
        E.drawSprite(ctx, spr, b.left + L * gp + 30 + fin.boxW / 2, g.barY - 4 + E.wob(t, 0.4, ri + 13) * 2, { s: pp, rot: E.deg(-4 + ri * 2) });
      }
    }
  }
  S.barriers = {
    draw(ctx, t) {
      const b = G.TIMELINE.barriers;
      b.rows.forEach((row, ri) => drawBarrierRow(ctx, t, row, ri, !(row.carry && t >= b.carryAt)));
    },
    drawTop(ctx, t) {
      // carry-over: labels of rows with `carry` fly to their new item and flip
      const b = G.TIMELINE.barriers;
      b.rows.forEach((row, ri) => {
        if (!row.carry || t < b.carryAt) return;
        const target = G.TIMELINE.items.find((i) => i.id === row.carry);
        if (!target || t >= target.in) return;
        const from = barrierLabelPos(row, ri, t);
        const tspr = E.itemSprite(target);
        const tx = target.x + (tspr.boxW / 2), ty = target.y;
        const p = E.easeInOut(E.inv(b.carryAt + ri * 0.12, Math.min(target.in - 0.2, b.carryAt + ri * 0.12 + 0.9), t));
        const x = E.lerp(from.x, tx, p), y = E.lerp(from.y, ty, p) - Math.sin(Math.PI * p) * 90;
        const flip = 1 - E.easeInCubic(E.inv(target.in - 0.2, target.in, t));
        E.drawSprite(ctx, from.spr, x, y, { rot: E.deg(E.lerp(ri % 2 ? 1 : -1, target.rot || 0, p)) + Math.sin(Math.PI * p) * 0.1, sx: flip, s: E.lerp(1, 1.15, p), lift: Math.sin(Math.PI * p) * 1.2 });
      });
      // red hand-drawn strike through the money myth note
      const k = b.strike;
      if (k && t >= k.at && t < 33.2) {
        const p = E.clamp((t - k.at) / 0.25);
        ctx.save();
        ctx.strokeStyle = 'rgba(12,85,166,0.95)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath();
        const w1 = E.wob(t, 0.4, 5) * 2;
        ctx.moveTo(k.x0, k.y0 + w1);
        ctx.quadraticCurveTo((k.x0 + k.x1) / 2, (k.y0 + k.y1) / 2 - 14 + w1, E.lerp(k.x0, k.x1, p), E.lerp(k.y0, k.y1, p) + w1);
        ctx.stroke();
        ctx.restore();
      }
    },
  };

  // ================================================================== GEM ====
  S.gem = {
    draw(ctx, t) {
      const g = G.TIMELINE.gem;
      const t0 = g.bars[0].in - 0.35;
      if (t < t0) return;
      // cardboard backing
      const ds = dropState(t - t0);
      const bw = g.barW * 2 + g.gap + 170, bh = 660;
      const cb = E.makeCardboard(bw, bh, 'gem');
      const cx = g.x0 + g.barW + g.gap / 2, cy = g.base - bh / 2 + 50;
      E.drawSprite(ctx, cb, cx, cy + E.wob(t, 0.3, 1) * 1.5, { rot: E.deg(-1.2) + ds.r * 0.5 + E.deg(0.3) * E.wob(t, 0.4, 2), s: ds.s, alpha: ds.a, lift: ds.lift });
      // baseline
      ctx.save();
      ctx.strokeStyle = 'rgba(40,28,16,0.8)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      const bp = E.easeOutCubic(E.clamp((t - t0 - 0.2) / 0.4));
      ctx.beginPath(); ctx.moveTo(cx - bw / 2 + 40, g.base); ctx.lineTo(cx - bw / 2 + 40 + (bw - 80) * bp, g.base + 2); ctx.stroke();
      ctx.restore();
      g.bars.forEach((bar, i) => {
        const d = t - bar.in;
        if (d < 0) return;
        const x = g.x0 + g.barW / 2 + i * (g.barW + g.gap);
        const H = bar.value * g.pxPerPct;
        const spr = E.makeCard({ w: g.barW, h: H, color: bar.color, seed: 'gembar' + i, amp: 3, endAmp: 3 });
        const gp = E.easeOutBack(E.clamp(d / 0.8), 1.1);
        ctx.save();
        ctx.beginPath(); ctx.rect(x - g.barW, g.base - H * gp - 20, g.barW * 2, H * gp + 20); ctx.clip();
        E.drawSprite(ctx, spr, x, g.base - H / 2 + E.wob(t, 0.3, i) * 1.2, { rot: E.deg(0.5) * E.wob(t, 0.35, i + 4) });
        ctx.restore();
        // year label
        const yl = E.makeStrip({ text: bar.year, font: 'typed', size: 40, color: 'white', seed: 'year' + i, pad: [14, 6] });
        E.drawSprite(ctx, yl, x, g.base + 48, { s: E.spring(d, 16, 0.45), rot: E.deg(i ? 2 : -2) });
        // value label
        const nd = d - 0.55;
        if (nd > 0) {
          const nv = E.makeStrip({ text: bar.text, font: 'number', size: i ? 80 : 62, color: i ? 'yellow' : 'white', seed: 'gemv' + i });
          const pd = dropState(nd);
          E.drawSprite(ctx, nv, x + (i ? 0 : 0), g.base - H - (i ? 70 : 58) + E.wob(t, 0.4, i + 8) * 2, { s: pd.s, alpha: pd.a, lift: pd.lift, rot: E.deg(i ? -3 : 2) + pd.r });
        }
      });
      // hand-drawn arrow from bar 1 to bar 2
      const ap = E.clamp((t - g.arrowAt) / 0.5);
      if (ap > 0) {
        const x1 = g.x0 + g.barW / 2, x2 = x1 + g.barW + g.gap;
        const y1 = g.base - g.bars[0].value * g.pxPerPct - 130, y2 = g.base - g.bars[1].value * g.pxPerPct - 20;
        E.drawHandArrow(ctx, x1 - 30, y1, x2 - g.barW / 2 - 30, y2 + 30, ap, '#141414', 7, -0.3);
      }
    },
  };

  // ============================================================== CONFETTI ===
  const CONF_COLORS = ['#FCDF48', '#FFFFFF', '#F782C3', '#1EB4FF', '#7EEAAC', '#CDB7EC', '#EC57AA'];
  E.drawConfetti = function (ctx, t, t0, W, H, n = 140, ox = 540, oy = 950) {
    if (t < t0) return;
    for (let i = 0; i < n; i++) {
      const r = (k) => E.h01(i, k, 77);
      const burst = i < n * 0.45; // first part bursts from the URL, rest rains from the top
      const start = t0 + (burst ? r(1) * 0.1 : 0.2 + r(1) * 4.5);
      const d = t - start;
      if (d < 0) continue;
      let x, y;
      if (burst) {
        const ang = -Math.PI / 2 + (r(2) - 0.5) * 2.6, sp = 700 + r(3) * 900;
        const drag = 1.8;
        const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
        const k = (1 - Math.exp(-drag * d)) / drag;
        x = ox + vx * k + Math.sin(d * 3 + i) * 30;
        y = oy + vy * k + 260 * d * d * 0.5 + 120 * d;
      } else {
        x = r(4) * W + Math.sin(d * (1.5 + r(5) * 2) + i) * (30 + r(6) * 40);
        y = -40 + d * (140 + r(7) * 160);
      }
      if (y > H + 40) continue;
      const spin = d * (4 + r(8) * 8) + i;
      const w = 12 + r(9) * 10, h = 7 + r(10) * 5;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(spin * 0.7);
      ctx.scale(Math.cos(spin), 1);
      ctx.fillStyle = CONF_COLORS[i % CONF_COLORS.length];
      ctx.globalAlpha = 0.95;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(-w / 2, h / 2 - 2, w, 2);
      ctx.restore();
    }
  };
  S.end = {
    drawTop(ctx, t) {
      const e = G.TIMELINE.end;
      E.drawConfetti(ctx, t, e.confettiAt, G.TIMELINE.width, G.TIMELINE.height);
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
