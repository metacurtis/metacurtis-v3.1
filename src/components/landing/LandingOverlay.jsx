import { useEffect, useState } from 'react';

import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { stageAtom } from '@/state/atoms/stageAtom.js';
import { useAtomValue } from '@/state/atoms/createAtom.js';

const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const LANDING_HERO_STATE_KEY = '__LANDING_HERO_STATE__';
const LANDING_HERO_STATE_EVENT = 'landing-hero-state-change';

const readLandingHeroState = (stageName = null) => {
  if (typeof window === 'undefined') return null;
  const nextState = window[LANDING_HERO_STATE_KEY] || null;
  if (!nextState || typeof nextState !== 'object') return null;
  if (stageName && nextState.stage && nextState.stage !== stageName) return null;
  return nextState;
};

const shellStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 20,
  pointerEvents: 'none',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '24px clamp(20px, 3vw, 40px) 28px',
};

const rowStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: '18px',
};

const resolveOverlayPhase = (elapsedMs) => {
  if (elapsedMs < 800) return 'immersion';
  if (elapsedMs < 1800) return 'awareness';
  if (elapsedMs < 3000) return 'identity';
  if (elapsedMs < 6000) return 'meaning';
  return 'action';
};

const mapBrandVisibility = (phase, phaseProgress) => {
  if (phase === 'immersion') return 0.12;
  if (phase === 'awareness') return 0.2 + (phaseProgress * 0.16);
  if (phase === 'identity') return 0.42 + (phaseProgress * 0.4);
  if (phase === 'meaning') return 0.86;
  return 1;
};

