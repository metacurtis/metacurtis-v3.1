#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

let clipboardy;
try {
  // eslint-disable-next-line global-require
  clipboardy = require('clipboardy');
  if (clipboardy && clipboardy.default) {
    clipboardy = clipboardy.default;
  }
} catch (error) {
  clipboardy = null;
}

const colors = {
  reset: '\x1b[0m',
  yellow: '\x1b[33m'
};

const sstPath = path.resolve('sst/canon/v3.5.json');
const SST = JSON.parse(fs.readFileSync(sstPath, 'utf8'));

const stageNames = ['genesis', 'discipline', 'neural', 'velocity', 'architecture', 'harmony', 'transcendence'];
const systemKeywords = {
  camera: ['camera', 'orbit', 'reveal', 'movement', 'dolly', 'push'],
  particles: ['particle', 'tier', 'morph', 'spread'],
  typography: ['letter', 'font', 'word', 'glyph', 'typography'],
  performance: ['performance', 'fps', 'frame', 'optimize'],
  narration: ['narration', 'dialogue', 'audio', 'beat', 'story']
};

function parseTask(taskString) {
  const lowered = taskString.toLowerCase();
  const stage = stageNames.find((name) => lowered.includes(name));
  const system = Object.keys(systemKeywords).find((key) =>
    systemKeywords[key].some((keyword) => lowered.includes(keyword))
  );
  return { stage, system };
}

function extractRelevantData(stage, system) {
  const data = {};

  if (stage) {
    if ((system === 'typography' || system === 'particles') && SST.visual.letterGeometry[stage]) {
      data.letterGeometry = SST.visual.letterGeometry[stage];
    }
    if (system === 'camera' && SST.visual.camera?.[stage]) {
      data.camera = SST.visual.camera[stage];
    }
    if (system === 'performance' && SST.performance.particleCount?.[stage] !== undefined) {
      data.particleCount = SST.performance.particleCount[stage];
      data.frameRate = SST.performance.frameRate;
    }
  } else {
    if (system === 'performance') {
      data.performance = SST.performance;
    }
    if (system === 'typography') {
      data.letterGeometry = SST.visual.letterGeometry;
    }
  }

  if (!stage && !system) {
    data.summary = {
      meta: SST.meta,
      systems: Object.keys(SST.visual.letterGeometry)
    };
  }

  return data;
}

function suggestFiles(stage, system) {
  const map = {
    camera: ['src/components/webgl/CameraController.js', 'src/engine/ConsciousnessEngine.js'],
    particles: ['src/engine/ConsciousnessEngine.js', 'src/components/webgl/WebGLBackground.jsx'],
    typography: ['src/engine/LetterGeometryGenerator.js', 'src/config/sst-loader.js'],
    performance: ['src/hooks/useAdaptiveQuality.js', 'src/state/atoms/qualityAtom.js'],
    narration: ['src/theater/TheaterDirector.js', 'src/theater/NarrationController.js']
  };
  return map[system] || ['(identify relevant files based on feature)'];
}

function generateValidation(stage, system) {
  if (system === 'camera' && stage) return `probe.camera({ stage: '${stage}' })`;
  if (system === 'typography' && stage) return `probe.letterGeometry('${stage}')`;
  if (system === 'performance') return 'probe.performance()';
  if (system === 'particles' && stage) return `probe.particles('${stage}')`;
  if (system === 'narration') return 'probe.narration()';
  return 'probe.validate()';
}

function buildContext(taskString) {
  const { stage, system } = parseTask(taskString);
  const data = extractRelevantData(stage, system);
  const files = suggestFiles(stage, system);
  const validation = generateValidation(stage, system);

  const constraints = [];
  if (system === 'performance') {
    constraints.push(`Target FPS: ${SST.performance.frameRate.target}`);
    constraints.push(`Minimum FPS: ${SST.performance.frameRate.minimum}`);
  }
  if (stage && system !== 'performance' && typeof SST.performance.particleCount[stage] === 'number') {
    constraints.push(`Stage particle count: ${SST.performance.particleCount[stage]}`);
  }
  if (system === 'camera') {
    constraints.push('Camera motion must align with narration timeline.');
  }
  if (system === 'typography') {
    constraints.push('Maintain >95% legibility at all reveal angles.');
  }
  constraints.push('Do not hardcode canonical values; read from SST payload.');
  constraints.push('Changes must pass: npm run detect-drift');

  const context = `
═══════════════════════════════════════════════════════════════════
METACURTIS SST v${SST.meta.version} AUTHORITY
═══════════════════════════════════════════════════════════════════

TASK: ${taskString}
${stage ? `STAGE: ${stage}` : 'STAGE: (system-wide)'}
${system ? `SYSTEM: ${system}` : 'SYSTEM: (unspecified)'}

CANONICAL REQUIREMENTS:
${JSON.stringify(data, null, 2)}

CONSTRAINTS:
- ${constraints.join('\n- ')}

FILES TO MODIFY:
${files.map((file) => `- ${file}`).join('\n')}

VALIDATION:
Run: ${validation}
Expected: (define success criteria)

TESTING:
1. npm run validate-sst
2. npm run detect-drift
3. npm run test:sst-all

REFERENCE:
- Schema: sst/canon/schema.json
- Config: sst/canon/v3.5.json
- Types: src/types/sst-types.js

═══════════════════════════════════════════════════════════════════
`;

  return context;
}

const taskString = process.argv.slice(2).join(' ');

if (!taskString) {
  console.error(`${colors.yellow}Usage:${colors.reset} npm run ai-context "<task description>"`);
  process.exit(1);
}

const context = buildContext(taskString);
console.log(context);

if (clipboardy && typeof clipboardy.writeSync === 'function') {
  try {
    clipboardy.writeSync(context);
    console.log('✅ Context copied to clipboard.');
  } catch (error) {
    console.log('⚠️  Unable to copy to clipboard:', error.message);
  }
} else {
  console.log('⚠️  Install clipboard support with: npm install clipboardy');
}
