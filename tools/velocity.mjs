import fs from 'fs';
const out = 'reports/velocity.csv';
if (!fs.existsSync('reports')) fs.mkdirSync('reports');
const now = ()=> new Date().toISOString();
const cmd = process.argv[2];
const task = process.argv[3] || process.env.npm_config_task || 'unspecified';
if (cmd==='start') {
  fs.appendFileSync(out, `${now()},START,${task}\n`); console.log('[velocity] START', task);
} else if (cmd==='stop') {
  fs.appendFileSync(out, `${now()},STOP,${task}\n`); console.log('[velocity] STOP', task);
} else {
  console.log('usage: node tools/velocity.mjs start|stop "Task Name"');
}
