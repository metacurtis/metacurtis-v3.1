// WebGLBackground.jsx — Dumb Renderer
// Renders whatever BLUEPRINT_READY provides. No R3F.
import React, { useEffect, useRef } from 'react';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
import BeatBus from '@modules/orchestration/core/BeatBus';
// Match your app's EVENTS export (switch to '@theater/events.js' if needed)
import { EVENTS } from '@theater/events';
import { ParticleRenderer } from '../../renderer/ParticleRenderer';
// auto-register debug helpers
import '../../renderer/CanonRendererDebug';

export default function WebGLBackground({
  id = 'canon-webgl-bg',
  morphProgress = 0,
  scrollProgress = 0,
  quality = 'HIGH',
  particleCount = 5000,
  onContextLost,
  onContextRestored,
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const morphRef = useRef(morphProgress);
  const scrollRef = useRef(scrollProgress);

  useEffect(() => { morphRef.current = morphProgress; }, [morphProgress]);
  useEffect(() => { scrollRef.current = scrollProgress; }, [scrollProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Canvas sits behind UI and is transparent/non-interactive
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
      background: 'transparent',
    });

    console.log('🎨 WebGLBackground mounting…');
    let renderer = new ParticleRenderer(canvas);
    rendererRef.current = renderer;

    // Context lost/restored wiring
    const handleLost = (e) => {
      e.preventDefault();
      console.warn('⚠️ WebGL context lost');
      try { renderer.stopAnimationLoop(); } catch {}
      typeof onContextLost === 'function' && onContextLost();
    };
    const handleRestored = () => {
      console.log('✅ WebGL context restored — reinitializing');
      // Recreate renderer (fresh context) and redraw latest blueprint
      try { renderer.dispose(); } catch {}
      renderer = new ParticleRenderer(canvas);
      rendererRef.current = renderer;
      renderer.startAnimationLoop();
      const bp = window.engineDebug?.getCurrentBlueprint?.();
      if (bp) {
        const safe = applyGuard(bp);
        if (safe && safe.ready !== false) {
          safe.morphProgress = morphRef.current;
          safe.scrollProgress = scrollRef.current;
          renderer.upsert(safe);
        }
      }
      typeof onContextRestored === 'function' && onContextRestored();
    };
    canvas.addEventListener('webglcontextlost', handleLost, { passive: false });
    canvas.addEventListener('webglcontextrestored', handleRestored, { passive: true });

    function applyGuard(rawBp) {
      const g = window.canonBlueprintGuard;
      try { return g && typeof g.guard === 'function' ? g.guard(rawBp, 'WebGLBackground.BLUEPRINT_READY') : rawBp; }
      catch (e) { console.warn('CanonBlueprintGuard error:', e); return rawBp; }
    }

    const handleBlueprint = ({ blueprint: raw }) => {
      if (!raw) return;
      const bp = applyGuard(raw);
      if (!bp || bp.ready === false) {
        console.warn('❌ Blueprint not ready after guard');
        return;
      }
      bp.morphProgress = morphRef.current;
      bp.scrollProgress = scrollRef.current;
      renderer.upsert(bp);
    };

    // Subscribe (supports both disposer-return and off API)
    const ret = BeatBus.on(EVENTS.BLUEPRINT_READY, handleBlueprint);
    const unsubscribe = () => {
      if (typeof ret === 'function') ret();
      else if (BeatBus.off) BeatBus.off(EVENTS.BLUEPRINT_READY, handleBlueprint);
    };
    console.log('🚌 Subscribed to BLUEPRINT_READY');

    // Hot-start with current blueprint
    const current = window.engineDebug?.getCurrentBlueprint?.();
    if (current) {
      console.log('🔥 Hot-starting with current blueprint');
      handleBlueprint({ blueprint: current });
    }

    // Keep rendering
    renderer.startAnimationLoop();

    // Expose minimal debug surface
    window.webglBackground = {
      renderer,
      getStats: () => renderer.getStats(),
      testRender: () => {
        const bp = window.engineDebug?.getCurrentBlueprint?.();
        if (bp) handleBlueprint({ blueprint: bp });
      },
      stopAnimation: () => renderer.stopAnimationLoop(),
      startAnimation: () => renderer.startAnimationLoop(),
    };

    return () => {
      console.log('🧹 WebGLBackground unmounting…');
      unsubscribe();
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', handleRestored);
      try { renderer.dispose(); } catch {}
      delete window.webglBackground;
    };
  }, [onContextLost, onContextRestored]);

  return <canvas id={id} ref={canvasRef} />;
}
