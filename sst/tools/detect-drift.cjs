#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m'
};

const SST = require('../canon/v3.5.json');

const allowList = [
  /src\/components\/webgl\/WebGLCanvas\.jsx$/,
  /src\/core\/CentralEventClock\.js$/,
  /src\/hooks\/useAdaptiveQuality\.js$/,
  /src\/state\/atoms\/qualityAtom\.js$/,
  /src\/config\/sst3\/sst-v3\.0-config\.js$/
];

const driftPatterns = [
  {
    name: 'Hardcoded Particle Counts',
    regex: /particleCount\s*[:=]\s*(\d{4,5})/g,
    check: (match) => {
      const count = Number(match[1]);
      const stage = Object.entries(SST.performance.particleCount)
        .find(([, value]) => value === count);
      if (stage) {
        return {
          issue: `Hardcoded particle count: ${count}`,
          fix: `Use SST.performance.particleCount.${stage[0]}`
        };
      }
      return null;
    }
  },
  {
    name: 'Hardcoded FPS Targets',
    regex: /(?:fps|frameRate|target)\s*[<>=]{1,2}\s*(\d{2})/gi,
    check: (match) => {
      const fps = Number(match[1]);
      if (fps === SST.performance.frameRate.target) {
        return {
          issue: `Hardcoded FPS target: ${fps}`,
          fix: 'Use SST.performance.frameRate.target'
        };
      }
      if (fps === SST.performance.frameRate.minimum) {
        return {
          issue: `Hardcoded FPS minimum: ${fps}`,
          fix: 'Use SST.performance.frameRate.minimum'
        };
      }
      return null;
    }
  },
  {
    name: 'Hardcoded Stage Words',
    regex: /(["'`])(HELLO CURTIS|STRUCTURE|AWAKENING|VELOCITY|SYSTEMS|FLOW STATE|CONSCIOUSNESS)\1/g,
    check: (match) => {
      const word = match[2];
      const stage = Object.entries(SST.visual.letterGeometry)
        .find(([, config]) => config.word === word);
      if (stage) {
        return {
          issue: `Hardcoded stage word: "${word}"`,
          fix: `Use SST.visual.letterGeometry.${stage[0]}.word`
        };
      }
      return null;
    }
  },
  {
    name: 'Hardcoded Font Names',
    regex: /font(?:Family)?\s*[:=]\s*["'`]([^"'`]+)["'`]/gi,
    check: (match) => {
      const font = match[1];
      const stage = Object.entries(SST.visual.letterGeometry)
        .find(([, config]) => config.font === font);
      if (stage) {
        return {
          issue: `Hardcoded font: "${font}"`,
          fix: `Use SST.visual.letterGeometry.${stage[0]}.font`
        };
      }
      return null;
    }
  },
  {
    name: 'Hardcoded Tier Mix',
    regex: /tierMix\s*[:=]\s*\[(.*?)\]/gis,
    check: (match, file) => {
      if (/canonical|sst\/canon/.test(file)) return null;
      return {
        issue: `Hardcoded tierMix detected: [${match[1]}]`,
        fix: 'Derive tier mix from Canonical.stages[stage].tierMix',
      };
    },
  },
  {
    name: 'Hardcoded Motion Behavior',
    regex: /(drift_perlin_slow|orbital_micro|twinkle_soft|pulse_soft|breathing_rhythm|tier2_lock_into_grid|tier3_cadence_pulse)/gi,
    check: (match, file) => {
      if (/canonical|sst\/canon/.test(file)) return null;
      return {
        issue: `Hardcoded motion behavior "${match[1]}"`,
        fix: 'Read motionBehaviors from Canonical.stages[stage].motionBehaviors',
      };
    },
  },
  {
    name: 'Hardcoded Camera Cue',
    regex: /camera\s*[:=]\s*\{[^}]*movement\s*:\s*["'`](.+?)["'`]/gis,
    check: (match, file) => {
      if (/canonical|sst\/canon/.test(file)) return null;
      return {
        issue: `Hardcoded camera movement "${match[1]}"`,
        fix: 'Reference Canonical.visual.camera[stage] or Canonical.stages[stage].camera',
      };
    },
  }
];

const filesToScan = glob.sync('src/**/*.{js,jsx}', {
  ignore: ['**/node_modules/**', '**/sst/**'],
  nodir: true
});

const violations = [];

filesToScan.forEach((file) => {
  if (allowList.some((pattern) => pattern.test(file))) {
    return;
  }

  const code = fs.readFileSync(file, 'utf8');
  driftPatterns.forEach((pattern) => {
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(code)) !== null) {
      const result = pattern.check(match, file);
      if (result) {
        const preceding = code.slice(0, match.index);
        const line = preceding.split('\n').length;
        violations.push({ file, line, ...result });
      }
    }
  });
});

if (violations.length > 0) {
  console.log(`${colors.red}❌ SST Drift Detected (${violations.length} violations)${colors.reset}\n`);
  violations.forEach((v) => {
    console.log(`${colors.yellow}${v.file}:${v.line}${colors.reset}`);
    console.log(`  Issue: ${v.issue}`);
    console.log(`  Fix: ${v.fix}\n`);
  });
  process.exit(1);
}

console.log(`${colors.green}✅ No drift detected - all values reference SST${colors.reset}`);
process.exit(0);
