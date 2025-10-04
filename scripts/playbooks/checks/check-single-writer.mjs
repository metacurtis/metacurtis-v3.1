import fs from 'node:fs';
import path from 'node:path';

function scan(dir) {
  const files = [];
  (function walk(current) {
    for (const entry of fs.readdirSync(current)) {
      const full = path.join(current, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (/\.(jsx?|tsx?)$/.test(full)) files.push(full);
    }
  })(dir);
  return files;
}

export default async function checkSingleWriter() {
  const offenders = [];
  const roots = ['src', 'canon-console'];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const file of scan(root)) {
      if (/WebGLBackground\.jsx$/.test(file)) continue;
      if (/canon-console\/runtime\/steps/.test(file)) continue;
      if (/canon-console\/agent\/pilot\.js$/.test(file)) continue;
      if (/canon-console\/browser\/inject\.js$/.test(file)) continue;
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('setDrawRange(')) offenders.push(file);
      if (/material\.uniforms\.[\w$]+\.value\s*=/.test(content) && !/shaders?/.test(file)) {
        offenders.push(file);
      }
    }
  }
  const uniq = [...new Set(offenders)];
  return uniq.length
    ? {
        name: 'Single-Writer Policy',
        ok: false,
        detail: `${uniq.length} offenders`,
        advice: [
          'Move geometry.setDrawRange and uniform writes into WebGLBackground.jsx only.',
          'Change HUD "Fix" to emit a REQUEST event; renderer performs the write.',
        ],
      }
    : { name: 'Single-Writer Policy', ok: true };
}
