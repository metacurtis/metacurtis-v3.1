import fs from 'fs';

const patternsData = JSON.parse(
  fs.readFileSync('reports/navigation-patterns.json', 'utf8')
);
const patternHits = patternsData.patterns || {};

const events = JSON.parse(
  fs.readFileSync('reports/navigation-events.json', 'utf8')
);

const getEntries = (key) => patternHits[key] || [];

const graph = {
  entryPoints: {},
  orchestrators: {},
  mutators: {},
  emitters: {},
};

['STAGE_CONTROLS', 'ARROW_NAV', 'KEYBOARD_NAV', 'NARRATION_NEXT'].forEach((key) => {
  const hits = getEntries(key);
  if (hits.length) {
    graph.entryPoints[key] = hits.map(({ file, line }) => ({ file, line }));
  }
});

['UNIFIED_NAV', 'NAVIGATION_GATE', 'SCROLL_ORCHESTRATOR'].forEach((key) => {
  const hits = getEntries(key);
  if (hits.length) {
    graph.orchestrators[key] = hits.map(({ file, line }) => ({ file, line }));
  }
});

['STAGE_ATOM_SET', 'JUMP_TO_STAGE', 'FALLBACK_JUMP'].forEach((key) => {
  const hits = getEntries(key);
  if (hits.length) {
    graph.mutators[key] = hits.map(({ file, line }) => ({ file, line }));
  }
});

graph.emitters = {
  STAGE_CHANGE: events.navigation?.STAGE_CHANGE?.emitters || [],
  MORPH_PROGRESS: events.navigation?.MORPH_PROGRESS?.emitters || [],
};

const analysis = {
  orchestratedPaths: 0,
  directPaths: 0,
  unknownPaths: 0,
};

Object.entries(graph.entryPoints).forEach(([entryKey, entries]) => {
  entries.forEach((entry) => {
    const hasOrchestrator = Object.values(graph.orchestrators).some((orch) =>
      orch.some((o) => o.file === entry.file)
    );
    const hasMutator = Object.values(graph.mutators).some((mut) =>
      mut.some((m) => m.file === entry.file)
    );

    if (hasOrchestrator) {
      analysis.orchestratedPaths += 1;
    } else if (hasMutator) {
      analysis.directPaths += 1;
    } else {
      analysis.unknownPaths += 1;
    }
  });
});

const violations = {
  directMutations: graph.mutators,
  multipleEmitters: Object.entries(graph.emitters)
    .filter(([_, emitters]) => Array.isArray(emitters) && emitters.length > 1)
    .map(([event, emitters]) => ({ event, count: emitters.length })),
};

const result = { graph, analysis, violations };

fs.writeFileSync('reports/control-flow-graph.json', JSON.stringify(result, null, 2));

console.log('[analyze-control-flow] wrote reports/control-flow-graph.json');
console.log(`Orchestrated paths: ${analysis.orchestratedPaths}`);
console.log(`Direct paths (violations): ${analysis.directPaths}`);
console.log(`Unknown paths: ${analysis.unknownPaths}`);
