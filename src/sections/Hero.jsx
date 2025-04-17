// src/sections/Hero.jsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * The Hero section component - Fixed useEffect dependency warning.
 */
function Hero() {
  const sectionRef = useRef(null);
  const lettersContainerRef = useRef(null);
  const mRef = useRef(null);
  const cRef = useRef(null);
  const ref3 = useRef(null);
  const vRef = useRef(null);
  // Define letterRefs array - stable reference across renders in this case
  const letterRefs = [mRef, cRef, ref3, vRef];
  const subtitleRef = useRef(null);

  // GSAP Entrance Animation & Magnetic Effect Setup
  useEffect(() => {
    let mainTl;
    // Note: Accessing .current inside useEffect is fine
    const letters = lettersContainerRef.current?.children;
    const subtitle = subtitleRef.current;

    // --- Magnetic Effect Setup ---
    // Create setters only if refs are valid
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

      // Use letterRefs from outer scope here
      letterRefs.forEach((ref, index) => {
        if (!ref.current || !setters[index]) return; // Check setter exists too

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
        // Use setter from outer scope
        setters[index].x(shiftX);
        setters[index].y(shiftY);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    console.log('Adding mousemove listener for magnetic effect.');

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

    // --- Cleanup Function ---
    return () => {
      console.log('Cleaning up Hero component...');
      if (mainTl) {
        console.log('Killing entrance timeline.');
        mainTl.kill();
      }
      window.removeEventListener('mousemove', handleMouseMove);
      console.log('Mousemove listener removed.');
      // Use letterRefs from outer scope here for cleanup
      letterRefs.forEach(ref => {
        if (ref.current) {
          gsap.to(ref.current, { x: 0, y: 0, duration: 0.2 });
        }
      });
    };
    // --- End Cleanup Function ---
  }, [letterRefs]); // <-- Added letterRefs to dependency array

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
          {/* Assign refs to each letter span */}
          <span
            ref={mRef}
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white"
            style={{ color: '#ff00ff' }}
          >
            M
          </span>
          <span
            ref={cRef}
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white"
            style={{ color: '#ff00ff' }}
          >
            C
          </span>
          <span
            ref={ref3}
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white"
            style={{ color: '#ff66ff' }}
          >
            3
          </span>
          <span
            ref={vRef}
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white"
            style={{ color: '#ff66ff' }}
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
