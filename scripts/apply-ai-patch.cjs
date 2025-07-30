'use strict';

const { execSync }   = require('node:child_process');
const { readdirSync, mkdtempSync, rmSync, statSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');

const queueDir = '.ai-queue';
const patches  = readdirSync(queueDir)
  .filter(f => f.endsWith('.patch'))
  .sort();                 // FIFO

if (!patches.length) {
  console.log('✅  No patches in queue – nothing to do.');
  process.exit(0);
}

const patch    = patches[0];
const patchAbs = resolve(queueDir, patch);
const branch   = `ai/${patch.replace('.patch', '')}`;

const run = (cmd, opts = {}) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit',
                  env: { ...process.env, HUSKY: '0' },
                  ...opts });
};

try {
  /* 0 — bail early on empty patch */
  if (statSync(patchAbs).size === 0) {
    throw new Error(`${patch} is empty – remove or regenerate`);
  }

  /* 1 — clean stale branches (ignore failures) */
  try { run(`git branch -D ${branch}`);           } catch {}
  try { run(`git push origin --delete ${branch}`); } catch {}

  /* 2 — isolated work‑tree */
  const workDir = mkdtempSync(join(tmpdir(), 'ai-patch-'));
  run(`git worktree add -b ${branch} ${workDir}`);

  /* 2a — set author so git commit works */
  run(`git -C ${workDir} config user.name  "github-actions[bot]"`);
  run(`git -C ${workDir} config user.email "41898282+github-actions[bot]@users.noreply.github.com"`);

  /* 3 — dependencies */
  run('npm ci --ignore-scripts', { cwd: workDir });

  /* 4 — apply patch (3‑way merge fallback) */
  run(`git -C ${workDir} apply --index --whitespace=nowarn --3way "${patchAbs}"`);

  /* 5 — project gates */
  run('npm run lint',                 { cwd: workDir }); // warnings allowed
  run('npm test --silent',            { cwd: workDir });
  run('node scripts/validate-sst.js',  { cwd: workDir });

  /* 6 — commit & push PR branch */
  run(`git -C ${workDir} commit -am "ai: ${patch}"`);
  run(`git -C ${workDir} push -u origin ${branch}`);

  /* 7 — open PR */
  run(`gh pr create -f -l ai-patch -t "${patch}" -b "Automated AI patch"`);

  /* 8 — remove patch from queue */
  rmSync(patchAbs);
  console.log('🎉  Patch applied & PR opened.');
} catch (err) {
  console.error('🛑  Patch failed – left in queue.');
  console.error(err.message || err);
  process.exit(1);
}
