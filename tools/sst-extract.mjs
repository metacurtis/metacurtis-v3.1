import fs from 'fs';
import path from 'path';

const outDir = 'reports';
await fs.promises.mkdir(outDir, { recursive: true });

const candidates = [
  'sst/canon/v3.5.json',
  'sst/canon/v3.4.json',
  'sst/canon/v3.3.json',
  'sst/canon/v3.0.json'
];
let sstPath = null;
for (const c of candidates) { if (fs.existsSync(c)) { sstPath = c; break; } }

let result = { error: 'SST not found', searched: candidates };
if (sstPath) {
  const raw = await fs.promises.readFile(sstPath,'utf8');
  const sst = JSON.parse(raw);
  const stages = Object.keys(sst.stages || {});
  const cameraByStage = {};
  const beatsByStage = {};
  for (const st of stages) {
    cameraByStage[st] = sst.stages[st]?.camera || null;
    const beats = sst.stages[st]?.beats || sst.stages[st]?.narrative?.beats || null;
    if (Array.isArray(beats)) {
      beatsByStage[st] = beats.map((b,i)=>({ index:i, when:b.when??null, text:b.text??null, visual:b.visual??null }));
    }
  }
  result = {
    source: sstPath,
    version: sst.version || null,
    mode: sst.mode || null,
    openingPhases: sst.opening?.timeline ? (sst.opening) : (sst.opening||{}),
    stages,
    morphProfiles: sst.morphProfiles || {},
    cameraByStage,
    beatsByStage,
    generatedAt: new Date().toISOString()
  };
}
await fs.promises.writeFile(path.join(outDir,'sst-extract.json'), JSON.stringify(result,null,2));
console.log('[sst-extract] wrote reports/sst-extract.json');