export default function LandingOverlay() {
  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage || 'genesis');
  const landingResolved = Canonical?.landingStageSliceResolved || {};
  const landingModeForm = Canonical?.landingModes?.form || {};
  const stageLocked = (landingResolved?.stage || landingModeForm?.stage || currentStage).toString();
  const stagePalette = Array.isArray(landingResolved?.palette)
    ? landingResolved.palette
    : (Array.isArray(landingModeForm?.palette) ? landingModeForm.palette : []);
  const copy = landingModeForm?.ui?.voidCopy || {};
  const [heroState, setHeroState] = useState(() => readLandingHeroState(stageLocked));
  const [continuationTakeover, setContinuationTakeover] = useState(0);

  useEffect(() => {
    if (currentStage !== stageLocked) {
      setHeroState(null);
      return undefined;
    }

    const syncHeroState = () => {
      setHeroState(readLandingHeroState(stageLocked));
    };

    syncHeroState();
    window.addEventListener(LANDING_HERO_STATE_EVENT, syncHeroState);
    return () => window.removeEventListener(LANDING_HERO_STATE_EVENT, syncHeroState);
  }, [currentStage, stageLocked]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (currentStage !== stageLocked) {
      setContinuationTakeover(0);
      return undefined;
    }

    let rafId = 0;
    const updateTakeover = () => {
      rafId = 0;
      const surface = document.getElementById('landing-continuation-surface');
      if (!surface) {
        setContinuationTakeover(0);
        return;
      }
      const rect = surface.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight || 0, 1);
      const fadeStart = viewportHeight * 0.88;
      const fadeEnd = viewportHeight * 0.54;
      const next = clamp01((fadeStart - rect.top) / Math.max(1, fadeStart - fadeEnd));
      setContinuationTakeover((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));
    };

    const requestUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateTakeover);
    };

    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, [currentStage, stageLocked]);

  const ink = '#F3EEFF';
  const accent = stagePalette[1] || '#A78BFA';
  const accentSoft = stagePalette[0] || '#DDD6FE';
  const cueInk = 'rgba(243, 238, 255, 0.78)';
  const elapsedMs = Math.max(0, Number(heroState?.elapsedMs) || 0);
  const heroPhase = resolveOverlayPhase(elapsedMs);
  const heroPhaseProgress = heroPhase === 'immersion'
    ? clamp01(elapsedMs / 800)
    : heroPhase === 'awareness'
      ? clamp01((elapsedMs - 800) / 1000)
      : heroPhase === 'identity'
        ? clamp01((elapsedMs - 1800) / 1200)
        : heroPhase === 'meaning'
          ? clamp01((elapsedMs - 3000) / 3000)
          : clamp01((elapsedMs - 6000) / 4000);
  const brandVisibility = heroState ? mapBrandVisibility(heroPhase, heroPhaseProgress) : 0;
  const lineVisibility = heroState ? clamp01((elapsedMs - 3000) / 900) : 0;
  const ctaVisibility = heroState ? clamp01((elapsedMs - 6000) / 1000) : 0;
  const cueVisibility = heroState ? clamp01((elapsedMs - 3000) / 1000) : 0;
  const bottomRowOpacity = continuationTakeover <= 0.1
    ? 1
    : clamp01(1 - ((continuationTakeover - 0.1) / 0.24));
  const bottomRowLift = continuationTakeover * 30;
  const bottomRowInteractive = continuationTakeover < 0.16;
  const surfaceBackground = 'linear-gradient(145deg, rgba(8, 10, 18, 0.74), rgba(12, 15, 28, 0.44))';
  const surfaceBorder = `1px solid ${accent}2D`;
  const surfaceShadow = `0 18px 44px ${accent}14`;
  const surfaceBlur = 'blur(12px)';
  const ctaInk = '#1A1430';

  return (
    <section style={shellStyle} aria-label="Landing experience overlay">
      <div
        style={{
          alignSelf: 'flex-start',
          opacity: brandVisibility,
          filter: `blur(${(1 - brandVisibility) * 14}px)`,
          transition: 'opacity 260ms ease, filter 360ms ease',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '12px 14px',
            borderRadius: '16px',
            border: surfaceBorder,
            background: surfaceBackground,
            backdropFilter: surfaceBlur,
            WebkitBackdropFilter: surfaceBlur,
            boxShadow: surfaceShadow,
          }}
        >
          <div
            style={{
              color: ink,
              fontSize: '0.78rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              opacity: 0.74,
            }}
          >
            {copy.name || 'Curtis Whorton'}
          </div>
          <div
            style={{
              color: accentSoft,
              fontSize: '0.9rem',
              letterSpacing: '0.06em',
            }}
          >
            {copy.title || 'Creative Technologist'}
          </div>
        </div>
      </div>

      <div
        style={{
          ...rowStyle,
          opacity: bottomRowOpacity,
          transform: `translate3d(0, ${bottomRowLift}px, 0)`,
          transition: 'opacity 320ms ease, transform 420ms ease',
          visibility: bottomRowOpacity <= 0.001 ? 'hidden' : 'visible',
        }}
      >
        <div
          style={{
            maxWidth: 'min(460px, calc(100vw - 48px))',
            opacity: lineVisibility,
            filter: `blur(${(1 - lineVisibility) * 10}px)`,
            transition: 'opacity 320ms ease, filter 420ms ease',
            marginBottom: 'clamp(34px, 6vh, 64px)',
            pointerEvents: bottomRowInteractive ? 'auto' : 'none',
          }}
        >
          <div
            style={{
              color: ink,
              fontSize: 'clamp(1rem, 1.2vw, 1.14rem)',
              lineHeight: 1.45,
              letterSpacing: '0.02em',
              textWrap: 'balance',
              textShadow: `0 0 24px ${accent}14`,
            }}
          >
            {copy.line || 'I build real-time cinematic systems for the web.'}
          </div>

          <div
            style={{
              marginTop: '16px',
              opacity: ctaVisibility,
              filter: `blur(${(1 - ctaVisibility) * 8}px)`,
              transition: 'opacity 320ms ease, filter 420ms ease',
            }}
          >
            {copy.ctaHref ? (
              <a
                href={copy.ctaHref}
                style={{
                  pointerEvents: bottomRowInteractive ? 'auto' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '11px 16px',
                  borderRadius: '999px',
                  border: `1px solid ${accent}2A`,
                  background: 'linear-gradient(135deg, rgba(236, 226, 255, 0.98), rgba(223, 205, 255, 0.96))',
                  color: ctaInk,
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  boxShadow: `0 12px 24px ${accent}22`,
                }}
              >
                <span>{copy.cta || 'Let’s talk'}</span>
                <span aria-hidden="true" style={{ opacity: 0.55 }}>↗</span>
              </a>
            ) : null}
          </div>
        </div>

        <div
          style={{
            alignSelf: 'flex-end',
            marginBottom: '18px',
            opacity: cueVisibility,
            filter: `blur(${(1 - cueVisibility) * 8}px)`,
            transition: 'opacity 360ms ease, filter 420ms ease',
          }}
        >
          <div
            style={{
              color: cueInk,
              fontSize: '0.74rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              textShadow: `0 0 18px ${accent}18`,
            }}
          >
            Scroll to continue
          </div>
        </div>
      </div>
    </section>
  );
}
