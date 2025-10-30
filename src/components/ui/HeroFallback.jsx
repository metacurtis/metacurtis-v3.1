import { useEffect, useState } from 'react';

export default function HeroFallback() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleInteractive = () => {
      setHidden(true);
      document.removeEventListener('page-interactive', handleInteractive);
    };

    document.addEventListener('page-interactive', handleInteractive);

    return () => {
      document.removeEventListener('page-interactive', handleInteractive);
    };
  }, []);

  return (
    <section
      className={`hero-shell ${hidden ? 'hero-hidden' : ''}`}
      aria-live="polite"
    >
      <div className="hero-content">
        <p className="hero-kicker">Metacurtis / Consciousness Engine</p>
        <h1 className="hero-title">Building impossible experiences with code, design, and soul.</h1>
        <p className="hero-subtitle">
          Sit tight for a few seconds while we synchronize the particle field.
          The full interactive WebGL sequence fades in the moment it&rsquo;s ready.
        </p>
      </div>
    </section>
  );
}
