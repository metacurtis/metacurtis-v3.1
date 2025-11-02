import fs from 'fs';
import path from 'path';
import { walk } from './lib/walk.mjs';

const outDir = 'reports';
await fs.promises.mkdir(outDir, { recursive: true });

const PATTERNS = [
  // Navigation entry points
  { key: 'NAVIGATE_TO_STAGE', re: /navigateToStage\s*\(/i },
  { key: 'JUMP_TO_STAGE', re: /jumpToStage\s*\(/i },
  { key: 'STAGE_ATOM_SET', re: /stageAtom\.(set|jump)/i },
  { key: 'SCROLL_TO_STAGE', re: /scrollToStage\s*\(/i },
  
  // Narration controls
  { key: 'AUTO_ADVANCE', re: /autoAdvance|triggerAutoAdvance|markAutoAdvance/i },
  { key: 'NARRATION_NEXT', re: /narration.*\.next\(\)|liveControls\.next/i },
  { key: 'NARRATION_START', re: /startNarration|START_NARRATIVE/i },
  { key: 'NARRATION_STOP', re: /stopNarration|STOP_NARRATIVE/i },
  
  // Manual controls
  { key: 'STAGE_CONTROLS', re: /stageControls\.(next|prev|jumpToStage)/i },
  { key: 'ARROW_NAV', re: /ArrowDown|ArrowUp|ArrowLeft|ArrowRight.*stage/i },
  { key: 'KEYBOARD_NAV', re: /onKeyDown.*stage|handleKeyPress.*stage/i },
  
  // Orchestration
  { key: 'SCROLL_ORCHESTRATOR', re: /ScrollOrchestrator\.(start|orchestrate|navigateTo)/i },
  { key: 'UNIFIED_NAV', re: /unifiedNav\.(navigateToStage|isNavigating)/i },
  { key: 'NAVIGATION_GATE', re: /NavigationGate\.(enter|canNavigate)/i },
  
  // Race condition indicators
  { key: 'FALLBACK_JUMP', re: /fallback.*jump|direct.*jump|bypass.*orchestrat/i },
  { key: 'RAPID_FIRE', re: /rapid|too.*fast|interval.*violation/i },
  { key: 'DUPLICATE_EVENT', re: /duplicate.*stage|already.*stage/i },
  
  // State mutations
  { key: 'STAGE_CHANGE_EMIT', re: /emit\s*\(\s*['"]STAGE_CHANGE/i },
  { key: 'MORPH_PROGRESS', re: /MORPH_PROGRESS|setMorph|morphTo/i },
  
  // Timing controls
  { key: 'SETTLE_TIME', re: /settle|settling|navigationSettleMs/i },
  { key: 'DEBOUNCE', re: /debounce|throttle.*stage/i }
];

function captureContext(lines, idx, span = 3) {
  const start = Math.max(0, idx - span);
  const end = Math.min(lines.length, idx + span + 1);
  return lines.slice(start, end)
    .map((l, i) => `${start + i + 1}: ${l}`)
    .join('\n');
}

const hits = [];

for await (const file of walk('src')) {
  const txt = await fs.promises.readFile(file, 'utf8');
  const lines = txt.split('\n');
  
  PATTERNS.forEach(({key, re}) => {
    lines.forEach((ln, i) => {
      if (re.test(ln)) {
        hits.push({
          key,
          file,
          line: i + 1,
          context: captureContext(lines, i, 3)
        });
      }
    });
  });
}

// Group by key
const byKey = hits.reduce((acc, h) => {
  (acc[h.key] ||= []).push(h);
  return acc;
}, {});

// Generate summary stats
const summary = {
  timestamp: new Date().toISOString(),
  totalHits: hits.length,
  byCategory: {
    entryPoints: ['NAVIGATE_TO_STAGE', 'JUMP_TO_STAGE', 'STAGE_ATOM_SET', 'SCROLL_TO_STAGE']
      .reduce((sum, k) => sum + (byKey[k]?.length || 0), 0),
    narrationControls: ['AUTO_ADVANCE', 'NARRATION_NEXT', 'NARRATION_START', 'NARRATION_STOP']
      .reduce((sum, k) => sum + (byKey[k]?.length || 0), 0),
    manualControls: ['STAGE_CONTROLS', 'ARROW_NAV', 'KEYBOARD_NAV']
      .reduce((sum, k) => sum + (byKey[k]?.length || 0), 0),
    orchestration: ['SCROLL_ORCHESTRATOR', 'UNIFIED_NAV', 'NAVIGATION_GATE']
      .reduce((sum, k) => sum + (byKey[k]?.length || 0), 0),
    raceIndicators: ['FALLBACK_JUMP', 'RAPID_FIRE', 'DUPLICATE_EVENT']
      .reduce((sum, k) => sum + (byKey[k]?.length || 0), 0)
  },
  patterns: Object.keys(byKey).map(k => ({
    key: k,
    count: byKey[k].length,
    files: [...new Set(byKey[k].map(h => h.file))].length
  }))
};

// Write JSON
await fs.promises.writeFile(
  path.join(outDir, 'navigation-patterns.json'),
  JSON.stringify({ summary, patterns: byKey }, null, 2)
);

// Write Markdown
const md = [
  '# Navigation Pattern Analysis',
  '',
  `**Generated:** ${summary.timestamp}`,
  `**Total Hits:** ${summary.totalHits}`,
  '',
  '## Summary by Category',
  '',
  '| Category | Count |',
  '|----------|-------|',
  `| Entry Points | ${summary.byCategory.entryPoints} |`,
  `| Narration Controls | ${summary.byCategory.narrationControls} |`,
  `| Manual Controls | ${summary.byCategory.manualControls} |`,
  `| Orchestration | ${summary.byCategory.orchestration} |`,
  `| **Race Indicators** | **${summary.byCategory.raceIndicators}** |`,
  '',
  '## Pattern Distribution',
  '',
  '| Pattern | Count | Files |',
  '|---------|-------|-------|',
  ...summary.patterns.map(p => `| ${p.key} | ${p.count} | ${p.files} |`),
  '',
  '## Detailed Hits by Pattern',
  ''
];

Object.entries(byKey).forEach(([key, hits]) => {
  md.push(`### ${key} (${hits.length} hits)`);
  md.push('');
  hits.forEach(h => {
    md.push(`**${h.file}:${h.line}**`);
    md.push('```javascript');
    md.push(h.context);
    md.push('```');
    md.push('');
  });
});

await fs.promises.writeFile(
  path.join(outDir, 'navigation-patterns.md'),
  md.join('\n')
);

console.log('[scan-navigation] wrote reports/navigation-patterns.{json,md}');
console.log(`Total patterns found: ${summary.totalHits}`);
console.log(`Race condition indicators: ${summary.byCategory.raceIndicators}`);
