// src/sections/Hero.jsx
import { useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
// ScrollToPlugin is often needed for more complex targets or offsets,
// but basic ID targeting might work without explicit import/registration.
// If scrolling fails, uncomment the next two lines:
// import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
// gsap.registerPlugin(ScrollToPlugin);

/**
 * The Hero section component - Letters are now clickable for scrolling.
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

  // --- ScrollTo Function ---
  const scrollToSection = sectionId => {
    console.log(`Scrolling to: ${sectionId}`);
    gsap.to(window, {
      duration: 1.5, // Adjust duration as needed
      ease: 'power3.inOut', // Smooth easing
      scrollTo: {
        y: `#${sectionId}`, // Target the section ID
        offsetY: 80, // Optional: offset from the top (adjust for sticky navbar height)
      },
    });
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center text-center relative overflow-hidden px-4 py-20 bg-gradient-to-b from-sky-200/60 via-sky-100/40 to-transparent"
    >
      <div className="relative z-20 max-w-4xl w-full">
        <div
          ref={lettersContainerRef}
          className="letters-container flex justify-center items-baseline space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4"
          aria-label="MC3V"
        >
          {/* Added onClick handlers and cursor-pointer */}
          <span
            ref={mRef}
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white cursor-pointer" // Added cursor-pointer
            style={{ color: '#ff00ff' }}
            onClick={() => scrollToSection('hero')} // Example: M scrolls to Hero (top)
          >
            M
          </span>
          <span
            ref={cRef}
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white cursor-pointer" // Added cursor-pointer
            style={{ color: '#ff00ff' }}
            onClick={() => scrollToSection('about')} // Example: C scrolls to About
          >
            C
          </span>
          <span
            ref={ref3}
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white cursor-pointer" // Added cursor-pointer
            style={{ color: '#ff66ff' }}
            onClick={() => scrollToSection('features')} // Example: 3 scrolls to Features
          >
            3
          </span>
          <span
            ref={vRef}
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white cursor-pointer" // Added cursor-pointer
            style={{ color: '#ff66ff' }}
            onClick={() => scrollToSection('contact')} // Example: V scrolls to Contact
          >
            V
          </span>
        </div>
        <p
          ref={subtitleRef}
          className="mt-6 md:mt-8 text-lg sm:text-xl lg:text-2xl text-slate-300 opacity-0"
          style={{ visibility: 'hidden' }}
        >
          Digital Experience Creator
        </p>
      </div>
    </section>
  );
}

export default Hero;
