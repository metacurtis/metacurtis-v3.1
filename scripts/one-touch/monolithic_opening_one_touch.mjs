#!/usr/bin/env node
import fs from 'node:fs';

function patchFile(path, mut) {
  if (!fs.existsSync(path)) { console.error('❌ Missing', path); process.exitCode = 1; return; }
  const src = fs.readFileSync(path, 'utf8');
  const out = mut(src);
  if (out !== src) {
    fs.writeFileSync(path + `.bak.monolithic-${Date.now()}`, src, 'utf8');
    fs.writeFileSync(path, out, 'utf8');
    console.log('✓ Patched', path);
  } else {
    console.log('• No changes needed in', path);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   A) EVENTS — ensure OPENING_COMPLETE exists
   ────────────────────────────────────────────────────────────────────────── */
patchFile('src/theater/events.js', (s) => {
  let t = s;
  if (!/OPENING_COMPLETE/.test(t)) {
    t = t.replace(
      /START_NARRATIVE:\s*'START_NARRATIVE',/,
      `START_NARRATIVE: 'START_NARRATIVE',
  OPENING_COMPLETE: 'OPENING_COMPLETE',`
    );
  }
  return t;
});

/* ──────────────────────────────────────────────────────────────────────────
   B) OpeningSequence.jsx — monolithic cinematic intro
   (uses Three.js, drives its own canvas, emits OPENING_COMPLETE)
   ────────────────────────────────────────────────────────────────────────── */
const MONOLITH = `// src/components/theater/OpeningSequence.jsx
// Monolithic opening sequence — owns everything until handoff

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default function OpeningSequence() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState('idle');
  const [cursorVisible, setCursorVisible] = useState(false);
  const [lines, setLines] = useState([]);
  const [currentTypingLine, setCurrentTypingLine] = useState(-1);
  const [screenFillLines, setScreenFillLines] = useState([]);

  const mounted = useRef(true);
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const particlesRef = useRef(null);
  const frameRef = useRef(null);

  const initThree = () => {
    if (!canvasRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
  };

  const createBigBangParticles = () => {
    const count = 2000;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const spread = 80; // ~75% of view
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3 + 0] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = (Math.random() - 0.5) * spread;
      positions[i3 + 2] = (Math.random() - 0.5) * spread * 0.5;

      // C64 green
      colors[i3 + 0] = 0.0;
      colors[i3 + 1] = 1.0;
      colors[i3 + 2] = 0.0;

      sizes[i] = 1 + Math.random() * 3;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    const pts = new THREE.Points(geom, mat);
    particlesRef.current = pts;
    sceneRef.current.add(pts);
  };

  // 2s swirl with light chaos; renders every frame
  const animateSwirl = (duration) => new Promise(resolve => {
    const start = performance.now();
    const tick = () => {
      if (!mounted.current) return resolve();
      const el = performance.now() - start;
      const k = Math.min(1, el / duration);

      if (particlesRef.current) {
        const p = particlesRef.current;
        p.rotation.z += 0.005;
        p.rotation.x += 0.002;

        // micro chaos
        const arr = p.geometry.attributes.position.array;
        for (let i = 0; i < arr.length; i += 3) {
          arr[i+0] += (Math.random() - 0.5) * 0.25;
          arr[i+1] += (Math.random() - 0.5) * 0.25;
        }
        p.geometry.attributes.position.needsUpdate = true;
      }

      rendererRef.current?.render(sceneRef.current, cameraRef.current);
      if (k < 1) { frameRef.current = requestAnimationFrame(tick); } else { resolve(); }
    };
    tick();
  });

  // settle to a simple 4-ring constellation (tiered radii)
  const settleToConstellation = (duration) => new Promise(resolve => {
    const start = performance.now();
    const positions = particlesRef.current.geometry.attributes.position.array;
    const startPos = new Float32Array(positions);
    const target = new Float32Array(positions.length);
    const n = positions.length / 3;

    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      const tier = Math.floor((i / n) * 4.0); // 0..3
      const radius = 40 - tier * 10;
      const ang = (i / n) * Math.PI * 2;
      target[i3 + 0] = Math.cos(ang) * radius;
      target[i3 + 1] = Math.sin(ang) * radius;
      target[i3 + 2] = (Math.random() - 0.5) * 10;
    }

    const tick = () => {
      if (!mounted.current) return resolve();
      const el = performance.now() - start;
      const k = Math.min(1, el / duration);
      const e = k * k * (3 - 2 * k); // smoothstep

      for (let i = 0; i < positions.length; i++) {
        positions[i] = startPos[i] + (target[i] - startPos[i]) * e;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;

      // damp swirl
      particlesRef.current.rotation.z *= 0.985;
      particlesRef.current.rotation.x *= 0.985;

      rendererRef.current?.render(sceneRef.current, cameraRef.current);
      if (k < 1) { frameRef.current = requestAnimationFrame(tick); } else { resolve(); }
    };
    tick();
  });

  const runOpeningSequence = async () => {
    if (!mounted.current) return;

    // Phase 1: black (2s)
    setPhase('black'); await sleep(2000);

    // Phase 2: cursor blinks twice (~2.5s total)
    setPhase('cursor'); setCursorVisible(true); await sleep(500);
    for (let i = 0; i < 2; i++) { setCursorVisible(false); await sleep(500); setCursorVisible(true); await sleep(500); }
    setCursorVisible(false);

    // Phase 3: terminal typing
    setPhase('typing');
    const toType = ['READY.', '10 PRINT "HELLO CURTIS"', '20 GOTO 10', 'RUN'];
    for (let lineIdx = 0; lineIdx < toType.length; lineIdx++) {
      const line = toType[lineIdx];
      setCurrentTypingLine(lineIdx);
      let cur = ''; setLines(prev => [...prev, '']);
      for (let c = 0; c < line.length; c++) {
        cur += line[c];
        setLines(prev => { const u = [...prev]; u[lineIdx] = cur; return u; });
        await sleep(50);
      }
      if (lineIdx < toType.length - 1) await sleep(300);
    }
    setCurrentTypingLine(-1);

    // Phase 4: screen fill (brief)
    setPhase('fill');
    const fillText = 'HELLO CURTIS '.repeat(10);
    for (let i = 0; i < 30; i++) { setScreenFillLines(prev => [...prev, fillText]); await sleep(50); }

    // Phase 5: particles
    setPhase('particles'); initThree(); createBigBangParticles();
    setVisible(false);

    // Swirl (2s) → settle (1.5s)
    await animateSwirl(2000);
    await settleToConstellation(1500);

    // Handoff: tell app we're done; start in genesis constellation w/ scroll locked until ENABLE_SCROLL
    BeatBus.emit(EVENTS.OPENING_COMPLETE, { stage: 'genesis', particleState: 'constellation' });

    setPhase('complete');
  };

  useEffect(() => {
    mounted.current = true;
    runOpeningSequence();
    return () => {
      mounted.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      rendererRef.current?.dispose();
    };
  }, []);

  if (phase === 'complete') return null;

  return (
    <>
      {/* Overlay */}
      <div className="opening-sequence"
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: phase === 'particles' ? 'transparent' : '#000',
          color: '#00FF00', fontFamily: "'Courier New', monospace",
          zIndex: phase === 'particles' ? 998 : 9999,
          transition: 'opacity 0.7s', opacity: visible ? 1 : 0,
          pointerEvents: 'none'
        }}
      >
        {phase === 'cursor' && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>
            <span style={{fontSize:'2rem',color:'#00FF00',opacity:cursorVisible?1:0,textShadow:'0 0 10px #00FF00'}}> _ </span>
          </div>
        )}
        {phase === 'typing' && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',padding:'2rem'}}>
            <pre style={{color:'#00FF00',textShadow:'0 0 5px #00FF00'}}>
              {lines.map((line, idx) => (<div key={idx}>{line}{idx === currentTypingLine && '_'}</div>))}
            </pre>
          </div>
        )}
        {phase === 'fill' && (
          <div style={{position:'absolute',inset:0,overflow:'hidden'}}>
            {screenFillLines.map((line, idx) => (
              <div key={idx} style={{whiteSpace:'nowrap',color:'#00FF00',opacity:0.8}}>{line}</div>
            ))}
          </div>
        )}
      </div>

      {/* Three.js canvas */}
      <canvas ref={canvasRef}
        style={{position:'fixed',inset:0,width:'100vw',height:'100vh',zIndex:999,display: phase==='particles'?'block':'none'}}
      />
    </>
  );
}
`;

patchFile('src/components/theater/OpeningSequence.jsx', () => MONOLITH);

/* ──────────────────────────────────────────────────────────────────────────
   C) ConsciousnessTheater.jsx — do NOT start Director during opening.
      Show main canvas after OPENING_COMPLETE and hand off to runtime.
   ────────────────────────────────────────────────────────────────────────── */
patchFile('src/components/consciousness/ConsciousnessTheater.jsx', (s) => {
  let t = s;

  // add showCanvas state default false
  if (!/const \[showCanvas\]/.test(t)) {
    t = t.replace(
      /const \[morphProgress[\s\S]*?\];/,
      (m)=> m + `\n  const [showCanvas, setShowCanvas] = useState(false);\n`
    );
  }

  // remove/disable any auto director.start gates; wait for OPENING_COMPLETE
  if (/director\.start\(\)/.test(t)) {
    t = t.replace(/director\.start\(\);/g, '// director.start() (disabled during monolithic opening)');
  }

  // add OPENING_COMPLETE listener → show canvas + set stage + scroll enable
  if (!/OPENING_COMPLETE/.test(t)) {
    t = t.replace(
      /const offs = \[/,
      `const offs = [
      BeatBus.on(EVENTS.OPENING_COMPLETE, (p={}) => {
        // reveal main renderer
        setShowCanvas(true);
        // set stage-0 constellated and enable scroll
        BeatBus.emit(EVENTS.STAGE_CHANGE, { stage: 'genesis' });
        BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: 1 });
        BeatBus.emit(EVENTS.ENABLE_SCROLL);
      }),`
    );
  }

  // lock scroll until enable
  if (!/document\.body\.style\.overflow\s*=\s*'hidden'/.test(t)) {
    t = t.replace(
      /useEffect\(\(\)\s*=>\s*\{\s*/,
      `useEffect(() => {
    document.body.style.overflow = 'hidden';`
    );
    t = t.replace(
      /return \(\) => \{\s*/,
      `return () => {
    document.body.style.overflow = '';`
    );
  }

  // Render condition for WebGLCanvas — show only after opening
  t = t.replace(
    /\{showCanvas\s*\?\s*.*?\:\s*.*?\}/s, // if there is a ternary, avoid double-applying
    (m)=> m
  );
  if (!/WebGLCanvas[\s\S]*showCanvas/.test(t)) {
    t = t.replace(
      /\{showCanvas && \(\s*<WebGLCanvas[\s\S]*?\/>\s*\)\s*\}/m,
      (m)=> m // already controlled
    );
    // if WebGLCanvas is unconditional, wrap it
    if (/<WebGLCanvas[\s\S]*\/>/.test(t) && !/\{showCanvas &&/.test(t)) {
      t = t.replace(
        /(<WebGLCanvas[\s\S]*\/>)/,
        `{showCanvas && ($1)}`
      );
    }
  }

  return t;
});
