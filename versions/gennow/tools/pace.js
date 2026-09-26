// Re-time the text beats so they appear at a "spoken" rhythm across each slide.
//
// For every scene the beats (in reading order) are placed one after another,
// each gap proportional to how long the previous beat takes to say
// (words ÷ 2.6 words/s + 0.35 s pause). The whole rhythm is then stretched or
// squeezed (factor k ≤ 1) so the slide is used evenly and its LAST beat still
// gets its reading time (words ÷ 3 + 0.5 s) before the slide ends – so there is
// only a short hold at the end of each slide instead of a long one.
// Dependent timings (character poses, stamps, crowd sort, money note, confetti…)
// are derived from the beats.
//
// Usage: node tools/pace.js            -> prints the schedule
//        node tools/pace.js --write    -> writes the numbers into timeline.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const FILE = path.resolve(__dirname, '..', 'project/src/data/timeline.js');
const ctx = { Math, JSON, Object, Array, String, console }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['project/src/engine/core.js']) vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(FILE, 'utf8'), ctx);
const TL = ctx.TIMELINE, E = ctx.E;

const RATE = 2.6, PAUSE = 0.35, MARGIN = 0.15, MIN_GAP = 0.4, CAPTION_CARRY = 0.6;
const ORDER = {
  hook: ['h1', 'd1', 'd2', 'd3', 'money', 'd5', 'h2', 'c1'],
  study: ['s_k', 's_h1', 's_h2', 's_h3', 's_n', 's_n2', 's_stamp'],
  crowd: ['q_h', 'c2', 'tag0', 'tag1', 'tag2', 'tag3', 'tag4', 'q_big', 'q_sub', 'c3'],
  barriers: ['b_h', 'b_base', 'row0', 'row1', 'row2', 'b_multi', 'b_tw', 'c4'],
  good: ['g_h', 'g_a', 'g_a1', 'g_a2', 'c5', 'g_b', 'g_b1', 'g_b2'],
  gem: ['m_h', 'm_sub', 'bar0', 'bar1', 'm_src', 'c6'],
  end: ['e_k', 'e_t', 'e_s', 'e_b', 'e_url', 'e_hand'], // source credit = fine print, shown for the whole slide
};
const LEAD = { hook: 0.55 };
const NEED = { e_url: 3.2 }; // minimum on-screen reading time overrides (URL held >= 3 s) // first beat after the scene's sheet has landed (default 0.4 s)
const item = (id) => TL.items.find((i) => i.id === id);
const scene = (id) => TL.scenes.find((s) => s.id === id);
const nextStart = (sid) => { const i = TL.scenes.findIndex((s) => s.id === sid); return i < TL.scenes.length - 1 ? TL.scenes[i + 1].start : TL.duration; };

function beatInfo(b, sid) {
  if (/^tag\d$/.test(b)) { const g = TL.crowd.groups[+b[3]]; return { words: E.wordCount(g.text + ' ' + g.label), settle: 0.6 }; }
  if (/^row\d$/.test(b)) { const r = TL.barriers.rows[+b[3]]; return { words: E.wordCount(r.text + ' ' + r.label), settle: 1.0 }; }
  if (/^bar\d$/.test(b)) { const r = TL.gem.bars[+b[3]]; return { words: E.wordCount(r.text + ' ' + r.year), settle: 0.9 }; }
  const it = item(b);
  const enter = it.enter || (it.type === 'caption' ? 'caption' : 'drop');
  const settle = it.type === 'hand' ? Math.min(1.1, it.text.length * 0.045) : it.type === 'credit' ? 0.4 : { slideL: 0.4, slideR: 0.4, flip: 0.35 }[enter] || 0.3;
  return { words: E.wordCount(it.text), settle };
}

// latest time until which beat b must be readable, given the schedule t{}
function readableUntil(b, sid, t) {
  const end = sid === 'end' ? TL.duration : nextStart(sid) + 0.15;
  if (b === 'money') return 6.55;                          // flies off after the hook
  if (b === 's_stamp') return TL.study.burst.move;         // survey card flies off
  if (b === 'q_h') return t.q_big - 0.45;                  // flies out when the big number arrives
  if (b === 'c2') return t.q_big - 0.27;
  if (/^c\d$/.test(b)) return (sid === 'end' ? TL.duration : scene(sid).end + CAPTION_CARRY) - 0.22; // a slide's last caption stays on top while the next sheet slides in (as in the reference), then fades
  if (b === 'row1' || b === 'row2') return TL.barriers.carryAt;
  return end;
}
function notBefore(b) {
  if (b === 'tag0') return 15.3;                           // figures must have burst out and started sorting
  const carry = TL.barriers.rows.findIndex((r) => r.carry === b);
  if (carry >= 0) return TL.barriers.carryAt + carry * 0.12 + 1.1; // carried label has flown in
  return 0;
}

