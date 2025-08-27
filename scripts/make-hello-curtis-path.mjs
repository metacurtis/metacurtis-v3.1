#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';

const TEXT = 'HELLO CURTIS';
const FONT_PATH = path.resolve('src/assets/fonts/CourierPrime-Regular.ttf');
const FONT_SIZE = 180;
const LETTER_SPACING = 8;
const OUT_JS = path.resolve('src/assets/paths/hello-curtis-d.js');

function toFixed(n, p=3) { return Number.parseFloat(n).toFixed(p); }

function pathToSvgD(pathCommands, precision=3) {
  let d = '';
  for (const c of pathCommands) {
    switch (c.type) {
      case 'M': d += `M${toFixed(c.x,precision)},${toFixed(c.y,precision)} `; break;
      case 'L': d += `L${toFixed(c.x,precision)},${toFixed(c.y,precision)} `; break;
      case 'C': d += `C${toFixed(c.x1,precision)},${toFixed(c.y1,precision)} ${toFixed(c.x2,precision)},${toFixed(c.y2,precision)} ${toFixed(c.x,precision)},${toFixed(c.y,precision)} `; break;
      case 'Q': d += `Q${toFixed(c.x1,precision)},${toFixed(c.y1,precision)} ${toFixed(c.x,precision)},${toFixed(c.y,precision)} `; break;
      case 'Z': d += 'Z '; break;
    }
  }
  return d.trim();
}

(async () => {
  const font = await opentype.load(FONT_PATH);
  let x = 0;
  let dParts = [];
  
  for (const ch of TEXT) {
    const glyph = font.charToGlyph(ch);
    const glyphPath = glyph.getPath(x, 0, FONT_SIZE);
    const d = pathToSvgD(glyphPath.commands, 3);
    dParts.push(d);
    x += glyph.advanceWidth * (FONT_SIZE / font.unitsPerEm) + LETTER_SPACING;
  }
  
  const finalD = dParts.join(' ');
  const js = `// auto-generated\nexport const HELLO_CURTIS_PATH_D = ${JSON.stringify(finalD)};\n`;
  
  fs.mkdirSync(path.dirname(OUT_JS), { recursive: true });
  fs.writeFileSync(OUT_JS, js, 'utf8');
  console.log(`Wrote ${OUT_JS}`);
})();
