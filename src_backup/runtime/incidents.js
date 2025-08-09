// src/runtime/incidents.js
// Canon Guard Incident Recording System - Tracks all guard actions and issues

const MAX_INCIDENTS = 100;
const ring = [];
let stats = {
  total: 0,
  byType: {},
  bySeverity: { info: 0, warn: 0, error: 0, critical: 0 }
};

export function recordIncident(evt) {
  try {
    const item = {
      id: stats.total++,
      ts: Date.now(),
      type: evt.type || "unknown",
      severity: evt.severity || "info",
      message: evt.message || "",
      meta: evt.meta || {}
    };
    
    // Add to ring buffer
    ring.push(item);
    if (ring.length > MAX_INCIDENTS) {
      ring.shift();
    }
    
    // Update statistics
    stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
    stats.bySeverity[item.severity]++;
    
    // Console output in dev
    if (import.meta.env.DEV) {
      const emoji = {
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
        critical: "🔥"
      }[item.severity] || "📝";
      
      if (item.severity === "warn" || item.severity === "error" || item.severity === "critical") {
        console[item.severity === "warn" ? "warn" : "error"](
          `${emoji} Canon Incident:`,
          item.type,
          item.message,
          item.meta
        );
      }
    }
    
    // Emit custom event for monitoring tools
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("canon:incident", {
        detail: item
      }));
    }
    
  } catch (e) {
    console.error("Failed to record incident:", e);
  }
}

export function getIncidents(filter = null) {
  if (!filter) return ring.slice();
  
  return ring.filter(item => {
    if (filter.type && item.type !== filter.type) return false;
    if (filter.severity && item.severity !== filter.severity) return false;
    if (filter.since && item.ts < filter.since) return false;
    return true;
  });
}

export function getIncidentStats() {
  return {
    ...stats,
    current: ring.length,
    max: MAX_INCIDENTS,
    oldest: ring[0]?.ts,
    newest: ring[ring.length - 1]?.ts
  };
}

export function clearIncidents() {
  ring.length = 0;
  stats.byType = {};
  stats.bySeverity = { info: 0, warn: 0, error: 0, critical: 0 };
  console.log("📝 Canon Incidents cleared");
}

// Export for dev console
if (typeof window !== "undefined" && import.meta.env.DEV) {
  window.canonIncidents = {
    get: getIncidents,
    stats: getIncidentStats,
    clear: clearIncidents,
    record: recordIncident
  };
  console.info("📝 Canon Incidents ready: window.canonIncidents.stats()");
}