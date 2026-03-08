import React from 'react';
import { landingUiTokens } from '@/components/landing/landingUiTokens.js';

const sectionStyle = {
  minHeight: '90vh',
  padding: '120px 24px',
  scrollMarginTop: '110px',
  background: 'linear-gradient(180deg, rgba(7, 9, 14, 0.82), rgba(11, 10, 9, 0.9))',
  borderTop: `1px solid ${landingUiTokens.border}`,
  color: landingUiTokens.text,
};

const sectionInnerStyle = {
  maxWidth: '760px',
};

const microStyle = {
  display: 'inline-block',
  marginBottom: '10px',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: landingUiTokens.accent,
  fontWeight: 600,
};

const displayStyle = {
  margin: 0,
  fontSize: '1.55rem',
  fontWeight: 620,
  letterSpacing: '0.01em',
  color: landingUiTokens.text,
};

const bodyStyle = {
  marginTop: '14px',
  maxWidth: '660px',
  fontSize: '0.98rem',
  lineHeight: 1.56,
  color: landingUiTokens.textMuted,
};

const SECTIONS = [
  {
    id: 'foundation',
    title: 'Foundation',
    body: 'Deterministic formation, renderer single-writer discipline, and read-only runtime anchors.',
  },
  {
    id: 'offer',
    title: 'Offer',
    body: 'Hero Slice, Hero + UI consumer, and full Landing OS implementation packages.',
  },
  {
    id: 'results',
    title: 'Results',
    body: 'Sharper differentiation, conversion-ready UI, and faster iteration without regression loops.',
  },
  {
    id: 'motion',
    title: 'Motion',
    body: 'Scenario isolation, keeper promotion, and gate-pass workflows that preserve quality.',
  },
  {
    id: 'contact',
    title: 'Contact',
    body: 'Ready to map your brand surface and ship a deterministic premium landing system.',
  },
];

export default function LandingSectionStack() {
  return (
    <main data-ui="landing-sections">
      <div aria-hidden="true" style={{ height: '118vh' }} />
      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id} data-ui-section={section.id} style={sectionStyle}>
          <div style={sectionInnerStyle}>
            <span style={microStyle}>FORM / {section.title}</span>
            <h2 style={displayStyle}>{section.title}</h2>
            <p style={bodyStyle}>{section.body}</p>
          </div>
        </section>
      ))}
    </main>
  );
}

