/**
 * Canon HUD - minimal trust signals (DEV only).
 */
export class CanonHUD {
  constructor() {
    this.element = null;
    this.stats = { fps: 0 };
    this._last = 0;
    this._frames = 0;
  }
  init() {
    if (typeof window === 'undefined' || !import.meta.env || !import.meta.env.DEV) return;
    if (this.element) return;
    this.element = document.createElement('div');
    this.element.id = 'canon-hud';
    this.element.style.position = 'fixed';
    this.element.style.top = '10px';
    this.element.style.right = '10px';
    this.element.style.background = 'rgba(0,0,0,0.8)';
    this.element.style.color = '#0f0';
    this.element.style.padding = '10px';
    this.element.style.fontFamily = 'monospace';
    this.element.style.fontSize = '12px';
    this.element.style.border = '1px solid #0f0';
    this.element.style.borderRadius = '4px';
    this.element.style.zIndex = '999999';
    this.element.style.pointerEvents = 'none';
    document.body.appendChild(this.element);
    this._last = performance.now();
    const tick = () => {
      const now = performance.now();
      this._frames++;
      if (now - this._last >= 1000) {
        this.stats.fps = Math.round((this._frames * 1000) / (now - this._last));
        this._frames = 0;
        this._last = now;
        this.update();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    this.update();
    console.log('CANON HUD active');
  }
  update() {
    if (!this.element || !window.canon) return;
    const b =
      window.canon.boundary && window.canon.boundary.getReport
        ? window.canon.boundary.getReport()
        : {};
    const t = b.telemetry || {};
    const vio = (b.violations || []).length;
    const fpsColor = this.stats.fps < 30 ? '#f00' : '#0f0';
    this.element.innerHTML =
      '' +
      '<div style="margin-bottom:5px;border-bottom:1px solid #0f0;padding-bottom:5px;"><b>CANON HUD</b></div>' +
      '<div>FPS: <span style="color:' +
      fpsColor +
      '">' +
      this.stats.fps +
      '</span></div>' +
      '<div>Mode: ' +
      (b.mode || 'WARN') +
      '</div>' +
      '<div>Events: ' +
      (t.total || 0) +
      '</div>' +
      '<div>Valid: ' +
      (t.valid || 0) +
      '</div>' +
      '<div>Violations (last 10): ' +
      (vio || 0) +
      '</div>';
  }
}

export default CanonHUD;
