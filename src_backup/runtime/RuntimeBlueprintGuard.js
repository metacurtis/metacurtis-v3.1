// src/runtime/RuntimeBlueprintGuard.js
// Canon Guard Runtime Blueprint Protection - Guards blueprints during execution

import { BlueprintValidator } from "./BlueprintValidator.js";
import { flowValidator } from "./FlowValidator.js";

import { recordIncident } from "./incidents.js";

export class RuntimeBlueprintGuard {
  constructor() {
    this.validator = new BlueprintValidator();
    this.history = [];
    this.enabled = true;
    this.startTime = Date.now();
  }

  guard(bp, source = "unknown") {
    if (!this.enabled) return bp;
    
    const t0 = performance.now();
    const { blueprint, report } = this.validator.validateAndFix(bp, source);
    
    // Track history
    const entry = {
      t: Date.now(),
      dt: performance.now() - t0,
      source,
      report
    };
    this.history.push(entry);
    
    // Keep history bounded
    if (this.history.length > 100) {
      this.history.shift();
    }
    
    // Log significant events
    if (report.errors.length || report.autoFixed.length) {
      const level = report.errors.length ? "warn" : "info";
      console[level](
        "🛡️ BlueprintGuard:",
        {
          source,
          errors: report.errors.length,
          fixed: report.autoFixed.length,
          warnings: report.warnings.length,
          details: report
        }
      );
      
      // Record to incident system
      recordIncident({
        type: "blueprint_guard",
        severity: report.errors.length ? "warn" : "info",
        message: report.errors.length 
          ? `Blueprint validation: ${report.errors.length} errors`
          : `Blueprint auto-fixed: ${report.autoFixed.length} issues`,
        meta: report
      });
    }
    
    
    // Validate flow integrity
    if (import.meta.env.DEV) {
      const flowReport = flowValidator.validateBlueprint(blueprint);
      if (!flowReport.valid) {
        console.warn('⚠️ Canon Guard: Blueprint flow issues detected', flowReport);
      }
    }
    return blueprint;
  }

  getReport() {
    const stats = this.validator.getStatistics();
    const recent = this.history.slice(-10);
    const uptime = Date.now() - this.startTime;
    
    return {
      enabled: this.enabled,
      uptime: `${(uptime / 1000).toFixed(1)}s`,
      totalGuarded: this.history.length,
      totalFixed: stats.totalFixes,
      patterns: stats.patterns,
      recentHistory: recent.map(h => ({
        source: h.source,
        time: new Date(h.t).toLocaleTimeString(),
        duration: `${h.dt.toFixed(2)}ms`,
        errors: h.report.errors.length,
        fixed: h.report.autoFixed.length
      }))
    };
  }

  enable() {
    this.enabled = true;
    console.log("🛡️ BlueprintGuard: Protection ENABLED");
  }

  disable() {
    this.enabled = false;
    console.log("🛡️ BlueprintGuard: Protection DISABLED");
  }

  clear() {
    this.history = [];
    this.validator = new BlueprintValidator();
    console.log("🛡️ BlueprintGuard: History cleared");
  }
}

// Export singleton for dev console access
export const blueprintGuard = new RuntimeBlueprintGuard();

// Dev console access
if (typeof window !== "undefined" && import.meta.env.DEV) {
  window.canonBlueprintGuard = blueprintGuard;
  console.info("🛡️ Canon Blueprint Guard ready: window.canonBlueprintGuard.getReport()");
}