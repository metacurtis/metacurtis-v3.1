import { Canonical } from '@/config/canonical/canonicalAuthority.js';

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

  return (
    <section id="landing-continuation" style={sectionStyle} aria-label="Landing continuation">
      <div style={innerStyle}>
        <div
          id="landing-continuation-surface"
          style={{
            maxWidth: 'min(1080px, 100%)',
            margin: '0 auto',
            position: 'relative',
            padding: 'clamp(30px, 4vw, 52px)',
            borderRadius: '38px',
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
              gap: '18px',
              maxWidth: '760px',
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
              Stage-mode landing system
            </div>

            <h2
              style={{
                margin: 0,
                color: ink,
                fontSize: 'clamp(2rem, 4vw, 3.4rem)',
                lineHeight: 1.06,
                letterSpacing: '-0.03em',
                textWrap: 'balance',
              }}
            >
              Premium interactive systems built through AI-native orchestration.
            </h2>

            <p
              style={{
                margin: 0,
                maxWidth: '62ch',
                color: bodyInk,
                fontSize: 'clamp(1rem, 1.35vw, 1.18rem)',
                lineHeight: 1.65,
                textWrap: 'pretty',
              }}
            >
              The same world that opens with FORM settles into a calmer product surface for agency
              review, real-time brand systems, and disciplined deployment across interactive web
              experiences.
            </p>

            <a
              href="#landing-capability-signals"
              style={{
                alignSelf: 'flex-start',
                color: accentSoft,
                fontSize: '0.88rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderBottom: `1px solid ${accent}30`,
                paddingBottom: '6px',
              }}
            >
              Explore Capabilities ↓
            </a>
          </div>

          <div
            id="landing-capability-signals"
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '22px',
              marginTop: 'clamp(32px, 4vw, 46px)',
              paddingTop: '22px',
              borderTop: `1px solid ${accent}1F`,
            }}
          >
            {capabilitySignals.map((signal, index) => (
              <div
                key={signal.label}
                style={{
                  paddingLeft: index === 0 ? 0 : 'clamp(0px, 1vw, 14px)',
                }}
              >
                <div
                  style={{
                    color: ink,
                    fontSize: '0.92rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    opacity: 0.92,
                  }}
                >
                  {signal.label}
                </div>
                <div
                  style={{
                    marginTop: '10px',
                    color: mutedInk,
                    fontSize: '0.98rem',
                    lineHeight: 1.6,
                    maxWidth: '28ch',
                  }}
                >
                  {signal.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
