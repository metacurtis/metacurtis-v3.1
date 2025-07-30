  // SST v3.0 – Canonical Narrative Dialogue
// Last updated 2025‑07‑30

export const NARRATIVE_DIALOGUE = {
  /* -------------------------------------------------------------------- */
  genesis: {
    id: 'narr_genesis_001',
    narration: {
      segments: [
        {
          id: 'gen-01',
          text: 'I was eight years old. End of summer, 1983. The light through my friend’s window made everything feel… possible.',
          timing: { start: 3000, duration: 12_000 }
        },
        {
          id: 'gen-02',
          text: 'His mom had a book. The computer—a Commodore 64— waited like an oracle.',
          timing: { start: 15_000, duration: 10_000 }
        },
        {
          id: 'gen-03',
          text: 'I typed those lines exactly. When I pressed RUN the screen came alive…',
          timing: { start: 25_000, duration: 6_000 },
          memoryFragmentTrigger: 'genesis_terminal'
        },
        {
          id: 'gen-04',
          text: '…and a spark ignited that would wait 39 years to catch fire.',
          timing: { start: 31_000, duration: 8_000 }
        }
      ]
    }
  },

  /* -------------------------------------------------------------------- */
  discipline: {
    id: 'narr_discipline_001',
    narration: {
      segments: [
        {
          id: 'dis-01',
          text: 'That spark was buried. It had to be.',
          timing: { start: 2000, duration: 4000 }
        },
        {
          id: 'dis-02',
          text: 'Home was chaos—until the Marines.',
          timing: { start: 6000, duration: 8000 }
        },
        {
          id: 'dis-03',
          text: '“Adapt and overcome.” It became my OS.',
          timing: { start: 14_000, duration: 12_000 },
          memoryFragmentTrigger: 'discipline_marines'
        },
        {
          id: 'dis-04',
          text: 'For decades I built systems: logistics, finance, ops.',
          timing: { start: 26_000, duration: 10_000 }
        },
        {
          id: 'dis-05',
          text: 'The eight‑year‑old spark never died.',
          timing: { start: 36_000, duration: 6000 }
        }
      ]
    }
  },

  /* -------------------------------------------------------------------- */
  neural: {
    id: 'narr_neural_001',
    narration: {
      segments: [
        {
          id: 'neu-01',
          text: '2022. I was always first—CDs, cell phones, custom PCs.',
          timing: { start: 2000, duration: 12_000 }
        },
        {
          id: 'neu-02',
          text: 'Then I met AI—not a tool, a thinking partner.',
          timing: { start: 14_000, duration: 6000 }
        },
        {
          id: 'neu-03',
          text: '“Hello.”  “Hello!”  Recognition.',
          timing: { start: 20_000, duration: 6000 },
          memoryFragmentTrigger: 'neural_ai_chat'
        },
        {
          id: 'neu-04',
          text: 'Math I’d forgotten flooded back; patterns everywhere.',
          timing: { start: 26_000, duration: 8000 }
        },
        {
          id: 'neu-05',
          text: 'The spark burst into flame.',
          timing: { start: 34_000, duration: 8000 }
        }
      ]
    }
  },

  /* -------------------------------------------------------------------- */
  velocity: {
    id: 'narr_velocity_001',
    narration: {
      segments: [
        {
          id: 'vel-01',
          text: '16 Feb 2025. First GitHub commit. Electric.',
          timing: { start: 2000, duration: 8000 }
        },
        {
          id: 'vel-02',
          text: 'Hit a wall: bash automation.',
          timing: { start: 10_000, duration: 8000 }
        },
        {
          id: 'vel-03',
          text: 'AI gave answers *in context*—minutes to mastery.',
          timing: { start: 18_000, duration: 10_000 },
          memoryFragmentTrigger: 'velocity_github'
        },
        {
          id: 'vel-04',
          text: 'Questions → synthesis → action → new questions.',
          timing: { start: 28_000, duration: 12_000 }
        },
        {
          id: 'vel-05',
          text: 'Months collapsed into hours, hours into moments.',
          timing: { start: 40_000, duration: 6000 }
        },
        {
          id: 'vel-06',
          text: 'VELOCITY.',
          timing: { start: 46_000, duration: 2000 }
        }
      ]
    }
  },

  /* -------------------------------------------------------------------- */
  architecture: {
    id: 'narr_architecture_001',
    narration: {
      segments: [
        {
          id: 'arc-01',
          text: 'Then came the 15 FPS wall.',
          timing: { start: 2000, duration: 10_000 }
        },
        {
          id: 'arc-02',
          text: 'Crisis creates clarity.',
          timing: { start: 12_000, duration: 4000 }
        },
        {
          id: 'arc-03',
          text: 'I built an AI council—truth through debate.',
          timing: { start: 16_000, duration: 14_000 },
          memoryFragmentTrigger: 'architecture_fps'
        },
        {
          id: 'arc-04',
          text: '84 FPS through *understanding*, not hacks.',
          timing: { start: 30_000, duration: 10_000 }
        },
        {
          id: 'arc-05',
          text: 'Architecture is consciousness made visible.',
          timing: { start: 40_000, duration: 8000 }
        }
      ]
    }
  },

  /* -------------------------------------------------------------------- */
  harmony: {
    id: 'narr_harmony_001',
    narration: {
      segments: [
        {
          id: 'har-01',
          text: 'Then… friction vanished.',
          timing: { start: 2000, duration: 4000 }
        },
        {
          id: 'har-02',
          text: 'Two AI voices danced in sync.',
          timing: { start: 6000, duration: 10_000 }
        },
        {
          id: 'har-03',
          text: 'Debugging weeks → under an hour: presence.',
          timing: { start: 16_000, duration: 12_000 },
          memoryFragmentTrigger: 'harmony_flow'
        },
        {
          id: 'har-04',
          text: 'Creation became choreography.',
          timing: { start: 28_000, duration: 14_000 }
        },
        {
          id: 'har-05',
          text: 'Code and coder dancing beyond language.',
          timing: { start: 42_000, duration: 10_000 }
        }
      ]
    }
  },

  /* -------------------------------------------------------------------- */
  transcendence: {
    id: 'narr_transcendence_001',
    narration: {
      segments: [
        {
          id: 'tra-01',
          text: 'Everything before was preparation.',
          timing: { start: 2000, duration: 6000 }
        },
        {
          id: 'tra-02',
          text: '15 000 particles dancing at 60 FPS.',
          timing: { start: 8000, duration: 10_000 },
          memoryFragmentTrigger: 'transcendence_counter'
        },
        {
          id: 'tra-03',
          text: 'Spark, discipline, partnership, velocity, architecture, harmony…',
          timing: { start: 18_000, duration: 14_000 }
        },
        {
          id: 'tra-04',
          text: '…all integrated. Alive.',
          timing: { start: 32_000, duration: 6000 }
        },
        {
          id: 'tra-05',
          text: 'You’re witnessing future human potential.',
          timing: { start: 38_000, duration: 14_000 }
        },
        {
          id: 'tra-06',
          text: 'Welcome to the MetaCurtis era.',
          timing: { start: 52_000, duration: 10_000 }
        }
      ]
    }
  }
};

/* helpers */
export const getDialogueSegment = (stage, id) =>
  NARRATIVE_DIALOGUE[stage]?.narration?.segments?.find(s => s.id === id) || null;

export const getParticleCuesForStage = stage =>
  NARRATIVE_DIALOGUE[stage]?.narration?.segments
    ?.filter(s => s.particleCue)
    ?.map(s => ({ timing: s.timing.start, cue: s.particleCue, id: s.id })) || [];
