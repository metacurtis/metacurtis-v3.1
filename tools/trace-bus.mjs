import fs from 'fs';
import { walk } from './lib/walk.mjs';

const outDir = 'reports';
await fs.promises.mkdir(outDir, { recursive: true });

const emitRE =
  /BeatBus(?:\?\.)?\.?emit(?:\?\.)?\(\s*(?:EVENTS\.)?['"]?([A-Z0-9:_-]+)['"]?\s*,?/g;
const onRE =
  /BeatBus(?:\?\.)?\.?on(?:ce)?(?:\?\.)?\(\s*(?:EVENTS\.)?['"]?([A-Z0-9:_-]+)['"]?\s*,/g;

const emitters = {}, listeners = {};
const record = (map, ev, file, line) => {
  (map[ev] ||= []).push({ file, line });
};

const roots = ['src', 'canon-console'];

for (const root of roots) {
  try {
    await fs.promises.access(root);
  } catch {
    continue;
  }
  for await (const file of walk(root)) {
    const txt = await fs.promises.readFile(file,'utf8');
    const lines = txt.split('\n');
    let m;
    while ((m = emitRE.exec(txt))) {
      const idx = m.index;
      const line = txt.slice(0, idx).split('\n').length;
      record(emitters, m[1], file, line);
    }
    while ((m = onRE.exec(txt))) {
      const idx = m.index;
      const line = txt.slice(0, idx).split('\n').length;
      record(listeners, m[1], file, line);
    }
    const subscribeRE = /subscribe\(\s*['"]([A-Z0-9:_-]+)['"]/g;
    while ((m = subscribeRE.exec(txt))) {
      const idx = m.index;
      const line = txt.slice(0, idx).split('\n').length;
      record(listeners, m[1], file, line);
    }
    const onceRE =
      /\.once(?:\?\.)?\(\s*(?:EVENTS\.)?['"]?([A-Z0-9:_-]+)['"]?\s*,/g;
    while ((m = onceRE.exec(txt))) {
      const idx = m.index;
      const line = txt.slice(0, idx).split('\n').length;
      record(listeners, m[1], file, line);
    }
  }
}

const md = [];
const events = Array.from(new Set([...Object.keys(emitters), ...Object.keys(listeners)])).sort();
md.push('# BeatBus Event Map\n');
md.push('Total events: ' + events.length + '\n');
for (const ev of events) {
  md.push('## ' + ev + '\n\n**Emitters**:\n' + ((emitters[ev]||[]).map(e=>`- \`${e.file}:${e.line}\``).join('\n') || '- (none)'));
  md.push('\n\n**Listeners**:\n' + ((listeners[ev]||[]).map(e=>`- \`${e.file}:${e.line}\``).join('\n') || '- (none)'));
  md.push('\n\n');
}
fs.writeFileSync('reports/beatbus-map.json', JSON.stringify({ emitters, listeners }, null, 2));
fs.writeFileSync('reports/beatbus-map.md', md.join(''));
console.log('[trace-bus] wrote reports/beatbus-map.{json,md}');
