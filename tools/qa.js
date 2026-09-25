// QA: reading-time rule + safe-zone check for every text beat.
// Rule: each text must be fully readable for >= words/3 + 0.5 s.
// Usage: node tools/qa.js   -> prints table and writes docs/qa_pacing.md
const fs = require('fs'), path = require('path');
const { open } = require('./browser');

(async () => {
  const { page, close } = await open(8790);
  const rows = await page.evaluate(() => {
    const TL = window.TIMELINE, E = window.E;
    const out = [];
    const sceneOf = (id) => TL.scenes.findIndex((s) => s.id === id);
    const coverAt = (sceneId) => { const i = sceneOf(sceneId); return i >= 0 && i < TL.scenes.length - 1 ? TL.scenes[i + 1].start + 0.15 : TL.duration; };
    const settle = { drop: 0.3, pop: 0.3, slideL: 0.4, slideR: 0.4, slideUp: 0.4, flip: 0.3, caption: 0.3, stamp: 0.2, none: 0 };
    const bounds = (x, y, w, h, rot) => {
      const c = Math.abs(Math.cos(rot)), s = Math.abs(Math.sin(rot));
      const W = w * c + h * s, H = w * s + h * c;
      return [x - W / 2, y - H / 2, x + W / 2, y + H / 2];
    };
    TL.items.forEach((it) => {
      const enter = it.enter || (it.type === 'caption' ? 'caption' : it.type === 'stamp' ? 'stamp' : 'drop');
      let start = it.in + (it.type === 'hand' ? Math.min(1.1, it.text.length * 0.045) : it.type === 'credit' ? 0.4 : settle[enter] || 0.3);
      let end = Math.min(it.out, TL.duration);
      const exit = it.exit || (it.type === 'caption' ? 'fade' : 'cover');
      if (exit === 'fly') end = it.out - 0.4; else if (exit === 'fade') end = it.out - 0.22;
      if (exit === 'cover' && !it.top) end = Math.min(end, coverAt(it.scene));
      if (it.path) { // carried item: readable until it starts moving away
        const mv = it.path.find((k, i) => i > 0 && it.path[i - 1].t >= it.in && (k.x !== it.path[i - 1].x));
        if (mv) end = Math.min(end, it.path[0].t);
      }
      let box = null;
      const spr = E.itemSprite(it);
      if (spr) {
        const st = E.itemState(it, Math.min(end - 0.01, it.in + 1.2), TL.width);
        const w = spr.boxW || spr.w, h = spr.boxH || spr.h;
        box = st ? bounds(st.x, st.y, w * st.s, h * st.s, E.deg(it.rot || 0)) : null;
      } else if (it.type === 'hand' || it.type === 'credit') {
        const c = E.canvas(4, 4).getContext('2d');
        c.font = it.type === 'hand' ? E.fontStr(E.FONTS.hand, it.size) : E.fontStr(E.FONTS.small, it.size || 27);
        const w = Math.max(...it.text.split('\n').map((l) => c.measureText(l).width));
        const h = it.text.split('\n').length * (it.size || 36);
        box = bounds(it.x, it.y, w, h, E.deg(it.rot || 0));
      }
      out.push({ id: it.id, text: it.text, words: E.wordCount(it.text), start, end, box, kind: it.type });
    });
    // scene-drawn texts
    const cr = TL.crowd, L = E.crowdLayout();
    cr.groups.forEach((g, i) => {
      const end = TL.scenes[sceneOf('crowd') + 1].start + 0.15;
      out.push({ id: 'crowd.tag' + i, text: g.text, words: E.wordCount(g.text), start: cr.tagsIn[i] + 0.6, end, box: null, kind: 'scene' });
      const lab = E.makeStrip({ text: g.label, font: 'small', size: 28, color: 'white', seed: 'lab' + i, pad: [14, 6] });
      out.push({ id: 'crowd.label' + i, text: g.label, words: E.wordCount(g.label), start: cr.tagsIn[i] + 0.55, end, box: [cr.left, L.groupsGeo[i].labelY - lab.boxH / 2, cr.left + lab.boxW, L.groupsGeo[i].labelY + lab.boxH / 2], kind: 'scene' });
    });
    const b = TL.barriers;
    b.rows.forEach((r, i) => {
      const end = r.carry ? TL.items.find((x) => x.id === r.carry).in - 0.2 : TL.scenes[sceneOf('barriers') + 1].start + 0.15;
      const lab = E.makeStrip({ text: r.label, font: 'body', size: 36, color: 'cream', seed: 'blab' + i });
      const y = b.top + i * b.rowH;
      out.push({ id: 'bar.label' + i, text: r.label, words: E.wordCount(r.label), start: r.in + 0.3, end: Math.min(end, b.carryAt), box: [b.left + 86, y - lab.boxH / 2, b.left + 86 + lab.boxW, y + lab.boxH / 2], kind: 'scene' });
      const fin = E.makeStrip({ text: r.text, font: 'number', size: 64, color: 'white', seed: 'bnum' + i });
      const x0 = b.left + (b.full * r.value) / 100 + 30;
      out.push({ id: 'bar.num' + i, text: r.text, words: E.wordCount(r.text), start: r.in + 0.95, end: TL.scenes[sceneOf('barriers') + 1].start + 0.15, box: [x0, y + 78 - fin.boxH / 2, x0 + fin.boxW, y + 78 + fin.boxH / 2], kind: 'scene' });
    });
    const g = TL.gem;
    g.bars.forEach((bar, i) => out.push({ id: 'gem.value' + i, text: bar.text + ' (' + bar.year + ')', words: E.wordCount(bar.text) + 1, start: bar.in + 0.85, end: TL.scenes[sceneOf('gem') + 1].start + 0.15, box: null, kind: 'scene' }));
    return { rows: out, safe: TL.safe, duration: TL.duration };
  });
  await close();
  const { safe } = rows;
  let fails = 0;
  const lines = ['| id | text | words | needed s | readable s | ok | box (x0,y0,x1,y1) | safe zone |', '|---|---|---|---|---|---|---|---|'];
  rows.rows.forEach((r) => {
    const need = r.words / 3 + 0.5, have = r.end - r.start;
    const ok = have + 1e-6 >= need;
    let zone = '–';
    if (r.box) {
      const [x0, y0, x1, y1] = r.box.map((v) => Math.round(v));
      const bad = [];
      if (y0 < safe.top) bad.push('top');
      if (y1 > safe.bottom) bad.push('bottom');
      if (x0 < safe.left) bad.push('left');
      if (x1 > safe.right) bad.push('right');
      zone = bad.length ? '⚠ ' + bad.join(',') : 'ok';
      r.boxs = `${x0},${y0},${x1},${y1}`;
    }
    if (!ok || zone.startsWith('⚠')) fails++;
    lines.push(`| ${r.id} | ${r.text.replace(/\n/g, ' ⏎ ')} | ${r.words} | ${need.toFixed(2)} | ${have.toFixed(2)} | ${ok ? '✅' : '❌'} | ${r.boxs || '–'} | ${zone} |`);
  });
  const md = `# QA – reading time & safe zones\n\nRule: every text beat stays fully readable (after its entrance settles, before it exits or is covered) for at least *words ÷ 3 + 0.5 s*. Safe box for key text: x ${safe.left}–${safe.right}, y ${safe.top}–${safe.bottom} (1080×1920).\n\nIssues: **${fails}**\n\n` + lines.join('\n') + '\n';
  fs.writeFileSync(path.resolve(__dirname, '..', 'docs', 'qa_pacing.md'), md);
  console.log(lines.filter((l) => l.includes('❌') || l.includes('⚠')).join('\n') || 'all ok');
  console.log('issues:', fails);
})();
