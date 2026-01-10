import { useMemo, useState } from 'react';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';

const panelStyle = {
  position: 'fixed',
  top: '1rem',
  left: '1rem',
  zIndex: 10000,
  background: 'rgba(0, 0, 0, 0.85)',
  color: '#e5e7eb',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  padding: '10px 12px',
  fontFamily: 'Courier New, monospace',
  fontSize: '12px',
  minWidth: '260px',
  maxWidth: '360px',
  pointerEvents: 'auto',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#f9fafb',
};

const optionRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px 12px',
  marginBottom: '10px',
};

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const inputStyle = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '4px',
  color: '#e5e7eb',
  padding: '2px 6px',
  fontSize: '11px',
  width: '72px',
};

const buttonStyle = {
  background: '#111827',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: '#f3f4f6',
  padding: '2px 8px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
};

const ghostButtonStyle = {
  ...buttonStyle,
  background: 'transparent',
};

const listStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  maxHeight: '240px',
  overflowY: 'auto',
};

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '6px 8px',
  borderRadius: '6px',
  background: 'rgba(255, 255, 255, 0.04)',
};

const metaStyle = {
  fontSize: '10px',
  color: '#9ca3af',
};

const actionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const activeBadgeStyle = {
  fontSize: '10px',
  color: '#10b981',
  border: '1px solid rgba(16, 185, 129, 0.6)',
  borderRadius: '999px',
  padding: '1px 6px',
};

export default function DemoLauncher() {
  const demos = useMemo(() => {
    const entries = Canonical?.visualDemos || {};
    return Object.keys(entries)
      .map((key) => ({
        key,
        durationMs: entries[key]?.durationMs ?? null,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, []);
  const [autoplay, setAutoplay] = useState(true);
  const [delayMs, setDelayMs] = useState(300);
  const [recordParam, setRecordParam] = useState(false);
  const [openNewTab, setOpenNewTab] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!import.meta.env.DEV) return null;

  const activeDemo =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('demo')
      : null;

  const buildUrl = (demoKey) => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('demo', demoKey);
    if (autoplay) {
      url.searchParams.set('autoplay', '1');
    } else {
      url.searchParams.delete('autoplay');
    }
    const delayValue = Number(delayMs);
    if (Number.isFinite(delayValue) && delayValue > 0) {
      url.searchParams.set('delay', String(Math.floor(delayValue)));
    } else {
      url.searchParams.delete('delay');
    }
    if (recordParam) {
      url.searchParams.set('record', 'true');
    } else {
      url.searchParams.delete('record');
    }
    return url.toString();
  };

  const launchDemo = (demoKey) => {
    const url = buildUrl(demoKey);
    if (!url) return;
    if (openNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(url);
    }
  };

  const copyDemoUrl = async (demoKey) => {
    const url = buildUrl(demoKey);
    if (!url) return;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        return;
      } catch {
        // fall through to prompt
      }
    }
    window.prompt('Copy demo URL', url);
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span>Demo Launcher</span>
        <button
          type="button"
          style={ghostButtonStyle}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      {collapsed ? null : (
        <>
          <div style={optionRowStyle}>
            <label style={labelStyle}>
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(event) => setAutoplay(event.target.checked)}
              />
              autoplay
            </label>
            <label style={labelStyle}>
              delay
              <input
                type="number"
                min="0"
                step="50"
                value={delayMs}
                onChange={(event) => setDelayMs(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              record param
              <input
                type="checkbox"
                checked={recordParam}
                onChange={(event) => setRecordParam(event.target.checked)}
              />
            </label>
            <label style={labelStyle}>
              new tab
              <input
                type="checkbox"
                checked={openNewTab}
                onChange={(event) => setOpenNewTab(event.target.checked)}
              />
            </label>
          </div>
          <div style={listStyle}>
            {demos.length === 0 ? (
              <div style={metaStyle}>No demos found.</div>
            ) : (
              demos.map((demo) => (
                <div key={demo.key} style={rowStyle}>
                  <div>
                    <div>{demo.key}</div>
                    {demo.durationMs ? (
                      <div style={metaStyle}>
                        {(demo.durationMs / 1000).toFixed(1)}s
                      </div>
                    ) : null}
                  </div>
                  <div style={actionsStyle}>
                    {activeDemo === demo.key ? (
                      <span style={activeBadgeStyle}>active</span>
                    ) : null}
                    <button type="button" style={buttonStyle} onClick={() => launchDemo(demo.key)}>
                      Run
                    </button>
                    <button type="button" style={buttonStyle} onClick={() => copyDemoUrl(demo.key)}>
                      Copy
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
