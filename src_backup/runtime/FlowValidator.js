// src/runtime/FlowValidator.js
// Canon Guard Flow Validator - Ensures data flow integrity after shader modifications

export class FlowValidator {
  constructor() {
    this.requiredUniforms = new Set([
      'uTime',
      'uMorphProgress',
      'uScrollProgress',
      'uActiveCount',
      'uPointSize',
      'uDevicePixelRatio',
      'uResolution',
      'uColorCurrent',
      'uColorNext',
      'uAtlasTexture',
      'uTotalSprites'
    ]);
    
    // Aliases that might be used
    this.aliasUniforms = new Set([
      'uStageProgress',   // Alias for uMorphProgress
      'uStageBlend',      // Alias for uScrollProgress
      'uTierCutoff'       // Alias for uActiveCount
    ]);
    
    this.requiredAttributes = new Set([
      'position',
      'atmosphericPosition',
      'allenAtlasPosition',
      'particleIndex'
    ]);
    
    this.optionalAttributes = new Set([
      'animationSeed',
      'tierData',
      'sizeMultiplier',
      'opacityData',
      'atlasIndex'
    ]);
    
    this.validationHistory = [];
  }

  validateShaderFlow(vertexSource, fragmentSource) {
    const report = {
      valid: true,
      errors: [],
      warnings: [],
      uniformsFound: [],
      attributesFound: [],
      timestamp: Date.now()
    };

    // Check vertex shader for required attributes
    for (const attr of this.requiredAttributes) {
      const pattern = new RegExp(`attribute\\s+\\w+\\s+${attr}`, 'g');
      if (!vertexSource.match(pattern)) {
        report.errors.push(`Missing required attribute: ${attr}`);
        report.valid = false;
      } else {
        report.attributesFound.push(attr);
      }
    }

    // Check for required uniforms in either shader
    const combinedSource = vertexSource + '\n' + fragmentSource;
    for (const uniform of this.requiredUniforms) {
      const pattern = new RegExp(`uniform\\s+\\w+\\s+${uniform}`, 'g');
      if (!combinedSource.match(pattern)) {
        report.warnings.push(`Uniform not found in shaders: ${uniform}`);
      } else {
        report.uniformsFound.push(uniform);
      }
    }

    // Check for critical shader operations
    if (!vertexSource.includes('gl_Position')) {
      report.errors.push('Vertex shader missing gl_Position assignment');
      report.valid = false;
    }

    if (!vertexSource.includes('gl_PointSize')) {
      report.errors.push('Vertex shader missing gl_PointSize assignment');
      report.valid = false;
    }

    if (!fragmentSource.includes('gl_FragColor')) {
      report.errors.push('Fragment shader missing gl_FragColor assignment');
      report.valid = false;
    }

    this.recordValidation('shader', report);
    return report;
  }

  validateMaterialFlow(material) {
    const report = {
      valid: true,
      errors: [],
      warnings: [],
      uniformsPresent: [],
      uniformsMissing: [],
      timestamp: Date.now()
    };

    if (!material || !material.uniforms) {
      report.valid = false;
      report.errors.push('Material or uniforms not defined');
      return report;
    }

    // Check all required uniforms exist in material
    for (const uniform of this.requiredUniforms) {
      if (material.uniforms[uniform]) {
        report.uniformsPresent.push(uniform);
      } else {
        // Check if alias exists
        const hasAlias = this.checkForAlias(material.uniforms, uniform);
        if (!hasAlias) {
          report.uniformsMissing.push(uniform);
          report.warnings.push(`Material missing uniform: ${uniform} (no alias found)`);
        }
      }
    }

    this.recordValidation('material', report);
    return report;
  }

  checkForAlias(uniforms, uniformName) {
    // Map of uniforms to their aliases
    const aliasMap = {
      'uMorphProgress': 'uStageProgress',
      'uScrollProgress': 'uStageBlend',
      'uActiveCount': 'uTierCutoff'
    };
    
    const alias = aliasMap[uniformName];
    return alias && uniforms[alias];
  }

  validateBlueprint(blueprint) {
    const report = {
      valid: true,
      errors: [],
      warnings: [],
      arraysPresent: [],
      arraysMissing: [],
      timestamp: Date.now()
    };

    if (!blueprint) {
      report.valid = false;
      report.errors.push('Blueprint is null or undefined');
      return report;
    }

    // Check required arrays
    const requiredArrays = ['atmosphericPositions', 'allenAtlasPositions'];
    for (const array of requiredArrays) {
      if (blueprint[array]) {
        report.arraysPresent.push(array);
      } else {
        report.arraysMissing.push(array);
        report.errors.push(`Blueprint missing required array: ${array}`);
        report.valid = false;
      }
    }

    // Check particle count
    if (!blueprint.particleCount || blueprint.particleCount <= 0) {
      report.errors.push('Invalid particleCount');
      report.valid = false;
    }

    if (!blueprint.activeCount) {
      report.warnings.push('activeCount not set, will use particleCount');
    }

    this.recordValidation('blueprint', report);
    return report;
  }

  recordValidation(type, report) {
    this.validationHistory.push({
      type,
      timestamp: report.timestamp,
      valid: report.valid,
      errorCount: report.errors?.length || 0,
      warningCount: report.warnings?.length || 0
    });
    
    // Keep history bounded
    if (this.validationHistory.length > 100) {
      this.validationHistory.shift();
    }
  }

  getValidationStats() {
    const stats = {
      total: this.validationHistory.length,
      byType: {},
      errorRate: 0,
      warningRate: 0
    };
    
    let totalErrors = 0;
    let totalWarnings = 0;
    
    this.validationHistory.forEach(entry => {
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      totalErrors += entry.errorCount;
      totalWarnings += entry.warningCount;
    });
    
    if (stats.total > 0) {
      stats.errorRate = (totalErrors / stats.total).toFixed(2);
      stats.warningRate = (totalWarnings / stats.total).toFixed(2);
    }
    
    return stats;
  }

  validateFullPipeline(blueprint, material, vertexShader, fragmentShader) {
    console.log('🔍 Canon Guard: Validating full pipeline flow...');
    
    const reports = {
      blueprint: this.validateBlueprint(blueprint),
      shaders: this.validateShaderFlow(vertexShader, fragmentShader),
      material: this.validateMaterialFlow(material)
    };

    const allValid = reports.blueprint.valid && 
                     reports.shaders.valid && 
                     reports.material.valid;

    if (allValid) {
      console.log('✅ Canon Guard: Pipeline flow validated successfully');
    } else {
      console.warn('⚠️ Canon Guard: Pipeline flow issues detected', reports);
    }

    return {
      valid: allValid,
      reports,
      timestamp: Date.now()
    };
  }
}

// Export singleton
export const flowValidator = new FlowValidator();

// Dev console access
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.canonFlowValidator = flowValidator;
  console.info('🔍 Canon Flow Validator ready: window.canonFlowValidator');
  console.info('📊 Get stats: window.canonFlowValidator.getValidationStats()');
}
