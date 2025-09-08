#!/usr/bin/env node
/* eslint-env node */
import {spawnSync} from 'node:child_process';
const r=spawnSync(process.execPath, ['tools/sst-guard.mjs','--opening'], {stdio:'inherit'});
process.exit(r.status ?? 0);
