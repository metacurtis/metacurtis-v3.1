import { useEffect, useState } from 'react';

import { Canonical } from '@/config/canonical/canonicalAuthority.js';

const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const MOBILE_BREAKPOINT_PX = 767;
const COMPACT_LANDSCAPE_MAX_WIDTH_PX = 960;
const COMPACT_LANDSCAPE_MAX_HEIGHT_PX = 420;

const readViewportLayout = () => {
  if (typeof window === 'undefined') {
    return {
      isMobileViewport: false,
      isCompactLandscape: false,
    };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isCompactLandscape =
    width > height &&
    height <= COMPACT_LANDSCAPE_MAX_HEIGHT_PX &&
    width <= COMPACT_LANDSCAPE_MAX_WIDTH_PX;
  return {
    isMobileViewport: width <= MOBILE_BREAKPOINT_PX || isCompactLandscape,
    isCompactLandscape,
  };
};

const sectionStyle = {
  position: 'relative',
  minHeight: '250vh',
  paddingTop: '124vh',
  paddingBottom: '20vh',
  pointerEvents: 'none',
};

const innerStyle = {
  width: 'min(1120px, calc(100vw - 40px))',
  margin: '0 auto',
  pointerEvents: 'auto',
  position: 'sticky',
  top: 'clamp(72px, 9vh, 108px)',
  zIndex: 24,
};

export default function LandingContinuation() {
  const landingResolved = Canonical?.landingStageSliceResolved || {};
  const landingModeForm = Canonical?.landingModes?.form || {};
  const stagePalette = Array.isArray(landingResolved?.palette)
    ? landingResolved.palette
    : (Array.isArray(landingModeForm?.palette) ? landingModeForm.palette : []);
  const accent = stagePalette[1] || '#A78BFA';
  const accentSoft = stagePalette[0] || '#DDD6FE';
  const ink = '#F3EEFF';
  const bodyInk = 'rgba(243, 238, 255, 0.82)';
  const mutedInk = 'rgba(243, 238, 255, 0.58)';
  const primaryContactHref = typeof landingModeForm?.ui?.voidCopy?.ctaHref === 'string'
    ? landingModeForm.ui.voidCopy.ctaHref
    : 'mailto:curtis@curtiswhorton.com';
  const primaryContactLabel = landingModeForm?.ui?.voidCopy?.cta || 'Book a Call';
  const brandName = landingModeForm?.ui?.voidCopy?.name || 'Meta Curtis Labs';
  const formAction = 'https://formspree.io/f/meovodzy';
  const emailHref = 'mailto:curtis@curtiswhorton.com';
  const emailLabel = 'curtis@curtiswhorton.com';
  const capabilitySignals = [
    {
      label: 'Real-time WebGL experiences',
      detail: 'Cinematic interactive surfaces that stay readable under motion and review.',
    },
    {
      label: 'Deterministic creative pipelines',
      detail: 'Synchronized captures and runtime truth keep iteration inspectable.',
    },
    {
      label: 'AI-accelerated prototyping',
      detail: 'Creative direction moves faster without giving up engineering discipline.',
    },
  ];
  const demoEntries = [
    {
      title: 'Stage-mode landing',
      detail: 'Cinematic hero systems with inspectable timing, authority, and handoff.',
    },
    {
      title: 'Renderer discipline',
      detail: 'Single-writer rendering architecture that stays stable under iteration.',
    },
    {
      title: 'Review-ready captures',
      detail: 'Live and deterministic proof packs for creative and technical review.',
    },
  ];
  const [sectionProgress, setSectionProgress] = useState(0);
  const [viewportLayout, setViewportLayout] = useState(readViewportLayout);
  const { isMobileViewport, isCompactLandscape } = viewportLayout;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncViewportMode = () => {
      setViewportLayout((prev) => {
        const next = readViewportLayout();
        return prev.isMobileViewport === next.isMobileViewport &&
          prev.isCompactLandscape === next.isCompactLandscape
          ? prev
          : next;
      });
    };

    syncViewportMode();
    window.addEventListener('resize', syncViewportMode);
    window.addEventListener('orientationchange', syncViewportMode);
    return () => {
      window.removeEventListener('resize', syncViewportMode);
      window.removeEventListener('orientationchange', syncViewportMode);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let rafId = 0;
    const updateProgress = () => {
      rafId = 0;
      const section = document.getElementById('landing-continuation');
      if (!section) {
        setSectionProgress(0);
        return;
      }
      const rect = section.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight || 0, 1);
      const entered = viewportHeight - rect.top;
      const next = clamp01(entered / Math.max(viewportHeight * 1.4, 1));
      setSectionProgress((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));
    };

    const requestUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateProgress);
    };

    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  const arrivalProgress = clamp01(sectionProgress / 0.22);
  const trustProgress = clamp01((sectionProgress - 0.16) / 0.28);
  const conversionProgress = clamp01((sectionProgress - 0.52) / 0.22);
  const arrivalLift = (1 - arrivalProgress) * 16;
  const trustLift = (1 - trustProgress) * 14;
  const conversionLift = (1 - conversionProgress) * 12;
  const responsiveSectionStyle = isCompactLandscape
    ? {
        ...sectionStyle,
        minHeight: '205vh',
        paddingTop: '104vh',
        paddingBottom: '16vh',
      }
    : isMobileViewport
    ? {
        ...sectionStyle,
        minHeight: '235vh',
        paddingTop: '118vh',
        paddingBottom: '22vh',
      }
    : sectionStyle;
  const responsiveInnerStyle = isCompactLandscape
    ? {
        ...innerStyle,
        width: 'calc(100vw - 18px)',
        top: 'calc(8px + env(safe-area-inset-top, 0px))',
      }
    : isMobileViewport
    ? {
        ...innerStyle,
        width: 'calc(100vw - 24px)',
        top: 'calc(14px + env(safe-area-inset-top, 0px))',
      }
    : innerStyle;
  const stackedGridStyle = isMobileViewport
    ? {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-start',
      }
    : null;
  const mobileActionStyle = isMobileViewport
    ? {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'stretch',
      }
    : null;
  const panelPadding = isCompactLandscape ? '18px 16px 18px' : (isMobileViewport ? '24px 18px 26px' : 'clamp(30px, 4vw, 52px)');
  const panelRadius = isCompactLandscape ? '24px' : (isMobileViewport ? '28px' : '38px');
  const sectionGap = isCompactLandscape ? '14px' : (isMobileViewport ? '18px' : '22px');
  const chapterGap = isCompactLandscape ? '14px' : (isMobileViewport ? '20px' : '18px');
  const chapterMarginTop = isCompactLandscape ? '26px' : (isMobileViewport ? '40px' : 'clamp(32px, 4vw, 46px)');
  const chapterPaddingTop = isCompactLandscape ? '18px' : (isMobileViewport ? '24px' : '22px');

  return (
    <section id="landing-continuation" style={responsiveSectionStyle} aria-label="Landing continuation">
      <div style={responsiveInnerStyle}>
        <div
          id="landing-continuation-surface"
          style={{
            maxWidth: 'min(1080px, 100%)',
            margin: '0 auto',
            position: 'relative',
            padding: panelPadding,
            borderRadius: panelRadius,
            border: `1px solid ${accent}1E`,
            background:
              'linear-gradient(180deg, rgba(6, 8, 14, 0.62) 0%, rgba(7, 9, 16, 0.84) 24%, rgba(8, 10, 18, 0.92) 100%)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            boxShadow: `0 30px 88px ${accent}14`,
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(9, 11, 18, 0) 0%, rgba(9, 11, 18, 0.16) 18%, rgba(9, 11, 18, 0.28) 100%)',
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: '18%',
              top: '22%',
              width: '220px',
              height: '220px',
              borderRadius: '999px',
              background: `${accent}14`,
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: sectionGap,
              maxWidth: isMobileViewport ? '100%' : '760px',
            }}
          >
            <div
              style={{
                color: accentSoft,
                fontSize: '0.76rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                opacity: 0.84,
              }}
            >
              {brandName}
            </div>

            <h2
              style={{
                margin: 0,
                color: ink,
                fontSize: isCompactLandscape
                  ? 'clamp(1.28rem, 3.9vw, 1.64rem)'
                  : (isMobileViewport ? 'clamp(1.72rem, 8vw, 2.2rem)' : 'clamp(2rem, 4vw, 3.4rem)'),
                lineHeight: isCompactLandscape ? 1.06 : (isMobileViewport ? 1.1 : 1.06),
                letterSpacing: '-0.03em',
                textWrap: 'balance',
                opacity: arrivalProgress,
                filter: `blur(${(1 - arrivalProgress) * 12}px)`,
                transform: `translate3d(0, ${arrivalLift}px, 0)`,
                transition: 'opacity 320ms ease, filter 420ms ease, transform 420ms ease',
              }}
            >
              Premium interactive systems built through AI-native orchestration.
            </h2>

            <p
              style={{
                margin: 0,
                maxWidth: '62ch',
                color: bodyInk,
                fontSize: isCompactLandscape ? '0.92rem' : (isMobileViewport ? '1rem' : 'clamp(1rem, 1.35vw, 1.18rem)'),
                lineHeight: isCompactLandscape ? 1.58 : (isMobileViewport ? 1.72 : 1.65),
                textWrap: 'pretty',
                opacity: arrivalProgress,
                filter: `blur(${(1 - arrivalProgress) * 10}px)`,
                transform: `translate3d(0, ${arrivalLift}px, 0)`,
                transition: 'opacity 320ms ease, filter 420ms ease, transform 420ms ease',
              }}
            >
              We build premium interactive systems where visual direction, runtime behavior, and
              production discipline stay aligned from concept to ship.
            </p>
          </div>

          <div
            id="landing-capability-signals"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: chapterGap,
              marginTop: chapterMarginTop,
              paddingTop: chapterPaddingTop,
              borderTop: `1px solid ${accent}1F`,
              opacity: trustProgress,
              filter: `blur(${(1 - trustProgress) * 10}px)`,
              transform: `translate3d(0, ${trustLift}px, 0)`,
              transition: 'opacity 320ms ease, filter 420ms ease, transform 420ms ease',
            }}
          >
            {capabilitySignals.map((signal) => (
              <div
                key={signal.label}
                style={{
                  ...(stackedGridStyle || {
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 260px) minmax(0, 1fr)',
                    gap: '14px',
                    alignItems: 'start',
                  }),
                }}
              >
                <div
                  style={{
                    color: ink,
                    fontSize: '0.92rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    opacity: 0.92,
                    maxWidth: isMobileViewport ? '28ch' : 'none',
                  }}
                >
                  {signal.label}
                </div>
                <div
                  style={{
                    color: mutedInk,
                    fontSize: '0.98rem',
                    lineHeight: isCompactLandscape ? 1.58 : (isMobileViewport ? 1.7 : 1.6),
                    maxWidth: isMobileViewport ? 'none' : '48ch',
                  }}
                >
                  {signal.detail}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              marginTop: isCompactLandscape ? '26px' : (isMobileViewport ? '40px' : 'clamp(28px, 4vw, 42px)'),
              paddingTop: isCompactLandscape ? '18px' : (isMobileViewport ? '24px' : '22px'),
              borderTop: `1px solid ${accent}1F`,
              opacity: trustProgress,
              filter: `blur(${(1 - trustProgress) * 10}px)`,
              transform: `translate3d(0, ${trustLift}px, 0)`,
              transition: 'opacity 320ms ease, filter 420ms ease, transform 420ms ease',
            }}
          >
            <div
              style={{
                color: accentSoft,
                fontSize: '0.76rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                opacity: 0.82,
              }}
            >
              Demo surface
            </div>
            {demoEntries.map((entry) => (
              <div
                key={entry.title}
                style={{
                  ...(stackedGridStyle || {
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 220px) minmax(0, 1fr)',
                    gap: '14px',
                  }),
                  paddingTop: isCompactLandscape ? '12px' : (isMobileViewport ? '14px' : '10px'),
                  borderTop: `1px solid ${accent}14`,
                }}
              >
                <div
                  style={{
                    color: ink,
                    fontSize: '0.9rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    opacity: 0.94,
                    maxWidth: isMobileViewport ? '28ch' : 'none',
                  }}
                >
                  {entry.title}
                </div>
                <div
                  style={{
                    color: mutedInk,
                    fontSize: '0.98rem',
                    lineHeight: isCompactLandscape ? 1.58 : (isMobileViewport ? 1.7 : 1.6),
                    maxWidth: isMobileViewport ? 'none' : '52ch',
                  }}
                >
                  {entry.detail}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              marginTop: isCompactLandscape ? '28px' : (isMobileViewport ? '42px' : 'clamp(28px, 4vw, 42px)'),
              paddingTop: isCompactLandscape ? '18px' : (isMobileViewport ? '24px' : '22px'),
              borderTop: `1px solid ${accent}1F`,
              opacity: conversionProgress,
              filter: `blur(${(1 - conversionProgress) * 10}px)`,
              transform: `translate3d(0, ${conversionLift}px, 0)`,
              transition: 'opacity 320ms ease, filter 420ms ease, transform 420ms ease',
            }}
          >
            <div
              style={{
                color: accentSoft,
                fontSize: '0.76rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                opacity: 0.82,
              }}
            >
              Contact
            </div>
            <div
              style={{
                color: ink,
                fontSize: isCompactLandscape
                  ? 'clamp(1.04rem, 3.5vw, 1.28rem)'
                  : (isMobileViewport ? 'clamp(1.18rem, 5.5vw, 1.5rem)' : 'clamp(1.24rem, 2vw, 1.72rem)'),
                lineHeight: isCompactLandscape ? 1.28 : (isMobileViewport ? 1.35 : 1.25),
                letterSpacing: '-0.02em',
                maxWidth: '24ch',
              }}
            >
              If the system feels right, let’s make the next one.
            </div>
            <div
              style={{
                color: bodyInk,
                fontSize: isCompactLandscape ? '0.92rem' : '1rem',
                lineHeight: isCompactLandscape ? 1.58 : (isMobileViewport ? 1.72 : 1.65),
                maxWidth: isMobileViewport ? 'none' : '48ch',
              }}
            >
              Scheduling is live through Calendly. Direct email remains available, and the message
              path below submits through Formspree.
            </div>
            <div
              style={{
                ...(mobileActionStyle || {
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '14px 20px',
                  alignItems: 'center',
                }),
              }}
            >
              <a
                href={primaryContactHref}
                target={primaryContactHref.startsWith('http') ? '_blank' : undefined}
                rel={primaryContactHref.startsWith('http') ? 'noreferrer' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: isMobileViewport ? '100%' : 'auto',
                  justifyContent: isMobileViewport ? 'space-between' : 'center',
                  padding: isCompactLandscape ? '10px 14px' : '11px 16px',
                  borderRadius: '999px',
                  border: `1px solid ${accent}2A`,
                  background: 'linear-gradient(135deg, rgba(236, 226, 255, 0.98), rgba(223, 205, 255, 0.96))',
                  color: '#1A1430',
                  textDecoration: 'none',
                  fontSize: isCompactLandscape ? '0.84rem' : '0.88rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  boxShadow: `0 12px 24px ${accent}22`,
                }}
              >
                <span>{primaryContactLabel}</span>
                <span aria-hidden="true" style={{ opacity: 0.55 }}>↗</span>
              </a>
              <a
                href={emailHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: isMobileViewport ? '100%' : 'auto',
                  color: ink,
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  letterSpacing: isMobileViewport ? '0.06em' : '0.08em',
                  textTransform: 'uppercase',
                  borderBottom: `1px solid ${accent}30`,
                  paddingBottom: '6px',
                }}
              >
                <span>{emailLabel}</span>
                <span aria-hidden="true" style={{ opacity: 0.55 }}>↗</span>
              </a>
            </div>
            <form
              action={formAction}
              method="POST"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxWidth: isMobileViewport ? '100%' : '560px',
                marginTop: isCompactLandscape ? '4px' : '6px',
              }}
            >
              <input
                type="hidden"
                name="_subject"
                value="Curtis Whorton landing inquiry"
              />
              <input
                type="email"
                name="email"
                placeholder="Your email"
                required
                style={{
                  width: '100%',
                  padding: isCompactLandscape ? '12px 14px' : '14px 16px',
                  borderRadius: '16px',
                  border: `1px solid ${accent}24`,
                  background: 'rgba(12, 16, 28, 0.48)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: ink,
                  fontSize: '0.98rem',
                  outline: 'none',
                }}
              />
              <textarea
                name="message"
                placeholder="What are you building?"
                rows={4}
                required
                style={{
                  width: '100%',
                  resize: 'vertical',
                  minHeight: isCompactLandscape ? '110px' : '132px',
                  padding: isCompactLandscape ? '12px 14px' : '14px 16px',
                  borderRadius: '18px',
                  border: `1px solid ${accent}24`,
                  background: 'rgba(12, 16, 28, 0.48)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: ink,
                  fontSize: '0.98rem',
                  lineHeight: 1.6,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  width: isMobileViewport ? '100%' : 'auto',
                  alignItems: 'center',
                  justifyContent: isMobileViewport ? 'space-between' : 'center',
                  gap: '10px',
                  padding: isCompactLandscape ? '10px 14px' : '11px 16px',
                  borderRadius: '999px',
                  border: `1px solid ${accent}24`,
                  background: 'rgba(243, 238, 255, 0.08)',
                  color: ink,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontSize: isCompactLandscape ? '0.84rem' : '0.88rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  boxShadow: `0 12px 24px ${accent}14`,
                }}
              >
                <span>Send a Message</span>
                <span aria-hidden="true" style={{ opacity: 0.55 }}>↗</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
