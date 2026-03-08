import React, { useEffect, useMemo } from 'react';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function finiteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildDefaultCenters(items, width) {
  const count = Math.max(1, items.length);
  const step = width / (count + 1);
  return items.map((_, index) => (index + 1) * step);
}

function resolveIndicatorCenterX({
  activeLetterId,
  resolvedItems,
  buttonCenters,
  indicatorAnchorCenters,
  viewportLeft,
  width,
  buttonWidth,
}) {
  const activeIndex = Math.max(0, resolvedItems.findIndex((item) => String(item?.id) === activeLetterId));
  const fallbackCenter = buttonCenters[activeIndex] ?? (width * 0.5);
  const id = String(resolvedItems[activeIndex]?.id || '');
  const anchoredAbsolute = finiteOrNull(indicatorAnchorCenters?.[id]);
  if (!Number.isFinite(anchoredAbsolute)) return fallbackCenter;

  const minCenter = (buttonWidth * 0.5) + 6;
  const maxCenter = width - (buttonWidth * 0.5) - 6;
  return clamp(anchoredAbsolute - viewportLeft, minCenter, maxCenter);
}

export default function LetterDockInterface({
  width,
  rowTopViewport,
  viewportLeft,
  model,
  visible,
  items,
  indicatorAnchorCenters,
  activeLetterId,
  onSelectLetter,
  onIndicatorPositionChange,
}) {
  const rowWidth = Math.max(320, finiteOrNull(width) || 420);
  const leftViewport = finiteOrNull(viewportLeft) || 0;
  const topViewport = finiteOrNull(rowTopViewport) || 0;
  const rowHeight = 74;
  const buttonWidth = Math.max(58, Math.min(84, Math.floor((rowWidth - 40) / 4)));

  const resolvedItems = Array.isArray(items) && items.length
    ? items
    : ['F', 'O', 'R', 'M'].map((id) => ({ id, label: id }));

  const buttonCenters = useMemo(
    () => buildDefaultCenters(resolvedItems, rowWidth),
    [resolvedItems, rowWidth]
  );

  const indicatorLocalX = useMemo(
    () => resolveIndicatorCenterX({
      activeLetterId,
      resolvedItems,
      buttonCenters,
      indicatorAnchorCenters,
      viewportLeft: leftViewport,
      width: rowWidth,
      buttonWidth,
    }),
    [activeLetterId, resolvedItems, buttonCenters, indicatorAnchorCenters, leftViewport, rowWidth]
  );
  const indicatorX = leftViewport + indicatorLocalX;
  const indicatorY = topViewport - 9;

  useEffect(() => {
    if (typeof onIndicatorPositionChange !== 'function') return;
    onIndicatorPositionChange({ x: indicatorX, y: indicatorY });
  }, [indicatorX, indicatorY, onIndicatorPositionChange]);

  return (
    <div
      data-ui="letter-dock"
      data-testid="letter-dock"
      data-anchor-model={model}
      style={{
        position: 'relative',
        width: `${rowWidth}px`,
        height: `${rowHeight}px`,
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'linear-gradient(135deg, rgba(20, 26, 40, 0.34), rgba(10, 14, 24, 0.24))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        opacity: visible ? 1 : 0.28,
        transform: visible ? 'translateY(0px)' : 'translateY(6px)',
        transition: 'opacity 260ms ease, transform 260ms ease',
        pointerEvents: 'auto',
        overflow: 'hidden'
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: `${indicatorX - 24}px`,
          top: `${indicatorY}px`,
          width: '48px',
          height: '2px',
          borderRadius: '2px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.12), rgba(230,240,255,0.78), rgba(255,255,255,0.12))',
          boxShadow: '0 0 12px rgba(190,220,255,0.42)',
          pointerEvents: 'none',
          transition: 'left 220ms ease, top 220ms ease',
          zIndex: 25
        }}
      />

      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div
          style={{
            position: 'absolute',
            inset: '9px 8px 11px',
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(1, resolvedItems.length)}, minmax(0, 1fr))`,
            columnGap: '8px',
            alignItems: 'stretch',
          }}
        >
          {resolvedItems.map((item) => {
            const id = String(item?.id || 'X').charAt(0);
            const active = id === activeLetterId;

            return (
              <button
                key={id}
                type="button"
                data-ui-letter={id}
                data-testid={`landing-ui-overlay-letter-${id}`}
                onClick={() => onSelectLetter?.(id)}
                style={{
                  width: '100%',
                  height: '100%',
                  minWidth: 0,
                  borderRadius: '13px',
                  border: active
                    ? '1px solid rgba(240,248,255,0.75)'
                    : '1px solid rgba(255,255,255,0.24)',
                  background: active
                    ? 'linear-gradient(145deg, rgba(210,226,255,0.26), rgba(108,134,178,0.2))'
                    : 'linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
                  boxShadow: active
                    ? '0 0 20px rgba(160,200,255,0.34), inset 0 1px 0 rgba(255,255,255,0.2)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.1)',
                  color: '#edf3ff',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 180ms ease, box-shadow 180ms ease',
                }}
                aria-label={`Select letter ${id}`}
                title={item?.label || id}
              >
                <span>{id}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
