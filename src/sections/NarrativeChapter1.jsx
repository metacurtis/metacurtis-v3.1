// src/sections/NarrativeChapter1.jsx
// First narrative section with mood switching demo

import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNarrativeStore } from '@/stores/useNarrativeStore';

gsap.registerPlugin(ScrollTrigger);

function NarrativeChapter1() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  // Add throttling for mood changes
  const lastMoodChangeRef = useRef(0);
  const MOOD_CHANGE_THROTTLE = 1000; // 1 second minimum between mood changes

  // Get narrative mood actions
  const setNarrativeMood = useNarrativeStore(s => s.setNarrativeMood);
  const currentMood = useNarrativeStore(s => s.currentMood);
  const isTransitioning = useNarrativeStore(s => s.isTransitioning);

  // Throttled mood change function (wrapped in useCallback)
  const throttledMoodChange = useCallback(
    (moodName, options = {}) => {
      const now = Date.now();
      if (now - lastMoodChangeRef.current < MOOD_CHANGE_THROTTLE) {
        return; // Skip if too soon
      }

      lastMoodChangeRef.current = now;
      console.log(`🎨 NarrativeChapter1: THROTTLED mood change to ${moodName}`);
      setNarrativeMood(moodName, options);
    },
    [setNarrativeMood]
  );

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const title = titleRef.current;
    const subtitle = subtitleRef.current;

    if (!section || !content || !title || !subtitle) return;

    console.log('🎭 NarrativeChapter1: Setting up scroll triggers');

    // Initial state - hidden
    gsap.set([title, subtitle], {
      opacity: 0,
      y: 50,
      scale: 0.9,
    });

    // MOOD CHANGE: When section enters viewport, switch to calm mood
    const moodTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 80%', // Start earlier but with throttling
      end: 'bottom 20%', // End later
      onEnter: () => {
        throttledMoodChange('narrativeCalm', {
          duration: 3.0,
          easing: 'smooth',
        });
      },
      onLeave: () => {
        throttledMoodChange('heroIntro', {
          duration: 2.0,
          easing: 'smooth',
        });
      },
      onEnterBack: () => {
        throttledMoodChange('narrativeCalm', {
          duration: 2.0,
          easing: 'smooth',
        });
      },
      onLeaveBack: () => {
        throttledMoodChange('heroIntro', {
          duration: 2.0,
          easing: 'smooth',
        });
      },
      markers: process.env.NODE_ENV === 'development', // Show markers in dev
    });

    // CONTENT ANIMATION: Fade in content when section is visible
    const contentTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      end: 'bottom 30%',
      onEnter: () => {
        console.log('📝 NarrativeChapter1: Animating content in');

        const tl = gsap.timeline();

        tl.to(title, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: 'power3.out',
        }).to(
          subtitle,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.0,
            ease: 'power3.out',
          },
          '-=0.6'
        );
      },
      onLeave: () => {
        console.log('📝 NarrativeChapter1: Animating content out');
        gsap.to([title, subtitle], {
          opacity: 0,
          y: -30,
          scale: 0.9,
          duration: 0.8,
          ease: 'power2.in',
        });
      },
      onEnterBack: () => {
        console.log('📝 NarrativeChapter1: Animating content back in');

        const tl = gsap.timeline();

        tl.to(title, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
        }).to(
          subtitle,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: 'power3.out',
          },
          '-=0.4'
        );
      },
      onLeaveBack: () => {
        console.log('📝 NarrativeChapter1: Animating content out (back)');
        gsap.to([title, subtitle], {
          opacity: 0,
          y: 50,
          scale: 0.9,
          duration: 0.8,
          ease: 'power2.in',
        });
      },
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 NarrativeChapter1: Cleaning up scroll triggers');
      moodTrigger.kill();
      contentTrigger.kill();
    };
  }, [throttledMoodChange]);

  return (
    <section
      id="narrative-chapter-1"
      ref={sectionRef}
      className="min-h-screen w-full flex flex-col justify-center items-center text-center relative"
      style={{ background: 'transparent' }}
    >
      {/* Subtle overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 pointer-events-none" />

      {/* Main content */}
      <div ref={contentRef} className="relative z-20 w-full max-w-4xl mx-auto px-4">
        <h2
          ref={titleRef}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
          style={{
            color: 'rgba(100, 200, 255, 0.9)', // Soft blue to match calm mood
            textShadow: `
              0 0 20px rgba(100, 200, 255, 0.5),
              0 0 40px rgba(100, 200, 255, 0.3),
              0 0 60px rgba(100, 200, 255, 0.1)
            `,
            opacity: 0,
          }}
        >
          Calm Waters
        </h2>

        <p
          ref={subtitleRef}
          className="text-xl md:text-2xl lg:text-3xl mb-8 leading-relaxed"
          style={{
            color: 'rgba(150, 220, 255, 0.8)',
            textShadow: '0 0 10px rgba(150, 220, 255, 0.3)',
            opacity: 0,
          }}
        >
          Watch as the particles shift from vibrant energy
          <br />
          to peaceful, flowing movements.
          <br />
          <span className="text-lg opacity-70 mt-4 block">
            Scroll slowly to see the mood transition in real-time.
          </span>
        </p>

        {/* Debug info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-black/20 rounded-lg border border-white/10">
            <div className="text-sm text-white/70">
              <p>
                <strong>Current Mood:</strong> {currentMood}
              </p>
              <p>
                <strong>Transitioning:</strong> {isTransitioning ? 'Yes' : 'No'}
              </p>
              <p className="mt-2 text-xs">Expected: Pink/Purple particles → Blue/Green particles</p>
            </div>
          </div>
        )}

        {/* Interactive hint */}
        <div className="mt-12">
          <div
            className="inline-block px-6 py-3 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm"
            style={{
              animation: 'pulse 2s infinite',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <span className="text-sm">
              🌊 Narrative Mood:{' '}
              <strong>{currentMood === 'narrativeCalm' ? 'Calm' : 'Default'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Animated scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          style={{ animation: 'pulse 2s infinite' }}
        >
          <div
            className="w-1 h-3 bg-white/50 rounded-full mt-2"
            style={{
              animation: 'bounce 2s infinite',
              animationDelay: '0.5s',
            }}
          />
        </div>
      </div>

      {/* Add some CSS animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>
    </section>
  );
}

export default NarrativeChapter1;
