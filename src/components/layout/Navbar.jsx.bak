import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X, Aperture } from 'lucide-react';

const navLinks = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'features', label: 'Features' },
  { id: 'contact', label: 'Contact' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [active, setActive] = useState('hero');

  const handleNavLinkClick = useCallback(sectionId => {
    setIsOpen(false);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // scroll-based hide/show + active-link tracking
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          // visibility
          if (y < 50 || y < lastY) setIsVisible(true);
          else if (!isOpen && y > lastY && y > 200) setIsVisible(false);
          lastY = y;

          // active link
          let best = 'hero',
            bestRatio = 0;
          navLinks.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) {
              const r = el.getBoundingClientRect();
              const vh = window.innerHeight;
              if (r.top < vh && r.bottom > 0) {
                const visH = Math.min(r.bottom, vh) - Math.max(r.top, 0);
                const ratio = visH / el.offsetHeight;
                if (ratio > bestRatio) {
                  bestRatio = ratio;
                  best = id;
                }
              }
            }
          });
          setActive(best);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isOpen]);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50 p-4
        bg-black/60 backdrop-blur-lg text-white shadow-xl
        transition-transform transition-opacity duration-300
        ${isVisible || isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}
      `}
    >
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <a
          href="#hero"
          onClick={e => {
            e.preventDefault();
            handleNavLinkClick('hero');
          }}
          className="flex items-center space-x-2 text-xl md:text-2xl font-bold hover:text-cyan-300 transition-colors"
        >
          <Aperture size={28} className="text-cyan-400" />
          <span>MC3V</span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-4">
          {navLinks.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleNavLinkClick(id)}
              className={`
                relative px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${active === id ? 'text-cyan-400' : 'text-gray-300'}
                hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50
              `}
            >
              <span className="relative z-10">{label}</span>
              <span
                className={`
                  absolute inset-0 rounded-md transition-all
                  ${active === id ? 'bg-cyan-600/30' : 'group-hover:bg-cyan-500/20'}
                `}
              />
            </button>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(o => !o)}
          className="md:hidden p-2 hover:bg-gray-700/50 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-2 space-y-1 bg-gray-900/80 backdrop-blur-sm p-3 rounded-md">
          {navLinks.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleNavLinkClick(id)}
              className={`
                block w-full text-left px-3 py-2 rounded-md text-base font-medium
                ${active === id ? 'text-cyan-400 bg-cyan-700/20' : 'text-gray-200'}
                hover:text-cyan-300 hover:bg-cyan-600/30 transition-colors
              `}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default React.memo(Navbar);
