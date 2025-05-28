// src/sections/Hero.jsx
import { useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useInteractionStore } from '@/stores/useInteractionStore';
import { useNarrativeStore } from '@/stores/useNarrativeStore'; // Add narrative store

// Register ScrollToPlugin
gsap.registerPlugin(ScrollToPlugin);

/**
 * The Hero section component - Letters trigger particle effects and scroll to sections
 */
function Hero() {
  const sectionRef = useRef(null);
  const lettersContainerRef = useRef(null);
  const mRef = useRef(null);
  const cRef = useRef(null);
  const ref3 = useRef(null);
  const vRef = useRef(null);
  const letterRefs = useMemo(() => [mRef, cRef, ref3, vRef], []);
  const subtitleRef = useRef(null);
  const _isScrolling = useRef(false); // Debouncing ref (prefixed to indicate intentional unused)

  // Get store actions
  const { addInteractionEvent } = useInteractionStore();
  const { setMood } = useNarrativeStore();

  // Section to mood mapping for narrative particle system
  const sectionMoodMap = {
    hero: 'heroIntro',
    about: 'narrativeCalm',
    projects: 'narrativeExcited',
    contact: 'narrativeTriumph',
  };

  // GSAP Entrance Animation & Magnetic Effect Setup
  useEffect(() => {
    let mainTl;
    const letters = lettersContainerRef.current?.children;
    const subtitle = subtitleRef.current;

    // --- Entrance Animation ---
    if (letters && letters.length > 0 && subtitle && gsap) {
      gsap.set([letters, subtitle], { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });
      mainTl = gsap.timeline();
      mainTl
        .from(letters, {
          autoAlpha: 0,
          y: 80,
          scale: 0.8,
          rotation: -10,
          duration: 1.0,
          ease: 'power4.out',
          stagger: 0.15,
        })
        .from(
          subtitle,
          {
            autoAlpha: 0,
            y: 30,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.6'
        );
      console.log('Hero component mounted, entrance animations triggered.');
    } else {
      console.log('Hero mount: Entrance animation targets not ready yet.');
    }

    // --- Magnetic Effect Setup ---
    const setters = letterRefs
      .map(ref => {
        if (!ref.current) return null;
        return {
          x: gsap.quickSetter(ref.current, 'x', 'px'),
          y: gsap.quickSetter(ref.current, 'y', 'px'),
        };
      })
      .filter(Boolean);

    const handleMouseMove = event => {
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      letterRefs.forEach((ref, index) => {
        if (!ref.current || !setters[index]) return;
        const rect = ref.current.getBoundingClientRect();
        const letterCenterX = rect.left + rect.width / 2;
        const letterCenterY = rect.top + rect.height / 2;
        const deltaX = letterCenterX - mouseX;
        const deltaY = letterCenterY - mouseY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = 300;
        const maxShift = 25;
        let shiftX = 0;
        let shiftY = 0;
        if (distance < maxDistance) {
          const pullFactor = (maxDistance - distance) / maxDistance;
          shiftX = -(deltaX * Math.pow(pullFactor, 3) * (maxShift / maxDistance));
          shiftY = -(deltaY * Math.pow(pullFactor, 3) * (maxShift / maxDistance));
        }
        setters[index].x(shiftX);
        setters[index].y(shiftY);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- Cleanup Function ---
    return () => {
      if (mainTl) {
        mainTl.kill();
      }
      window.removeEventListener('mousemove', handleMouseMove);
      letterRefs.forEach(ref => {
        if (ref.current) {
          gsap.to(ref.current, { x: 0, y: 0, duration: 0.2 });
        }
      });
    };
  }, [letterRefs]); // Added letterRefs back as dependency after memoization

  // --- Letter Click Handler with Particle Effects & Mood Transitions ---
  const handleLetterClick = (letterIndex, targetSection, letterElement) => {
    console.log(`Letter ${letterIndex} clicked - scrolling to: ${targetSection}`);

    // Get letter position for particle effect
    const rect = letterElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Convert screen coordinates to world space (approximate)
    const worldX = (centerX / window.innerWidth) * 20 - 10; // Scale to particle world space
    const worldY = -(centerY / window.innerHeight) * 12 + 6; // Invert Y and scale

    // Trigger enhanced particle effect with specific effect type
    addInteractionEvent({
      type: 'letterClick',
      effectType: 'letterSelect', // Specific visual effect style
      letterIndex,
      section: 'hero',
      position: { x: worldX, y: worldY, z: 0 },
      intensity: 1.8,
      targetSection,
      duration: 800, // Effect duration
    });

    // NARRATIVE MOOD TRANSITION - This is the magic!
    const targetMood = sectionMoodMap[targetSection];
    if (targetMood && targetMood !== 'heroIntro') {
      console.log(`Transitioning particle mood to: ${targetMood}`);
      setTimeout(() => {
        setMood(targetMood, { duration: 2000 }); // 2-second smooth transition
      }, 500); // Delay to let scroll animation start
    }

    // Scroll to target section
    scrollToSection(targetSection);
  };

  // --- ScrollTo Function ---
  const scrollToSection = sectionId => {
    console.log(`Scrolling to: ${sectionId}`);
    gsap.to(window, {
      duration: 1.5,
      ease: 'power3.inOut',
      scrollTo: {
        y: `#${sectionId}`,
        offsetY: 80,
      },
    });
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="fixed inset-0 flex flex-col justify-center items-center text-center"
      style={{
        background: 'transparent',
        width: '100vw',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 5, // Below navbar (z-50) but above particles (z-1)
      }}
    >
      {/* Centered Content Container */}
      <div className="relative z-20 max-w-6xl w-full flex flex-col items-center justify-center">
        {/* Letters Container - Perfectly Centered */}
        <div
          ref={lettersContainerRef}
          className="letters-container flex justify-center items-center space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8 mb-8"
          aria-label="MC3V Navigation"
        >
          {/* M - Home */}
          <span
            ref={mRef}
            className="inline-block text-[8rem] sm:text-[10rem] md:text-[12rem] lg:text-[14rem] xl:text-[16rem] font-extrabold text-white cursor-pointer transform transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              color: '#ff00ff',
              textShadow: '0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)',
              userSelect: 'none',
            }}
            onClick={e => handleLetterClick(0, 'hero', e.target)}
            title="Home"
          >
            M
          </span>

          {/* C - About */}
          <span
            ref={cRef}
            className="inline-block text-[8rem] sm:text-[10rem] md:text-[12rem] lg:text-[14rem] xl:text-[16rem] font-extrabold text-white cursor-pointer transform transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              color: '#ff00ff',
              textShadow: '0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)',
              userSelect: 'none',
            }}
            onClick={e => handleLetterClick(1, 'about', e.target)}
            title="About"
          >
            C
          </span>

          {/* 3 - Projects/Portfolio */}
          <span
            ref={ref3}
            className="inline-block text-[8rem] sm:text-[10rem] md:text-[12rem] lg:text-[14rem] xl:text-[16rem] font-extrabold text-white cursor-pointer transform transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              color: '#ff66ff',
              textShadow: '0 0 20px rgba(255, 102, 255, 0.5), 0 0 40px rgba(255, 102, 255, 0.3)',
              userSelect: 'none',
            }}
            onClick={e => handleLetterClick(2, 'projects', e.target)}
            title="Projects"
          >
            3
          </span>

          {/* V - Contact */}
          <span
            ref={vRef}
            className="inline-block text-[8rem] sm:text-[10rem] md:text-[12rem] lg:text-[14rem] xl:text-[16rem] font-extrabold text-white cursor-pointer transform transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              color: '#ff66ff',
              textShadow: '0 0 20px rgba(255, 102, 255, 0.5), 0 0 40px rgba(255, 102, 255, 0.3)',
              userSelect: 'none',
            }}
            onClick={e => handleLetterClick(3, 'contact', e.target)}
            title="Contact"
          >
            V
          </span>
        </div>

        {/* Subtitle - Centered */}
        <div className="flex flex-col items-center space-y-4">
          <p
            ref={subtitleRef}
            className="text-2xl sm:text-3xl lg:text-4xl text-slate-200 font-medium tracking-wide"
            style={{
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            Digital Experience Creator
          </p>

          {/* Navigation Hints */}
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm sm:text-base text-slate-300 opacity-80">
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
              <span className="font-bold text-pink-300">M</span> - Home
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
              <span className="font-bold text-pink-300">C</span> - About
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
              <span className="font-bold text-pink-300">3</span> - Projects
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
              <span className="font-bold text-pink-300">V</span> - Contact
            </span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-slate-300 opacity-60">
          <span className="text-sm mb-2">Click letters to navigate</span>
          <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-300 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
