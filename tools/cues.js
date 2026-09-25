// Export the SFX cue list (derived from the timeline) to project/assets/audio/cues.json
const fs = require('fs'), path = require('path'), vm = require('vm');
const P = path.resolve(__dirname, '..', 'project');
const ctx = { console, Math, JSON, Object, Array, String, Number, Map, Set };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['src/engine/core.js', 'src/engine/items.js', 'src/data/timeline.js', 'src/render.js']) vm.runInContext(fs.readFileSync(path.join(P, f), 'utf8'), ctx, { filename: f });
const TL = ctx.TIMELINE;
const cues = ctx.E.collectCues(TL);
const sc = (id) => TL.scenes.find((x) => x.id === id);
// story markers the music follows (sections move with the slides)
const markers = { barriers: sc('barriers').start, twist: TL.items.find((i) => i.id === 'b_tw').in, good: sc('good').start, end: sc('end').start };
const out = { duration: TL.duration, bpm: TL.bpm, markers, scenes: TL.scenes.map((s) => ({ id: s.id, start: s.start, end: s.end })), cues, narration: TL.audio.narration };
fs.writeFileSync(path.join(P, 'assets/audio/cues.json'), JSON.stringify(out, null, 1));
console.log(cues.length, 'cues; types:', [...new Set(cues.map((c) => c.type))].join(', '));
