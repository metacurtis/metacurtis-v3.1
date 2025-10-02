#!/usr/bin/env node
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const schemaPath = path.resolve(__dirname, '../canon/schema.json');
const schema = require(schemaPath);

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const tests = [
  {
    name: 'Valid SST v3.5 payload',
    data: {
      meta: {
        version: '3.5.0',
        authority: 'ABSOLUTE',
        lastUpdated: '2025-10-02'
      },
      visual: {
        system: '3d_kinetic_typography',
        letterGeometry: {
          genesis: { word: 'HELLO CURTIS', font: 'Courier Prime', weight: 400, depth: 0.3, particlesPerLetter: 200, spacing: 1.1, scale: 1.0 },
          discipline: { word: 'STRUCTURE', font: 'Inter', weight: 700, depth: 0.5, particlesPerLetter: 250, spacing: 1.0, scale: 1.1 },
          neural: { word: 'AWAKENING', font: 'Playfair Display', weight: 600, depth: 0.4, particlesPerLetter: 500, spacing: 1.05, scale: 1.05 },
          velocity: { word: 'VELOCITY', font: 'Archivo Black', weight: 800, depth: 0.6, particlesPerLetter: 1200, spacing: 0.95, scale: 1.2 },
          architecture: { word: 'SYSTEMS', font: 'JetBrains Mono', weight: 500, depth: 0.5, particlesPerLetter: 900, spacing: 1.1, scale: 1.05 },
          harmony: { word: 'FLOW STATE', font: 'Cormorant Garamond', weight: 600, depth: 0.4, particlesPerLetter: 1100, spacing: 1.08, scale: 1.0 },
          transcendence: { word: 'CONSCIOUSNESS', font: 'Montserrat', weight: 300, depth: 0.7, particlesPerLetter: 1300, spacing: 1.05, scale: 1.2 }
        }
      },
      narrative: {
        orchestration: {
          mode: 'narration-driven',
          scrollLocked: true,
          skipKey: 'SPACE'
        }
      },
      performance: {
        frameRate: { target: 60, minimum: 55 },
        particleCount: {
          genesis: 2000,
          discipline: 3000,
          neural: 5000,
          velocity: 12000,
          architecture: 8000,
          harmony: 12000,
          transcendence: 15000
        }
      }
    },
    expect: true
  },
  {
    name: 'Invalid SST payload (missing stage geometry)',
    data: {
      meta: {
        version: '3.5.1',
        authority: 'ABSOLUTE',
        lastUpdated: '2025-10-05'
      },
      visual: {
        system: '3d_kinetic_typography',
        letterGeometry: {
          genesis: { word: 'HELLO CURTIS', font: 'Courier Prime', weight: 400, depth: 0.3, particlesPerLetter: 200, spacing: 1.1, scale: 1.0 }
        }
      },
      narrative: {
        orchestration: {
          mode: 'scroll-driven',
          scrollLocked: false,
          skipKey: 'ENTER'
        }
      },
      performance: {
        frameRate: { target: 60, minimum: 55 },
        particleCount: {
          genesis: 2000,
          discipline: 3000,
          neural: 5000,
          velocity: 12000,
          architecture: 8000,
          harmony: 12000,
          transcendence: 15000
        }
      }
    },
    expect: false
  }
];

let hasFailures = false;
for (const test of tests) {
  const result = validate(test.data);
  if (result !== test.expect) {
    hasFailures = true;
    console.log(`❌ ${test.name}`);
    if (!result) {
      console.log('   Errors:', validate.errors);
    }
  } else {
    console.log(`✅ ${test.name}`);
  }
}

if (hasFailures) {
  process.exitCode = 1;
}
