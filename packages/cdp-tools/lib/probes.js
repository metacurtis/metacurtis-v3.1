import fs from 'fs';
import path from 'path';
import playwright from 'playwright';
import { ConfigManager } from './config.js';
import { Logger } from './logger.js';

export class ProbeRunner {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.config = new ConfigManager(projectRoot);
    this.logger = new Logger();
    this.resultsDir = path.join(projectRoot, '.cdp', 'probe-results');
  }

  async runProbes(options = {}) {
    const { url = 'http://localhost:5173', headless = true } = options;
    const schema = this.config.loadProbeSchema();

    this.logger.info('🔬 Running probe validation...');

    const browser = await playwright.chromium.launch({ headless });
    const page = await browser.newPage();

    await page.goto(url);
    await page.waitForFunction(() => window.probe !== undefined, { timeout: 10000 });

    const results = {
      timestamp: new Date().toISOString(),
      duration: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      probes: {}
    };

    const startTime = Date.now();

    for (const [name, probe] of Object.entries(schema.probes || {})) {
      if (!probe.required) {
        results.skipped += 1;
        continue;
      }

      try {
        const probeResult = await this.executeProbe(page, probe);
        results.probes[name] = probeResult;
        if (probeResult.status === 'PASS') {
          results.passed += 1;
          this.logger.success(`✅ ${name}: PASS (${probeResult.duration}ms)`);
        } else {
          results.failed += 1;
          this.logger.error(`❌ ${name}: ${probeResult.status}`);
          if (probeResult.error) {
            this.logger.error(`   ${probeResult.error}`);
          }
          if (probe.errorMessage) {
            this.logger.error(`   ${probe.errorMessage}`);
          }
        }
      } catch (error) {
        results.failed += 1;
        results.probes[name] = { status: 'ERROR', error: error.message };
        this.logger.error(`❌ ${name}: ERROR`);
        this.logger.error(`   ${error.message}`);
      }
    }

    results.duration = Date.now() - startTime;

    await browser.close();

    this.saveResults(results);
    this.printSummary(results);

    return results;
  }

  async executeProbe(page, probe) {
    const start = Date.now();
    const timeout = probe.timeout || 5000;

    return page.evaluate(async ({ probe, start, timeout }) => {
      const contextResult = await (async () => {
        if (!probe.context) return null;
        try {
          return await (new Function(`${probe.context}; return (typeof result !== 'undefined') ? result : undefined;`))();
        } catch (err) {
          return { __contextError: err.message };
        }
      })();

      const evaluateAssertion = () => {
        if (!probe.assertion) return false;
        try {
          return Boolean(eval(probe.assertion));
        } catch (_) {
          return false;
        }
      };

      const startTs = Date.now();
      while (Date.now() - startTs < timeout) {
        if (evaluateAssertion()) {
          return {
            status: 'PASS',
            duration: Date.now() - startTs,
            actual: contextResult
          };
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        status: 'FAIL',
        duration: Date.now() - startTs,
        actual: contextResult,
        error: 'Timeout'
      };
    }, { probe, start, timeout });
  }

  saveResults(results) {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
    const filename = `${Date.now()}.json`;
    fs.writeFileSync(path.join(this.resultsDir, filename), JSON.stringify(results, null, 2));
    fs.writeFileSync(path.join(this.resultsDir, 'latest.json'), JSON.stringify(results, null, 2));
  }

  printSummary(results) {
    this.logger.info('\n📊 Probe Summary');
    this.logger.success(`  Passed: ${results.passed}`);
    if (results.failed) {
      this.logger.error(`  Failed: ${results.failed}`);
    }
    if (results.skipped) {
      this.logger.debug(`  Skipped: ${results.skipped}`);
    }
    this.logger.info(`  Duration: ${results.duration}ms\n`);
  }
}
