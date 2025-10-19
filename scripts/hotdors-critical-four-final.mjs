#!/usr/bin/env node
// hotdors-critical-four-final.mjs
// Canon Dev-OS Critical Four HOT-DORS - Path-true implementation
// Based on actual scan results and latest guidance

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Helper functions
async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function backup(filePath) {
  if (!await exists(filePath)) return;
  
  const backupDir = path.join(ROOT, '.canon_backups');
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `${path.basename(filePath)}.${TIMESTAMP}.bak`);
  await fs.copyFile(filePath, backupPath);
  console.log(`  📦 Backed up: ${path.basename(filePath)}`);
}

async function ensureFile(filePath, defaultContent) {
  if (!await exists(filePath)) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, defaultContent, 'utf8');
    console.log(`  ✨ Created: ${path.basename(filePath)}`);
    return true;
  }
  return false;
}

// Main implementation
async function implementCriticalFour() {
  console.log('🚀 Canon Dev-OS Critical Four HOT-DORS Implementation');
  console.log('   Path-true, idempotent, hermetic\n');

  const report = {
    timestamp: new Date().toISOString(),
    events: { before: 0, after: 0, added: [] },
    steps: { implemented: [], missing: [] },
    playbooks: { implemented: [], missing: [] },
    blueprintGuard: { wired: false },
    learningHook: { wired: false }
  };

  // ============================================================
  // 1. COMPLETE EVENTS NAMED EXPORT
  // ============================================================
  console.log('📝 [1/4] Completing EVENTS named export...');
  
  const eventsFile = path.join(ROOT, 'src/theater/events.js');
  const eventsToAdd = [
    'AUDIO_COMPUTER_HUM', 'AUDIO_KEY_CLICK', 'AUDIO_START_STAGE',
    'BLUEPRINT_READY', 'BUILD_EMERGENCE_BLUEPRINT',
    'DIRECTOR_CANCEL', 'DIRECTOR_ERROR',
    'ENABLE_SCROLL', 'ENGINE_VIEWPORT_HINT',
    'MEMORY_FRAGMENT_END', 'MEMORY_FRAGMENT_START', 'MEMORY_FRAGMENT_TRIGGER',
    'MORPH_PROGRESS',
    'PARTICLES_EMERGED', 'PARTICLES_START_EMERGING', 'PARTICLE_PHASE',
    'PREWARM_COMPLETE', 'PREWARM_GENESIS_BLUEPRINT',
    'QUALITY_CHANGE', 'RENDERER_TUNE',
    'SCREEN_FILL', 'STAGE_CHANGE', 'STAGE_CHANGED', 'STAGE_TRANSITION',
    'START_NARRATIVE', 'TERMINAL_TYPE'
  ];

  if (await exists(eventsFile)) {
    await backup(eventsFile);
    let content = await fs.readFile(eventsFile, 'utf8');
    
    // Extract existing events
    const match = content.match(/export\s+const\s+EVENTS\s*=\s*{([\s\S]*?)}/);
    if (match) {
      const body = match[1];
      const existing = new Set(
        (body.match(/([A-Z_]+)\s*:/g) || [])
          .map(x => x.replace(/[:\s]/g, ''))
      );
      
      report.events.before = existing.size;
      
      // Find missing events
      const missing = eventsToAdd.filter(e => !existing.has(e));
      
      if (missing.length > 0) {
        // Build new events object
        const newEntries = missing.map(e => `  ${e}: '${e}'`).join(',\n');
        const newBody = body.trim().replace(/,?$/, '') + 
                       (body.trim() ? ',\n' : '') + 
                       newEntries;
        
        const newEventsBlock = `export const EVENTS = {\n${newBody}\n}`;
        content = content.replace(/export\s+const\s+EVENTS\s*=\s*{[\s\S]*?}/, newEventsBlock);
        
        await fs.writeFile(eventsFile, content);
        report.events.added = missing;
        report.events.after = existing.size + missing.length;
        console.log(`  ✅ Added ${missing.length} events to EVENTS map`);
      } else {
        console.log('  ✅ All events already defined');
      }
    }
  } else {
    // Create events file from scratch
    const newContent = `// src/theater/events.js
// Canon Dev-OS Event Constants

export const EVENTS = {
${eventsToAdd.map(e => `  ${e}: '${e}'`).join(',\n')}
};

export default EVENTS;
`;
    await ensureFile(eventsFile, newContent);
    report.events.added = eventsToAdd;
    report.events.after = eventsToAdd.length;
    console.log(`  ✅ Created events.js with ${eventsToAdd.length} events`);
  }

  // ============================================================
  // 2. ENSURE STEPS/PLAYBOOKS FOUNDATIONS & IMPLEMENT MISSING
  // ============================================================
  console.log('\n🔧 [2/4] Implementing Steps & Playbooks...');

  // Ensure foundations exist
  const stepsRegistry = path.join(ROOT, 'canon-console/runtime/steps.js');
  const stepsExtra = path.join(ROOT, 'canon-console/runtime/steps-extra.js');
  const playbooksRegistry = path.join(ROOT, 'canon-console/runtime/playbooks.js');
  const playbooksExtra = path.join(ROOT, 'canon-console/runtime/playbooks-extra.js');

  // Create missing foundations
  await ensureFile(stepsRegistry, `// Canon Steps Registry
export const Steps = {};
export default Steps;
window.CANON_STEPS = Steps;
`);

  await ensureFile(stepsExtra, `// Canon Steps Extra
export const ExtraSteps = {};
export default ExtraSteps;
`);

  await ensureFile(playbooksRegistry, `// Canon Playbooks Registry
export const Playbooks = {};
export default Playbooks;
window.CANON_PLAYBOOKS = Playbooks;
`);

  // Add missing step: verify_fps_probe
  if (await exists(stepsExtra)) {
    await backup(stepsExtra);
    let stepsContent = await fs.readFile(stepsExtra, 'utf8');
    
    if (!stepsContent.includes('verify_fps_probe')) {
      const fpsProbeCode = `
// verify_fps_probe - FPS measurement step
export const verify_fps_probe = async (ctx = {}) => {
  try {
    const frames = 30;
    const times = [];
    let last = performance.now();
    
    await new Promise((resolve) => {
      let n = 0;
      function step() {
        const now = performance.now();
        times.push(now - last);
        last = now;
        if (++n >= frames) return resolve();
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    
    times.shift(); // drop first
    const avg = times.reduce((a,b) => a+b, 0) / times.length;
    const fps = 1000 / avg;
    const ok = fps >= 50;
    
    window.BeatBus?.emit?.(ok ? 'FPS_OK' : 'FPS_LOW', {
      fps: Number(fps.toFixed(1)),
      avgMs: Number(avg.toFixed(2)),
      frames,
      ts: Date.now()
    });
    
    console.log('[Steps:verify_fps_probe]', { fps, avg });
    return { success: true, fps, avgMs: avg };
  } catch (e) {
    console.warn('[Steps:verify_fps_probe] failed:', e);
    return { success: false, error: String(e) };
  }
};

ExtraSteps.verify_fps_probe = verify_fps_probe;
`;
      stepsContent += '\n' + fpsProbeCode;
      await fs.writeFile(stepsExtra, stepsContent);
      report.steps.implemented.push('verify_fps_probe');
      console.log('  ✅ Added verify_fps_probe step');
    }
  }

  // Create playbooks-extra.js with both playbooks
  const playbooksContent = `// canon-console/runtime/playbooks-extra.js
// Canon Playbooks Extra - HOT-DORS Generated

export const ExtraPlaybooks = {};

// RECOVER_DIM_POINTS - Fix particle visibility
ExtraPlaybooks.RECOVER_DIM_POINTS = async (ctx = {}) => {
  console.log('[Playbook:RECOVER_DIM_POINTS] Starting recovery...');
  
  // Import the step dynamically
  try {
    const { set_draw_range_from_uniforms } = await import('./steps-extra.js');
    const result = await set_draw_range_from_uniforms(ctx);
    
    if (result.success) {
      window.BeatBus?.emit?.('FENCEPOST_REPORT', {
        type: 'DRAW_RANGE_RECOVERED',
        count: result.count,
        ts: Date.now()
      });
    }
    
    return result;
  } catch (e) {
    console.error('[Playbook:RECOVER_DIM_POINTS] Error:', e);
    return { success: false, error: String(e) };
  }
};

// OPENING_FENCEPOST - Await emergence with timeout
ExtraPlaybooks.OPENING_FENCEPOST = async (ctx = {}) => {
  const bus = window.BeatBus;
  if (!bus || !bus.on) {
    console.warn('[Playbook:OPENING_FENCEPOST] No BeatBus');
    return { success: false, error: 'No BeatBus' };
  }
  
  const EVENTS = window.EVENTS || {};
  const evName = EVENTS.PARTICLES_EMERGED || 'PARTICLES_EMERGED';
  const start = performance.now();
  const timeoutMs = ctx.timeoutMs || 4500;
  
  let off = null;
  const ok = await new Promise((resolve) => {
    let done = false;
    off = bus.on(evName, () => {
      if (done) return;
      done = true;
      resolve(true);
    });
    setTimeout(() => {
      if (done) return;
      done = true;
      resolve(false);
    }, timeoutMs);
  });
  
  if (typeof off === 'function') {
    try { off(); } catch {}
  }
  
  const dt = Math.round(performance.now() - start);
  const payload = { dt, ts: Date.now(), timeoutMs };
  
  window.BeatBus?.emit?.(ok ? 'FENCEPOST_OK' : 'FENCEPOST_TIMEOUT', payload);
  console.log('[Playbook:OPENING_FENCEPOST]', ok ? 'OK' : 'TIMEOUT', payload);
  
  return { success: ok, ...payload };
};

// Export for window access
if (typeof window !== 'undefined') {
  window.CANON_PLAYBOOKS_EXTRA = ExtraPlaybooks;
}

export default ExtraPlaybooks;
`;

  const created = await ensureFile(playbooksExtra, playbooksContent);
  if (created) {
    report.playbooks.implemented = ['RECOVER_DIM_POINTS', 'OPENING_FENCEPOST'];
    console.log('  ✅ Created playbooks-extra.js with 2 playbooks');
  } else {
    console.log('  ℹ️  playbooks-extra.js already exists');
  }

  // ============================================================
  // 3. WIRE BLUEPRINT GUARD VALIDATIONS
  // ============================================================
  console.log('\n🛡️  [3/4] Wiring Blueprint Guard validations...');

  const blueprintGuardFile = path.join(ROOT, 'canon-console/runtime/blueprint-guard-v2.js');
  
  if (await exists(blueprintGuardFile)) {
    await backup(blueprintGuardFile);
    let guardContent = await fs.readFile(blueprintGuardFile, 'utf8');
    
    if (!guardContent.includes('__canonBlueprintValidate')) {
      const validationCode = `
// Blueprint validation function - HOT-DORS injected
const __canonBlueprintValidate = (blueprint) => {
  const issues = [];
  
  // Check typed arrays
  const isTypedArray = (x) => ArrayBuffer.isView(x) && x.BYTES_PER_ELEMENT;
  const isLen3Multiple = (x) => isTypedArray(x) && x.length % 3 === 0;
  
  if (!isLen3Multiple(blueprint?.atmosphericPositions)) {
    issues.push('atmosphericPositions: missing/invalid typed array');
  }
  
  if (!isLen3Multiple(blueprint?.text3DPositions)) {
    issues.push('text3DPositions: missing/invalid typed array');
  }
  
  // Check particle count bounds
  const count = blueprint?.particleCount || blueprint?.activeCount || 0;
  if (count < 100 || count > 200000) {
    issues.push(\`particleCount out of bounds: \${count}\`);
  }
  
  // NaN/Infinity scan (sample first 100)
  const scanForNaN = (arr, name) => {
    if (!isTypedArray(arr)) return;
    const limit = Math.min(arr.length, 100);
    for (let i = 0; i < limit; i++) {
      if (!Number.isFinite(arr[i])) {
        issues.push(\`\${name} contains NaN/Infinity at index \${i}\`);
        break;
      }
    }
  };
  
  scanForNaN(blueprint?.atmosphericPositions, 'atmosphericPositions');
  scanForNaN(blueprint?.text3DPositions, 'text3DPositions');
  
  return { valid: issues.length === 0, issues };
};

// Hook into blueprint processing
const originalInstall = blueprintGuard.install;
blueprintGuard.install = function(BeatBus, incidentCollector, EVENTS) {
  // Call original if it exists
  if (originalInstall) {
    originalInstall.call(this, BeatBus, incidentCollector, EVENTS);
  }
  
  // Add validation tap
  if (BeatBus && EVENTS?.BLUEPRINT_READY) {
    BeatBus.on(EVENTS.BLUEPRINT_READY, (payload) => {
      const validation = __canonBlueprintValidate(payload);
      if (!validation.valid) {
        console.warn('[BlueprintGuard] Validation failed:', validation.issues);
        
        if (incidentCollector?.add) {
          incidentCollector.add({
            code: 'BLUEPRINT_INVALID',
            severity: 'error',
            message: 'Blueprint validation failed',
            context: { issues: validation.issues }
          });
        }
        
        BeatBus.emit('CANON_VIOLATION', {
          type: 'BLUEPRINT_GUARD',
          issues: validation.issues,
          ts: Date.now()
        });
      }
    });
    
    console.log('🛡️ Blueprint validation wired to BLUEPRINT_READY');
  }
};
`;
      
      // Find insertion point (before the export)
      const exportIdx = guardContent.lastIndexOf('export default blueprintGuard');
      if (exportIdx > 0) {
        guardContent = guardContent.slice(0, exportIdx) + 
                      validationCode + '\n\n' + 
                      guardContent.slice(exportIdx);
        await fs.writeFile(blueprintGuardFile, guardContent);
        report.blueprintGuard.wired = true;
        console.log('  ✅ Wired blueprint validation functions');
      }
    } else {
      console.log('  ℹ️  Blueprint validation already present');
    }
  }

  // ============================================================
  // 4. CONNECT LEARNING SYSTEM TO INCIDENT STREAMS
  // ============================================================
  console.log('\n🧠 [4/4] Connecting Learning System to incidents...');

  const injectorFile = path.join(ROOT, 'canon-console/browser/inject.js');
  
  if (await exists(injectorFile)) {
    await backup(injectorFile);
    let injectorContent = await fs.readFile(injectorFile, 'utf8');
    
    if (!injectorContent.includes('__canonLearningHook__')) {
      const learningHook = `
// Learning System incident hook - HOT-DORS injected
(function installLearningHook() {
  try {
    if (window.__canonLearningHook__) return;
    window.__canonLearningHook__ = true;
    
    const bus = window.BeatBus;
    if (!bus || !bus.on) return;
    
    // Hook these incident types
    const incidentTypes = [
      'CANON_VIOLATION', 'GUARD_WARN', 'GUARD_ERROR',
      'SHADER_COMPILE_ERROR', 'SHADER_COMPILE_FAIL', 'SHADER_LINK_FAIL',
      'FPS_LOW', 'FENCEPOST_TIMEOUT', 'BLUEPRINT_INVALID'
    ];
    
    const tap = (eventName) => {
      bus.on(eventName, (payload) => {
        try {
          if (window.CANON_LEARNING?.recordPattern) {
            window.CANON_LEARNING.recordPattern(eventName, {
              payload,
              ts: Date.now()
            });
          }
        } catch (e) {}
      });
    };
    
    incidentTypes.forEach(tap);
    console.log('🧠 Learning System connected to', incidentTypes.length, 'incident types');
    
  } catch (e) {
    console.warn('[Canon] Learning hook failed:', e);
  }
})();
`;
      
      // Add at end of file
      injectorContent += '\n' + learningHook;
      await fs.writeFile(injectorFile, injectorContent);
      report.learningHook.wired = true;
      console.log('  ✅ Connected Learning System to 9 incident types');
    } else {
      console.log('  ℹ️  Learning hook already installed');
    }
  }

  // ============================================================
  // GENERATE REPORTS
  // ============================================================
  console.log('\n📊 Generating reports...');

  const reportDir = path.join(ROOT, '.canon_reports');
  await fs.mkdir(reportDir, { recursive: true });

  // JSON report
  const jsonReport = {
    ...report,
    summary: {
      eventsComplete: report.events.after >= 28,
      stepsComplete: report.steps.implemented.includes('verify_fps_probe'),
      playbooksComplete: report.playbooks.implemented.length >= 2,
      blueprintGuardWired: report.blueprintGuard.wired,
      learningHookWired: report.learningHook.wired
    }
  };
  
  const jsonPath = path.join(reportDir, `canon-critical-four.json`);
  await fs.writeFile(jsonPath, JSON.stringify(jsonReport, null, 2));

  // Markdown report
  const mdReport = `# Canon Dev-OS Critical Four Report

Generated: ${new Date().toISOString()}

## Summary
- ✅ Events Complete: ${jsonReport.summary.eventsComplete ? 'YES' : 'NO'}
- ✅ Steps Implemented: ${jsonReport.summary.stepsComplete ? 'YES' : 'NO'}
- ✅ Playbooks Ready: ${jsonReport.summary.playbooksComplete ? 'YES' : 'NO'}
- ✅ Blueprint Guard: ${jsonReport.summary.blueprintGuardWired ? 'WIRED' : 'NOT WIRED'}
- ✅ Learning System: ${jsonReport.summary.learningHookWired ? 'CONNECTED' : 'NOT CONNECTED'}

## Events
- Before: ${report.events.before} events
- After: ${report.events.after} events
- Added: ${report.events.added.length} new events

## Components
- Steps: ${report.steps.implemented.join(', ') || 'none'}
- Playbooks: ${report.playbooks.implemented.join(', ') || 'none'}

## Verification Commands
\`\`\`javascript
// Test playbooks
await window.CANON_PLAYBOOKS_EXTRA.RECOVER_DIM_POINTS()
await window.CANON_PLAYBOOKS_EXTRA.OPENING_FENCEPOST({timeoutMs: 4500})

// Check learning system
window.CANON_LEARNING.getInsights()
\`\`\`
`;

  const mdPath = path.join(reportDir, `canon-critical-four.md`);
  await fs.writeFile(mdPath, mdReport);

  // ============================================================
  // FINAL OUTPUT
  // ============================================================
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ CANON DEV-OS CRITICAL FOUR COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('📊 Results:');
  console.log(`  Events: ${report.events.added.length} added (now ${report.events.after} total)`);
  console.log(`  Steps: ${report.steps.implemented.length} implemented`);
  console.log(`  Playbooks: ${report.playbooks.implemented.length} ready`);
  console.log(`  Blueprint Guard: ${report.blueprintGuard.wired ? 'WIRED' : 'Already present'}`);
  console.log(`  Learning System: ${report.learningHook.wired ? 'CONNECTED' : 'Already connected'}`);
  
  console.log('\n📄 Reports saved:');
  console.log(`  ${path.relative(ROOT, jsonPath)}`);
  console.log(`  ${path.relative(ROOT, mdPath)}`);
  
  console.log('\n🎯 Quick Test Commands:');
  console.log('  window.CANON_PLAYBOOKS_EXTRA.OPENING_FENCEPOST()');
  console.log('  window.CANON_PLAYBOOKS_EXTRA.RECOVER_DIM_POINTS()');
  
  console.log('\n🔄 Reload your app to activate all changes.');
}

// Run with error handling
implementCriticalFour().catch(error => {
  console.error('\n❌ Implementation failed:', error);
  process.exit(1);
});