function schedule(sid) {
  const s = scene(sid), order = ORDER[sid];
  const info = order.map((b) => beatInfo(b, sid));
  const T0 = s.start + (LEAD[sid] != null ? LEAD[sid] : 0.4);
  const place = (k) => {
    const t = {};
    order.forEach((b, i) => {
      const prev = i ? t[order[i - 1]] + Math.max(MIN_GAP, k * (info[i - 1].words / RATE + PAUSE)) : T0;
      t[b] = Math.max(prev, notBefore(b));
    });
    return t;
  };
  const need = (b, i) => Math.max(info[i].words / 3 + 0.5, NEED[b] || 0);
  const ok = (t) => order.every((b, i) => t[b] + info[i].settle + need(b, i) + MARGIN <= readableUntil(b, sid, t) + 1e-9);
  let lo = 0.05, hi = 1.0;
  if (ok(place(hi))) lo = hi;
  else for (let n = 0; n < 40; n++) { const m = (lo + hi) / 2; if (ok(place(m))) lo = m; else hi = m; }
  const t = place(lo);
  if (!ok(t)) console.warn(`! ${sid}: cannot satisfy reading time even at minimum spacing`);
  Object.keys(t).forEach((k) => (t[k] = Math.round(t[k] * 100) / 100));
  const last = order[order.length - 1];
  return { t, k: lo, hold: s.end - t[last] };
}

const S = {};
TL.scenes.forEach((s) => (S[s.id] = schedule(s.id)));
const T = Object.assign({}, ...Object.values(S).map((x) => x.t));
TL.scenes.forEach((s) => console.log(`${s.id.padEnd(9)} k=${S[s.id].k.toFixed(2)}  last beat at ${S[s.id].t[ORDER[s.id].slice(-1)[0]].toFixed(2)} (slide ends ${s.end})  ` + ORDER[s.id].map((b) => `${b}@${S[s.id].t[b].toFixed(2)}`).join(' ')));

if (process.argv.includes('--write')) {
  let src = fs.readFileSync(FILE, 'utf8');
  const r2 = (x) => String(Math.round(x * 100) / 100);
  const setOnLine = (anchor, key, val) => {
    const lines = src.split('\n');
    const i = lines.findIndex((l) => l.includes(anchor));
    if (i < 0) throw new Error('anchor not found: ' + anchor);
    const re = new RegExp(`(\\b${key}:\\s*)(-?[0-9.]+|\\[[^\\]]*\\])`);
    if (!re.test(lines[i])) throw new Error(`key ${key} not on line: ${anchor}`);
    lines[i] = lines[i].replace(re, `$1${val}`);
    src = lines.join('\n');
  };
  const setIn = (id, v) => setOnLine(`id: '${id}'`, 'in', r2(v));
  const setOut = (id, v) => setOnLine(`id: '${id}'`, 'out', r2(v));
  // plain text beats
  Object.entries(T).forEach(([b, v]) => { if (item(b)) setIn(b, v); });
  // --- hook
  setOut('c1', scene('hook').end + CAPTION_CARRY);
  const ch = (idx, v) => { // character keyframe by index
    const lines = src.split('\n');
    const start = lines.findIndex((l) => l.includes('character: ['));
    const li = start + 1 + idx;
    lines[li] = lines[li].replace(/\{ t: [0-9.]+/, `{ t: ${r2(v)}`);
    src = lines.join('\n');
  };
  ch(1, T.d1); ch(2, T.h2); ch(3, T.c1 + 0.4);
  // --- study
  const cardIn = T.s_n - 0.05;
  setOnLine("title: 'FRAGEBOGEN'", 'in', r2(cardIn));
  setOnLine("title: 'FRAGEBOGEN'", 'ticks', `[${[0.55, 0.85, 1.15].map((d) => r2(cardIn + d)).join(', ')}]`);
  // --- crowd
  setOnLine('sort:', 'sort', r2(T.tag0 - 0.9));
  setOnLine('tagsIn:', 'tagsIn', `[${[0, 1, 2, 3, 4].map((g) => r2(T['tag' + g])).join(', ')}]`);
  setOnLine('highlight:', 'highlight', r2(T.q_big + 0.15));
  setOut('q_h', T.q_big - 0.05);
  setOut('c2', T.q_big - 0.05);
  setOut('c3', scene('crowd').end + CAPTION_CARRY);
  // --- barriers
  ["icon: 'lock'", "icon: 'question'", "icon: 'bolt'"].forEach((a, i) => setOnLine(a, 'in', r2(T['row' + i])));
  const arrive = T.b_tw + 0.45;
  setOnLine('x: 1320, y: 1300', 't', r2(arrive - 0.55));
  setOnLine('x: 690, y: 1206', 't', r2(arrive));
  setIn('b_stamp', arrive + 0.15);
  setOnLine('strike: {', 'at', r2(arrive + 0.4));
  ch(8, arrive + 0.1); ch(9, T.c4 + 1.0);
  setOut('c4', scene('barriers').end + CAPTION_CARRY);
  // --- good news
  setIn('g_a_st', T.g_a + 0.5); setIn('g_b_st', T.g_b + 0.5);
  setOut('c5', scene('good').end + CAPTION_CARRY);
  // --- gem
  setOnLine("year: '2024'", 'in', r2(T.bar0)); setOnLine("year: '2025'", 'in', r2(T.bar1));
  setOnLine('arrowAt:', 'arrowAt', r2(T.bar1 + 0.7));
  setOut('c6', scene('gem').end + CAPTION_CARRY);
  // --- end
  setOnLine('confettiAt:', 'confettiAt', r2(T.e_url));
  setIn('e_src', scene('end').start + 0.7);
  ch(13, T.e_url + 0.4);
  fs.writeFileSync(FILE, src);
  console.log('timeline.js updated');
}
