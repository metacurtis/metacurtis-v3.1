import React, { useEffect, useRef, useState } from 'react';
import { landingUiTokens } from '@/components/landing/landingUiTokens.js';

const DEFAULT_ITEMS = [
  { id: 'work', label: 'Work', target: 'results' },
  { id: 'contact', label: 'Contact', target: 'contact' },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isDeterministicMode() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('deterministic') === '1';
}

function getScrollRoot() {
  if (typeof document === 'undefined') return null;
  return document.querySelector('[data-ui="landing-scroll-root"]')
    || document.scrollingElement
    || document.documentElement;
}

function scrollToId(id) {
  if (typeof document === 'undefined') return;
  const root = getScrollRoot();
  const el = document.getElementById(id);
  if (!root || !el) return;

  const rootRect = root.getBoundingClientRect?.() || { top: 0 };
  const elRect = el.getBoundingClientRect?.();
  if (!elRect) return;

  const offset = 110;
  const delta = elRect.top - rootRect.top;
  const top = (root.scrollTop || 0) + delta - offset;
  root.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export default function LandingPillNav() {
  const navRef = useRef(null);
  const velocityRef = useRef(0);
  const [activeId, setActiveId] = useState(DEFAULT_ITEMS[0].id);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const root = getScrollRoot();
    if (!root) return undefined;

    const nav = navRef.current;
    if (nav && isDeterministicMode()) {
      nav.style.setProperty('--pill-glow', '10px');
      nav.style.setProperty('--pill-wave', '0.2');
      return undefined;
    }

    let lastTop = root.scrollTop || 0;
    let lastTs = performance.now();
    let smooth = 0;
    let rafId = 0;

    const onScroll = () => {
      const now = performance.now();
      const top = root.scrollTop || 0;
      const dt = Math.max(16, now - lastTs);
      const velocity = Math.abs(top - lastTop) / dt;
      velocityRef.current = velocity;
      lastTop = top;
      lastTs = now;
    };

    const tick = () => {
      const raw = Math.min(1.2, velocityRef.current * 12);
      smooth = (smooth * 0.88) + (raw * 0.12);
      const glowPx = clamp(10 + (smooth * 22), 10, 34);
      const wave = clamp(0.2 + (smooth * 1.1), 0.2, 1.5);
      const nav = navRef.current;
      if (nav) {
        nav.style.setProperty('--pill-glow', `${glowPx}px`);
        nav.style.setProperty('--pill-wave', `${wave}`);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    rafId = window.requestAnimationFrame(tick);

    return () => {
      root.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  const renderPillButton = (item) => {
    const active = item.id === activeId;
    return (
      <button
        key={item.id}
        type="button"
        data-ui="pill-nav-item"
        data-ui-pill-id={item.id}
        data-ui-pill-target={item.target}
        data-active={active ? 'true' : 'false'}
        onClick={() => scrollToId(item.target)}
        style={{
          border: active ? `1px solid ${landingUiTokens.border}` : '1px solid rgba(255, 246, 232, 0.16)',
          background: active
            ? `linear-gradient(145deg, rgba(245, 238, 225, 0.24), ${landingUiTokens.surface})`
            : 'linear-gradient(145deg, rgba(245, 238, 225, 0.12), rgba(255, 246, 232, 0.05))',
          color: landingUiTokens.text,
          height: '36px',
          padding: '0 14px',
          borderRadius: '999px',
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 620,
          cursor: 'pointer',
          transition: 'border-color 180ms ease, background 180ms ease, box-shadow 180ms ease',
          boxShadow: active ? `0 0 14px ${landingUiTokens.glow}` : 'none',
        }}
        aria-current={active ? 'page' : undefined}
      >
        {item.label}
      </button>
    );
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const root = getScrollRoot();
    if (!root) return undefined;

    const sections = DEFAULT_ITEMS
      .map((item) => ({ ...item, element: document.getElementById(item.target) }))
      .filter((item) => !!item.element);
    if (!sections.length) return undefined;

    const targetToId = new Map(sections.map((entry) => [entry.target, entry.id]));
    const observedElements = sections.map((entry) => entry.element).filter(Boolean);
    if (!observedElements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const id = targetToId.get(visible[0].target.id);
        if (id) setActiveId(id);
      },
      {
        root: root === document.documentElement || root === document.body ? null : root,
        threshold: [0.2, 0.4, 0.6],
        rootMargin: '-8% 0px -45% 0px',
      }
    );

    observedElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      ref={navRef}
      data-ui="pill-nav"
      aria-label="Landing section navigation"
      style={{
        position: 'fixed',
        top: '18px',
        right: '20px',
        zIndex: 26,
        pointerEvents: 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px',
        borderRadius: '999px',
        border: `1px solid ${landingUiTokens.border}`,
        background: `linear-gradient(145deg, ${landingUiTokens.bg}, rgba(10, 12, 18, 0.28))`,
        backdropFilter: `blur(${landingUiTokens.blurPx}px)`,
        WebkitBackdropFilter: `blur(${landingUiTokens.blurPx}px)`,
        boxShadow: `0 0 var(--pill-glow, 10px) ${landingUiTokens.glow}, inset 0 1px 0 rgba(255, 246, 232, 0.18)`,
      }}
    >
      {DEFAULT_ITEMS[0] ? renderPillButton(DEFAULT_ITEMS[0]) : null}
      <div
        aria-hidden="true"
        data-ui="pill-wave-glyph"
        style={{
          width: '34px',
          height: '10px',
          borderRadius: '999px',
          border: `1px solid ${landingUiTokens.border}`,
          background: `linear-gradient(90deg, rgba(255, 246, 232, 0.12), ${landingUiTokens.accent}, rgba(255, 246, 232, 0.12))`,
          transformOrigin: '50% 50%',
          transform: 'scaleX(var(--pill-wave, 0.2))',
          opacity: 0.72,
          transition: 'transform 140ms linear',
        }}
      />
      {DEFAULT_ITEMS[1] ? renderPillButton(DEFAULT_ITEMS[1]) : null}
    </nav>
  );
}
