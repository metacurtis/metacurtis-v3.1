'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
Object.defineProperty(exports, '__esModule', { value: true });
// scripts/apply-ai-patch.cjs
// ⏩  Pops the oldest *.patch in .ai-queue/, validates, pushes branch, opens PR
var node_child_process_1 = require('node:child_process');
var node_fs_1 = require('node:fs');
var node_path_1 = require('node:path');
var node_os_1 = require('node:os');
var queueDir = '.ai-queue';
var patches = (0, node_fs_1.readdirSync)(queueDir)
  .filter(function (f) {
    return f.endsWith('.patch');
  })
  .sort();
if (patches.length === 0) {
  console.log('✅  No patches in queue. Nothing to do.');
  process.exit(0);
}
var patchPath = (0, node_path_1.join)(queueDir, patches[0]);
var branch = 'ai/'.concat(patches[0].replace('.patch', ''));
function run(cmd, opts) {
  if (opts === void 0) {
    opts = {};
  }
  console.log('$ '.concat(cmd));
  return (0, node_child_process_1.execSync)(cmd, __assign({ stdio: 'inherit' }, opts));
}
try {
  // ✨ guard: nuke any stale branch from previous failed runs
  try { run(`git branch -D ${branch}`); } catch {}
  try { run(`git push origin --delete ${branch}`); } catch {}

  // create temp worktree
  var workDir = (0, node_fs_1.mkdtempSync)(
    (0, node_path_1.join)((0, node_os_1.tmpdir)(), 'ai-patch-')
  );
  run('git worktree add -b '.concat(branch, ' ').concat(workDir));
  // apply patch
  process.chdir(workDir);

  // (OPTIONAL) If you hit "corrupt patch at line ...", add --whitespace=nowarn:
  run('git apply --index --whitespace=nowarn '.concat((0, node_path_1.join)('..', patchPath)));

  // run project validators
  run('npm run lint --silent');
  run('npm test --silent');
  run('node scripts/validate-sst.js');
  // commit & push
  run('git commit -am "AI patch: '.concat(patches[0], '"'));
  run('git push -u origin '.concat(branch));
  // open GitHub PR (gh CLI)
  run('gh pr create -f -l "ai-patch" -t "'.concat(patches[0], '" -b "Automated AI patch"'));
  // success ⇒ remove patch from queue
  process.chdir((0, node_path_1.dirname)(__dirname));
  (0, node_fs_1.rmSync)(patchPath);
  console.log('🎉  Patch applied & PR opened.');
} catch (e) {
  console.error('🛑  Patch failed validation; leaving in queue.');
  process.exit(1);
}
