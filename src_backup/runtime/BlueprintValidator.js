// src/runtime/BlueprintValidator.js
// Canon Guard Blueprint Validator - Validates and auto-fixes blueprint contracts

export class BlueprintValidator {
  constructor(contract = defaultContract) { 
    this.contract = contract;
    this.fixCount = 0;
    this.patterns = new Map();
  }

  validateAndFix(bpIn, source = "unknown") {
    // Clone reference (don't deep copy arrays for performance)
    const bp = bpIn || {};
    const report = { 
      valid: true, 
      errors: [], 
      warnings: [], 
      autoFixed: [], 
      source,
      timestamp: Date.now()
    };

    // 0) Validate required scalars
    const pc = Number(bp.particleCount ?? bp.count);
    if (!Number.isFinite(pc) || pc <= 0) {
      report.valid = false;
      report.errors.push("Missing or invalid particleCount");
      return { blueprint: bp, report };
    }
    
    // Ensure activeCount exists
    if (!Number.isFinite(bp.activeCount)) {
      bp.activeCount = pc;
      report.autoFixed.push("Set activeCount = particleCount");
    }

    // 1) Apply transforms (auto-fixes)
    // THE FIX THAT WOULD HAVE SAVED 1.5 DAYS!
    if (bp.tiers && !bp.tierData) {
      bp.tierData = new Float32Array(bp.tiers);
      delete bp.tiers;
      report.autoFixed.push("Converted Uint8Array tiers → Float32Array tierData");
      this.recordPattern('tiers_conversion');
    }
    
    // Synthesize Allen positions if missing
    if (!bp.allenAtlasPositions && bp.atmosphericPositions) {
      const a = bp.atmosphericPositions;
      bp.allenAtlasPositions = a.slice ? a.slice() : new Float32Array(a);
      report.autoFixed.push("Synthesized allenAtlasPositions from atmosphericPositions");
      this.recordPattern('allen_synthesis');
    }

    // 2) Validate arrays existence, type, and length
    const need = this.contract.arrays;
    for (const key of Object.keys(need)) {
      const spec = need[key];
      let arr = bp[key];
      
      // Check existence
      if (!arr) {
        if (spec.required) {
          report.valid = false;
          report.errors.push(`Missing required array: ${key}`);
        }
        continue;
      }
      
      // Check type and convert if needed
      const ctor = arr?.constructor?.name;
      if (ctor !== spec.type) {
        try {
          arr = new Float32Array(arr);
          bp[key] = arr;
          report.autoFixed.push(`Converted ${key}: ${ctor} → ${spec.type}`);
          this.recordPattern(`type_conversion_${key}`);
        } catch (e) {
          report.valid = false;
          report.errors.push(`Cannot convert ${key}: ${ctor} → ${spec.type}`);
          continue;
        }
      }
      
      // Check length
      const expected = pc * spec.itemSize;
      if (arr.length !== expected) {
        report.warnings.push(`${key}.length=${arr.length} (expected ${expected})`);
        
        // Best effort: adjust length
        if (arr.length > expected) {
          bp[key] = arr.subarray(0, expected);
          report.autoFixed.push(`Truncated ${key} to ${expected} elements`);
        } else {
          const tmp = new Float32Array(expected);
          tmp.set(arr.subarray(0, arr.length));
          bp[key] = tmp;
          report.autoFixed.push(`Padded ${key} to ${expected} elements`);
        }
      }
    }

    // 3) Validate limits
    const lim = this.contract.limits || {};
    if (pc < (lim.min ?? 1)) {
      report.warnings.push(`particleCount ${pc} below minimum ${lim.min}`);
    }
    if (pc > (lim.max ?? 1e9)) {
      report.warnings.push(`particleCount ${pc} exceeds maximum ${lim.max}`);
    }

    // 4) Track fix count
    this.fixCount += report.autoFixed.length;

    return { blueprint: bp, report };
  }

  recordPattern(pattern) {
    const count = this.patterns.get(pattern) || 0;
    this.patterns.set(pattern, count + 1);
  }

  getStatistics() {
    return {
      totalFixes: this.fixCount,
      patterns: Array.from(this.patterns.entries()).map(([pattern, count]) => ({
        pattern,
        count,
        percentage: ((count / this.fixCount) * 100).toFixed(1) + '%'
      }))
    };
  }
}

// Default contract (can be overridden)
const defaultContract = {
  arrays: {
    atmosphericPositions: { type: "Float32Array", itemSize: 3, required: true },
    allenAtlasPositions:  { type: "Float32Array", itemSize: 3, required: true },
    tierData:             { type: "Float32Array", itemSize: 1, required: true }
  },
  limits: { min: 100, max: 15000 }
};