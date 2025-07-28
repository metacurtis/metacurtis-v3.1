// Add this to the existing ConsciousnessTheater.jsx after the imports

// Import our new narrative data
import { NARRATIVE_DIALOGUE, getDialogueAtTime } from '@/config/sst3/narrative-dialogue.js';

// In the component, replace the narrative timing effect (around line 300) with:
useEffect(() => {
  if (!isInitialized || openingPhase !== 'complete') return;
  
  // Reset timer when stage changes
  startTimeRef.current = Date.now();
  
  const timer = setInterval(() => {
    const elapsed = Date.now() - startTimeRef.current;
    setNarrativeTime(elapsed);
    
    // Get current stage narrative
    const stageNarrative = NARRATIVE_DIALOGUE[currentStage];
    if (!stageNarrative) return;
    
    // Find active segment
    const segment = stageNarrative.segments.find(seg => {
      const end = seg.start + seg.duration;
      return elapsed >= seg.start && elapsed < end;
    });
    
    if (segment && segment.id !== activeNarrative?.id) {
      console.log('🎭 Showing narrative:', segment.text);
      setActiveNarrative(segment);
      
      // Trigger memory fragment if specified
      if (segment.memoryTrigger) {
        console.log('💎 Triggering fragment:', segment.memoryTrigger);
        triggerFragment(segment.memoryTrigger);
      }
    } else if (!segment && activeNarrative) {
      setActiveNarrative(null);
    }
  }, 100);
  
  return () => clearInterval(timer);
}, [currentStage, isInitialized, openingPhase, activeNarrative, triggerFragment]);
