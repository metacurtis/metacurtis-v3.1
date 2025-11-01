import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

export class ConfigManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.configPath = path.join(projectRoot, '.cdp', 'config.json');
    this.schemaPath = path.join(projectRoot, '.cdp', 'probe-schema.json');
  }

  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error('CDP not initialized. Run: npx cdp init');
    }
    return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
  }

  loadProbeSchema() {
    if (!fs.existsSync(this.schemaPath)) {
      throw new Error('Probe schema not found. Run: npx cdp init');
    }
    return JSON.parse(fs.readFileSync(this.schemaPath, 'utf-8'));
  }

  validateConfig(config) {
    const ajv = new Ajv({ allErrors: true });
    const schema = {
      type: 'object',
      required: ['version', 'projectName', 'automation'],
      properties: {
        version: { type: 'string', pattern: '^2\\.0\\.\\d+$' },
        projectName: { type: 'string' },
        automation: {
          type: 'object',
          required: ['savepoints', 'validation'],
          properties: {
            savepoints: {
              type: 'object',
              required: ['enabled', 'autoCreate'],
              properties: {
                enabled: { type: 'boolean' },
                autoCreate: { type: 'boolean' }
              }
            },
            validation: {
              type: 'object',
              required: ['specCheck', 'probes'],
              properties: {
                specCheck: { enum: ['always', 'conditional', 'never'] },
                probes: { enum: ['always', 'pre-commit', 'conditional', 'never'] }
              }
            }
          }
        }
      }
    };

    const validate = ajv.compile(schema);
    const valid = validate(config);

    if (!valid) {
      throw new Error(`Invalid CDP config: ${JSON.stringify(validate.errors, null, 2)}`);
    }

    return true;
  }

  getSSTConfig() {
    const config = this.loadConfig();
    if (!config.sst) {
      throw new Error('CDP config missing "sst" block.');
    }
    return {
      path: path.join(this.projectRoot, config.sst.path),
      schema: path.join(this.projectRoot, config.sst.schema)
    };
  }
}
