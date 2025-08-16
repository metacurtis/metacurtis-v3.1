export class Incident {
  constructor(data) {
    this.id = this.generateId();
    this.code = data.code || 'UNKNOWN';
    this.severity = data.severity || 'info';
    this.ts = Date.now();
    this.fingerprint = this.generateFingerprint(data);
    this.message = data.message || '';
    this.count = 1;
    this.firstSeen = this.ts;
    this.lastSeen = this.ts;
    
    this.evidence = {
      stack: data.stack || data.evidence?.stack || null,
      logs: data.logs || [],
      glLog: data.glLog || null,
      file: data.file || null,
      line: data.line || null,
      raw: data.raw || null
    };
    
    this.context = {
      stage: data.stage || null,
      particleCount: data.particleCount || null,
      fps: data.fps || null,
      gpu: data.gpu || null
    };
    
    this.tags = data.tags || [];
    this.fixed = false;
  }
  
  generateId() {
    return 'inc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  generateFingerprint(data) {
    const parts = [
      data.code,
      data.message?.substring(0, 100),
      data.file,
      data.line
    ].filter(Boolean);
    
    const str = parts.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  
  increment() {
    this.count++;
    this.lastSeen = Date.now();
  }
  
  toJSON() {
    return {
      id: this.id,
      code: this.code,
      severity: this.severity,
      fingerprint: this.fingerprint,
      message: this.message,
      count: this.count,
      firstSeen: this.firstSeen,
      lastSeen: this.lastSeen,
      evidence: this.evidence,
      context: this.context,
      tags: this.tags,
      fixed: this.fixed
    };
  }
}

export default Incident;