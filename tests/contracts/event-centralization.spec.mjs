import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { globSync } from 'glob';

const SRC_GLOB = 'src/**/*.{js,jsx}';

const START_NARRATIVE_REGEX = /BeatBus\.emit\(\s*EVENTS\.START_NARRATIVE/;
const AUTHORIZED_START_FILES = new Set(['src/theater/TheaterDirector.js']);

describe('Event Centralization Contracts', () => {
  it('START_NARRATIVE is only emitted from TheaterDirector', () => {
    const files = globSync(SRC_GLOB, { nodir: true });
    const unauthorized = [];

    for (const file of files) {
      if (AUTHORIZED_START_FILES.has(file)) continue;
      const content = readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (START_NARRATIVE_REGEX.test(line)) {
          unauthorized.push({ file, line: idx + 1, code: line.trim() });
        }
      });
    }

    expect(unauthorized, 'Unauthorized START_NARRATIVE emitters detected').toEqual([]);
  });

  it('narrativeAtom does not define bypass helpers', () => {
    const narrativeAtomPath = 'src/state/atoms/narrativeAtom.js';
    const content = readFileSync(narrativeAtomPath, 'utf8');
    const bypassHelpers = ['jumpToStage', 'nextStage', 'prevStage', 'setStage'];
    const offenders = bypassHelpers.filter((helper) =>
      new RegExp(`narrativeAtom\\.${helper}\\s*=\\s*function`).test(content)
    );

    expect(offenders, 'narrativeAtom bypass helpers must not exist').toEqual([]);
  });
});
