/**
 * Viewport fitting and renderer dimension management.
 * Extracted from WebGLBackground.jsx (lines ~360-740).
 *
 * Responsibilities:
 * - Compute geometry fits against viewport constraints
 * - Update material uniforms tied to viewport sizing
 * - Produce viewport hint emitters that replicate BeatBus behaviour
 */

import * as THREE from 'three';

export const applyRendererFits = ({
  geometry,
  viewport,
  material,
  viewportHintRef,
  windowSize,
  lastUniformsRef,
  lastFitStampRef,
  fitsLockedRef,
  vcConfig,
  clampFit,
  computeAABB,
  vec2Close,
  dev = false,
}) => {
  if (!material?.uniforms || !geometry) return;

  const resolved =
    viewport ||
    viewportHintRef?.current ||
    (typeof window !== 'undefined' ? window.__viewportHint : {}) ||
    {};

  const fallbackWidth =
    windowSize?.width ?? (typeof window !== 'undefined' ? window.innerWidth : 120);
  const fallbackHeight =
    windowSize?.height ?? (typeof window !== 'undefined' ? window.innerHeight : 90);

  const width = Math.max(
    1,
    resolved.width ?? resolved.cssWidth ?? fallbackWidth ?? 120,
  );
  const height = Math.max(
    1,
    resolved.height ?? resolved.cssHeight ?? fallbackHeight ?? 90,
  );

  const stamp = lastFitStampRef?.current ?? {};
  const geoId = geometry.uuid || geometry.id;

  if (
    fitsLockedRef?.current &&
    stamp.geoId === geoId &&
    stamp.width === width &&
    stamp.height === height
  ) {
    if (dev) console.debug('[WBG] fits locked; skipping recompute');
    return;
  }

  if (stamp.geoId === geoId && stamp.width === width && stamp.height === height) {
    return;
  }

  const atmoAabb =
    computeAABB(geometry, 'atmosphericPosition') || computeAABB(geometry, 'position');
  const textAabb =
    computeAABB(geometry, 'text3DPosition') || computeAABB(geometry, 'position');
  if (!atmoAabb || !textAabb) return;

  const config = vcConfig ?? {};
  const atmoTargetX = Number.isFinite(config.ATMO_FIT_X) ? config.ATMO_FIT_X : 0.92;
  const atmoTargetY = Number.isFinite(config.ATMO_FIT_Y) ? config.ATMO_FIT_Y : 0.85;
  const textTargetWidth = Number.isFinite(config.TEXT_FIT_WIDTH)
    ? config.TEXT_FIT_WIDTH
    : 0.9;
  const textTargetMaxH = Number.isFinite(config.TEXT_FIT_MAX_H)
    ? config.TEXT_FIT_MAX_H
    : 0.8;

  const halfW = width * 0.5;
  const halfH = height * 0.5;

  const atmoFitX =
    atmoAabb.extX > 1e-6 ? clampFit((halfW * atmoTargetX) / atmoAabb.extX) : 1;
  const atmoFitY =
    atmoAabb.extY > 1e-6 ? clampFit((halfH * atmoTargetY) / atmoAabb.extY) : 1;

  const textWidthScale =
    textAabb.extX > 1e-6 ? (halfW * textTargetWidth) / textAabb.extX : 1;
  let textFitY = textWidthScale;
  if (textAabb.extY > 1e-6) {
    const maxScaleY = (halfH * textTargetMaxH) / textAabb.extY;
    textFitY = Math.min(textFitY, maxScaleY);
  }

  const textFitX = clampFit(textWidthScale);
  textFitY = clampFit(textFitY);

  const newAtmo = [atmoFitX, atmoFitY];
  const newText = [textFitX, textFitY];

  const uniforms = material.uniforms;
  let changed = false;

  if (!vec2Close(lastUniformsRef?.current?.atmo, newAtmo)) {
    if (uniforms.uAtmoFit?.value?.set) {
      uniforms.uAtmoFit.value.set(atmoFitX, atmoFitY);
    } else {
      uniforms.uAtmoFit = { value: new THREE.Vector2(atmoFitX, atmoFitY) };
    }
    changed = true;
  }

  if (!vec2Close(lastUniformsRef?.current?.text, newText)) {
    if (uniforms.uTextFit?.value?.set) {
      uniforms.uTextFit.value.set(textFitX, textFitY);
    } else {
      uniforms.uTextFit = { value: new THREE.Vector2(textFitX, textFitY) };
    }
    changed = true;
  }

  if (uniforms.uBandFade !== undefined && uniforms.uBandFade.value !== 0) {
    uniforms.uBandFade.value = 0;
    changed = true;
  }

  if (changed) {
    material.uniformsNeedUpdate = true;
    if (dev) {
      console.debug('[WBG] fits(set once)', {
        atmoFit: { x: newAtmo[0], y: newAtmo[1] },
        textFit: { x: newText[0], y: newText[1] },
        viewport: { width, height },
      });
    }
  }

  if (lastUniformsRef) {
    lastUniformsRef.current = { atmo: newAtmo, text: newText };
  }
  if (lastFitStampRef) {
    lastFitStampRef.current = { geoId, width, height };
  }
  if (fitsLockedRef) {
    fitsLockedRef.current = true;
  }
};

