'use strict';

const { execSync } = require('node:child_process');
const { readdirSync, mkdtempSync, rmSync, statSync } = require('node:fs');
const { join, dirname, resolve } = require('node:path');
const { tmpdir } = require('node:os');

const queueDir = '.ai-queue';
const patches  = readdirSync(queueDir).filter(f => f.endsWith('.patch')).sort();

if (!patches.length) {
  console.log('✅  No patches in queue – nothing to do.');
  process.exit(0);
}

const patch     = patches[0];
const patchAbs  = resolve(queueDir, patch);
const branch    = `ai/${patch.replace('.patch', '')}`;

const run = (cmd, opts = {}) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, HUSKY: '0' }, ...opts });
};

/* ───────────────────────────────────────────────────────────── */

try {
  /* 0  Skip empty patch files */
  if (statSync(patchAbs).size === 0) {
    throw new Error(`${patch} is empty`);
  }

  /* 1  Delete stale branch/PR refs (ignore errors) */
  try { run(`git branch -D ${branch}`);           } catch {} // local
  try { run(`git push origin --delete ${branch}`); } catch {} // remote

  /* 2  Isolated work‑tree */
  const workDir = mkdtempSync(join(tmpdir(), 'ai-patch-'));
  run(`git worktree add -b ${branch} ${workDir}`);

  /* 3  Dependencies */
  run('npm ci --ignore-scripts', { cwd: workDir });

  /* 4  Apply patch (3‑way merge if context shifted) */
  run(`git -C ${workDir} apply --index --whitespace=nowarn --3way "${patchAbs}"`);

  /* 5  Project gates */
  run('npm run lint',            { cwd: workDir });        // warnings allowed
  run('npm test --silent',       { cwd: workDir });
  run('node scripts/validate-sst.js', { cwd: workDir });

  /* 6  Commit & push PR branch */
  run(`git -C ${workDir} commit -am "ai: ${patch}"`);
  run(`git -C ${workDir} push -u origin ${branch}`);

  /* 7  Open PR (labelled “ai‑patch”) */
  run(`gh pr create -f -l ai-patch -t "${patch}" -b "Automated AI patch"`);

  /* 8  Remove patch from queue on success */
  rmSync(patchAbs);
  console.log('🎉  Patch applied & PR opened.');
} catch (err) {
  console.error('🛑  Patch failed – left in queue.');
  console.error(err.message || err);
  process.exit(1);
}
