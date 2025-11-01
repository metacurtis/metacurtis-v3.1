#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.cwd();

console.log(chalk.blue.bold('\n🚀 CDP v2.0 Initialization\n'));

async function init() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: path.basename(projectRoot)
    },
    {
      type: 'input',
      name: 'sstPath',
      message: 'Path to SST config:',
      default: 'sst/canon/v3.5.json'
    },
    {
      type: 'input',
      name: 'sstSchema',
      message: 'Path to SST schema:',
      default: 'sst/canon/v3.5.schema.json'
    },
    {
      type: 'confirm',
      name: 'autoSavepoints',
      message: 'Enable automatic savepoints?',
      default: true
    },
    {
      type: 'confirm',
      name: 'installHooks',
      message: 'Install git hooks?',
      default: true
    }
  ]);

  const spinner = ora('Creating CDP directory structure...').start();
  const cdpDir = path.join(projectRoot, '.cdp');
  const resultsDir = path.join(cdpDir, 'probe-results');
  fs.mkdirSync(cdpDir, { recursive: true });
  fs.mkdirSync(resultsDir, { recursive: true });
  spinner.succeed('.cdp directory created');

  spinner.start('Writing configuration files...');

  const configTemplate = {
    version: '2.0.0',
    projectName: answers.projectName,
    sst: {
      path: answers.sstPath,
      schema: answers.sstSchema
    },
    automation: {
      savepoints: {
        enabled: answers.autoSavepoints,
        autoCreate: answers.autoSavepoints,
        prefix: 'cdp-savepoint',
        maxSavepoints: 10
      },
      validation: {
        specCheck: 'always',
        probes: 'pre-commit',
        visualTests: 'optional'
      },
      hooks: {
        preCheckout: answers.installHooks,
        preCommit: answers.installHooks,
        postCommit: answers.installHooks
      }
    },
    enforcement: {
      blockOnSpecFail: true,
      blockOnProbeFail: true,
      blockOnVisualFail: false
    },
    visualTests: {
      mode: 'optional',
      mandatoryTriggers: [
        'src/shaders/**/*.glsl',
        'src/components/webgl/**',
        'src/engine/**'
      ]
    }
  };

  fs.writeFileSync(path.join(cdpDir, 'config.json'), JSON.stringify(configTemplate, null, 2));
  const probeSchemaTemplate = path.join(__dirname, '..', 'templates', 'probe-schema.json');
  fs.copyFileSync(probeSchemaTemplate, path.join(cdpDir, 'probe-schema.json'));
  spinner.succeed('Configuration files written');

  if (answers.installHooks) {
    spinner.start('Installing git hooks...');
    const huskyDir = path.join(projectRoot, '.husky');
    fs.mkdirSync(huskyDir, { recursive: true });
    for (const hook of ['pre-checkout', 'pre-commit', 'post-commit']) {
      const source = path.join(__dirname, '..', 'templates', `${hook}.sh`);
      const target = path.join(huskyDir, hook);
      fs.copyFileSync(source, target);
      fs.chmodSync(target, 0o755);
    }
    spinner.succeed('Git hooks installed');
  }

  spinner.start('Updating package.json scripts...');
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  packageJson.scripts = {
    ...packageJson.scripts,
    cdp: 'node scripts/cdp-quick.mjs',
    'cdp:start': 'node scripts/cdp-start.mjs',
    'cdp:check': 'npm run validate-sst && npm run detect-drift',
    'cdp:probe': 'node scripts/cdp-probe.mjs',
    'cdp:validate': 'npm run cdp:check && npm run cdp:probe',
    'cdp:commit': 'node scripts/cdp-commit.mjs',
    'cdp:savepoint': 'node scripts/cdp-savepoint.mjs',
    'cdp:savepoint:list': 'node scripts/cdp-savepoint.mjs --list',
    'cdp:rollback': 'node scripts/cdp-rollback.mjs'
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  spinner.succeed('package.json updated');

  console.log(chalk.green.bold('\n✅ CDP v2.0 initialization complete!\n'));
  console.log(chalk.cyan('Next steps:'));
  console.log('  1. Review configuration: .cdp/config.json');
  console.log('  2. Customize probes: .cdp/probe-schema.json');
  console.log('  3. Start work: npm run cdp:start feat/your-feature\n');
}

init().catch((error) => {
  console.error(chalk.red('Initialization failed:'), error);
  process.exit(1);
});
