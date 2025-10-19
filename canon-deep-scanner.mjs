#!/usr/bin/env node
// canon-deep-scanner.mjs
// Comprehensive file discovery and capability scan for Canon Dev-OS
// Generates detailed JSON report for review before HOT-DORS implementation

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();

async function scanCanonSystem() {
  const report = {
    timestamp: new Date().toISOString(),
    root: ROOT,
    
    // File existence mapping
    files: {
      found: {},
      missing: {},
      candidates: {}
    },
    
    // Event discovery
    events: {
      defined: [],      // Already in EVENTS export
      used: [],         // Found in codebase
      undefined: [],    // Used but not in EVENTS
      locations: {}     // Where each event is used
    },
    
    // Component analysis
    components: {
      steps: {
        registry: null,
        extras: null,
        implemented: []
      },
      playbooks: {
        registry: null,
        extras: null,
        implemented: []
      },
      blueprintGuard: {
        files: [],
        hasValidations: false,
        validationCode: []
      },
      learningSystem: {
        file: null,
        hasHooks: false,
        connectedEvents: []
      }
    },
    
    // Injection points
    injectionPoints: {
      injector: null,
      beatBusLocations: [],
      blueprintHandlers: []
    },
    
    // Recommendations
    recommendations: {
      createFiles: [],
      addEvents: [],
      wireConnections: [],
      implementFeatures: []
    }
  };

  console.log('🔍 Starting Canon Dev-OS deep scan...\n');

  // 1. Check critical file existence
  const criticalPaths = {
    'injector': 'canon-console/browser/inject.js',
    'eventsFile': 'src/theater/events.js',
    'stepsRegistry': 'canon-console/runtime/steps.js',
    'stepsExtra': 'canon-console/runtime/steps-extra.js',
    'playbooksRegistry': 'canon-console/runtime/playbooks.js',
    'playbooksExtra': 'canon-console/runtime/playbooks-extra.js',
    'blueprintGuardV2': 'canon-console/runtime/blueprint-guard-v2.js',
    'learningSystem': 'canon-console/runtime/learning-system.js',
    'beatBus': 'src/theater/bus/index.js',
    'theaterDirector': 'src/theater/TheaterDirector.js',
    'consciousnessEngine': 'src/engine/ConsciousnessEngine.js',
    'webglBackground': 'src/components/webgl/WebGLBackground.jsx'
  };

  for (const [key, relPath] of Object.entries(criticalPaths)) {
    const fullPath = path.join(ROOT, relPath);
    try {
      await fs.access(fullPath);
      report.files.found[key] = relPath;
    } catch {
      report.files.missing[key] = relPath;
    }
  }

  // 2. Find all BeatBus event emissions and listeners
  console.log('Scanning for BeatBus events...');
  try {
    const eventPattern = /BeatBus\.(emit|on)\s*\(\s*['"`]([A-Z_]+)['"`]/g;
    const eventPattern2 = /EVENTS\.([A-Z_]+)/g;
    
    // Use grep to find all event usages
    const grepCmd = `grep -r "BeatBus\\." src --include="*.js" --include="*.jsx" 2>/dev/null || true`;
    const grepResult = execSync(grepCmd, { encoding: 'utf8' });
    
    const usedEvents = new Set();
    const eventLocations = {};
    
    for (const line of grepResult.split('\n')) {
      if (!line) continue;
      const [file, ...rest] = line.split(':');
      const content = rest.join(':');
      
      // Find BeatBus.emit/on patterns
      let match;
      const regex = /BeatBus\.(emit|on)\s*\(\s*['"`]([A-Z_]+)['"`]/g;
      while ((match = regex.exec(content)) !== null) {
        const eventName = match[2];
        usedEvents.add(eventName);
        if (!eventLocations[eventName]) eventLocations[eventName] = [];
        eventLocations[eventName].push({ file: file.replace(ROOT + '/', ''), method: match[1] });
      }
      
      // Find EVENTS.NAME patterns
      const regex2 = /EVENTS\.([A-Z_]+)/g;
      while ((match = regex2.exec(content)) !== null) {
        const eventName = match[1];
        usedEvents.add(eventName);
        if (!eventLocations[eventName]) eventLocations[eventName] = [];
        eventLocations[eventName].push({ file: file.replace(ROOT + '/', ''), method: 'EVENTS' });
      }
    }
    
    report.events.used = Array.from(usedEvents).sort();
    report.events.locations = eventLocations;
    
  } catch (e) {
    console.log('Event scanning error:', e.message);
  }

  // 3. Check existing EVENTS definition
  if (report.files.found.eventsFile) {
    try {
      const eventsContent = await fs.readFile(path.join(ROOT, report.files.found.eventsFile), 'utf8');
      const match = eventsContent.match(/export\s+const\s+EVENTS\s*=\s*{([\s\S]*?)}/);
      if (match) {
        const body = match[1];
        const defined = (body.match(/([A-Z_]+)\s*:/g) || []).map(x => x.replace(/[:\s]/g, ''));
        report.events.defined = defined;
        
        // Find undefined events
        report.events.undefined = report.events.used.filter(e => !defined.includes(e));
      }
    } catch (e) {
      console.log('Error reading events file:', e.message);
    }
  } else {
    report.events.undefined = report.events.used;
  }

  // 4. Check Steps implementation
  if (report.files.found.stepsRegistry) {
    try {
      const content = await fs.readFile(path.join(ROOT, report.files.found.stepsRegistry), 'utf8');
      report.components.steps.registry = 'exists';
      
      // Check for specific steps
      const steps = ['set_draw_range_from_uniforms', 'verify_fps_probe'];
      for (const step of steps) {
        if (content.includes(step)) {
          report.components.steps.implemented.push(step);
        }
      }
    } catch (e) {}
  }
  
  if (report.files.found.stepsExtra) {
    try {
      const content = await fs.readFile(path.join(ROOT, report.files.found.stepsExtra), 'utf8');
      report.components.steps.extras = 'exists';
      
      // Check for implementations
      const stepPattern = /Steps\.(\w+)\s*=/g;
      let match;
      while ((match = stepPattern.exec(content)) !== null) {
        if (!report.components.steps.implemented.includes(match[1])) {
          report.components.steps.implemented.push(match[1]);
        }
      }
    } catch (e) {}
  }

  // 5. Check Playbooks implementation
  if (report.files.found.playbooksRegistry) {
    try {
      const content = await fs.readFile(path.join(ROOT, report.files.found.playbooksRegistry), 'utf8');
      report.components.playbooks.registry = 'exists';
      
      const playbooks = ['RECOVER_DIM_POINTS', 'OPENING_FENCEPOST'];
      for (const playbook of playbooks) {
        if (content.includes(playbook)) {
          report.components.playbooks.implemented.push(playbook);
        }
      }
    } catch (e) {}
  }

  // 6. Check Blueprint Guard
  const blueprintCandidates = [
    'canon-console/runtime/blueprint-guard-v2.js',
    'canon-console/runtime/guards/blueprint-guard.js',
    'scripts/agent/detectors/emergence.mjs'
  ];
  
  for (const candidate of blueprintCandidates) {
    const fullPath = path.join(ROOT, candidate);
    try {
      await fs.access(fullPath);
      const content = await fs.readFile(fullPath, 'utf8');
      report.components.blueprintGuard.files.push(candidate);
      
      // Check for validation code
      if (content.includes('validateParticleCount') || 
          content.includes('validateTypedArrays') ||
          content.includes('detectNaN')) {
        report.components.blueprintGuard.hasValidations = true;
        
        if (content.includes('validateParticleCount')) 
          report.components.blueprintGuard.validationCode.push('particleCount');
        if (content.includes('validateTypedArrays')) 
          report.components.blueprintGuard.validationCode.push('typedArrays');
        if (content.includes('detectNaN')) 
          report.components.blueprintGuard.validationCode.push('NaN');
      }
    } catch (e) {}
  }

  // 7. Check Learning System hooks
  if (report.files.found.learningSystem) {
    try {
      const content = await fs.readFile(path.join(ROOT, report.files.found.learningSystem), 'utf8');
      report.components.learningSystem.file = 'exists';
      
      // Check for pattern recording
      if (content.includes('recordPattern')) {
        report.components.learningSystem.hasHooks = true;
      }
      
      // Check if it's wired to events
      if (report.files.found.injector) {
        const injectorContent = await fs.readFile(path.join(ROOT, report.files.found.injector), 'utf8');
        if (injectorContent.includes('CANON_LEARNING.recordPattern')) {
          report.components.learningSystem.connectedEvents.push('Connected in injector');
        }
      }
    } catch (e) {}
  }

  // 8. Find BeatBus locations for injection points
  try {
    const busLocations = execSync('grep -r "BeatBus" src --include="*.js" --include="*.jsx" | head -20', { encoding: 'utf8' });
    report.injectionPoints.beatBusLocations = busLocations.split('\n').slice(0, 5).map(line => {
      const [file] = line.split(':');
      return file.replace(ROOT + '/', '');
    }).filter(Boolean);
  } catch (e) {}

  // 9. Generate recommendations
  // Missing files to create
  for (const [key, path] of Object.entries(report.files.missing)) {
    if (['stepsRegistry', 'stepsExtra', 'playbooksRegistry', 'playbooksExtra'].includes(key)) {
      report.recommendations.createFiles.push({
        file: path,
        reason: `${key} needed for Steps/Playbooks system`
      });
    }
  }

  // Events to add
  if (report.events.undefined.length > 0) {
    report.recommendations.addEvents.push({
      count: report.events.undefined.length,
      events: report.events.undefined.slice(0, 10), // First 10 as sample
      action: 'Add to EVENTS export in src/theater/events.js'
    });
  }

  // Connections to wire
  if (!report.components.blueprintGuard.hasValidations) {
    report.recommendations.wireConnections.push({
      component: 'Blueprint Guard',
      action: 'Add validation functions for typed arrays, NaN detection, count bounds'
    });
  }

  if (!report.components.learningSystem.connectedEvents.length) {
    report.recommendations.wireConnections.push({
      component: 'Learning System',
      action: 'Connect to incident streams (CANON_VIOLATION, GUARD_*, SHADER_*, FPS_LOW)'
    });
  }

  // Features to implement
  const neededSteps = ['set_draw_range_from_uniforms', 'verify_fps_probe'];
  const missingSteps = neededSteps.filter(s => !report.components.steps.implemented.includes(s));
  if (missingSteps.length) {
    report.recommendations.implementFeatures.push({
      type: 'Steps',
      missing: missingSteps
    });
  }

  const neededPlaybooks = ['RECOVER_DIM_POINTS', 'OPENING_FENCEPOST'];
  const missingPlaybooks = neededPlaybooks.filter(p => !report.components.playbooks.implemented.includes(p));
  if (missingPlaybooks.length) {
    report.recommendations.implementFeatures.push({
      type: 'Playbooks',
      missing: missingPlaybooks
    });
  }

  return report;
}

// Main execution
async function main() {
  console.log('Canon Dev-OS Deep Scanner v1.0\n');
  console.log('This will scan your system and generate a report.');
  console.log('No files will be modified.\n');
  
  const report = await scanCanonSystem();
  
  // Save report
  const reportPath = path.join(ROOT, '.canon_reports');
  await fs.mkdir(reportPath, { recursive: true });
  
  const jsonFile = path.join(reportPath, `canon-scan-${Date.now()}.json`);
  await fs.writeFile(jsonFile, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('SCAN COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('📁 FILES FOUND:', Object.keys(report.files.found).length);
  console.log('❌ FILES MISSING:', Object.keys(report.files.missing).length);
  
  if (report.files.missing.length > 0) {
    console.log('\nMissing files:');
    for (const [key, path] of Object.entries(report.files.missing)) {
      console.log(`  - ${key}: ${path}`);
    }
  }
  
  console.log('\n📊 EVENTS:');
  console.log('  Defined:', report.events.defined.length);
  console.log('  Used:', report.events.used.length);
  console.log('  Undefined:', report.events.undefined.length);
  
  if (report.events.undefined.length > 0) {
    console.log('\n  First 5 undefined events:');
    report.events.undefined.slice(0, 5).forEach(e => console.log(`    - ${e}`));
  }
  
  console.log('\n🔧 COMPONENTS:');
  console.log('  Steps implemented:', report.components.steps.implemented.length);
  console.log('  Playbooks implemented:', report.components.playbooks.implemented.length);
  console.log('  Blueprint validations:', report.components.blueprintGuard.hasValidations ? 'YES' : 'NO');
  console.log('  Learning System connected:', report.components.learningSystem.connectedEvents.length > 0 ? 'YES' : 'NO');
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('  Files to create:', report.recommendations.createFiles.length);
  console.log('  Events to add:', report.recommendations.addEvents.length > 0 ? report.events.undefined.length : 0);
  console.log('  Connections to wire:', report.recommendations.wireConnections.length);
  console.log('  Features to implement:', report.recommendations.implementFeatures.length);
  
  console.log('\n📄 Report saved to:', path.relative(ROOT, jsonFile));
  console.log('\nReview this report to understand what needs to be done.');
  console.log('Then run the HOT-DORS implementation to make the changes.\n');
}

main().catch(console.error);