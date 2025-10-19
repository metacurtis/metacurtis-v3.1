// src/contracts/OptimizedContracts.js

import crypto from 'crypto';

export class BeatBusContract {
  static enforceShape(event, payload) {
    const contracts = {
      STAGE_CHANGE: ['stage'],
      QUALITY_CHANGE: ['quality'],
      BLUEPRINT_READY: ['blueprint', 'stage', 'quality'],
    };
    
    const required = contracts[event];
    if (!required) throw new Error(`No contract for event: ${event}`);
    
    const result = {};
    for (const field of required) {
      if (!(field in payload)) {
        throw new Error(`Missing required field '${field}' for ${event}`);
      }
      result[field] = payload[field];
    }
    
    return result;
  }
}

export class BlueprintContract {
  static validate(blueprint) {
    const required = ['positions', 'particleCount', 'mode'];
    
    for (const field of required) {
      if (!(field in blueprint)) {
        console.error(`Blueprint missing required field: ${field}`);
        return false;
      }
    }
    
    if (blueprint.positions && blueprint.positions.length !== blueprint.particleCount * 3) {
      console.error('Position array length mismatch');
      return false;
    }
    
    return true;
  }
}

export class CacheKeyGenerator {
  static generate(params) {
    return crypto.createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex');
  }
}

export class BlueprintValidationError extends Error {
  constructor(blueprint) {
    super('Blueprint validation failed');
    this.name = 'BlueprintValidationError';
    this.blueprint = blueprint;
  }
}
