#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { walk } from './lib/walk.mjs';

const outDir = 'reports';
mkdirSync(outDir, { recursive: true });

const EMIT_PATTERNS = [
  /director\.emit\(['"]([^'"]+)['"]\)/g,
  /beatBus\.emit\(['"]([^'"]+)['"]\)/g,
  /BeatBus\.emit\(['"]([^'"]+)['"]\)/g,
  /\.emit\(['"]([^'"]+)['"]\)/g,
];

const LISTEN_PATTERNS = [
  /director\.on\(['"]([^'"]+)['"]\)/g,
  /beatBus\.on\(['"]([^'"]+)['"]\)/g,
  /BeatBus\.on\(['"]([^'"]+)['"]\)/g,
  /\.on\(['"]([^'"]+)['"]\)/g,
];

const emitters = {};
const listeners = {};

for await (const file of walk('src')) {
  const content = readFileSync(file, 'utf8');

  EMIT_PATTERNS.forEach(pattern => {
    const matches = [...content.matchAll(pattern)];
    matches.forEach(match => {
      const event = match[1];
      const lineIdx = content.substring(0, match.index).split('\n').length;
      if (!emitters[event]) emitters[event] = [];
      emitters[event].push({ file: file.replace(/^src\//, ''), line: lineIdx });
    });
  });

  LISTEN_PATTERNS.forEach(pattern => {
    const matches = [...content.matchAll(pattern)];
    matches.forEach(match => {
      const event = match[1];
      const lineIdx = content.substring(0, match.index).split('\n').length;
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push({ file: file.replace(/^src\//, ''), line: lineIdx });
    });
  });
}

const eventMap = {};
const allEvents = new Set([...Object.keys(emitters), ...Object.keys(listeners)]);
allEvents.forEach(event => {
  eventMap[event] = {
    emitters: emitters[event] || [],
    listeners: listeners[event] || []
  };
});

writeFileSync(join(outDir, 'beatbus-map.json'), JSON.stringify(eventMap, null, 2));

let md = '# Event Flow Map\n\n';
md += `Generated: ${new Date().toISOString()}\n\n`;
md += `Total Events: ${allEvents.size}\n\n`;
allEvents.forEach(event => {
  md += `## ${event}\n\n`;
  if (emitters[event]) {
    md += '**Emitters:**\n';
    emitters[event].forEach(e => md += `- ${e.file}:${e.line}\n`);
    md += '\n';
  }
  if (listeners[event]) {
    md += '**Listeners:**\n';
    listeners[event].forEach(l => md += `- ${l.file}:${l.line}\n`);
    md += '\n';
  }
});

writeFileSync(join(outDir, 'beatbus-map.md'), md);
console.log(`[trace-bus] Mapped ${allEvents.size} events → reports/beatbus-map.{json,md}`);
