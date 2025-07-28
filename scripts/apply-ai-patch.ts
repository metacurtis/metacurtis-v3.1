// scripts/apply-ai-patch.ts
// ⏩  Pops the oldest *.patch in .ai-queue/, validates, pushes branch, opens PR

import { execSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const queueDir = '.ai-queue';
const patches = readdirSync(queueDir).filter(f => f.endsWith('.patch')).sort();
if (patches.length === 0) {
  console.log('✅  No patches in queue. Nothing to do.');
  process.exit(0);
}

const patchPath = resolve(queueDir, patches[0]); // ABSOLUTE PATH!
const branch = `ai/${patches[0].replace('.patch','')}`;

function run(cmd: string, opts = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', ...opts });
}

try {
  // create temp worktree
  const workDir = mkdtempSync(join(tmpdir(), 'ai-patch-'));
  run(`git worktree add -b ${branch} ${workDir}`);

  // apply patch
  process.chdir(workDir);
  console.log('Using patch file:', patchPath);
  run(`ls -l ${patchPath}`); // debug output to prove file exists
  run(`git apply --index ${patchPath}`);

  // run project validators
  run('npm run lint --silent');
  run('npm test --silent');
  run('node scripts/validate-sst.js');

  // commit & push
  run(`git commit -am "AI patch: ${patches[0]}"`);
  run(`git push -u origin ${branch}`);

  // open GitHub PR (gh CLI)
  run(`gh pr create -f -l "ai-patch" -t "${patches[0]}" -b "Automated AI patch"`);

  // success ⇒ remove patch from queue
  process.chdir(dirname(__dirname));
  rmSync(patchPath);
  console.log('🎉  Patch applied & PR opened.');
} catch (e) {
  console.error('🛑  Patch failed validation; leaving in queue.');
  if (e instanceof Error) {
    console.error(e.message);
  }
  process.exit(1);
}
