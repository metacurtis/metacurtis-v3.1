// src/sections/Hero.jsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * The Hero section component - Added GSAP magnetic hover effect to letters
 * and re-added subtitle with animation.
 */
function Hero() {
  const sectionRef = useRef(null);
  const lettersContainerRef = useRef(null);
  // Refs for individual letters
  const mRef = useRef(null);
  const cRef = useRef(null);
  const ref3 = useRef(null);
  const vRef = useRef(null);
  const letterRefs = [mRef, cRef, ref3, vRef];
  // Ref for the subtitle
  const subtitleRef = useRef(null); // <-- Re-added subtitle ref

  // GSAP Entrance Animation & Magnetic Effect Setup
  useEffect(() => {
    let mainTl;
    const letters = lettersContainerRef.current?.children;
    const subtitle = subtitleRef.current; // <-- Get subtitle element

    // --- Entrance Animation ---
    // Updated condition to include subtitle
    if (letters && letters.length > 0 && subtitle && gsap) {
      // Set initial final states for letters AND subtitle
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
        // Re-add subtitle animation to the timeline
        .from(
          subtitle,
          {
            autoAlpha: 0,
            y: 30,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.6'
        ); // Start overlapping with letter animation end

      console.log('Hero component mounted, entrance animations triggered.');
    } else {
      console.log('Hero mount: Entrance animation targets not ready yet.');
    }

    // --- Magnetic Effect Setup ---
    const setters = letterRefs
      .map(ref => {
        // Check if ref.current exists before creating setter
        if (!ref.current) return null;
        return {
          x: gsap.quickSetter(ref.current, 'x', 'px'),
          y: gsap.quickSetter(ref.current, 'y', 'px'),
        };
      })
      .filter(Boolean); // Filter out nulls if any ref is not ready

    const handleMouseMove = event => {
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      letterRefs.forEach((ref, index) => {
        // Ensure ref and corresponding setter exist
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
      console.log('Cleaning up Hero component...');
      if (mainTl) {
        console.log('Killing entrance timeline.');
        mainTl.kill();
      }
      window.removeEventListener('mousemove', handleMouseMove);
      console.log('Mousemove listener removed.');
      letterRefs.forEach(ref => {
        if (ref.current) {
          gsap.to(ref.current, { x: 0, y: 0, duration: 0.2 });
        }
      });
      // Ensure subtitle also resets if needed (though set should handle it)
      // if (subtitleRef.current) {
      //   gsap.set(subtitleRef.current, { x: 0, y: 0, autoAlpha: 1 });
      // }
    };
  }, []); // Runs once on mount

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
          {/* Using ARBITRARY VALUE Tailwind classes for font size */}
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

        {/* --- Subtitle Added Back Below --- */}
        <p
          ref={subtitleRef} // Assign ref
          // Added margin-top, responsive text size, color, and initial hidden state for animation
          className="mt-6 md:mt-8 text-lg sm:text-xl lg:text-2xl text-slate-300 opacity-0"
          style={{ visibility: 'hidden' }} // Ensure hidden before JS/GSAP runs
        >
          Digital Experience Creator
        </p>
        {/* --- End Subtitle --- */}
      </div>
    </section>
  );
}

export default Hero;
