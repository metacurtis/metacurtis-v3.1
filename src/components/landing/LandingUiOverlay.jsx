import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useLandingUiAnchor from '@/hooks/useLandingUiAnchor.js';
import LetterDockInterface from '@/components/landing/LetterDockInterface.jsx';
import GlassRailCTA from '@/components/landing/GlassRailCTA.jsx';
import landingUiContentModel from '../../../configs/landing-ui-content-model.v1.json';

const shellStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 24,
  pointerEvents: 'none',
};

const SAFE_MARGIN_PX = 20;
const SAFE_BOTTOM_PX = 20;
const CONSOLE_MIN_WIDTH = 360;
const CONSOLE_MAX_WIDTH = 760;
const CONSOLE_WORD_PADDING = 120;
const CONSOLE_INSET_PX = 10;
const CONSOLE_RADIUS_PX = 18;

const RAIL_HEIGHT_PX = 62;
const RAIL_TO_DOCK_GAP_PX = 10;
const DOCK_HEIGHT_PX = 74;
const DRAWER_GAP_PX = 10;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function finiteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function finiteOrFallback(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isSamePoint(a, b) {
  return finiteOrNull(a?.x) === finiteOrNull(b?.x)
    && finiteOrNull(a?.y) === finiteOrNull(b?.y);
}

function hasScreenRect(rect) {
  return Number.isFinite(Number(rect?.center?.x))
    && Number.isFinite(Number(rect?.center?.y))
    && Number.isFinite(Number(rect?.min?.x))
    && Number.isFinite(Number(rect?.max?.x))
    && Number.isFinite(Number(rect?.min?.y))
    && Number.isFinite(Number(rect?.max?.y));
}

function computeDrawerHeight(content) {
  if (!content) return 0;
  const bulletCount = Array.isArray(content?.bullets) ? content.bullets.slice(0, 4).length : 0;
  const hasBody = typeof content?.body === 'string' && content.body.length > 0;
  const hasCta = !!content?.cta?.label;
  let height = 94 + (bulletCount * 16);
  if (hasBody) height += 22;
  if (hasCta) height += 40;
  return clamp(height, 120, 220);
}

function isHeroVisible(wholeRect, viewport) {
  if (!hasScreenRect(wholeRect)) return false;
  const width = finiteOrFallback(viewport?.width, 0);
  const height = finiteOrFallback(viewport?.height, 0);
  return wholeRect.max.x > 0
    && wholeRect.min.x < width
    && wholeRect.max.y > 0
    && wholeRect.min.y < height;
}

function buildConsoleLayout({
  viewport,
  wholeRect,
  attachMode,
  drawerHeight,
  showDock,
}) {
  const viewportWidth = Math.max(320, finiteOrFallback(viewport?.width, 1440));
  const viewportHeight = Math.max(280, finiteOrFallback(viewport?.height, 900));
  const wholeWidth = finiteOrNull(wholeRect?.size?.w);

  const maxAllowedWidth = Math.max(280, viewportWidth - (SAFE_MARGIN_PX * 2));
  const computedWidth = Number.isFinite(wholeWidth)
    ? wholeWidth + CONSOLE_WORD_PADDING
    : (CONSOLE_MIN_WIDTH + 80);
  const consoleWidth = clamp(computedWidth, CONSOLE_MIN_WIDTH, Math.min(CONSOLE_MAX_WIDTH, maxAllowedWidth));

  const centerX = hasScreenRect(wholeRect) ? wholeRect.center.x : (viewportWidth * 0.5);
  const left = clamp(
    centerX - (consoleWidth * 0.5),
    SAFE_MARGIN_PX,
    viewportWidth - consoleWidth - SAFE_MARGIN_PX
  );

  const dockBlock = showDock ? (RAIL_TO_DOCK_GAP_PX + DOCK_HEIGHT_PX) : 0;
  const railAndDockHeight = RAIL_HEIGHT_PX + dockBlock;
  const drawerBlock = drawerHeight > 0 ? drawerHeight + DRAWER_GAP_PX : 0;
  const innerHeight = railAndDockHeight + drawerBlock;
  const consoleHeight = innerHeight + (CONSOLE_INSET_PX * 2);

  let top;
  if (attachMode === 'word' && hasScreenRect(wholeRect)) {
    const maxTop = viewportHeight - SAFE_BOTTOM_PX - consoleHeight;
    top = clamp(wholeRect.max.y + 14, 12, Math.max(12, maxTop));
  } else {
    top = viewportHeight - SAFE_BOTTOM_PX - consoleHeight;
  }

  const innerLeft = left + CONSOLE_INSET_PX;
  const innerTop = top + CONSOLE_INSET_PX;
  const innerWidth = Math.max(280, consoleWidth - (CONSOLE_INSET_PX * 2));
  const drawerTop = innerTop;
  const railTop = innerTop + drawerBlock;
  const dockTop = showDock ? (railTop + RAIL_HEIGHT_PX + RAIL_TO_DOCK_GAP_PX) : null;

  return {
    centerX,
    console: {
      left,
      top,
      width: consoleWidth,
      height: consoleHeight,
    },
    inner: {
      left: innerLeft,
      top: innerTop,
      width: innerWidth,
      height: innerHeight,
    },
    drawer: {
      top: drawerTop,
      width: innerWidth,
      height: drawerHeight,
    },
    rail: {
      top: railTop,
      width: innerWidth,
      height: RAIL_HEIGHT_PX,
    },
    dock: {
      top: dockTop,
      width: innerWidth,
      height: showDock ? DOCK_HEIGHT_PX : 0,
    },
  };
}

function connectorGeometry(from, to) {
  const fromX = finiteOrNull(from?.x);
  const fromY = finiteOrNull(from?.y);
  const toX = finiteOrNull(to?.x);
  const toY = finiteOrNull(to?.y);
  if (!Number.isFinite(fromX) || !Number.isFinite(fromY) || !Number.isFinite(toX) || !Number.isFinite(toY)) {
    return null;
  }

  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt((dx * dx) + (dy * dy));
  if (!Number.isFinite(length) || length < 6) return null;

  return {
    left: fromX,
    top: fromY,
    length,
    angleRad: Math.atan2(dy, dx),
  };
}

function resolveMappedTargetId(model, activeLetterId, fallbackMap) {
  const safeModel = String(model || 'none');
  const map = safeModel === 'per-letter'
    ? fallbackMap?.perLetter
    : safeModel === 'zone'
      ? fallbackMap?.zone
      : fallbackMap?.whole;
  return map?.[activeLetterId] || null;
}

function resolveTargetScreenRect({ model, activeLetterId, display, fallbackMap }) {
  const targetId = resolveMappedTargetId(model, activeLetterId, fallbackMap);
  if (!targetId) return null;

  if (targetId === 'whole') {
    return display?.whole?.screenRect || null;
  }

  if (model === 'per-letter') {
    const match = (Array.isArray(display?.letters) ? display.letters : []).find((entry) => entry?.id === targetId);
    return match?.screenRect || null;
  }

  if (model === 'zone') {
    const match = (Array.isArray(display?.zones) ? display.zones : []).find((entry) => entry?.id === targetId);
    return match?.screenRect || null;
  }

  return display?.whole?.screenRect || null;
}

function computeIndicatorAnchorCenters({ model, items, display, fallbackMap }) {
  const result = {};
  const safeItems = Array.isArray(items) ? items : [];

  for (const item of safeItems) {
    const id = String(item?.id || '');
    if (!id) continue;
    const targetId = resolveMappedTargetId(model, id, fallbackMap);

    let rect = null;
    if (targetId === 'whole') {
      rect = display?.whole?.screenRect || null;
    } else if (model === 'per-letter') {
      rect = (Array.isArray(display?.letters) ? display.letters : []).find((entry) => entry?.id === targetId)?.screenRect || null;
    } else if (model === 'zone') {
      rect = (Array.isArray(display?.zones) ? display.zones : []).find((entry) => entry?.id === targetId)?.screenRect || null;
    }

    const centerX = finiteOrNull(rect?.center?.x);
    if (Number.isFinite(centerX)) {
      result[id] = centerX;
    }
  }

  return result;
}

export default function LandingUiOverlay() {
  const { raw, display, model, modelReason, visible, checkpoint } = useLandingUiAnchor({
    pollMs: 120,
    smoothing: 0.24,
  });

  const contentModel = landingUiContentModel || {};
  const dockItems = Array.isArray(contentModel?.dock?.items) ? contentModel.dock.items : [];

  const [activeLetterId, setActiveLetterId] = useState(() => dockItems[0]?.id || 'F');
  const [activePanelId, setActivePanelId] = useState(null);
  const [indicatorPos, setIndicatorPos] = useState({ x: null, y: null });
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  useEffect(() => {
    if (!dockItems.length) return;
    if (dockItems.some((item) => item?.id === activeLetterId)) return;
    setActiveLetterId(dockItems[0]?.id || 'F');
  }, [dockItems, activeLetterId]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const letters = useMemo(
    () => (Array.isArray(display?.letters) ? display.letters : []),
    [display?.letters]
  );

  const activeDockItem = useMemo(
    () => dockItems.find((item) => item?.id === activeLetterId) || dockItems[0] || null,
    [dockItems, activeLetterId]
  );

  const wholeRect = display?.whole?.screenRect;
  const heroVisible = isHeroVisible(wholeRect, viewport);
  const attachMode = heroVisible && checkpoint === 'lock' ? 'word' : 'bottom';

  const fallbackMap = contentModel?.dock?.anchorFallbackMap || {};
  const targetRect = resolveTargetScreenRect({
    model,
    activeLetterId,
    display,
    fallbackMap,
  });

  const shouldAutoExpand = checkpoint === contentModel?.dock?.defaultExpandedAt;
  const manualPanel = activePanelId && activePanelId !== 'dock' && contentModel?.panels?.[activePanelId]
    ? contentModel.panels[activePanelId]
    : null;
  const drawerContent = manualPanel || activeDockItem?.panel || null;
  const showDrawer = visible && !!drawerContent && (shouldAutoExpand || activePanelId === 'dock' || !!manualPanel);
  const consoleDensity = checkpoint === 'lock' && heroVisible ? 'minimal' : 'full';
  const showDock = visible && (consoleDensity === 'full' || showDrawer);
  const drawerHeight = showDrawer ? computeDrawerHeight(drawerContent) : 0;

  const layout = buildConsoleLayout({
    viewport,
    wholeRect,
    attachMode,
    drawerHeight,
    showDock,
  });

  const indicatorAnchorCenters = useMemo(
    () => computeIndicatorAnchorCenters({ model, items: dockItems, display, fallbackMap }),
    [model, dockItems, display, fallbackMap]
  );

  const showLetterHitZones = visible
    && heroVisible
    && checkpoint === 'lock'
    && model === 'per-letter';
  const letterHitZones = showLetterHitZones
    ? letters.filter((entry) => hasScreenRect(entry?.screenRect))
    : [];

  const bracketVisible = heroVisible && visible && hasScreenRect(targetRect);
  const connector = showDock
    ? connectorGeometry(
      indicatorPos,
      bracketVisible
        ? {
            x: targetRect.center.x,
            y: targetRect.center.y,
          }
        : null
    )
    : null;

  const showGhost = raw?.ready !== true;

  const handleAction = useCallback((action) => {
    if (!action || typeof action !== 'object') return;
    const type = String(action.type || 'none');
    const target = action.target || action.href || null;

    if (type === 'panel' && typeof target === 'string') {
      setActivePanelId(target);
      return;
    }

    if (type === 'scroll' && typeof target === 'string' && typeof document !== 'undefined') {
      const el = document.querySelector(`#${target}`) || document.querySelector(target);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    if (type === 'link' && typeof action.href === 'string' && typeof window !== 'undefined') {
      window.location.assign(action.href);
      return;
    }

    if (type === 'modal' && typeof target === 'string') {
      if (contentModel?.panels?.[target]) {
        setActivePanelId(target);
      }
    }
  }, [contentModel?.panels]);

  const handleIndicatorPositionChange = useCallback((nextPoint) => {
    setIndicatorPos((prevPoint) => {
      if (isSamePoint(prevPoint, nextPoint)) {
        return prevPoint;
      }
      return {
        x: finiteOrNull(nextPoint?.x),
        y: finiteOrNull(nextPoint?.y),
      };
    });
  }, []);

  const handleLetterSelect = useCallback((id) => {
    setActiveLetterId(id);
    setActivePanelId('dock');
  }, []);

  return (
    <section
      aria-label="Landing UI overlay"
      data-testid="landing-ui-overlay"
      data-ui="landing-ui-overlay"
      data-anchor-ready={raw?.ready === true ? 'true' : 'false'}
      data-anchor-checkpoint={checkpoint || 'unknown'}
      data-anchor-model={model || 'none'}
      data-anchor-reason={modelReason || 'none'}
      data-attach-mode={attachMode}
      data-console-density={consoleDensity}
      style={shellStyle}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: showGhost ? 0.76 : 1,
          transition: 'opacity 260ms ease',
          pointerEvents: 'none',
        }}
      >
        {letterHitZones.map((entry) => {
          const rect = entry?.screenRect;
          return (
            <button
              key={`hit-zone-${entry.id}`}
              type="button"
              data-ui="letter-hit-zone"
              data-ui-hit-letter={entry.id}
              aria-label={`Activate ${entry.id}`}
              onMouseEnter={() => handleLetterSelect(entry.id)}
              onFocus={() => handleLetterSelect(entry.id)}
              onClick={() => handleLetterSelect(entry.id)}
              style={{
                position: 'fixed',
                left: `${rect.min.x - 6}px`,
                top: `${rect.min.y - 6}px`,
                width: `${Math.max(12, rect.size.w + 12)}px`,
                height: `${Math.max(12, rect.size.h + 12)}px`,
                background: 'transparent',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            />
          );
        })}

        {bracketVisible ? (
          <div
            data-ui="letter-bracket"
            style={{
              position: 'fixed',
              left: `${targetRect.min.x - 6}px`,
              top: `${targetRect.min.y - 6}px`,
              width: `${Math.max(10, targetRect.size.w + 12)}px`,
              height: `${Math.max(10, targetRect.size.h + 12)}px`,
              borderRadius: '12px',
              border: '1px solid rgba(205, 228, 255, 0.68)',
              boxShadow: '0 0 18px rgba(166, 204, 255, 0.32), inset 0 1px 0 rgba(255,255,255,0.22)',
              background: 'linear-gradient(145deg, rgba(165, 198, 255, 0.08), rgba(110, 140, 190, 0.04))',
              transition: 'left 220ms ease, top 220ms ease, width 220ms ease, height 220ms ease',
              pointerEvents: 'none',
            }}
          />
        ) : null}

        {connector ? (
          <div
            data-ui="dock-letter-connector"
            style={{
              position: 'fixed',
              left: `${connector.left}px`,
              top: `${connector.top}px`,
              width: `${connector.length}px`,
              height: '1.5px',
              transformOrigin: '0 0',
              transform: `rotate(${connector.angleRad}rad)`,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(185, 219, 255, 0.78), rgba(255,255,255,0.06))',
              boxShadow: '0 0 12px rgba(160, 205, 255, 0.36)',
              pointerEvents: 'none',
            }}
          />
        ) : null}

        <div
          data-ui="glass-console"
          style={{
            position: 'fixed',
            left: `${layout.console.left}px`,
            top: `${layout.console.top}px`,
            width: `${layout.console.width}px`,
            height: `${layout.console.height}px`,
            borderRadius: `${CONSOLE_RADIUS_PX}px`,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'linear-gradient(135deg, rgba(16, 22, 36, 0.42), rgba(8, 12, 22, 0.30))',
            boxShadow: '0 22px 48px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.16)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            transition: 'left 240ms ease, top 260ms ease, width 240ms ease, height 240ms ease, opacity 220ms ease',
            pointerEvents: 'auto',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: `${CONSOLE_INSET_PX}px`,
              top: `${CONSOLE_INSET_PX}px`,
              width: `${layout.inner.width}px`,
              height: `${layout.inner.height}px`,
              display: 'grid',
              gridTemplateRows: [
                showDrawer ? `${layout.drawer.height}px` : null,
                `${RAIL_HEIGHT_PX}px`,
                showDock ? `${DOCK_HEIGHT_PX}px` : null,
              ].filter(Boolean).join(' '),
              rowGap: showDrawer
                ? `${DRAWER_GAP_PX}px`
                : showDock
                  ? `${RAIL_TO_DOCK_GAP_PX}px`
                  : '0px',
              pointerEvents: 'none',
            }}
          >
            {showDrawer ? (
              <section
                data-ui="console-drawer"
                style={{
                  borderRadius: '14px',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.16)',
                  background: 'linear-gradient(140deg, rgba(16,22,36,0.38), rgba(8,12,22,0.30))',
                  boxShadow: 'none',
                  padding: '10px 12px',
                  pointerEvents: 'auto',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ fontSize: '0.66rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(220,234,255,0.72)' }}>
                    {activeDockItem?.label || 'Panel'}
                  </div>
                  <button
                    type="button"
                    data-ui="console-drawer-close"
                    onClick={() => setActivePanelId(null)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'rgba(220,234,255,0.82)',
                      fontSize: '0.72rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Close
                  </button>
                </div>
                <div style={{ marginTop: '4px', color: '#f2f6ff', fontSize: '0.92rem', fontWeight: 650 }}>
                  {drawerContent?.title || 'Details'}
                </div>
                {Array.isArray(drawerContent?.bullets) ? (
                  <ul style={{ margin: '7px 0 0', paddingLeft: '18px', color: '#d6e4fb', fontSize: '0.74rem', lineHeight: 1.3 }}>
                    {drawerContent.bullets.slice(0, 4).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
                {drawerContent?.body ? (
                  <p style={{ margin: '7px 0 0', color: '#d6e4fb', fontSize: '0.74rem', lineHeight: 1.32 }}>{drawerContent.body}</p>
                ) : null}
                {drawerContent?.cta?.label ? (
                  <button
                    type="button"
                    data-ui="dock-panel-cta"
                    onClick={() => handleAction(drawerContent.cta.action)}
                    style={{
                      marginTop: '8px',
                      height: '30px',
                      borderRadius: '9px',
                      border: '1px solid rgba(216,232,255,0.66)',
                      background: 'rgba(154, 188, 242, 0.22)',
                      color: '#f5f8ff',
                      fontSize: '0.68rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      padding: '0 10px',
                    }}
                  >
                    {drawerContent.cta.label}
                  </button>
                ) : null}
              </section>
            ) : null}

            <GlassRailCTA
              checkpoint={checkpoint}
              visible={visible}
              model={model}
              content={contentModel?.rail}
              onAction={handleAction}
            />

            {showDock ? (
              <LetterDockInterface
                width={layout.dock.width}
                rowTopViewport={layout.dock.top}
                viewportLeft={layout.inner.left}
                model={model}
                visible={visible}
                items={dockItems}
                indicatorAnchorCenters={indicatorAnchorCenters}
                activeLetterId={activeLetterId}
                onSelectLetter={handleLetterSelect}
                onIndicatorPositionChange={handleIndicatorPositionChange}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
