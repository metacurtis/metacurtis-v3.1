#!/usr/bin/env node
/* eslint-env node */
/**
 * Doctor: consciousness-flow
 * Purpose: Verify the three critical flows for consciousness visualization
 * Questions answered:
 *   1. Does scroll trigger stage progression?
 *   2. Do stage changes update blueprint/particles?
 *   3. Do particles morph between atmospheric and brain positions?
 */

const fs = require('fs');
const _path = require('path');

const NAME = 'consciousness-flow';
const CWD = process.cwd();
const ART = p => path.join(CWD, 'doctor_artifacts', p);

function discoverFlowSystem() {
  const findings = {
    atoms: [],
    stores: [],
    scrollHandlers: [],
    morphDrivers: [],
    blueprintEmitters: [],
    stageHandlers: []
  };

  // Find all state systems
  const checkFiles = [
    'src/stores/atoms/stageAtom.js',
    'src/stores/atoms/narrativeAtom.js',
    'src/stores/atoms/qualityAtom.js',
    'src/stores/narrativeStore.js',
    'src/stores/performanceStore.js'
  ];

  checkFiles.forEach(file => {
    const fullPath = path.join(CWD, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const type = file.includes('Atom') ? 'atoms' : 'stores';
      findings[type].push({
        path: file,
        hasGetState: content.includes('getState'),
        hasSetState: content.includes('setState') || content.includes('.set('),
        exportsDefault: content.includes('export default'),
        windowAttached: content.includes('window.') || content.includes('globalThis.')
      });
    }
  });

  // Find scroll handlers
  const scrollFiles = [
    'src/components/consciousness/ConsciousnessTheater.jsx',
    'src/App.jsx',
    'src/hooks/useScroll.js'
  ];

  scrollFiles.forEach(file => {
    const fullPath = path.join(CWD, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('scroll') || content.includes('onScroll')) {
        findings.scrollHandlers.push({
          path: file,
          hasScrollListener: content.includes('addEventListener') && content.includes('scroll'),
          hasOnScroll: content.includes('onScroll'),
          updatesStage: content.includes('setStage') || content.includes('jumpToStage')
        });
      }
    }
  });

  // Find morph drivers
  const morphFiles = [
    'src/components/webgl/WebGLBackground.jsx',
    'src/engine/ConsciousnessEngine.js'
  ];

  morphFiles.forEach(file => {
    const fullPath = path.join(CWD, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('morph') || content.includes('interpolate')) {
        findings.morphDrivers.push({
          path: file,
          hasMorphProgress: content.includes('morphProgress'),
          hasInterpolation: content.includes('lerp') || content.includes('interpolate'),
          usesRAF: content.includes('requestAnimationFrame')
        });
      }
    }
  });

  // Find blueprint emitters
  if (fs.existsSync(path.join(CWD, 'src/engine/ConsciousnessEngine.js'))) {
    const engineContent = fs.readFileSync(path.join(CWD, 'src/engine/ConsciousnessEngine.js'), 'utf8');
    findings.blueprintEmitters.push({
      path: 'src/engine/ConsciousnessEngine.js',
      emitsBlueprintReady: engineContent.includes("emit('BLUEPRINT_READY") || engineContent.includes('emit("BLUEPRINT_READY'),
      hasGenerateBlueprint: engineContent.includes('generateBlueprint'),
      respondsToStageChange: engineContent.includes('STAGE_CHANGE')
    });
  }

  return findings;
}

function analyzeFlows(findings) {
  const analysis = {
    scrollToStage: { working: false, details: [] },
    stageToBlueprint: { working: false, details: [] },
    morphing: { working: false, details: [] },
    recommendations: []
  };

  // Check scroll → stage flow
  if (findings.scrollHandlers.length > 0) {
    const hasWorkingScroll = findings.scrollHandlers.some(h => h.updatesStage);
    analysis.scrollToStage.working = hasWorkingScroll;
    analysis.scrollToStage.details = findings.scrollHandlers;
    if (!hasWorkingScroll) {
      analysis.recommendations.push('No scroll handler updates stage. Need to connect scroll events to stageAtom.jumpToStage()');
    }
  } else {
    analysis.recommendations.push('No scroll handlers found. Need to add scroll listener in ConsciousnessTheater');
  }

  // Check stage → blueprint flow
  const engineEmits = findings.blueprintEmitters.some(e => e.emitsBlueprintReady);
  const engineResponds = findings.blueprintEmitters.some(e => e.respondsToStageChange);
  analysis.stageToBlueprint.working = engineEmits && engineResponds;
  if (!engineEmits) {
    analysis.recommendations.push('Engine does not emit BLUEPRINT_READY. Add BeatBus.emit("BLUEPRINT_READY", payload)');
  }
  if (!engineResponds) {
    analysis.recommendations.push('Engine does not respond to stage changes. Add listener for STAGE_CHANGE event');
  }

  // Check morphing
  const hasMorphDriver = findings.morphDrivers.some(m => m.hasMorphProgress && m.hasInterpolation);
  analysis.morphing.working = hasMorphDriver;
  if (!hasMorphDriver) {
    analysis.recommendations.push('No morph interpolation found. Need lerp between atmosphericPositions and allenAtlasPositions');
  }

  return analysis;
}

function generateReport(findings, analysis) {
  const report = {
    timestamp: new Date().toISOString(),
    name: NAME,
    findings,
    analysis,
    criticalFlows: {
      scrollToStage: analysis.scrollToStage.working ? 'WORKING' : 'BROKEN',
      stageToBlueprint: analysis.stageToBlueprint.working ? 'WORKING' : 'BROKEN',
      morphing: analysis.morphing.working ? 'WORKING' : 'BROKEN'
    },
    ready: analysis.scrollToStage.working && analysis.stageToBlueprint.working && analysis.morphing.working
  };

  // Write JSON report
  if (!fs.existsSync(ART(''))) {
    fs.mkdirSync(ART(''), { recursive: true });
  }
  
  fs.writeFileSync(ART(`${NAME}-report.json`), JSON.stringify(report, null, 2));

  // Write markdown summary
  const summary = `# Consciousness Flow Doctor Report
Generated: ${report.timestamp}

## Critical Flows
- Scroll → Stage: **${report.criticalFlows.scrollToStage}**
- Stage → Blueprint: **${report.criticalFlows.stageToBlueprint}**
- Morph Animation: **${report.criticalFlows.morphing}**

## Visualization Ready: ${report.ready ? '✅ YES' : '❌ NO'}

## Active State Systems
${findings.atoms.map(a => `- ${a.path} (window: ${a.windowAttached})`).join('\n')}

## Recommendations
${analysis.recommendations.map(r => `- ${r}`).join('\n')}
`;

  fs.writeFileSync(ART(`${NAME}-summary.md`), summary);

  return report;
}

// Main execution
const findings = discoverFlowSystem();
const analysis = analyzeFlows(findings);
const report = generateReport(findings, analysis);

console.log(`\nConsciousness Flow Doctor`);
console.log('=========================');
console.log(`Scroll → Stage: ${report.criticalFlows.scrollToStage}`);
console.log(`Stage → Blueprint: ${report.criticalFlows.stageToBlueprint}`);
console.log(`Morphing: ${report.criticalFlows.morphing}`);
console.log(`\nReady for visualization: ${report.ready ? 'YES' : 'NO'}`);

if (analysis.recommendations.length > 0) {
  console.log('\nNext steps:');
  analysis.recommendations.forEach(r => console.log(`- ${r}`));
}

console.log(`\nReports written to doctor_artifacts/`);