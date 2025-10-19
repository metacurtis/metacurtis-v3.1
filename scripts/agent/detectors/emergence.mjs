/* eslint-env node */
import { readFile } from '../core/ast.mjs';

// Engine
export function detectEngineGlyphSource(rel) {
  const s = readFile(rel) || '';
  const hasCanvasSampler = /_sampleTextToPositions|HOTDORS_GLYPH_SAMPLER/.test(s);
  const hasResolver      = /FormationResolver|resolver\.get|buildHelloCurtis/i.test(s);
  return hasCanvasSampler || hasResolver;
}
export function detectEngineBurstParams(rel) {
  const s = readFile(rel) || '';
  const mj = /const\s+jitter\s*=\s*(\d+(?:\.\d+)?)/.exec(s);
  const mz = /text3DPositions\[\s*j\s*\+\s*2\s*\]\s*=\s*\(Math\.random\(\)\s*-\s*0\.5\)\s*\*\s*(\d+(?:\.\d+)?)/.exec(s);
  return (mj && Number(mj[1]) >= 25) && (mz && Number(mz[1]) >= 6);
}

// Renderer
export function detectRendererBindGlyphAttrs(rel) {
  const s = readFile(rel) || '';
  const bindsAtmos = /setAttribute\(\s*['"]atmosphericPosition['"]/.test(s);
  const bindsText3D = /setAttribute\(\s*['"]text3DPosition['"]/.test(s);
  const mentionsAllen = /allen/i.test(s);
  return bindsAtmos && bindsText3D && !mentionsAllen;
}
export function detectRendererEmitOnce(rel) {
  const s = readFile(rel) || '';
  return /BeatBus\.emit\?\.\(EVENTS\.PARTICLES_EMERGED\)/.test(s);
}
export function detectRendererStage0TintLock(rel) {
  const s = readFile(rel) || '';
  const hasIsGen   = /const\s+isGenesis\s*=\s*stageName\s*===\s*['"]genesis['"]/.test(s);
  const nextLocked = /uColorNext:\s*\{\s*value:\s*isGenesis\s*\?\s*current\s*:\s*next\s*\}/.test(s);
  const blendZero  = /uStageBlend\.value\s*=\s*\(stageName\s*===\s*['"]genesis['"]\)\s*\?\s*0\s*:\s*sp/.test(s);
  return hasIsGen && nextLocked && blendZero;
}

// Director
export function detectDirectorSettle(rel) {
  const s = readFile(rel) || '';
  const hasHelper = /_easeMorphTo\s*\(/.test(s);
  const sequence  = /once\(\s*EVENTS\.PARTICLES_EMERGED[\s\S]*STAGE_CHANGE\(['"]genesis['"]\)[\s*S]*_easeMorphTo\(\s*1/i.test(s);
  return hasHelper && sequence;
}

// Opening
export function detectOpeningNoCTF(rel) {
  const s = readFile(rel) || '';
  return !/CTF_BUILD/.test(s);
}
export function detectOpeningAudioGate(rel) {
  const s = readFile(rel) || '';
  return /__gestureOk|__unlockAudio|gesture gate for autoplay/.test(s);
}
