#!/usr/bin/env node

console.log(`
CDP v2.0 quick help
-------------------
• npm run cdp:start <branch>    Start session with savepoint
• npm run cdp:validate          Spec + probes
• npm run cdp:commit "message"  Commit with enforcement
• npm run cdp:savepoint:list    Inspect savepoints
`);
