#!/usr/bin/env node
const fs=require('fs'), path=require('path');
const need = [
  'src/modules/state/StateController.js',
  'src/engine/EngineStateBridge.js',
  'src/dev/stateVerify.js',
  'src/main.jsx',
];
let ok=true;
for(const f of need){ if(!fs.existsSync(f)){ console.log('✗ missing', f); ok=false;} else { console.log('✓', f);} }
const main = fs.readFileSync('src/main.jsx','utf8');
['EngineStateBridge.js','dev/stateVerify.js','modules/state/StateController.js'].forEach(s=>{
  if(main.includes(s)) console.log('✓ main.jsx imports', s); else { console.log('✗ main.jsx missing import', s); ok=false; }
});
process.exit(ok?0:1);
