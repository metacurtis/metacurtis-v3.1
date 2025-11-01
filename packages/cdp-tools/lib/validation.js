import { execSync } from 'child_process';
import { ConfigManager } from './config.js';
import { Logger } from './logger.js';

export class ValidationRunner {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.config = new ConfigManager(projectRoot);
    this.logger = new Logger();
  }

  async runSSTValidation() {
    this.logger.info('🔍 Running SST validation...');
    try {
      execSync('npm run validate-sst', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      this.logger.success('✅ SST validation passed');
      return { passed: true };
    } catch (error) {
      const output = error.stdout?.toString() || error.message;
      this.logger.error('❌ SST validation failed');
      this.logger.error(output);
      return { passed: false, error: output };
    }
  }

  async runDriftDetection() {
    this.logger.info('🔍 Running drift detection...');
    try {
      execSync('npm run detect-drift', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      this.logger.success('✅ No drift detected');
      return { passed: true, driftCount: 0 };
    } catch (error) {
      const output = error.stdout?.toString() || error.message;
      const match = /Found (\d+)/.exec(output);
      const driftCount = match ? Number(match[1]) : 1;
      this.logger.error(`❌ Drift detected: ${driftCount}`);
      this.logger.error(output);
      return { passed: false, driftCount, error: output };
    }
  }

  async runSpecCheck() {
    const sst = await this.runSSTValidation();
    if (!sst.passed) return sst;
    return this.runDriftDetection();
  }
}