export const createViewportHintEmitter = ({
  camera,
  gl,
  size,
  viewportHintRef,
  updateBandHeight,
  geometryRef,
  logBind,
  scheduleRuntimeSampling,
  applyRendererFits,
  beatBus,
  eventName,
  getViewportLogMeta,
  dev = false,
}) => {
  return () => {
    try {
      const projection = camera?.projectionMatrix;
      if (!projection) return;

      const m11 = projection.elements?.[5] || 1; // 1/tan(fov/2)
      const tanHalfFov = 1 / m11;

      const worldPos = new THREE.Vector3();
      const distance = (() => {
        try {
          camera?.getWorldPosition?.(worldPos);
          return worldPos.length();
        } catch {
          return Math.abs(camera?.position?.z || 1);
        }
      })();

      const canvas = gl?.domElement;
      const rect = canvas?.getBoundingClientRect?.();

      const docWidth =
        typeof document !== 'undefined'
          ? document.documentElement?.clientWidth || 0
          : 0;
      const docHeight =
        typeof document !== 'undefined'
          ? document.documentElement?.clientHeight || 0
          : 0;
      const windowWidth =
        typeof window !== 'undefined'
          ? Math.max(window.innerWidth || 0, docWidth)
          : docWidth;
      const windowHeight =
        typeof window !== 'undefined'
          ? Math.max(window.innerHeight || 0, docHeight)
          : docHeight;

      const cssWidth = Math.max(
        rect?.width || 0,
        canvas?.clientWidth || 0,
        size?.width || 0,
        windowWidth || 0,
        1,
      );
      const cssHeight = Math.max(
        rect?.height || 0,
        canvas?.clientHeight || 0,
        size?.height || 0,
        windowHeight || 0,
        1,
      );

      let orientation =
        windowWidth && windowHeight
          ? windowWidth >= windowHeight
            ? 'landscape'
            : 'portrait'
          : cssWidth >= cssHeight
          ? 'landscape'
          : 'portrait';

      let aspect =
        Number.isFinite(camera?.aspect) && camera.aspect > 0
          ? camera.aspect
          : cssHeight > 0
          ? cssWidth / cssHeight
          : 1;

      if (!Number.isFinite(aspect) || aspect <= 0) {
        aspect = 1;
      }

      const viewHeightRaw = 2 * distance * tanHalfFov;
      let viewWidth = viewHeightRaw * aspect;
      let viewHeight = viewHeightRaw;

      if (viewWidth < viewHeight) {
        [viewWidth, viewHeight] = [viewHeight, viewWidth];
        aspect = viewWidth / viewHeight;
        orientation = 'landscape';
      } else {
        orientation = 'landscape';
      }

      const hint = {
        width: viewWidth,
        height: viewHeight,
        aspect,
        orientation,
        cssWidth,
        cssHeight,
      };

      if (viewportHintRef) {
        viewportHintRef.current = hint;
      }

      if (typeof updateBandHeight === 'function') {
        updateBandHeight(viewHeight);
      }

      if (geometryRef?.current) {
        applyRendererFits(geometryRef.current, hint);
        if (typeof logBind === 'function') {
          logBind('viewport', {
            mode: 'viewport',
            ...(typeof getViewportLogMeta === 'function'
              ? getViewportLogMeta()
              : {}),
          });
        }
        if (typeof scheduleRuntimeSampling === 'function') {
          scheduleRuntimeSampling();
        }
      }

      if (typeof window !== 'undefined') {
        window.__viewportHint = hint;
      }

      if (beatBus?.emit && eventName) {
        beatBus.emit(eventName, hint);
      }

      if (dev) {
        console.log('📐 Renderer: Sent viewport hint (proj-matrix)', {
          width: viewWidth.toFixed(1),
          height: viewHeight.toFixed(1),
          aspect: aspect.toFixed(2),
          cameraDist: distance.toFixed(2),
          orientation,
        });
      }
    } catch (error) {
      console.warn('Viewport hint emit failed', error);
    }
  };
};
