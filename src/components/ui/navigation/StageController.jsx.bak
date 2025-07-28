// src/components/webgl/narrative/StageController.jsx
// ENHANCED STAGE CONTROLLER - Threshold triggers + velocity-driven animation
// Added: Once-only narrative events, scroll velocity animation scaling

import { useEffect, useRef } from 'react';
import { useNarrativeStore } from '@/stores/narrativeStore';
import { narrativeTransition } from '@/config/narrativeParticleConfig';

export default function StageController() {
  const {
    setGlobalProgress,
    setStage,
    currentStage,
    updateEngagement,
    isStageFeatureEnabled,
    getNarrativeSnapshot,
  } = useNarrativeStore();

  const lastScrollTime = useRef(0);
  const scrollVelocity = useRef(0);

  // ⚡ B. THRESHOLD-BASED TRIGGERS - Once-only narrative events
  const stageReached = useRef({
    structure: false, // 20% - Memory fragments unlock
    learning: false, // 40% - MetaCurtis awakening
    building: false, // 60% - AI voice activation
    mastery: false, // 80% - Full consciousness, contact portal
    transcendence: false, // 95% - Services transition
  });

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = Math.min(scrollTop / Math.max(scrollHeight, 1), 1);

      // ⚡ C. SCROLL VELOCITY CALCULATION for animation scaling
      const now = performance.now();
      const deltaTime = now - lastScrollTime.current;
      const deltaScroll = Math.abs(scrollTop - (lastScrollTime.scrollTop || 0));
      const rawVelocity = deltaTime > 0 ? deltaScroll / deltaTime : 0;

      // Smooth velocity with exponential decay
      scrollVelocity.current = scrollVelocity.current * 0.8 + rawVelocity * 0.2;

      lastScrollTime.current = now;
      lastScrollTime.scrollTop = scrollTop;

      // Update narrative state
      setGlobalProgress(scrollProgress);

      // Calculate target stage based on scroll position
      const targetStage = Math.floor(scrollProgress * 6);
      const clampedTargetStage = Math.max(0, Math.min(5, targetStage));

      // Trigger stage change if needed
      if (clampedTargetStage !== currentStage) {
        const stageNames = ['genesis', 'awakening', 'structure', 'learning', 'building', 'mastery'];
        narrativeTransition.setStage(stageNames[clampedTargetStage]);
        setStage(clampedTargetStage);
      }

      // ⚡ B. THRESHOLD-BASED TRIGGERS - Once-only narrative events
      triggerNarrativeEvents(scrollProgress);

      // ⚡ C. UPDATE VELOCITY for shader animation scaling
      updateScrollVelocityEffects(scrollVelocity.current);

      // Update user engagement
      updateEngagement({
        hasScrolled: scrollProgress > 0.01,
        scrollVelocity: scrollVelocity.current,
      });

      ticking = false;
    };

    // ⚡ B. NARRATIVE EVENT TRIGGERS
    const triggerNarrativeEvents = progress => {
      // Structure stage (20%) - Memory fragments unlock
      if (progress > 0.2 && !stageReached.current.structure) {
        stageReached.current.structure = true;
        console.log('🧠 Narrative Event: Memory fragments unlocked');

        // Trigger memory fragment unlock animation
        if (isStageFeatureEnabled('memoryFragments')) {
          triggerMemoryFragmentUnlock();
        }
      }

      // Learning stage (40%) - MetaCurtis awakening
      if (progress > 0.4 && !stageReached.current.learning) {
        stageReached.current.learning = true;
        console.log('🤖 Narrative Event: MetaCurtis awakening');

        // Trigger MetaCurtis emergence
        if (isStageFeatureEnabled('metacurtisEmergence')) {
          triggerMetaCurtisAwakening();
        }
      }

      // Building stage (60%) - AI voice activation
      if (progress > 0.6 && !stageReached.current.building) {
        stageReached.current.building = true;
        console.log('🗣️ Narrative Event: MetaCurtis voice activated');

        // Trigger AI voice system
        if (isStageFeatureEnabled('metacurtisDialogue')) {
          triggerMetaCurtisVoice();
        }
      }

      // Mastery stage (80%) - Full consciousness + contact portal
      if (progress > 0.8 && !stageReached.current.mastery) {
        stageReached.current.mastery = true;
        console.log('🌟 Narrative Event: Digital mastery achieved');

        // Trigger full AI interaction + contact portal
        if (isStageFeatureEnabled('fullAIInteraction')) {
          triggerFullConsciousness();
        }

        if (isStageFeatureEnabled('contactPortal')) {
          triggerContactPortal();
        }
      }

      // Transcendence (95%) - Services transition
      if (progress > 0.95 && !stageReached.current.transcendence) {
        stageReached.current.transcendence = true;
        console.log('💼 Narrative Event: Services transition activated');

        triggerServicesTransition();
      }
    };

    // ⚡ C. SCROLL VELOCITY EFFECTS for shader animation
    const updateScrollVelocityEffects = velocity => {
      // Clamp velocity to reasonable range for shader uniforms
      const clampedVelocity = Math.max(0.2, Math.min(2.0, velocity * 0.1));

      // Update WebGL uniforms (will be consumed by WebGLBackground)
      if (window.narrativeVelocityController) {
        window.narrativeVelocityController.updateVelocity(clampedVelocity);
      }

      // Store for shader system access
      if (typeof window !== 'undefined') {
        window.currentScrollVelocity = clampedVelocity;
      }
    };

    // NARRATIVE EVENT HANDLERS
    const triggerMemoryFragmentUnlock = () => {
      // Dispatch custom event for memory fragment system
      window.dispatchEvent(
        new CustomEvent('narrativeEvent', {
          detail: { type: 'memoryFragmentsUnlocked', stage: 'structure' },
        })
      );
    };

    const triggerMetaCurtisAwakening = () => {
      // Dispatch MetaCurtis emergence event
      window.dispatchEvent(
        new CustomEvent('narrativeEvent', {
          detail: {
            type: 'metacurtisAwakening',
            stage: 'learning',
            message: 'The foundation was already there...',
          },
        })
      );
    };

    const triggerMetaCurtisVoice = () => {
      // Dispatch AI voice activation
      window.dispatchEvent(
        new CustomEvent('narrativeEvent', {
          detail: {
            type: 'metacurtisVoiceActivated',
            stage: 'building',
            message: "Architecture isn't just code - it's choreography",
          },
        })
      );
    };

    const triggerFullConsciousness = () => {
      // Dispatch full AI consciousness event
      window.dispatchEvent(
        new CustomEvent('narrativeEvent', {
          detail: {
            type: 'fullConsciousness',
            stage: 'mastery',
            message: "You've witnessed the journey. Now let's discuss your vision.",
          },
        })
      );
    };

    const triggerContactPortal = () => {
      // Dispatch contact portal activation
      window.dispatchEvent(
        new CustomEvent('narrativeEvent', {
          detail: { type: 'contactPortalActivated', stage: 'mastery' },
        })
      );
    };

    const triggerServicesTransition = () => {
      // Dispatch services transition
      window.dispatchEvent(
        new CustomEvent('narrativeEvent', {
          detail: { type: 'servicesTransition', stage: 'transcendence' },
        })
      );
    };

    // Initial scroll position check
    updateScrollProgress();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [setGlobalProgress, setStage, currentStage, updateEngagement, isStageFeatureEnabled]);

  // ⚡ C. VELOCITY CONTROLLER for shader integration
  useEffect(() => {
    // Create velocity controller for shader system integration
    if (typeof window !== 'undefined') {
      window.narrativeVelocityController = {
        updateVelocity: velocity => {
          // This will be consumed by WebGLBackground for shader uniforms
          const event = new CustomEvent('scrollVelocityUpdate', {
            detail: { velocity },
          });
          window.dispatchEvent(event);
        },
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.narrativeVelocityController;
        delete window.currentScrollVelocity;
      }
    };
  }, []);

  // Track time on page
  useEffect(() => {
    const startTime = Date.now();

    const updateTimeOnPage = () => {
      const timeOnPage = Date.now() - startTime;
      updateEngagement({ timeOnPage });
    };

    const interval = setInterval(updateTimeOnPage, 1000);

    return () => clearInterval(interval);
  }, [updateEngagement]);

  // Development keyboard shortcuts + velocity testing
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handleKeyDown = event => {
      // Only listen for number keys 0-5 with Ctrl modifier
      if (event.ctrlKey && event.key >= '0' && event.key <= '5') {
        const targetStage = parseInt(event.key);
        const stageNames = ['genesis', 'awakening', 'structure', 'learning', 'building', 'mastery'];

        narrativeTransition.jumpToStage(stageNames[targetStage]);
        setStage(targetStage);

        console.log(`🎮 Dev shortcut: Jumped to stage ${targetStage} (${stageNames[targetStage]})`);
        event.preventDefault();
      }

      // ⚡ Dev: Test velocity effects with Ctrl+V
      if (event.ctrlKey && event.key === 'v') {
        const testVelocity = Math.random() * 2;
        console.log(`🚀 Dev: Testing velocity effect: ${testVelocity.toFixed(2)}`);
        // TODO: remove or implement updateScrollVelocityEffects
        event.preventDefault();
      }

      // ⚡ Dev: Trigger narrative events with Ctrl+T
      if (event.ctrlKey && event.key === 't') {
        const snapshot = getNarrativeSnapshot();
        console.log('📊 Dev: Current narrative state:', snapshot);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setStage, getNarrativeSnapshot]);

  // This component doesn't render anything - it's just for logic
  return null;
}

// Export scroll utility functions for external use
export const scrollUtils = {
  // Programmatically scroll to a specific stage
  scrollToStage: stage => {
    const stageProgress = stage / 6;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScrollTop = stageProgress * scrollHeight;

    window.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    });
  },

  // Get current scroll progress
  getScrollProgress: () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.min(scrollTop / Math.max(scrollHeight, 1), 1);
  },

  // Get current stage based on scroll position
  getCurrentStageFromScroll: () => {
    const progress = scrollUtils.getScrollProgress();
    return Math.floor(progress * 6);
  },
};
// temp stub — remove when real helper exists

// temp stub — remove when real helper exists
