// src/sections/Hero.jsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap'; // Import GSAP

/**
 * The Hero section component - Using arbitrary values for font size
 * and re-adding the subtitle with animation.
 */
function Hero() {
  const sectionRef = useRef(null);
  const lettersContainerRef = useRef(null);
  const subtitleRef = useRef(null); // <-- Re-add ref for the subtitle

  // GSAP Entrance Animation
  useEffect(() => {
    let tl; // Define timeline variable in the effect's scope
    const letters = lettersContainerRef.current?.children;
    const subtitle = subtitleRef.current; // Get subtitle element

    // Ensure targets exist and GSAP is available
    if (letters && letters.length > 0 && subtitle && gsap) {
      // Set the final state (visible) for all elements immediately
      gsap.set([letters, subtitle], { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });

      // Create the timeline
      tl = gsap.timeline();

      // Stagger animation for letters first
      tl.from(letters, {
        autoAlpha: 0,
        y: 80,
        scale: 0.8,
        rotation: -10,
        duration: 1.0,
        ease: 'power4.out',
        stagger: 0.15,
      })
        // Then animate the subtitle, starting slightly before the letters finish
        .from(
          subtitle,
          {
            // <-- Re-add subtitle animation
            autoAlpha: 0, // Fade in
            y: 30, // Slide up slightly
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.6'
        ); // Position parameter: Start 0.6s before the end of the letter animation

      console.log('Hero component mounted, stagger & subtitle animation triggered.');
    } else {
      console.log('Hero mount: GSAP targets not ready yet.');
    }

    // Cleanup function
    return () => {
      if (tl) {
        console.log('Cleaning up Hero animation timeline.');
        tl.kill();
      }
    };
  }, []); // Runs once on mount

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center text-center relative overflow-hidden px-4 py-20 bg-gradient-to-b from-sky-200/60 via-sky-100/40 to-transparent"
    >
      {/* Content Wrapper */}
      <div className="relative z-20 max-w-4xl w-full">
        {/* Container for the letters */}
        <div
          ref={lettersContainerRef}
          className="letters-container flex justify-center items-baseline space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4"
          aria-label="MC3V"
        >
          {/* Using ARBITRARY VALUE Tailwind classes for font size */}
          <span
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white"
            style={{ color: '#ff00ff' }}
          >
            M
          </span>
          <span
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white"
            style={{ color: '#ff00ff' }}
          >
            C
          </span>
          <span
            className="inline-block text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-extrabold text-white"
            style={{ color: '#ff66ff' }}
          >
            3
          </span>
          <span
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

        {/* TODO: Implement Scroll Indicator animation */}
      </div>
    </section>
  );
}

export default Hero;
