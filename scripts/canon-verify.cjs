#!/usr/bin/env node
/* eslint-env node */
/* Canon CI Verification */
const fs = require('fs');
const _path = require('path');

function checkFile(p){ const ok = fs.existsSync(path.join(process.cwd(), p)); console.log('  ' + (ok?'✅':'❌') + ' ' + p); return ok; }

async function main(){
  console.log('🔍 Canon CI Verification\n');
  let ok = true;
  ok &= checkFile('src/canon/contracts/registry.js');
  ok &= checkFile('src/canon/boundary.js');
  ok &= checkFile('src/canon/hud.js');
  ok &= checkFile('src/canon/tests/contracts.test.js');
  ok &= checkFile('src/canon/doctor/base.js');
  ok &= checkFile('src/canon/deprecation.js');
  ok &= checkFile('src/canon/init-amplified.js');
  console.log('\n' + (ok? '✅ Canon verification PASSED':'❌ Canon verification FAILED'));
  process.exit(ok ? 0 : 1);
}
main().catch(e => { console.error(e); process.exit(1); });
