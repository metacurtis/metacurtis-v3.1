#!/usr/bin/env node
/* eslint-env node */
import fs from 'node:fs'; import path from 'node:path';
const args=new Set(process.argv.slice(2)); const checkOpening=args.has('--opening')||!args.size; const checkVision=args.has('--vision')||!args.size;
const read=(p)=>{ try{return fs.readFileSync(p,'utf8')}catch{return ''} };
let fails=0;

/* Opening checks (static) */
if (checkOpening){
  const opening  = read('src/components/theater/OpeningSequence.jsx');
  const engine   = read('src/engine/ConsciousnessEngine.js');
  const renderer = read('src/components/webgl/WebGLBackground.jsx');
  const theater  = read('src/components/consciousness/ConsciousnessTheater.jsx');
  const rows=[]; const row=(ok,l)=>{ rows.push((ok?'OK ':'X  ')+l); if(!ok) fails++; };

  // baseline fencepost
  row(/import\s+BeatBus\s+from\s+['"]@\/theater\/bus['"]/.test(opening),'OpeningSequence uses single bus');
  row(!/CTF_BUILD/.test(opening),'OpeningSequence has no CTF');
  row(!/(BufferGeometry|useFrame|THREE\.)/.test(opening),'OpeningSequence overlay-only');
  row(/buildAndEmitBlueprint[^]*?if\s*\(\s*this\._openingPhase\s*&&\s*stage\s*!==\s*['"]genesis['"]\s*\)/.test(engine),'Engine gate at top of buildAndEmitBlueprint');
  row(/BLUEPRINT_READY[^]*mode\s*:\s*['"]emergence['"]/.test(engine),'Engine emergence emits mode:"emergence"');
  const spiral=/(swirl|spiral)/.test(engine)||(/ang\s*=\s*(?:i|t)[^;]*\*/.test(engine)&&/\br\s*=\s*(?:i|t)\s*\*/.test(engine));
  row(!spiral,'Engine emergence random->random (no spiral)');
  row(/BeatBus\.emit\(\s*EVENTS\.PARTICLES_EMERGED/.test(renderer),'Renderer emits PARTICLES_EMERGED fencepost once');
  row(/ENGINE_VIEWPORT_HINT/.test(theater),'Theater start-after-viewport gate present');

  // Phase-1 static style contracts (OpeningSequence)
  row(/fontFamily:\s*["'][^"']*Courier New[^"']*["']/.test(opening),'OpeningSequence strict mono font stack');
  row(!/textShadow:\s*['"][^'"]+['"]/.test(opening) || /textShadow:\s*['"]none['"]/.test(opening),'OpeningSequence no glow');
  row(/__opening_fill_start_lines/.test(opening) && /setScreenFillLines\(\s*\[\s*\]\s*\)/.test(opening),'OpeningSequence progressive fill (no flash)');

  console.log('\nOpening checks:'); rows.forEach(l=>console.log(l));
  console.log('\nOpening sentinel:', rows.some(l=>l.startsWith('X'))?'FAIL':'OK');
}

/* Vision checks (telemetry) — __PHASE1_VISION_CHECKS__ */
if (checkVision){
  const vcPath='vision/vision-contract.v1.json';
  if(!fs.existsSync(vcPath)){ console.log('\nVision: contract not found (vision/vision-contract.v1.json)'); }
  else{
    const VC=JSON.parse(fs.readFileSync(vcPath,'utf8'));
    const teleDir='.vision/telemetry'; let tel=null;
    try{ const files=fs.readdirSync(teleDir).filter(f=>f.endsWith('.json'));
      if(files.length){ tel=files.map(f=>path.join(teleDir,f)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs)[0]; } }catch{}
    if(!tel){ console.log('\nVision: no telemetry in .vision/telemetry — run: npm run agent:run -- --goal=opening:record'); }
    else{
      const t = JSON.parse(fs.readFileSync(tel,'utf8'));
      console.log('\nVision checks ('+path.basename(tel)+')');
      const inR=(v,[lo,hi])=>typeof v==='number'&&v>=lo&&v<=hi;
      const ok=(m)=>console.log('OK ',m), bad=(m)=>{ console.log('X  ',m); fails++; };

      // No initial flash
      (t.fillLinesAtStart??0)===0 ? ok('No initial fill flash') : bad('Initial fill flashed');

      // Phase-1 timings (relative to t0)
      const P1=VC.opening?.phase1||{}, tolCursor=P1.cursor?.toleranceMs??80, tolType=P1.typing?.toleranceMs??120, tolFill=P1.fill?.toleranceMs??80;
      const t0 = t.tStart ?? t.tOpeningMounted ?? Math.min(...[t.tCursorShow,t.tTypingStart,t.tFillStart].filter(x=>typeof x==='number'&&x>=0));
      const rel = (x)=> (typeof x==='number'&&typeof t0==='number') ? (x - t0) : null;

      const dCursor = rel(t.tCursorShow);
      const dType   = rel(t.tTypingStart);
      const dFill   = rel(t.tFillStart);

      if (dCursor==null) console.log('▲ Missing tCursorShow'); else Math.abs(dCursor - (P1.cursor?.atMs??2000))<=tolCursor ? ok('Cursor @2.0s (±tol)') : bad(`Cursor at ${Math.round(dCursor)}ms (!=2000±${tolCursor})`);
      if (dType  ==null) console.log('▲ Missing tTypingStart'); else Math.abs(dType   - (P1.typing?.atMs??2250))<=tolType   ? ok('Typing @2.25s (±tol)') : bad(`Typing at ${Math.round(dType)}ms (!=2250±${tolType})`);
      if (dFill  ==null) console.log('▲ Missing tFillStart');  else Math.abs(dFill   - (P1.fill?.atMs??3000))<=tolFill     ? ok('Fill @3.0s (±tol)')    : bad(`Fill at ${Math.round(dFill)}ms (!=3000±${tolFill})`);

      // Min fill visible
      const minFill = VC.opening?.phase1?.fill?.minVisibleMs ?? VC.opening?.timeline?.minFillVisibleMs ?? 1200;
      if (typeof t.tFillStart==='number' && typeof t.tFadeOutStart==='number'){
        const vis = t.tFadeOutStart - t.tFillStart;
        vis >= minFill ? ok('Fill visible ≥ min') : bad(`Fill visible ${Math.round(vis)}ms < ${minFill}ms`);
      } else {
        console.log('▲ Missing tFillStart/tFadeOutStart');
      }

      console.log('\nVision sentinel:', fails? 'FAIL':'OK');
    }
  }
}

process.exit(fails?1:0);
