// NarrativeSection.jsx - Interactive narrative section with mood changes
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNarrativeStore } from '@/stores/useNarrativeStore';
import { useInteractionStore } from '@/stores/useInteractionStore';

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

/**
 * Interactive narrative section that changes particle moods and creates events
 */
export function NarrativeSection({
  id = 'narrative-demo',
  title = 'The Journey Begins',
  subtitle = 'Watch the particles respond to the story',
  className = '',
}) {
  const sectionRef = useRef();
  const contentRef = useRef();
  const [isVisible, setIsVisible] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(0);

  // Store access
  const { setMood, setCurrentSection } = useNarrativeStore();
  const { addInteractionEvent } = useInteractionStore();

  // Story chapters with corresponding moods
  const storyChapters = [
    {
      text: 'In the beginning, there was stillness...',
      mood: 'narrativeCalm',
      color: 'text-emerald-300',
      eventType: 'atmosphereChange',
    },
    {
      text: 'Suddenly, energy burst forth across the void!',
      mood: 'narrativeExcited',
      color: 'text-red-400',
      eventType: 'energyBurst',
    },
    {
      text: 'Mysteries unfold in the dancing lights...',
      mood: 'narrativeMystery',
      color: 'text-purple-400',
      eventType: 'mysticalFlow',
    },
    {
      text: 'And finally, triumph echoes through eternity!',
      mood: 'narrativeTriumph',
      color: 'text-yellow-400',
      eventType: 'victoryExplosion',
    },
  ];

  // Set up scroll trigger and section tracking
  useEffect(() => {
    if (!sectionRef.current) return;

    const section = sectionRef.current;

    // Entry animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        end: 'bottom 20%',
        onEnter: () => {
          setIsVisible(true);
          setCurrentSection('narrative-demo');
          setMood('narrativeCalm'); // Start with calm mood
        },
        onLeave: () => {
          setIsVisible(false);
          setMood('heroIntro'); // Return to default
        },
        onEnterBack: () => {
          setIsVisible(true);
          setCurrentSection('narrative-demo');
        },
        onLeaveBack: () => {
          setIsVisible(false);
          setMood('heroIntro');
        },
      },
    });

    // Animate content in
    tl.fromTo(
      contentRef.current,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power2.out',
      }
    );

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger === section) {
          trigger.kill();
        }
      });
    };
  }, [setMood, setCurrentSection]);

  // Handle chapter progression
  const triggerNextChapter = () => {
    const nextChapter = (currentChapter + 1) % storyChapters.length;
    const chapter = storyChapters[nextChapter];

    setCurrentChapter(nextChapter);
    setMood(chapter.mood);

    // Create particle event based on chapter
    const eventPosition = [
      (Math.random() - 0.5) * 4, // Random X
      (Math.random() - 0.5) * 3, // Random Y
      (Math.random() - 0.5) * 2, // Random Z
    ];

    addInteractionEvent({
      type: chapter.eventType,
      position: eventPosition,
      intensity: 0.8 + Math.random() * 0.4,
      originSection: 'narrative-demo',
      mood: chapter.mood,
    });
  };

  // Auto-progress chapters
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      triggerNextChapter();
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [isVisible, currentChapter]);

  // Handle manual interactions
  const handleStoryClick = event => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 4;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -3; // Inverted Y

    addInteractionEvent({
      type: 'narrativeClick',
      position: [x, y, 0],
      intensity: 0.6,
      originSection: 'narrative-demo',
    });
  };

  const currentChapterData = storyChapters[currentChapter];

  return (
    <section
      id={id}
      ref={sectionRef}
      className={`min-h-screen flex items-center justify-center relative ${className}`}
    >
      <div ref={contentRef} className="container mx-auto px-6 text-center max-w-4xl">
        {/* Title */}
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">{title}</h2>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-300 mb-12">{subtitle}</p>

        {/* Interactive Story Area */}
        <div
          className="bg-black/30 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/10 cursor-pointer transition-all duration-300 hover:bg-black/40 hover:border-white/20"
          onClick={handleStoryClick}
        >
          {/* Chapter Counter */}
          <div className="text-sm text-gray-400 mb-4">
            Chapter {currentChapter + 1} of {storyChapters.length}
          </div>

          {/* Story Text */}
          <p
            className={`text-2xl md:text-3xl font-light leading-relaxed ${currentChapterData.color} transition-colors duration-1000`}
          >
            {currentChapterData.text}
          </p>

          {/* Interaction Hint */}
          <div className="mt-8 text-gray-400 text-sm">
            Click anywhere in this area to create particle bursts
          </div>
        </div>

        {/* Manual Controls */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {storyChapters.map((chapter, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentChapter(index);
                setMood(chapter.mood);
              }}
              className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                currentChapter === index
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {chapter.mood.replace('narrative', '')}
            </button>
          ))}
        </div>

        {/* Status Indicator */}
        <div className="mt-8 text-xs text-gray-500">
          Current Mood: <span className={currentChapterData.color}>{currentChapterData.mood}</span>
        </div>
      </div>
    </section>
  );
}
