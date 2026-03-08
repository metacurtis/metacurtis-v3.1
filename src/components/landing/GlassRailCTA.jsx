import React from 'react';

export default function GlassRailCTA({
  checkpoint,
  visible,
  model,
  content,
  onAction,
}) {
  const lockContent = content?.lock || {};
  const driftContent = content?.drift || {};
  const railState = checkpoint === 'lock' ? lockContent : driftContent;
  const status = railState?.chip || null;

  const primaryCta = content?.primaryCta || { label: 'Start', action: { type: 'none' } };
  const secondaryCta = content?.secondaryCta || { label: 'View', action: { type: 'none' } };

  return (
    <div
      data-ui="glass-rail-cta"
      data-testid="landing-ui-overlay-cta"
      data-checkpoint={checkpoint || 'unknown'}
      data-anchor-model={model}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '62px',
        boxSizing: 'border-box',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.16)',
        background: 'linear-gradient(140deg, rgba(22, 28, 44, 0.42), rgba(10, 14, 24, 0.30))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
        padding: '8px 10px 8px 8px',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: '8px',
        opacity: visible ? 1 : 0.3,
        transform: visible ? 'translateY(0px)' : 'translateY(5px)',
        transition: 'opacity 260ms ease, transform 260ms ease',
        pointerEvents: 'auto'
      }}
    >
      <button
        data-ui="rail-secondary-cta"
        type="button"
        onClick={() => onAction?.(secondaryCta?.action)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '96px',
          height: '32px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.20)',
          background: 'rgba(255,255,255,0.07)',
          color: '#d8e6ff',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          cursor: 'pointer'
        }}
      >
        {secondaryCta?.label || 'View'}
      </button>

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div
          data-ui="rail-headline"
          style={{
            fontSize: '0.73rem',
            color: '#f2f6ff',
            fontWeight: 650,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={railState?.headline}
        >
          {railState?.headline || 'FORM Anchor Surface'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {status ? (
          <div
            data-ui="checkpoint-chip"
            style={{
              padding: '6px 8px',
              borderRadius: '999px',
              border: '1px solid rgba(220,236,255,0.42)',
              background: 'rgba(150,192,255,0.14)',
              color: '#eaf3ff',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase'
            }}
          >
            {status}
          </div>
        ) : null}
        <button
          data-ui="rail-primary-cta"
          type="button"
          onClick={() => onAction?.(primaryCta?.action)}
          style={{
            height: '32px',
            borderRadius: '10px',
            border: '1px solid rgba(215,232,255,0.74)',
            background: 'linear-gradient(145deg, rgba(180, 208, 255, 0.3), rgba(120, 150, 205, 0.22))',
            color: '#f6f9ff',
            fontSize: '0.70rem',
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            padding: '0 12px',
            cursor: 'pointer'
          }}
        >
          {primaryCta?.label || 'Start'}
        </button>
      </div>
    </div>
  );
}
