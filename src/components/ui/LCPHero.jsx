import { useEffect, useState } from 'react';
import BeatBus from '@/theater/bus';
import EVENTS from '@/theater/events';

/**
 * LCPHero — static poster that satisfies Lighthouse LCP immediately.
 *
 * Shows a pre-rendered hero until the renderer fires PARTICLES_EMERGED,
 * then removes itself (or times out after 5s as a fallback).
 */
export default function LCPHero() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hideHero = (reason = 'renderer') => {
      const hero = document.getElementById('lcp-hero');
      if (!hero) {
        setIsVisible(false);
        return;
      }

      requestAnimationFrame(() => {
        hero.style.setProperty('display', 'none', 'important');
        setIsVisible(false);
        if (import.meta?.env?.DEV) {
          console.log(`✅ [LCP HERO] Removed (${reason})`);
        }
      });
    };

    const off = (typeof BeatBus?.on === 'function')
      ? BeatBus.on(EVENTS.PARTICLES_EMERGED, () => hideHero('particles-emerged'))
      : () => {};

    const fallbackTimer = window.setTimeout(() => hideHero('fallback'), 5000);

    return () => {
      off?.();
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <picture
      id="lcp-hero"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        backgroundColor: '#000000',
        display: 'block',
      }}
    >
      <source
        type="image/avif"
        srcSet="/poster/hero.avif 1x, /poster/hero@2x.avif 2x"
      />
      <img
        src="/poster/hero.png"
        alt="MetaCurtis hero"
        width="1920"
        height="1080"
        loading="eager"
        decoding="sync"
        style={{
          display: 'block',
          inlineSize: '100%',
          maxBlockSize: '100vh',
          aspectRatio: '16 / 9',
          objectFit: 'cover',
          objectPosition: 'center',
          backgroundColor: '#000000',
        }}
      />
    </picture>
  );
}
