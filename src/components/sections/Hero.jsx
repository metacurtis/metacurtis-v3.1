// src/components/sections/Hero.jsx - Enhanced with Optimized Scroll-to-Reappear & Performance
import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useInteractionStore } from '@/stores/useInteractionStore';
import { narrativeTransition } from '@/config/narrativeParticleConfig';

gsap.registerPlugin(ScrollToPlugin);

function Hero() {
  const heroId = useRef(Math.random().toString(36).substr(2, 9));
  const renderCount = useRef(0);
  const magneticSetupDone = useRef(false);
  const scrollListenerActive = useRef(false);

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
  const [, forceUpdate] = useState({});

  // Configuration
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
      { letter: 'M', section: 'hero', color: '#FF0080', description: '🏠 Home', intensity: 0.3 },
      { letter: 'C', section: 'about', color: '#00FF80', description: '👤 About', intensity: 0.2 },
      {
        letter: '3',
        section: 'features',
        color: '#0080FF',
        description: '⚡ Features',
        intensity: 0.4,
      },
      {
        letter: 'V',
        section: 'contact',
        color: '#FF8000',
        description: '📧 Contact',
        intensity: 0.3,
      },
    ],
    []
  );

  // Narrative subscription with cleanup
  useEffect(() => {
    const unsubscribe = narrativeTransition.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  // Store actions - memoized for performance
  const storeActions = useMemo(
    () => ({
      setSection: section => {
        const store = useInteractionStore.getState();
        if (store.setCurrentSection) store.setCurrentSection(section);
      },
      triggerLetterClick: (index, section) => {
        const store = useInteractionStore.getState();
        if (store.addInteractionEvent) {
          store.addInteractionEvent({
            type: 'letterClick',
            letterIndex: index,
            targetSection: section,
            position: { x: 0, y: 0 },
            intensity: letterConfig[index].intensity,
          });
        }
      },
      triggerParticleBurst: (position, intensity, mood) => {
        console.log(
          `🎬 Hero [${heroId.current}]: 💥 Burst request - intensity: ${intensity.toFixed(3)}`
        );
        const store = useInteractionStore.getState();
        if (store.addInteractionEvent) {
          store.addInteractionEvent({
            type: 'heroLetterBurst',
            position,
            intensity: Math.min(intensity, 0.4),
            mood,
            timestamp: performance.now(),
          });
        }
      },
      setCursorPosition: pos => {
        const store = useInteractionStore.getState();
        if (store.setCursorPosition) store.setCursorPosition(pos);
      },
    }),
    [letterConfig]
  );

  // Entrance animation - runs once
  useEffect(() => {
    if (isInitialized) return;
    const letters = lettersContainerRef.current?.children;
    const subtitle = subtitleRef.current;
    const heroContent = heroContentRef.current;

    if (letters?.length > 0 && subtitle && heroContent) {
      console.log(`🎬 Hero [${heroId.current}]: 🎭 Starting entrance animation`);
      setIsInitialized(true);
      storeActions.setSection('hero');
      narrativeTransition.setMood('heroIntro', { duration: 3000 });

      // Clean up any existing animations
      gsap.killTweensOf([letters, subtitle, heroContent]);

      // Set initial states
      gsap.set(heroContent, { opacity: 1, scale: 1 });
      gsap.set(letters, { opacity: 0, y: 150, scale: 0.8, rotationY: 45 });
      gsap.set(subtitle, { opacity: 0, y: 50 });

      const entranceTl = gsap.timeline({
        delay: 0.5,
        onComplete: () => console.log(`🎬 Hero [${heroId.current}]: ✨ Entrance complete`),
      });

      entranceTl
        .to(letters, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationY: 0,
          duration: 1.8,
          ease: 'power4.out',
          stagger: { amount: 0.8, from: 'center' },
        })
        .to(
          subtitle,
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
          },
          '-=0.8'
        );
    }
  }, [isInitialized, storeActions]);

  // Magnetic interaction system
  useEffect(() => {
    if (!isInitialized || magneticSetupDone.current) return;
    console.log(`🎬 Hero [${heroId.current}]: 🧲 Setting up magnetic system ONCE`);
    magneticSetupDone.current = true;

    const setters = letterRefs
      .map(ref => {
        if (!ref.current) return null;
        return {
          x: gsap.quickSetter(ref.current, 'x', 'px'),
          y: gsap.quickSetter(ref.current, 'y', 'px'),
          scaleX: gsap.quickSetter(ref.current, 'scaleX'),
          scaleY: gsap.quickSetter(ref.current, 'scaleY'),
          rotationY: gsap.quickSetter(ref.current, 'rotationY', 'deg'),
        };
      })
      .filter(Boolean);

    let mouseUpdateTimeout;
    let lastBurstTime = 0;
    let hoverTimeline = null;

    const handleMouseMove = event => {
      if (isTransitioning || !isHeroVisible) return;

      const mouseX = event.clientX;
      const mouseY = event.clientY;
      const now = Date.now();

      // Throttled cursor position update
      clearTimeout(mouseUpdateTimeout);
      mouseUpdateTimeout = setTimeout(() => {
        const normalizedX = (mouseX / window.innerWidth) * 2 - 1;
        const normalizedY = -(mouseY / window.innerHeight) * 2 + 1;
        storeActions.setCursorPosition({ x: normalizedX, y: normalizedY });
      }, 16);

      let maxPullIntensity = 0;
      let closestLetterIndex = -1;
      let bestLetterConfig = null;

      // Process each letter's magnetic effect
      letterRefs.forEach((ref, index) => {
        if (!ref.current || !setters[index]) return;

        const rect = ref.current.getBoundingClientRect();
        const letterCenterX = rect.left + rect.width / 2;
        const letterCenterY = rect.top + rect.height / 2;
        const deltaX = letterCenterX - mouseX;
        const deltaY = letterCenterY - mouseY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        const maxDistance = 200;
        const maxShift = 10;
        const maxScale = 1.06;
        const maxRotation = 6;

        if (distance < maxDistance) {
          const pullIntensity = (maxDistance - distance) / maxDistance;
          const smoothPull = Math.pow(pullIntensity, 0.9);

          setters[index].x(-(deltaX * smoothPull * (maxShift / maxDistance)));
          setters[index].y(-(deltaY * smoothPull * (maxShift / maxDistance)));
          setters[index].scaleX(1 + smoothPull * (maxScale - 1));
          setters[index].scaleY(1 + smoothPull * (maxScale - 1));
          setters[index].rotationY(-(deltaX * smoothPull * (maxRotation / maxDistance)));

          if (pullIntensity > maxPullIntensity) {
            maxPullIntensity = pullIntensity;
            closestLetterIndex = index;
            bestLetterConfig = letterConfig[index];
          }
        } else {
          // Reset to neutral position
          setters[index].x(0);
          setters[index].y(0);
          setters[index].scaleX(1);
          setters[index].scaleY(1);
          setters[index].rotationY(0);
        }
      });

      // Handle hover state changes
      if (closestLetterIndex !== activeLetterIndex) {
        setActiveLetterIndex(closestLetterIndex);
        if (hoverTimeline) hoverTimeline.kill();

        if (closestLetterIndex >= 0 && bestLetterConfig) {
          const activeLetter = letterRefs[closestLetterIndex].current;
          if (activeLetter) {
            hoverTimeline = gsap.timeline().to(activeLetter, {
              textShadow: `0 0 20px ${bestLetterConfig.color}ff, 0 0 40px ${bestLetterConfig.color}aa, 0 0 60px ${bestLetterConfig.color}77`,
              duration: 0.3,
              ease: 'power2.out',
            });
          }
        }
      }

      // Trigger particle burst on strong interaction
      if (maxPullIntensity > 0.8 && now - lastBurstTime > 300 && bestLetterConfig) {
        const normalizedPos = {
          x: (mouseX / window.innerWidth) * 2 - 1,
          y: -(mouseY / window.innerHeight) * 2 + 1,
        };
        const cappedIntensity = Math.min(maxPullIntensity * bestLetterConfig.intensity, 0.3);
        storeActions.triggerParticleBurst(
          normalizedPos,
          cappedIntensity,
          sectionMoodMap[bestLetterConfig.section]
        );
        lastBurstTime = now;
      }
    };

    const handleMouseLeave = () => {
      if (isTransitioning) return;

      setActiveLetterIndex(-1);
      clearTimeout(mouseUpdateTimeout);
      if (hoverTimeline) hoverTimeline.kill();

      letterRefs.forEach((ref, index) => {
        if (ref.current && setters[index]) {
          gsap.to(ref.current, {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotationY: 0,
            textShadow: `0 0 10px ${letterConfig[index].color}aa, 0 0 20px ${letterConfig[index].color}77`,
            duration: 0.6,
            ease: 'power2.out',
          });
        }
      });
    };

    const container = lettersContainerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      clearTimeout(mouseUpdateTimeout);
      if (hoverTimeline) hoverTimeline.kill();
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [
    isInitialized,
    storeActions,
    activeLetterIndex,
    isTransitioning,
    isHeroVisible,
    letterConfig,
    sectionMoodMap,
    letterRefs,
  ]);

  // Letter click handler
  const handleLetterClick = useCallback(
    (letterIndex, targetSection) => {
      if (isTransitioning) {
        console.log(`🎬 Hero [${heroId.current}]: Click ignored - transitioning`);
        return;
      }

      const config = letterConfig[letterIndex];
      const targetMood = sectionMoodMap[targetSection];
      console.log(
        `🎬 Hero [${heroId.current}]: 🎭 Letter click: ${config.letter} → ${targetSection}`
      );

      setIsTransitioning(true);

      // Letter feedback animation
      const targetLetter = letterRefs[letterIndex].current;
      if (targetLetter) {
        gsap
          .timeline()
          .to(targetLetter, {
            scaleX: 1.12,
            scaleY: 1.12,
            textShadow: `0 0 30px ${config.color}ff, 0 0 60px ${config.color}ff`,
            duration: 0.1,
            ease: 'power2.out',
          })
          .to(targetLetter, {
            scaleX: 1,
            scaleY: 1,
            duration: 0.2,
            ease: 'power2.out',
          });
      }

      // Trigger particle burst
      const rect = targetLetter?.getBoundingClientRect();
      if (rect) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const normalizedPos = {
          x: (centerX / window.innerWidth) * 2 - 1,
          y: -(centerY / window.innerHeight) * 2 + 1,
        };
        const burstIntensity = Math.min(config.intensity * 1.2, 0.4);
        storeActions.triggerParticleBurst(normalizedPos, burstIntensity, targetMood);
        storeActions.triggerLetterClick(letterIndex, targetSection);
      }

      // Navigation timeline
      const transitionTimeline = gsap.timeline({
        onComplete: () => {
          console.log(`🎬 Hero [${heroId.current}]: ✨ GSAP Scroll/Fade Transition complete`);
          setIsTransitioning(false);
        },
      });

      if (targetSection === 'hero') {
        // Navigate to hero (scroll to top)
        narrativeTransition.setMood('heroIntro', { duration: 1500 });
        storeActions.setSection('hero');
        transitionTimeline.to(window, {
          duration: 1.8,
          ease: 'power2.inOut',
          scrollTo: { y: 0, offsetY: 0, autoKill: true },
        });
      } else {
        // Navigate to other section
        narrativeTransition.setMood(targetMood, { duration: 2500 });
        transitionTimeline
          .to(heroContentRef.current, {
            opacity: 0,
            scale: 0.95,
            y: -20,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => setIsHeroVisible(false),
          })
          .call(() => storeActions.setSection(targetSection), null, '-=0.4')
          .to(
            window,
            {
              duration: 1.5,
              ease: 'power3.inOut',
              scrollTo: { y: `#${targetSection}`, offsetY: 80, autoKill: true },
            },
            '-=0.2'
          )
          .call(() => {
            const sectionElement = document.getElementById(targetSection);
            if (sectionElement) {
              const event = new CustomEvent('heroNavigationComplete', {
                detail: { targetSection, mood: targetMood, fromHero: true },
              });
              sectionElement.dispatchEvent(event);
            }
          });
      }
    },
    [letterRefs, storeActions, isTransitioning, letterConfig, sectionMoodMap, heroId]
  );

  // Hero visibility animation
  useEffect(() => {
    if (!heroContentRef.current) return;

    gsap.to(heroContentRef.current, {
      opacity: isHeroVisible ? 1 : 0,
      scale: isHeroVisible ? 1 : 0.95,
      y: isHeroVisible ? 0 : -20,
      duration: 0.8,
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

  // Enhanced scroll listener with performance optimization
  useEffect(() => {
    if (scrollListenerActive.current) return;
    scrollListenerActive.current = true;

    let ticking = false;
    let lastScrollY = window.scrollY;
    const SCROLL_THRESHOLD = 100;
    const DEBOUNCE_THRESHOLD = 16; // ~60fps

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;

        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Only process if scroll position changed significantly
          if (Math.abs(currentScrollY - lastScrollY) < 5) {
            ticking = false;
            return;
          }

          lastScrollY = currentScrollY;

          // Get current states inside rAF for freshest values
          const currentHeroVisible = isHeroVisible;
          const currentLocalTransitioning = isTransitioning;
          const narrativeState = narrativeTransition.getTransitionState();

          // Enhanced debugging (uncomment for detailed logs)
          // console.log(
          //   `🎬 Hero Scroll Debug: scrollY=${currentScrollY.toFixed(0)}, ` +
          //   `heroVisible=${currentHeroVisible}, localTransition=${currentLocalTransitioning}, ` +
          //   `narrativeTransition=${narrativeState.isTransitioning}`
          // );

          // Hero reappear logic
          if (
            !currentHeroVisible &&
            !currentLocalTransitioning &&
            !narrativeState.isTransitioning &&
            currentScrollY < SCROLL_THRESHOLD
          ) {
            console.log(
              `🎬 Hero [${heroId.current}]: 📜 Scroll-triggered reappear (scrollY: ${currentScrollY.toFixed(0)})`
            );

            setIsHeroVisible(true);

            // Corrected lines for Hero.jsx:
            const currentMoodName = narrativeTransition.getMood(); // Use the existing getMood() method
            if (currentMoodName !== 'heroIntro') {
              console.log(
                `🎬 Hero [${heroId.current}]: 🎭 Setting mood to heroIntro via scroll (current: ${currentMoodName})`
              );
              narrativeTransition.setMood('heroIntro', { duration: 1000 });
            }

            // Update store section if needed
            const currentStoreSection = useInteractionStore.getState().currentSection;
            if (currentStoreSection !== 'hero') {
              storeActions.setSection('hero');
            }
          }

          // Optional: Auto-hide when scrolled far down (uncomment if desired)
          else if (
            currentHeroVisible &&
            !currentLocalTransitioning &&
            !narrativeState.isTransitioning &&
            currentScrollY > window.innerHeight * 1.5
          ) {
            console.log(`🎬 Hero [${heroId.current}]: 📜 Auto-hide on far scroll`);
            setIsHeroVisible(false);
          }

          ticking = false;
        });
      }
    };

    console.log(`🎬 Hero [${heroId.current}]: 📜 Activating scroll listener`);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      console.log(`🎬 Hero [${heroId.current}]: 📜 Deactivating scroll listener`);
      window.removeEventListener('scroll', handleScroll);
      scrollListenerActive.current = false;
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
          aria-label="MC3V Interactive Navigation"
        >
          {letterConfig.map((config, index) => {
            const ref = letterRefs[index];
            return (
              <span
                key={config.letter}
                ref={ref}
                className="inline-block font-black cursor-pointer select-none"
                style={{
                  fontSize: 'clamp(3rem, 15vw, 16rem)',
                  lineHeight: 0.8,
                  color: config.color,
                  textShadow: `0 0 10px ${config.color}aa, 0 0 20px ${config.color}77, 0 0 30px ${config.color}44`,
                  userSelect: 'none',
                  willChange: 'transform, opacity',
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
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl mb-6 font-medium leading-relaxed"
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
            }}
          >
            Beyond code and design lies vision, collaboration, transformation.
          </p>

          {activeLetterIndex >= 0 && (
            <div
              className="text-sm md:text-base animate-pulse font-medium"
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
              className="text-xs md:text-sm mt-4 animate-pulse font-medium"
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
