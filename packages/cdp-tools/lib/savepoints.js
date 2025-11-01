import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Logger } from './logger.js';

export class SavepointManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.logger = new Logger();
    this.logPath = path.join(projectRoot, '.cdp', 'savepoints.log');
  }

  createSavepoint(description = 'auto', options = {}) {
    const { auto = false } = options;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const branch = this.getCurrentBranch();
    const tag = `${options.prefix || 'cdp-savepoint'}-${timestamp}`;

    this.logger.info('🔒 Creating savepoint...');

    execSync(`git tag -a ${tag} -m "CDP savepoint: ${description}"`, {
      cwd: this.projectRoot,
      stdio: 'pipe'
    });

    this.logSavepoint({
      tag,
      branch,
      description,
      timestamp: new Date().toISOString(),
      auto
    });

    this.logger.success(`✅ Savepoint created: ${tag}`);
    return tag;
  }

  listSavepoints() {
    if (!fs.existsSync(this.logPath)) {
      return [];
    }
    return fs
      .readFileSync(this.logPath, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }

  rollbackToSavepoint(tag) {
    this.logger.info(`🔄 Rolling back to ${tag}...`);
    execSync(`git reset --hard ${tag}`, {
      cwd: this.projectRoot,
      stdio: 'inherit'
    });
    this.logger.success('✅ Rollback complete');
  }

  cleanupOldSavepoints(max = 10) {
    const entries = this.listSavepoints();
    if (entries.length <= max) return;

    const stale = entries.slice(0, entries.length - max);
    for (const entry of stale) {
      try {
        execSync(`git tag -d ${entry.tag}`, {
          cwd: this.projectRoot,
          stdio: 'pipe'
        });
      } catch (_) {
        // Ignore if already deleted
      }
    }

    const remaining = entries.slice(entries.length - max);
    fs.writeFileSync(this.logPath, remaining.map((s) => JSON.stringify(s)).join('\n') + '\n');
    this.logger.info(`🧹 Cleaned ${stale.length} savepoints`);
  }

  getCurrentBranch() {
    try {
      return execSync('git branch --show-current', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  logSavepoint(entry) {
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n');
  }
}
