#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';

const program = new Command();

program
  .name('cdp')
  .description('Constitutional Development Protocol CLI')
  .version('2.0.0');

program
  .command('init')
  .description('Initialize CDP in the current project')
  .action(() => {
    runScript('init.js');
  });

program
  .command('start [branch]')
  .allowUnknownOption(true)
  .description('Start a CDP session on the given branch')
  .action((branch, opts) => {
    runScript('cdp-start.mjs', branch ? [branch, ...opts.parent.args.slice(2)] : opts.parent.args.slice(2));
  });

program
  .command('check')
  .description('Run spec validation only')
  .action(() => {
    runScript('cdp-check.mjs');
  });

program
  .command('probe')
  .allowUnknownOption(true)
  .description('Run probe validation')
  .action((opts) => {
    runScript('cdp-probe.mjs', opts.parent.args.slice(2));
  });

program
  .command('commit <message>')
  .allowUnknownOption(true)
  .description('Commit with CDP validation')
  .action((message, opts) => {
    const extra = opts.parent.args.slice(3);
    runScript('cdp-commit.mjs', [message, ...extra]);
  });

program
  .command('savepoint')
  .allowUnknownOption(true)
  .description('Manage savepoints (create/list)')
  .action((opts) => {
    runScript('cdp-savepoint.mjs', opts.parent.args.slice(2));
  });

program
  .command('rollback [target]')
  .allowUnknownOption(true)
  .description('Rollback to a savepoint')
  .action((target, opts) => {
    const args = target ? [target, ...opts.parent.args.slice(3)] : opts.parent.args.slice(2);
    runScript('cdp-rollback.mjs', args);
  });

program.parse(process.argv);

function runScript(scriptName, args = []) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const scriptPath = path.join(__dirname, '..', 'scripts', scriptName);

  const child = spawn('node', [scriptPath, ...args], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}
