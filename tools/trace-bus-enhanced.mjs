import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function* walk(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      yield* walk(fullPath);
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      yield fullPath;
    }
  }
}

async function main() {
  const reportsDir = path.join(__dirname, '..', 'reports');
  await fs.promises.mkdir(reportsDir, { recursive: true });

  const emitters = {};
  const listeners = {};
  const stateRelatedEvents = new Set();

  const stateEventPatterns = [
    'STAGE_CHANGE',
    'STAGE_TRANSITION',
    'MORPH_PROGRESS',
    'MORPH_UPDATE',
    'QUALITY_CHANGE',
    'PHASE_CHANGE',
    'SKIP_REQUESTED',
    'OPENING_',
    'FENCEPOST'
  ];

  for await (const file of walk('src')) {
    const content = await fs.promises.readFile(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      const emitMatch = line.match(/BeatBus\.emit\s*\(\s*([^\s,)+]+)/);
      if (emitMatch) {
        const rawToken = emitMatch[1];
        const eventName = rawToken.replace(/['"`]/g, '');
        if (!emitters[eventName]) emitters[eventName] = [];
        emitters[eventName].push({ file, line: lineNum, token: rawToken });
        if (stateEventPatterns.some(p => eventName.includes(p))) {
          stateRelatedEvents.add(eventName);
        }
      }

      const onMatch = line.match(/BeatBus\.on\s*\(\s*([^\s,)+]+)/);
      if (onMatch) {
        const rawToken = onMatch[1];
        const eventName = rawToken.replace(/['"`]/g, '');
        if (!listeners[eventName]) listeners[eventName] = [];
        listeners[eventName].push({ file, line: lineNum, token: rawToken });
        if (stateEventPatterns.some(p => eventName.includes(p))) {
          stateRelatedEvents.add(eventName);
        }
      }
    });
  }

  let mdReport = `# Enhanced BeatBus Event Map (State-Focused)\n`;
  mdReport += `Generated: ${new Date().toISOString()}\n\n`;

  mdReport += `## State-Related Events\n\n`;
  mdReport += `Found ${stateRelatedEvents.size} state-related events:\n\n`;
  
  for (const eventName of Array.from(stateRelatedEvents).sort()) {
    mdReport += `### ${eventName}\n\n`;
    
    if (emitters[eventName]) {
      mdReport += `**Emitters (${emitters[eventName].length}):**\n`;
      emitters[eventName].forEach(({ file, line, token }) => {
        mdReport += `- \`${file}:${line}\` (token: \`${token}\`)\n`;
      });
      mdReport += '\n';
    }
    
    if (listeners[eventName]) {
      mdReport += `**Listeners (${listeners[eventName].length}):**\n`;
      listeners[eventName].forEach(({ file, line, token }) => {
        mdReport += `- \`${file}:${line}\` (token: \`${token}\`)\n`;
      });
      mdReport += '\n';
    }
    
    mdReport += '---\n\n';
  }

  await fs.promises.writeFile(
    path.join(reportsDir, 'beatbus-state-events.md'),
    mdReport
  );

  const jsonReport = {
    stateEvents: Array.from(stateRelatedEvents),
    emitters: Object.fromEntries(
      Array.from(stateRelatedEvents).map(e => [e, emitters[e] || []])
    ),
    listeners: Object.fromEntries(
      Array.from(stateRelatedEvents).map(e => [e, listeners[e] || []])
    )
  };

  await fs.promises.writeFile(
    path.join(reportsDir, 'beatbus-state-events.json'),
    JSON.stringify(jsonReport, null, 2)
  );

  console.log('✅ Enhanced BeatBus map generated');
  console.log(`   - State-related events: ${stateRelatedEvents.size}`);
  console.log(`   - Total unique events: ${Object.keys(emitters).length}`);
}

main().catch(console.error);
