import { VC } from '../config/visual-controls.js';

/* Dynamic visual probes (DEV-only)
 * Answers the questions we keep asking while tuning visuals:
 *  - Is the whole field framed? (AABB ratios)
 *  - Is there "dead space"? (centroid offset)
 *  - Do we really have a band? (PCA angle + aspect, per-tier bias)
 *  - Are we drawing all points? (drawRange vs active)
 *  - Is DPI sane? (uPointSize x uDevicePixelRatio)
 *  - Is the spawn Z depth reasonable?
 *  - Did implosion happen? (atmospheric vs target extents)
 *  - Is the palette applied to shader uniforms?
 */
(function attachProbes() {
  if (typeof window === 'undefined') return;
  if (window.probe && window.probe.__installed) return;

  const DEFAULT_FIT_FRAC = typeof VC?.FIT_FRAC === 'number' ? VC.FIT_FRAC : 0.92;

  const getGeo = () => window.__particleGeometry || null;
  const getU = () => window.__consciousnessMaterial && window.__consciousnessMaterial.uniforms || null;
  const getAttr = (name) => {
    const geo = getGeo();
    return geo && geo.getAttribute ? geo.getAttribute(name)?.array || null : null;
  };
  const getHint = () => {
    if (window.__viewportHint) return window.__viewportHint;
    if (window.__consciousnessEngine && window.__consciousnessEngine._viewportHint) {
      return window.__consciousnessEngine._viewportHint;
    }
    return null;
  };

  function aabb({ source = 'text3DPosition', fitFrac = DEFAULT_FIT_FRAC } = {}) {
    const arr = getAttr(source);
    if (!arr) return { error: `attribute ${source} missing` };
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i];
      const y = arr[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const hint = getHint();
    const mv = hint ? Math.min(hint.width, hint.height) : null;
    const rx = mv ? (maxX - minX) / mv : null;
    const ry = mv ? (maxY - minY) / mv : null;
    return {
      source,
      fitFrac,
      width: +(maxX - minX).toFixed(2),
      height: +(maxY - minY).toFixed(2),
      minView: mv,
      ratioX: rx != null ? +rx.toFixed(3) : null,
      ratioY: ry != null ? +ry.toFixed(3) : null,
      pass: rx != null && ry != null ? rx <= fitFrac && ry <= fitFrac : null,
    };
  }

  function centroid({ source = 'text3DPosition' } = {}) {
    const arr = getAttr(source);
    if (!arr) return { error: `attribute ${source} missing` };
    let cx = 0;
    let cy = 0;
    const n = arr.length / 3 || 1;
    for (let i = 0; i < arr.length; i += 3) {
      cx += arr[i];
      cy += arr[i + 1];
    }
    cx /= n;
    cy /= n;
    const r = Math.hypot(cx, cy);
    return { source, cx: +cx.toFixed(2), cy: +cy.toFixed(2), radius: +r.toFixed(2) };
  }

  function draw() {
    const g = getGeo();
    const u = getU();
    if (!g || !u) return { error: 'missing geometry/material' };
    const drawCount = g.drawRange?.count ?? null;
    const active = u.uActiveCount?.value ?? null;
    return { draw: drawCount, active, match: drawCount === active };
  }

  function dpi() {
    const u = getU();
    if (!u) return { error: 'no material uniforms' };
    const up = u.uPointSize?.value ?? null;
    const dpr = u.uDevicePixelRatio?.value ?? null;
    return { uPointSize: up, uDevicePixelRatio: dpr, combined: up && dpr ? up * dpr : null };
  }

  function band({ source = 'text3DPosition', tierRange = null, minAspect = 2.0 } = {}) {
    const arr = getAttr(source);
    if (!arr) return { error: `attribute ${source} missing` };
    const tiers = getAttr('tierData');
    const useTier = !!(tiers && Array.isArray(tierRange) && tierRange.length === 2);
    let n = 0;
    let mx = 0;
    let my = 0;
    for (let i = 0; i < arr.length; i += 3) {
      const t = tiers ? tiers[i / 3] : 0;
      if (useTier && (t < tierRange[0] || t > tierRange[1])) continue;
      mx += arr[i];
      my += arr[i + 1];
      n++;
    }
    if (!n) return { error: 'no points in selection' };
    mx /= n;
    my /= n;
    let cxx = 0;
    let cxy = 0;
    let cyy = 0;
    for (let i = 0; i < arr.length; i += 3) {
      const t = tiers ? tiers[i / 3] : 0;
      if (useTier && (t < tierRange[0] || t > tierRange[1])) continue;
      const x = arr[i] - mx;
      const y = arr[i + 1] - my;
      cxx += x * x;
      cxy += x * y;
      cyy += y * y;
    }
    cxx /= n;
    cxy /= n;
    cyy /= n;
    const tr = cxx + cyy;
    const det = cxx * cyy - cxy * cxy;
    const disc = Math.max(0, (tr * tr) / 4 - det);
    const l1 = tr / 2 + Math.sqrt(disc);
    const l2 = tr / 2 - Math.sqrt(disc);
    const ang = Math.abs(cxy) > 1e-8 ? 0.5 * Math.atan2(2 * cxy, cxx - cyy) : cxx >= cyy ? 0 : Math.PI / 2;
    const deg = ((ang * 180) / Math.PI + 360) % 180;
    const aspect = l2 > 0 ? l1 / l2 : Infinity;
    return {
      source,
      tierRange,
      angleDeg: +deg.toFixed(2),
      aspect: Number.isFinite(aspect) ? +aspect.toFixed(2) : Infinity,
      pass: Number.isFinite(aspect) ? aspect >= minAspect : false,
    };
  }

  function sizeHist({ bins = 8 } = {}) {
    const mul = getAttr('sizeMultiplier');
    const u = getU();
    if (!mul || !u) return { error: 'no sizeMultiplier/uniforms' };
    const base = u.uPointSize?.value ?? 48;
    const dpr = u.uDevicePixelRatio?.value ?? 1;
    const values = Array.from(mul, (m) => m * base * dpr);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min) / (bins || 1);
    const hist = Array.from({ length: bins }, () => 0);
    for (const v of values) {
      const idx = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / Math.max(step, 1e-6))));
      hist[idx]++;
    }
    return { min: +min.toFixed(2), max: +max.toFixed(2), bins, step: +step.toFixed(2), hist };
  }

  function depth({ source = 'atmosphericPosition' } = {}) {
    const arr = getAttr(source);
    if (!arr) return { error: `attribute ${source} missing` };
    let minZ = Infinity;
    let maxZ = -Infinity;
    const zs = [];
    for (let i = 2; i < arr.length; i += 3) {
      const z = arr[i];
      zs.push(z);
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const mean = zs.reduce((a, b) => a + b, 0) / zs.length;
    return { source, minZ: +minZ.toFixed(2), maxZ: +maxZ.toFixed(2), mean: +mean.toFixed(2) };
  }

  function compareAtmoTarget({ fitFrac = DEFAULT_FIT_FRAC } = {}) {
    const atmo = getAttr('atmosphericPosition');
    const target = getAttr('text3DPosition');
    if (!atmo || !target) return { error: 'attributes missing' };
    const a = extent(atmo);
    const t = extent(target);
    const hint = getHint();
    const mv = hint ? Math.min(hint.width, hint.height) : null;
    return {
      atmo: {
        width: +a.w.toFixed(2),
        height: +a.h.toFixed(2),
        ratioX: mv ? +((a.w) / mv).toFixed(3) : null,
        ratioY: mv ? +((a.h) / mv).toFixed(3) : null,
      },
      target: {
        width: +t.w.toFixed(2),
        height: +t.h.toFixed(2),
        ratioX: mv ? +((t.w) / mv).toFixed(3) : null,
        ratioY: mv ? +((t.h) / mv).toFixed(3) : null,
      },
      implosion: a.w > t.w && a.h > t.h,
      fitFrac,
    };

    function extent(arr) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i];
        const y = arr[i + 1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      return { w: maxX - minX, h: maxY - minY };
    }
  }

  window.probe = Object.freeze({
    __installed: true,
    aabb,
    centroid,
    draw,
    dpi,
    band,
    sizeHist,
    depth,
    compareAtmoTarget,
  });
  console.log('visual probes ready -> window.probe.{aabb,centroid,draw,dpi,band,sizeHist,depth,compareAtmoTarget}()');
})();
