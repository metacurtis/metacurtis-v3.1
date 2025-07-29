'use strict';
const { execSync } = require('node:child_process');
const { readdirSync, mkdtempSync, rmSync } = require('node:fs');
const { join, dirname, resolve } = require('node:path');
const { tmpdir } = require('node:os');

const queueDir = '.ai-queue';
const patches  = readdirSync(queueDir).filter(f => f.endsWith('.patch')).sort();
if (!patches.length) {
  console.log('✅  No patches in queue – nothing to do.');
  process.exit(0);
}

const patch   = patches[0];
const patchAbs = resolve(queueDir, patch);
const branch   = `ai/${patch.replace('.patch','')}`;

const run = (cmd, opts = {}) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio:'inherit', env:{ ...process.env, HUSKY:'0'}, ...opts });
};

try {
  /* clean stale refs (ignore errors when they don’t exist) */
  try { run(`git branch -D ${branch}`); }          catch {}
  try { run(`git push origin --delete ${branch}`); } catch {}

  /* create isolated work‑tree */
  const workDir = mkdtempSync(join(tmpdir(), 'ai-patch-'));
  run(`git worktree add -b ${branch} ${workDir}`);

  /* install deps in that work‑tree */
  run('npm ci --ignore-scripts', { cwd: workDir });

  /* apply patch */
  run(`git -C ${workDir} apply --index --whitespace=nowarn "${patchAbs}"`);

  /* project gates */
  run('npm run lint --silent',         { cwd: workDir });
  run('npm test --silent',             { cwd: workDir });
  run('node scripts/validate-sst.js',  { cwd: workDir });

  /* commit & push */
  run(`git -C ${workDir} commit -am "ai: ${patch}"`);
  run(`git -C ${workDir} push -u origin ${branch}`);

  /* create PR */
  run(`gh pr create -f -l ai-patch -t "${patch}" -b "Automated AI patch"`);

  /* success → remove file */
  rmSync(patchAbs);
  console.log('🎉  Patch applied & PR opened.');
} catch (err) {
  console.error('🛑  Patch failed – left in queue.');
  console.error(err.message || err);
  process.exit(1);
}
