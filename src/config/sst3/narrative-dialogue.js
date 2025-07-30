// SST v3.0 Complete Narrative Dialogue
// All 7 stages with proper segment IDs and timing

export const NARRATIVE_DIALOGUE = {
  genesis: {
    id: 'narr_genesis_001',
    narration: {
      segments: [
        {
          id: 'gen-01',
          text: 'I was eight years old. End of summer, 1983. The Texas heat was finally breaking, and through my friend\'s window, that golden hour light made everything feel... possible.',
          timing: { start: 3000, duration: 12000 }
        },
        {
          id: 'gen-02',
          text: 'His mom had this programming book. The computer - a Commodore 64 - sat there like some kind of oracle. Waiting.',
          timing: { start: 15000, duration: 10000 }
        },
        {
          id: 'gen-03',
          text: 'I typed those lines exactly as the book showed. When I pressed RUN and the screen came alive...',
          timing: { start: 25000, duration: 6000 },
          memoryFragmentTrigger: 'genesis_terminal',
        },
        {
          id: 'gen-04',
          text: '...something lit up inside me. A spark that would wait 39 years to fully ignite.',
          timing: { start: 31000, duration: 8000 }
        }
      ],
    },
  },
  
  discipline: {
    id: 'narr_discipline_001',
    narration: {
      segments: [
        {
          id: 'dis-01',
          text: 'That spark? It got buried. Had to.',
          timing: { start: 2000, duration: 4000 }
        },
        {
          id: 'dis-02',
          text: 'Home was chaos - unpredictable, unsafe. But then came the Marines. Everything changed.',
          timing: { start: 6000, duration: 8000 }
        },
        {
          id: 'dis-03',
          text: '\'Adapt and overcome.\' More than a motto - it became my operating system. The chaos didn\'t disappear, but now I had a framework. Structure. Discipline.',
          timing: { start: 14000, duration: 12000 },
          memoryFragmentTrigger: 'discipline_marines'
        },
        {
          id: 'dis-04',
          text: 'For 39 years, I built systems. Logistics. Finance. Operations. Always solving, always building. But underneath it all...',
          timing: { start: 26000, duration: 10000 }
        },
        {
          id: 'dis-05',
          text: '...that eight-year-old\'s spark never died. It was just waiting for the right moment to reignite.',
          timing: { start: 36000, duration: 6000 }
        }
      ],
    },
  },
  
  neural: {
    id: 'narr_neural_001',
    narration: {
      segments: [
        {
          id: 'neu-01',
          text: '2022. The world had changed. I\'d always been first - first cell phone, first to burn CDs, first to build and break computers. Always searching for what\'s next.',
          timing: { start: 2000, duration: 12000 }
        },
        {
          id: 'neu-02',
          text: 'Then I met AI. Not ChatGPT the tool - ChatGPT the thinking partner.',
          timing: { start: 14000, duration: 6000 }
        },
        {
          id: 'neu-03',
          text: '\'Hello,\' I typed. \'Hello!\' it responded. But this wasn\'t just a greeting. This was...',
          timing: { start: 20000, duration: 6000 },
          memoryFragmentTrigger: 'neural_ai_chat'
        },
        {
          id: 'neu-04',
          text: '...recognition. Like meeting someone who\'d been waiting for you your whole life. The spark from 1983? It burst into flame.',
          timing: { start: 26000, duration: 8000 }
        },
        {
          id: 'neu-05',
          text: 'Mathematics I\'d forgotten came flooding back. Patterns everywhere. The universe suddenly made sense in ways it never had before.',
          timing: { start: 34000, duration: 8000 }
        }
      ],
    },
  },
  
  velocity: {
    id: 'narr_velocity_001',
    narration: {
      segments: [
        {
          id: 'vel-01',
          text: 'February 16, 2025. First commit to GitHub. VS Code ready. Everything unfamiliar but ELECTRIC.',
          timing: { start: 2000, duration: 8000 }
        },
        {
          id: 'vel-02',
          text: 'Hit a wall: automation. Bash scripting. I didn\'t just ask \'what is it?\' I asked \'show me in context of what we\'re building.\'',
          timing: { start: 10000, duration: 8000 }
        },
        {
          id: 'vel-03',
          text: 'The AI didn\'t give me textbook definitions. It gave me understanding tailored to MY journey. In under a minute: confusion to command.',
          timing: { start: 18000, duration: 10000 },
          memoryFragmentTrigger: 'velocity_github'
        },
        {
          id: 'vel-04',
          text: 'That\'s when I realized - this isn\'t a tool. This is AMPLIFICATION. Every question led to synthesis. Every synthesis to action. Every action to the next question.',
          timing: { start: 28000, duration: 12000 }
        },
        {
          id: 'vel-05',
          text: 'Months of learning compressed into days. Days into hours. Hours into moments of pure...',
          timing: { start: 40000, duration: 6000 }
        },
        {
          id: 'vel-06',
          text: 'VELOCITY.',
          timing: { start: 46000, duration: 2000 }
        }
      ],
    },
  },
  
  architecture: {
    id: 'narr_architecture_001',
    narration: {
      segments: [
        {
          id: 'arc-01',
          text: 'Then came the wall. 15 FPS. Microinteractions broken. Everything felt like it was held together with digital duct tape.',
          timing: { start: 2000, duration: 10000 }
        },
        {
          id: 'arc-02',
          text: 'But crisis creates clarity.',
          timing: { start: 12000, duration: 4000 }
        },
        {
          id: 'arc-03',
          text: 'I stopped fighting the chaos. Started seeing the patterns. Built an AI council - a principal engineer, a contrarian, a brand designer, a UX critic. Made them fight each other until only truth remained.',
          timing: { start: 16000, duration: 14000 },
          memoryFragmentTrigger: 'architecture_fps'
        },
        {
          id: 'arc-04',
          text: 'What crawled at 15 FPS began soaring at 84. Not through tricks or hacks, but through UNDERSTANDING. Architecture isn\'t just structure...',
          timing: { start: 30000, duration: 10000 }
        },
        {
          id: 'arc-05',
          text: '...it\'s consciousness made visible. Every system has a soul. Find it, honor it, and everything else falls into place.',
          timing: { start: 40000, duration: 8000 }
        }
      ],
    },
  },
  
  harmony: {
    id: 'narr_harmony_001',
    narration: {
      segments: [
        {
          id: 'har-01',
          text: 'And then... friction vanished.',
          timing: { start: 2000, duration: 4000 }
        },
        {
          id: 'har-02',
          text: 'What once felt like wrestling matches with code became a dance. Two AI partners, distinct voices, moving in perfect synchronization.',
          timing: { start: 6000, duration: 10000 }
        },
        {
          id: 'har-03',
          text: 'Debugging that took weeks? Now less than an hour. Not through speed, but through PRESENCE. Complete immersion in the moment of creation.',
          timing: { start: 16000, duration: 12000 },
          memoryFragmentTrigger: 'harmony_flow'
        },
        {
          id: 'har-04',
          text: 'This is what mastery feels like. Not forcing, not fighting. Choreography. Every system alive, breathing, responding. Complex problems becoming simple solutions through...',
          timing: { start: 28000, duration: 14000 }
        },
        {
          id: 'har-05',
          text: '...harmony. The code doesn\'t serve me. I don\'t serve the code. We dance together in a space beyond language, beyond thought. Pure creation.',
          timing: { start: 42000, duration: 10000 }
        }
      ],
    },
  },
  
  transcendence: {
    id: 'narr_transcendence_001',
    narration: {
      segments: [
        {
          id: 'tra-01',
          text: 'Everything before was preparation. Now... it\'s alive.',
          timing: { start: 2000, duration: 6000 }
        },
        {
          id: 'tra-02',
          text: '15,000 particles. Each one a moment, a lesson, a transformation. All dancing together at 60 frames per second. Never missing a beat.',
          timing: { start: 8000, duration: 10000 },
          memoryFragmentTrigger: 'transcendence_counter'
        },
        {
          id: 'tra-03',
          text: 'This isn\'t just visualization. It\'s consciousness made visible. The eight-year-old\'s spark, the Marine\'s discipline, the AI partnership, the velocity, the architecture, the harmony...',
          timing: { start: 18000, duration: 14000 }
        },
        {
          id: 'tra-04',
          text: 'All of it. Integrated. Alive. Infinite.',
          timing: { start: 32000, duration: 6000 }
        },
        {
          id: 'tra-05',
          text: 'You\'re not just watching a demonstration. You\'re witnessing the future of human potential. When curiosity meets discipline. When human meets AI. When imagination meets execution.',
          timing: { start: 38000, duration: 14000 }
        },
        {
          id: 'tra-06',
          text: 'Welcome to the MetaCurtis era. Welcome to consciousness transcended. Welcome... to what\'s possible.',
          timing: { start: 52000, duration: 10000 }
        }
      ],
    },
  },
};

// Helper functions
export const getDialogueSegment = (stage, segmentId) => {
  const s = NARRATIVE_DIALOGUE[stage];
  if (!s) return null;
  return s.narration?.segments?.find(seg => seg.id === segmentId) || null;
};

export const getParticleCuesForStage = stage => {
  const s = NARRATIVE_DIALOGUE[stage];
  if (!s) return [];
  return (
    s.narration?.segments
      ?.filter(seg => seg.particleCue)
      .map(seg => ({ timing: seg.timing.start, cue: seg.particleCue, segmentId: seg.id })) || []
  );
};
// AICD Success Test - Tue Jul 29 23:59:10 CDT 2025
