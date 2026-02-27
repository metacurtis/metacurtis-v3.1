import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { stageAtom } from '@/state/atoms/stageAtom.js';
import { useAtomValue } from '@/state/atoms/createAtom.js';
import { LANDING_STAGE_PRESETS } from '@/slices/landingStagePresets.js';

const shellStyle = {
  position: 'fixed',
  inset: '0 0 auto 0',
  zIndex: 20,
  pointerEvents: 'none',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '24px',
  gap: '16px',
};

const cardStyle = {
  pointerEvents: 'auto',
  background: 'rgba(8, 12, 18, 0.72)',
  border: '1px solid rgba(255, 255, 255, 0.24)',
  borderRadius: '14px',
  color: '#E5EDF5',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.28)',
  transition: 'none',
};

const mutedStyle = {
  opacity: 0.75,
  fontSize: '0.8rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const swatchStyle = (hex) => ({
  width: '16px',
  height: '16px',
  borderRadius: '4px',
  border: '1px solid rgba(255,255,255,0.35)',
  background: hex,
});

export default function LandingOverlay() {
  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage || 'genesis');
  const landingResolved = Canonical?.landingStageSliceResolved || {};
  const landingModeForm = Canonical?.landingModes?.form || {};

  const preset = landingResolved?.preset || null;
  const stageName = (landingResolved?.stage || currentStage || 'genesis').toString();
  const stageLocked = (landingResolved?.stage || landingModeForm?.stage || stageName).toString();
  const stageWord = (landingResolved?.word || landingModeForm?.word || 'FORM').toString();
  const stagePalette = Array.isArray(landingResolved?.palette)
    ? landingResolved.palette
    : (Array.isArray(landingModeForm?.palette) ? landingModeForm.palette : []);

  const applyPreset = (nextPreset) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (nextPreset) {
      url.searchParams.set('preset', nextPreset);
      url.searchParams.delete('landingStage');
      url.searchParams.delete('landingWord');
      url.searchParams.delete('landingPalette');
      url.searchParams.delete('landingQuality');
    } else {
      url.searchParams.delete('preset');
    }
    window.location.assign(url.toString());
  };

  return (
    <section style={shellStyle} aria-label="Landing overlay">
      <div style={{ ...cardStyle, minWidth: '280px', padding: '14px 16px' }}>
        <div style={mutedStyle}>Preset</div>
        <div
          data-testid="landing-overlay-preset-value"
          style={{ fontWeight: 700, marginTop: '4px', fontSize: '1.1rem' }}
        >
          {preset || 'manual'}
        </div>
        <div style={{ marginTop: '10px', fontSize: '0.9rem', lineHeight: 1.35 }}>
          <div><strong>Stage:</strong> {stageLocked}</div>
          <div><strong>Active:</strong> {currentStage}</div>
          <div><strong>Word:</strong> {stageWord}</div>
        </div>
        {stagePalette.length ? (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {stagePalette.slice(0, 3).map((hex) => (
              <span key={hex} title={hex} style={swatchStyle(hex)} />
            ))}
          </div>
        ) : null}
        {import.meta.env.DEV ? (
          <label style={{ display: 'block', marginTop: '12px', fontSize: '0.8rem' }}>
            <div style={{ ...mutedStyle, marginBottom: '4px' }}>Preset Picker (Dev)</div>
            <select
              aria-label="Landing preset picker"
              value={preset || ''}
              onChange={(event) => applyPreset(event.target.value)}
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.24)',
                background: 'rgba(3, 7, 14, 0.9)',
                color: '#E5EDF5',
                padding: '8px',
              }}
            >
              <option value="">manual</option>
              {Object.keys(LANDING_STAGE_PRESETS).sort().map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div style={{ ...cardStyle, maxWidth: '360px', padding: '16px 18px' }}>
        <div style={mutedStyle}>Landing Slice Factory</div>
        <p style={{ margin: '10px 0 14px', fontSize: '0.93rem', lineHeight: 1.4 }}>
          Deterministic real-time stage backgrounds for agencies, SaaS, and premium brands.
          Configurable via preset and locked to canonical authority.
        </p>
        <a
          data-testid="landing-overlay-cta"
          href="https://example.com/book-call"
          style={{
            display: 'inline-block',
            borderRadius: '10px',
            background: '#E5EDF5',
            color: '#0B1220',
            padding: '10px 14px',
            textDecoration: 'none',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          Book a call
        </a>
      </div>
    </section>
  );
}
