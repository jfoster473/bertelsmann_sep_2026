// Lists every number that appears on screen and checks it against the approved
// list (docs/facts.md references). Usage: node tools/check_numbers.js
const TL = require('../project/src/data/timeline.js');
const APPROVED = {
  '1.763': 'F1', '1.325': 'F1', '2026': 'F1 / credit', '14': 'F1 (14- bis 25-Jährige)', '25': 'F1 age range / Y2 (unter 25)',
  '30': 'F2 (bis 30)', '100': 'illustration: 100 figures = 100 %', '4': 'F7', '10': 'F7 (4 von 10) / F11 (jede:r Zehnte, unter 10 %)',
  '9': 'F2', '28': 'F3', '31': 'F4', '29': 'F5', '3': 'F6', '60': 'F8 (rund)', '48': 'F9', '39': 'F10',
  '18': 'G1', '24': 'G1', '13': 'G1 (knapp 13)', '23': 'G2 (über 23)', '2024': 'G1', '2025': 'G2 / credit', '2025/26': 'G source',
};
const texts = [];
TL.items.forEach((i) => texts.push([i.id, i.text]));
TL.crowd.groups.forEach((g, k) => texts.push(['crowd' + k, g.text + ' ' + g.label]));
TL.barriers.rows.forEach((r, k) => texts.push(['bar' + k, r.text + ' ' + r.label]));
TL.gem.bars.forEach((b, k) => texts.push(['gem' + k, b.text + ' ' + b.year]));
let bad = 0;
const rows = [];
texts.forEach(([id, t]) => {
  const nums = String(t).match(/\d+(?:[.\/]\d+)?/g) || [];
  nums.forEach((n) => {
    const ok = APPROVED[n];
    if (!ok) bad++;
    rows.push(`| ${id} | ${n} | ${ok || '❌ not in facts.md'} | ${String(t).replace(/\n/g, ' ')} |`);
  });
});
// numeric consistency: values drawn as bars/counters equal the printed text
TL.crowd.groups.forEach((g) => { if (g.n !== g.value || !g.text.startsWith(String(g.value))) { bad++; rows.push(`| crowd | ${g.value} | ❌ figure count / text mismatch | ${g.text} |`); } });
const sum = TL.crowd.groups.reduce((a, g) => a + g.value, 0);
rows.push(`| crowd | sum ${sum} | ${sum === 100 ? 'ok: 9+28+31+29+3 = 100 (single-choice answer categories)' : '❌'} | |`);
TL.barriers.rows.forEach((r) => { if (!r.text.includes(String(r.value))) { bad++; rows.push(`| bar | ${r.value} | ❌ bar length ≠ printed value | ${r.text} |`); } });
console.log('| where | number | fact ref | text |\n|---|---|---|---|\n' + rows.join('\n'));
console.log('\nunapproved numbers:', bad);
process.exit(bad ? 1 : 0);
