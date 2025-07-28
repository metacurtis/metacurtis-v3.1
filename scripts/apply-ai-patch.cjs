#!/usr/bin/env node
/*  scripts/apply-ai-patch.cjs
    Pops the oldest *.patch from .ai‑queue, validates, pushes branch, opens PR
    Works both locally and in GitHub Actions.  Node 20+ required in CI.       */

'use strict';
const { execSync }      = require('node:child_process');
const { readdirSync,
        mkdtempSync,
        rmSync,
        statSync,
        existsSync }    = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir }        = require('node:os');

/* ---------------------------------------------------------------- helpers */
const run = (cmd, opts = {}) => {
  console.log(`$ ${cmd}`);
  return execSync(cmd, {
    stdio: 'inherit',
    env:   { ...process.env, HUSKY: '0' },   // skip Husky hooks
    ...opts
  });
};

/* ---------------------------------------------------------------- locate */
const QUEUE = '.ai-queue';
const patches = readdirSync(QUEUE).filter(f => f.endsWith('.patch')).sort();
if (!patches.length) {
  console.log('✅  No patches in queue – nothing to do.');
  process.exit(0);
}

const name     = patches[0];
const branch   = `ai/${name.replace('.patch', '')}`;
const localAbs = resolve(QUEUE, name);
const ciAbs    = process.env.GITHUB_WORKSPACE
               ? join(process.env.GITHUB_WORKSPACE, QUEUE, name)
               : localAbs;
const patchAbs = existsSync(ciAbs) ? ciAbs : localAbs;

if (!existsSync(patchAbs) || statSync(patchAbs).size === 0) {
  console.error(`🛑  Patch ${patchAbs} missing or empty.`);
  process.exit(1);
}

console.log(`👉  Applying ${patchAbs} on branch ${branch}`);

/* ---------------------------------------------------------------- apply */
try {
  /* clean any stale refs */
  try { run(`git branch -D ${branch}`);            } catch {}
  try { run(`git push origin --delete ${branch}`); } catch {}

  /* work‑tree dance */
  const work = mkdtempSync(join(tmpdir(), 'ai-patch-'));
  run(`git worktree add -b ${branch} ${work}`);
  process.chdir(work);

  run(`git apply --index --whitespace=nowarn "${patchAbs}"`);
  run('npm run lint  --silent');
  run('npm test      --silent');
  run('node scripts/validate-sst.js');

  run(`git commit -am "ai: ${name}" --no-verify`);
  run(`git push -u origin ${branch}`);

  /* PR – skip locally if gh CLI absent */
  try { run(`gh pr create -f -l ai-patch -t "${name}" -b "Automated AI patch"`); } catch {}

  /* success – drop from queue */
  process.chdir('..');            // out of work‑tree
  rmSync(patchAbs);
  console.log('🎉  Patch applied & PR opened.');
} catch (err) {
  console.error('\n🛑  Patch failed – left in queue.\n');
  console.error(err?.message || err);
  process.exit(1);
}
