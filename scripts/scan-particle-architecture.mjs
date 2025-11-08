#!/usr/bin/env node
import { readFileSync } from 'fs';
import { glob } from 'glob';

const CRITICAL_PATTERNS = {
  BLUEPRINT_EMIT: /emit.*blueprint|pushTrace.*blueprint|BeatBus\.emit.*BLUEPRINT/gi,
  BLUEPRINT_CONSUME: /blueprint.*=.*get|const.*blueprint|\.blueprint\b/g,
  BLUEPRINT_WRITE: /blueprint\s*=\s*\{|blueprint\s*=\s*\w+\.create/g,
  MORPH_EMIT: /emit.*MORPH_PROGRESS|BeatBus\.emit.*MORPH/gi,
  MORPH_LISTEN: /on.*MORPH_PROGRESS|addEventListener.*MORPH/gi,
  MORPH_WRITE: /morphProgress\s*=|setMorphProgress|morphState\./g,
  RENDERER_DIRECTIVE: /renderDirective|setRenderMode|updateRenderer/gi,
  DRAW_CALL: /\.draw\(|\.render\(|drawParticles/g,
  ENGINE_BLUEPRINT: /ConsciousnessEngine.*blueprint|engine\.emit.*blueprint/gi,
  ENGINE_MORPH: /ConsciousnessEngine.*morph|engine\.morph/gi,
  MULTIPLE_SOURCES: /\bif.*emit|conditional.*emit|race|concurrent/gi,
  STATE_MUTATION: /setState|mutate|direct.*write/gi,
};

const files = glob.sync('src/**/*.{js,jsx}', { nodir: true });
const results = {};
Object.keys(CRITICAL_PATTERNS).forEach((key) => {
  results[key] = [];
});

files.forEach((file) => {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (const [name, regex] of Object.entries(CRITICAL_PATTERNS)) {
    lines.forEach((line, i) => {
      if (regex.test(line)) {
        results[name].push({ file, line: i + 1, code: line.trim() });
      }
    });
  }
});

console.log('# Particle Architecture Evidence Report\n');
console.log(`**Generated:** ${new Date().toISOString()}`);
console.log(`**Commit:** ${process.env.GIT_COMMIT || 'unknown'}`);
console.log('');

for (const [name, matches] of Object.entries(results)) {
  console.log(`## ${name}: ${matches.length} occurrences\n`);
  const byFile = {};
  matches.forEach((m) => {
    if (!byFile[m.file]) byFile[m.file] = [];
    byFile[m.file].push(m);
  });
  Object.entries(byFile).forEach(([file, items]) => {
    console.log(`### ${file} (${items.length})\n`);
    items.forEach((m) => {
      console.log(`- Line ${m.line}: \`${m.code}\``);
    });
    console.log('');
  });
}

const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
console.log(`\n**Total patterns found:** ${total}\n`);
console.log('## 🚨 Critical Issues\n');

const blueprintEmitters = results.BLUEPRINT_EMIT.length;
const morphEmitters = results.MORPH_EMIT.length;
const blueprintWriters = results.BLUEPRINT_WRITE.length;

if (blueprintEmitters > 1) {
  console.log(`⚠️ **Multiple Blueprint Emitters:** ${blueprintEmitters} sources`);
  console.log('   Expected: 1 (ConsciousnessEngine only)\n');
}
if (morphEmitters > 1) {
  console.log(`⚠️ **Multiple Morph Emitters:** ${morphEmitters} sources`);
  console.log('   Expected: 1 (ConsciousnessEngine only)\n');
}
if (blueprintWriters > 1) {
  console.log(`⚠️ **Multiple Blueprint Writers:** ${blueprintWriters} sites`);
  console.log('   Expected: 1 (ConsciousnessEngine.createBlueprint)\n');
}
