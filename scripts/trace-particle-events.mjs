#!/usr/bin/env node
import { readFileSync } from 'fs';
import { glob } from 'glob';

const PARTICLE_EVENTS = [
  'BLUEPRINT_READY',
  'MORPH_PROGRESS',
  'RENDER_DIRECTIVE',
  'STAGE_CHANGE',
  'EMERGENCE_START',
  'EMERGENCE_COMPLETE'
];

const files = glob.sync('src/**/*.{js,jsx}');
const eventMap = {};

PARTICLE_EVENTS.forEach(event => {
  eventMap[event] = { emitters: [], listeners: [] };
});

files.forEach(file => {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  PARTICLE_EVENTS.forEach(event => {
    lines.forEach((line, i) => {
      // Detect emitters
      if (new RegExp(`emit.*${event}|pushTrace.*${event}`, 'i').test(line)) {
        eventMap[event].emitters.push({
          file,
          line: i + 1,
          code: line.trim()
        });
      }
      
      // Detect listeners
      if (new RegExp(`on.*${event}|addEventListener.*${event}|listen.*${event}`, 'i').test(line)) {
        eventMap[event].listeners.push({
          file,
          line: i + 1,
          code: line.trim()
        });
      }
    });
  });
});

// Generate report
console.log('# Particle Event Flow Topology\n');

PARTICLE_EVENTS.forEach(event => {
  const { emitters, listeners } = eventMap[event];
  
  console.log(`## ${event}\n`);
  console.log(`**Emitters:** ${emitters.length}`);
  console.log(`**Listeners:** ${listeners.length}\n`);
  
  if (emitters.length > 0) {
    console.log('### Emitters\n');
    emitters.forEach(e => {
      console.log(`- \`${e.file}:${e.line}\``);
      console.log('  ```javascript');
      console.log(`  ${e.code}`);
      console.log('  ```');
    });
    console.log();
  }
  
  if (listeners.length > 0) {
    console.log('### Listeners\n');
    listeners.forEach(l => {
      console.log(`- \`${l.file}:${l.line}\``);
      console.log('  ```javascript');
      console.log(`  ${l.code}`);
      console.log('  ```');
    });
    console.log();
  }
  
  // Analysis
  if (emitters.length > 1) {
    console.log('⚠️ **RACE CONDITION RISK:** Multiple emitters detected\n');
  }
  if (emitters.length === 0) {
    console.log('⚠️ **MISSING EMITTER:** No source found\n');
  }
  if (listeners.length === 0 && emitters.length > 0) {
    console.log('⚠️ **ORPHANED EVENT:** Emitted but no listeners\n');
  }
  
  console.log('---\n');
});
