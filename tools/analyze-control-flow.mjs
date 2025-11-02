import fs from 'fs';

const patterns = JSON.parse(
  fs.readFileSync('reports/navigation-patterns.json', 'utf8')
).patterns;

const events = JSON.parse(
  fs.readFileSync('reports/navigation-events.json', 'utf8')
);

// Build control flow graph
const graph = {
  entryPoints: {},
  orchestrators: {},
  mutators: {},
  emitters: {}
};

// Entry points (user-facing)
['STAGE_CONTROLS', 'ARROW_NAV', 'KEYBOARD_NAV', 'NARRATION_NEXT'].forEach(key => {
  if (patterns[key]) {
    graph.entryPoints[key] = patterns[key].map(h => ({
      file: h.file,
      line: h.line
    }));
  }
});

// Orchestrators (should route through these)
['UNIFIED_NAV', 'NAVIGATION_GATE', 'SCROLL_ORCHESTRATOR'].forEach(key => {
  if (patterns[key]) {
    graph.orchestrators[key] = patterns[key].map(h => ({
      file: h.file,
      line: h.line
    }));
  }
});

// Direct mutators (violate orchestration)
['STAGE_ATOM_SET', 'JUMP_TO_STAGE', 'FALLBACK_JUMP'].forEach(key => {
  if (patterns[key]) {
    graph.mutators[key] = patterns[key].map(h => ({
      file: h.file,
      line: h.line
    }));
  }
});

// Event emitters
graph.emitters = {
  STAGE_CHANGE: events.navigation?.STAGE_CHANGE?.emitters || [],
  MORPH_PROGRESS: events.navigation?.MORPH_PROGRESS?.emitters || []
};

// Analyze paths
const analysis = {
  orchestratedPaths: 0,
  directPaths: 0,
  unknownPaths: 0
};

// Check if entry points call orchestrators
Object.entries(graph.entryPoints).forEach(([entryKey, entries]) => {
  entries.forEach(entry => {
    const hasOrchestrator = Object.values(graph.orchestrators).some(orch =>
      orch.some(o => o.file === entry.file)
    );

    const hasMutator = Object.values(graph.mutators).some(mut =>
      mut.some(m => m.file === entry.file)
    );

    if (hasOrchestrator) {
      analysis.orchestratedPaths++;
    } else if (hasMutator) {
      analysis.directPaths++;
    } else {
      analysis.unknownPaths++;
    }
  });
});

const result = {
  graph,
  analysis,
  violations: {
    directMutations: graph.mutators,
    multipleEmitters: Object.entries(graph.emitters)
      .filter(([_, emitters]) => emitters.length > 1)
      .map(([event, emitters]) => ({ event, count: emitters.length }))
  }
};

fs.writeFileSync(
  'reports/control-flow-graph.json',
  JSON.stringify(result, null, 2)
);

console.log('[analyze-control-flow] wrote reports/control-flow-graph.json');
console.log(`Orchestrated paths: ${analysis.orchestratedPaths}`);
console.log(`Direct paths (violations): ${analysis.directPaths}`);
console.log(`Unknown paths: ${analysis.unknownPaths}`);
