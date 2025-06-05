// src/components/sections/Hero.jsx - Simplified Clean Navigation
// Removed all particle effects, ripples, and complex animations

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useInteractionStore } from '@/stores/useInteractionStore';
import { narrativeTransition } from '@/config/narrativeParticleConfig';

gsap.registerPlugin(ScrollToPlugin);

function Hero() {
  const heroId = useRef(Math.random().toString(36).substr(2, 9));
  const renderCount = useRef(0);

  renderCount.current++;
  if (renderCount.current % 10 === 0) {
    console.log(`🎬 Hero [${heroId.current}]: Render #${renderCount.current} (every 10th)`);
  }

  // Refs
  const sectionRef = useRef(null);
  const heroContentRef = useRef(null);
  const lettersContainerRef = useRef(null);
  const subtitleRef = useRef(null);
  const mRef = useRef(null);
  const cRef = useRef(null);
  const ref3 = useRef(null);
  const vRef = useRef(null);
  const letterRefs = useMemo(() => [mRef, cRef, ref3, vRef], []);

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [activeLetterIndex, setActiveLetterIndex] = useState(-1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Configuration - SIMPLIFIED
  const sectionMoodMap = useMemo(
    () => ({
      hero: 'heroIntro',
      about: 'narrativeCalm',
      features: 'narrativeExcited',
      contact: 'narrativeTriumph',
    }),
    []
  );

  const letterConfig = useMemo(
    () => [
      { letter: 'M', section: 'hero', color: '#FF0080', description: '🏠 Home' },
      { letter: 'C', section: 'about', color: '#00FF80', description: '👤 About' },
      { letter: '3', section: 'features', color: '#0080FF', description: '⚡ Features' },
      { letter: 'V', section: 'contact', color: '#FF8000', description: '📧 Contact' },
    ],
    []
  );

  // Store actions - SIMPLIFIED (no particle effects)
  const storeActions = useMemo(
    () => ({
      setSection: section => {
        const store = useInteractionStore.getState();
        if (store.setCurrentSection) store.setCurrentSection(section);
      },
    }),
    []
  );

  // Entrance animation - SIMPLIFIED
  useEffect(() => {
    if (isInitialized) return;
    const letters = lettersContainerRef.current?.children;
    const subtitle = subtitleRef.current;
    const heroContent = heroContentRef.current;

    if (letters?.length > 0 && subtitle && heroContent) {
      console.log(`🎬 Hero [${heroId.current}]: 🎭 Starting simple entrance animation`);
      setIsInitialized(true);
      storeActions.setSection('hero');
      narrativeTransition.setMood('heroIntro', { duration: 2000 });

      // Clean, simple entrance
      gsap.killTweensOf([letters, subtitle, heroContent]);
      gsap.set(heroContent, { opacity: 1, scale: 1 });
      gsap.set(letters, { opacity: 0, y: 50, scale: 0.9 });
      gsap.set(subtitle, { opacity: 0, y: 30 });

      const entranceTl = gsap.timeline({
        delay: 0.3,
        onComplete: () => console.log(`🎬 Hero [${heroId.current}]: ✨ Simple entrance complete`),
      });

      entranceTl
        .to(letters, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: 'power3.out',
          stagger: { amount: 0.4, from: 'center' },
        })
        .to(
          subtitle,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.6'
        );
    }
  }, [isInitialized, storeActions]);

  // SIMPLIFIED INTERACTION - Just hover effects, no particle bursts
  useEffect(() => {
    if (!isInitialized) return;
    console.log(`🎬 Hero [${heroId.current}]: 🎯 Setting up simple hover system`);

    let activeTimeline = null;

    const handleMouseEnter = (event, index) => {
      if (isTransitioning) return;

      const target = event.currentTarget;
      const config = letterConfig[index];

      setActiveLetterIndex(index);

      if (activeTimeline) activeTimeline.kill();
      activeTimeline = gsap.timeline().to(target, {
        scale: 1.1,
        textShadow: `0 0 20px ${config.color}ff, 0 0 40px ${config.color}aa`,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = (event, index) => {
      if (isTransitioning) return;

      const target = event.currentTarget;
      const config = letterConfig[index];

      setActiveLetterIndex(-1);

      if (activeTimeline) activeTimeline.kill();
      activeTimeline = gsap.timeline().to(target, {
        scale: 1,
        textShadow: `0 0 10px ${config.color}aa, 0 0 20px ${config.color}77`,
        duration: 0.4,
        ease: 'power2.out',
      });
    };

    // Add event listeners
    letterRefs.forEach((ref, index) => {
      if (ref.current) {
        const element = ref.current;
        element.addEventListener('mouseenter', e => handleMouseEnter(e, index));
        element.addEventListener('mouseleave', e => handleMouseLeave(e, index));
      }
    });

    return () => {
      if (activeTimeline) activeTimeline.kill();
      letterRefs.forEach((ref, index) => {
        if (ref.current) {
          const element = ref.current;
          element.removeEventListener('mouseenter', e => handleMouseEnter(e, index));
          element.removeEventListener('mouseleave', e => handleMouseLeave(e, index));
        }
      });
    };
  }, [isInitialized, letterRefs, letterConfig, isTransitioning]);

  // SIMPLIFIED CLICK HANDLER - No particle effects
  const handleLetterClick = useCallback(
    (letterIndex, targetSection) => {
      if (isTransitioning) {
        console.log(`🎬 Hero [${heroId.current}]: Click ignored - transitioning`);
        return;
      }

      const config = letterConfig[letterIndex];
      const targetMood = sectionMoodMap[targetSection];
      console.log(
        `🎬 Hero [${heroId.current}]: 🎯 Simple navigation: ${config.letter} → ${targetSection}`
      );

      setIsTransitioning(true);

      // Simple letter feedback
      const targetLetter = letterRefs[letterIndex].current;
      if (targetLetter) {
        gsap
          .timeline()
          .to(targetLetter, {
            scale: 1.15,
            duration: 0.1,
            ease: 'power2.out',
          })
          .to(targetLetter, {
            scale: 1,
            duration: 0.2,
            ease: 'power2.out',
          });
      }

      // Simple navigation timeline
      const transitionTimeline = gsap.timeline({
        onComplete: () => {
          console.log(`🎬 Hero [${heroId.current}]: ✨ Simple navigation complete`);
          setIsTransitioning(false);
        },
      });

      if (targetSection === 'hero') {
        // Navigate to hero (scroll to top)
        narrativeTransition.setMood('heroIntro', { duration: 1000 });
        storeActions.setSection('hero');
        transitionTimeline.to(window, {
          duration: 1.5,
          ease: 'power2.inOut',
          scrollTo: { y: 0, offsetY: 0, autoKill: true },
        });
      } else {
        // Navigate to other section
        narrativeTransition.setMood(targetMood, { duration: 1500 });
        transitionTimeline
          .to(heroContentRef.current, {
            opacity: 0,
            scale: 0.98,
            y: -10,
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete: () => setIsHeroVisible(false),
          })
          .call(() => storeActions.setSection(targetSection), null, '-=0.3')
          .to(
            window,
            {
              duration: 1.2,
              ease: 'power2.inOut',
              scrollTo: { y: `#${targetSection}`, offsetY: 80, autoKill: true },
            },
            '-=0.1'
          );
      }
    },
    [letterRefs, storeActions, isTransitioning, letterConfig, sectionMoodMap, heroId]
  );

  // Hero visibility animation - SIMPLIFIED
  useEffect(() => {
    if (!heroContentRef.current) return;

    gsap.to(heroContentRef.current, {
      opacity: isHeroVisible ? 1 : 0,
      scale: isHeroVisible ? 1 : 0.98,
      y: isHeroVisible ? 0 : -10,
      duration: 0.6,
      ease: 'power2.inOut',
      onStart: () => {
        if (!isHeroVisible && heroContentRef.current) {
          heroContentRef.current.style.pointerEvents = 'none';
        }
      },
      onComplete: () => {
        if (heroContentRef.current) {
          heroContentRef.current.style.pointerEvents = isHeroVisible ? 'auto' : 'none';
        }
      },
    });
  }, [isHeroVisible]);

  // SIMPLIFIED SCROLL LISTENER - No complex logic
  useEffect(() => {
    let ticking = false;
    const SCROLL_THRESHOLD = 100;

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Simple reappear logic
          if (!isHeroVisible && !isTransitioning && currentScrollY < SCROLL_THRESHOLD) {
            console.log(
              `🎬 Hero [${heroId.current}]: 📜 Simple reappear (scrollY: ${currentScrollY.toFixed(0)})`
            );
            setIsHeroVisible(true);

            const currentMoodName = narrativeTransition.getMood();
            if (currentMoodName !== 'heroIntro') {
              narrativeTransition.setMood('heroIntro', { duration: 800 });
            }

            const currentStoreSection = useInteractionStore.getState().currentSection;
            if (currentStoreSection !== 'hero') {
              storeActions.setSection('hero');
            }
          }

          ticking = false;
        });
      }
    };

    console.log(`🎬 Hero [${heroId.current}]: 📜 Activating simple scroll listener`);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      console.log(`🎬 Hero [${heroId.current}]: 📜 Deactivating scroll listener`);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [storeActions, heroId, isHeroVisible, isTransitioning]);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="fixed inset-0 w-screen h-screen"
      style={{
        background: 'transparent',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 pointer-events-none" />

      <div
        ref={heroContentRef}
        className="relative z-20 w-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center min-h-screen"
      >
        <div
          ref={lettersContainerRef}
          className="letters-container flex justify-center items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12 mb-8 w-full"
          aria-label="MC3V Navigation"
        >
          {letterConfig.map((config, index) => {
            const ref = letterRefs[index];
            return (
              <span
                key={config.letter}
                ref={ref}
                className="inline-block font-black cursor-pointer select-none transition-transform duration-200 hover:scale-105"
                style={{
                  fontSize: 'clamp(3rem, 15vw, 16rem)',
                  lineHeight: 0.8,
                  color: config.color,
                  textShadow: `0 0 10px ${config.color}aa, 0 0 20px ${config.color}77, 0 0 30px ${config.color}44`,
                  userSelect: 'none',
                  willChange: 'transform',
                  mixBlendMode: 'screen',
                }}
                onClick={() => handleLetterClick(index, config.section)}
                aria-label={`Navigate to ${config.description}`}
              >
                {config.letter}
              </span>
            );
          })}
        </div>

        <div className="text-center w-full max-w-4xl mx-auto">
          <p
            ref={subtitleRef}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl mb-6 font-medium leading-relaxed transition-opacity duration-300"
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
            }}
          >
            Beyond code and design lies vision, collaboration, transformation.
          </p>

          {activeLetterIndex >= 0 && (
            <div
              className="text-sm md:text-base font-medium transition-all duration-300"
              style={{
                color: letterConfig[activeLetterIndex].color + 'dd',
                textShadow: `0 0 8px ${letterConfig[activeLetterIndex].color}77`,
              }}
            >
              {letterConfig[activeLetterIndex].description}
            </div>
          )}

          {isTransitioning && (
            <div
              className="text-xs md:text-sm mt-4 font-medium transition-opacity duration-300"
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                textShadow: '0 0 4px rgba(255, 255, 255, 0.3)',
              }}
            >
              ✨ Navigating...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;

/*
🎯 SIMPLIFIED HERO - CLEAN NAVIGATION

✅ REMOVED ALL PARTICLE EFFECTS:
- No particle bursts on click/hover
- No ripple triggering
- No complex magnetic interactions
- No cursor position tracking for particles

✅ SIMPLIFIED INTERACTIONS:
- Clean hover effects with scale and glow
- Simple click feedback animation
- Smooth navigation transitions
- Basic scroll-based reappear logic

✅ MAINTAINED FUNCTIONALITY:
- Navigation between sections
- Narrative mood transitions
- Visual feedback and descriptions
- Responsive design and accessibility

✅ PERFORMANCE OPTIMIZED:
- Reduced event listeners
- Simplified animations
- No complex calculations
- Clean state management

This version focuses purely on navigation without any particle system interference.
The background particle canvas can now operate independently without any holes or disruption.
*/
