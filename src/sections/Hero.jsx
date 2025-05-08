// src/sections/Hero.jsx
import { useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
// If using scrollTo functionality, ensure the plugin is registered,
// ideally once globally (e.g., in App.jsx or main.jsx if possible).
// import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
// gsap.registerPlugin(ScrollToPlugin);

/**
 * The Hero section component - With GSAP animations re-enabled.
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

  // GSAP Entrance Animation & Magnetic Effect Setup (Re-enabled)
  useEffect(() => {
    let mainTl;
    const letters = lettersContainerRef.current?.children;
    const subtitle = subtitleRef.current;

    // Ensure targets are ready before animating
    if (letters && letters.length > 0 && subtitle && gsap) {
      // Optional: Set final state immediately to prevent flash, then animate from.
      // Depends on how initial CSS is set up. Test removing this if needed.
      // gsap.set([letters, subtitle], { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });

      mainTl = gsap.timeline();
      mainTl
        .from(letters, {
          autoAlpha: 0, // Animate from invisible
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
            autoAlpha: 0, // Animate from invisible
            y: 30,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.6' // Overlap animation start
        );
    } else {
      // Log warning if elements aren't ready - might indicate timing issue
      console.warn('Hero mount: GSAP animation targets not ready on initial mount.');
    }

    // --- Magnetic Effect Setup ---
    // Ensure refs are valid before creating setters to avoid errors
    const validRefs = letterRefs.filter(ref => ref.current);
    const setters = validRefs.map(ref => {
      return {
        x: gsap.quickSetter(ref.current, 'x', 'px'),
        y: gsap.quickSetter(ref.current, 'y', 'px'),
        ref: ref, // Include ref to access bounding box later
      };
    });

    const handleMouseMove = event => {
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      setters.forEach(setterData => {
        if (!setterData?.ref?.current) return; // Extra safety check

        const rect = setterData.ref.current.getBoundingClientRect();
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
          const pullFactor = Math.pow((maxDistance - distance) / maxDistance, 3); // Ease the pull
          shiftX = -(deltaX * pullFactor * (maxShift / maxDistance));
          shiftY = -(deltaY * pullFactor * (maxShift / maxDistance));
        }
        setterData.x(shiftX);
        setterData.y(shiftY);
      });
    };

    // Only add listener if magnetic effect targets were found
    if (setters.length > 0) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // --- Cleanup Function ---
    return () => {
      if (mainTl) {
        mainTl.kill(); // Important to kill GSAP timelines on unmount
      }
      if (setters.length > 0) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      // Reset letter positions smoothly on cleanup
      validRefs.forEach(ref => {
        if (ref.current) {
          gsap.to(ref.current, {
            x: 0,
            y: 0,
            duration: 0.3,
            ease: 'power1.out',
            overwrite: 'auto',
          });
        }
      });
    };
  }, [letterRefs]); // Dependency array is correct

  // --- ScrollTo Function ---
  const scrollToSection = sectionId => {
    // Check if ScrollToPlugin is registered/available
    if (gsap.plugins.scrollTo) {
      gsap.to(window, {
        duration: 1.5,
        ease: 'power3.inOut',
        scrollTo: {
          y: `#${sectionId}`, // Target section ID
          offsetY: 80, // Adjust if you have a sticky header of 80px height
        },
      });
    } else {
      console.warn('GSAP ScrollToPlugin not registered. Cannot scroll.');
      // Simple fallback:
      // const element = document.getElementById(sectionId);
      // if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      // Restore original Tailwind classes
      className="min-h-screen flex flex-col justify-center items-center text-center relative overflow-hidden px-4 py-20 bg-gradient-to-b from-sky-200/60 via-sky-100/40 to-transparent"
    >
      {/* Ensure container div uses Tailwind or styles needed for layout */}
      <div className="relative z-20 max-w-4xl w-full">
        <div
          ref={lettersContainerRef}
          className="letters-container flex justify-center items-baseline space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4"
          aria-label="MC3V"
        >
          {/* Restore full original spans with classes, refs, styles, onClick */}
          <span
            ref={mRef}
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white cursor-pointer"
            style={{ color: '#ff00ff' }}
            onClick={() => scrollToSection('hero')}
          >
            M
          </span>
          <span
            ref={cRef}
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white cursor-pointer"
            style={{ color: '#ff00ff' }}
            onClick={() => scrollToSection('about')}
          >
            C
          </span>
          <span
            ref={ref3}
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white cursor-pointer"
            style={{ color: '#ff66ff' }}
            onClick={() => scrollToSection('features')}
          >
            3
          </span>
          <span
            ref={vRef}
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white cursor-pointer"
            style={{ color: '#ff66ff' }}
            onClick={() => scrollToSection('contact')}
          >
            V
          </span>
        </div>
        <p
          ref={subtitleRef}
          // Restore original classes for styling AND initial state for GSAP .from() animation
          className="mt-6 md:mt-8 text-lg sm:text-xl lg:text-2xl text-slate-300 opacity-0"
          style={{ visibility: 'hidden' }} // Works with GSAP autoAlpha
        >
          Digital Experience Creator
        </p>
      </div>
    </section>
  );
}

export default Hero;
