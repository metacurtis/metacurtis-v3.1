#!/usr/bin/env node
const fs = require('fs');

const path = 'src/components/webgl/WebGLBackground.jsx';

if (!fs.existsSync(path)) {
  process.exit(0);
}

const s = fs.readFileSync(path, 'utf8');
const violations = [];

const fail = (msg) => {
  violations.push(msg);
};

// No rotation/timers in renderer
if (/rotation\.(x|y|z)\s*\+?=/.test(s)) fail('Renderer: mesh rotation found');
if (/requestAnimationFrame\s*\(/.test(s)) fail('Renderer: local tween found (requestAnimationFrame)');
if (/setInterval\s*\(/.test(s)) fail('Renderer: local polling timer found');
if (/setTimeout\s*\(/.test(s)) fail('Renderer: local timer found');

// Only allowed BeatBus listeners
const listeners = (s.match(/BeatBus\.on\s*\(/g) || []).length;
const allowed = (s.match(/BeatBus\.on\([^)]*EVENTS\.(RENDER_DIRECTIVE|BLUEPRINT_READY|STAGE_CHANGE|MORPH_PROGRESS)/g) || []).length;
if (listeners > allowed) fail('Renderer: unexpected BeatBus listeners present');

// No direct GPU writes outside uniform/geometry application
if (/material\.uniforms\s*=\s*/.test(s)) fail('Renderer: replacing uniforms object (unsafe)');

if (violations.length) {
  console.error('Renderer policy violations:\n - ' + violations.join('\n - '));
  process.exit(2);
}

console.log('Renderer policy OK');
