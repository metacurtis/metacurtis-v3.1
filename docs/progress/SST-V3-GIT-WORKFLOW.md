Day 1: Director Pattern & Core Theater
Morning Session 1: Director Infrastructure (45 min)
Create Director System
[ ] Create src/theater/events.js with event constants

JavaScript

// CURSOR_SHOW, TERMINAL_TYPE, SCREEN_FILL
// BUILD_EMERGENCE_BLUEPRINT, PARTICLES_EMERGED
// START_NARRATIVE, ENABLE_SCROLL
[ ] Create src/theater/TheaterDirector.js
[ ] Constructor with BeatBus
[ ] start() method with timeline
[ ] cancel() for cleanup
[ ] once() helper for promises
[ ] Prewarm method for assets
[ ] Test Director standalone: director.start()
[ ] Verify event emissions in console
[ ] Git commit: feat(theater): add Director pattern infrastructure

Create Opening Sequence Component (Reactive)
[ ] Create src/components/theater/OpeningSequence.jsx
[ ] Listen to Director signals (not self-timed)
[ ] Black screen phase
[ ] Cursor blink on CURSOR_SHOW
[ ] Terminal typing on TERMINAL_TYPE
[ ] Screen fill on SCREEN_FILL
[ ] Test with Director signals
[ ] Git commit: feat(theater): add reactive OpeningSequence component

Morning Session 2: Engine & Renderer Integration (45 min)
Engine Emergence Mode
[ ] Update src/engine/ConsciousnessEngine.js
[ ] Import theater events
[ ] Add BUILD_EMERGENCE_BLUEPRINT listener
[ ] Create emergence blueprint (particles from text positions)
[ ] Mark blueprint with mode: 'emergence'
[ ] Emit via BeatBus
[ ] Add prewarm listener for optimization
[ ] Test blueprint generation
[ ] Git commit: feat(engine): add emergence blueprint mode

Renderer Confirmation
[ ] Update src/components/webgl/WebGLBackground.jsx
[ ] Import theater events
[ ] Detect mode: 'emergence' blueprints
[ ] Add particle settlement detection
[ ] Emit PARTICLES_EMERGED when ready
[ ] Add 4-second fallback timeout
[ ] Test emergence → settled flow
[ ] Git commit: feat(renderer): add emergence confirmation

Morning Session 3: Theater Integration (45 min)
Wire Director to Theater
[ ] Update src/components/consciousness/ConsciousnessTheater.jsx
[ ] Import Director
[ ] Import OpeningSequence component
[ ] Start Director on mount
[ ] Cancel Director on unmount
[ ] Add Director status to debug overlay
[ ] Remove old opening code (lines 20-95)
[ ] Test complete flow: Opening → Emergence → Genesis
[ ] Git commit: refactor(theater): integrate Director pattern

Flow Verification
[ ] Terminal appears after 2 seconds
[ ] Text types with correct timing
[ ] Screen fills with "HELLO CURTIS"
[ ] Particles emerge FROM text (not fade)
[ ] Particles settle into Genesis formation
[ ] Narrative starts after particles settled
[ ] Scroll enables after narrative
[ ] Git commit: test: verify complete Director flow

Morning Session 4: Narrative System (1 hour)
Extract Narrative Components
[ ] Create src/components/theater/NarrativeDisplay.jsx
[ ] Listen for START_NARRATIVE signal
[ ] Extract NarrationOverlay from ConsciousnessTheater
[ ] Add typewriter effect
[ ] Stage-based content switching
[ ] Create src/data/narrative-dialogue.js
[ ] All 7 stage narratives from SST v3.0
[ ] Timing configurations
[ ] Wire to Director signals
[ ] Test narrative starts after particles
[ ] Git commit: feat(theater): add Director-controlled narrative

Afternoon Session 1: Memory Fragments (1 hour)
Create Fragment System
[ ] Create src/components/theater/MemoryFragments.jsx
[ ] Extract MemoryFragmentRenderer
[ ] Listen to scroll/time triggers
[ ] Coordinate with Director phase
[ ] Create fragment components:
[ ] Genesis: Commodore 64 (5%)
[ ] Discipline: Marine emblem (20%)
[ ] Neural: Chat interface (35%)
[ ] Velocity: GitHub graph (49%)
[ ] Architecture: FPS counter (63%)
[ ] Harmony: Live code (77%)
[ ] Transcendence: Particle count (92%)
[ ] Test triggers respect Director state
[ ] Git commit: feat(theater): add memory fragments system

Afternoon Session 2: Tier Behaviors & Polish (1 hour)
Shader Enhancements
[ ] Update vertex shader for tier behaviors
[ ] Tier 1: Drift from text positions
[ ] Tier 2: Orbital formation
[ ] Tier 3: Twinkle/pulse
[ ] Tier 4: Brain structure
[ ] Add emergence animation uniforms
[ ] Test visual distinction
[ ] Git commit: feat(shaders): add tier behaviors

Stage Transitions
[ ] Smooth morphing between stages
[ ] Narrative fade in/out timing
[ ] Audio crossfades (if implementing)
[ ] Test all 7 stage transitions
[ ] Git commit: feat(theater): polish stage transitions

Afternoon Session 3: Interaction & Debug (1 hour)
User Controls
[ ] Keyboard navigation (1-7, arrows, space)
[ ] Enable AFTER Director hands off
[ ] Mobile touch gestures
[ ] Debug key (D) for Director status
[ ] Test controls don't interfere with Director
[ ] Git commit: feat(interaction): add user controls

Debug & Monitoring
[ ] Add Director phase to debug overlay
[ ] BeatBus event logging
[ ] Performance metrics
[ ] Blueprint cache status
[ ] Git commit: feat(debug): add Director monitoring

Afternoon Session 4: Testing & Optimization (1 hour)
Performance Validation
[ ] 60+ FPS during all phases
[ ] No hitches during emergence
[ ] Smooth narrative appearance
[ ] Memory stable
[ ] Git commit: perf: optimize Director flow

Complete Flow Test
[ ] Opening sequence (8 seconds)
[ ] Emergence transition (3 seconds)
[ ] Genesis narrative starts
[ ] All 7 stages accessible
[ ] Memory fragments trigger
[ ] No console errors
[ ] Git commit: test: complete SST v3.0 validation

Day 2: Polish & Ship
Morning: Final Integration (2 hours)
[ ] Audio system integration with Director
[ ] Loading/prewarming optimization
[ ] Error boundaries
[ ] Final bug fixes
[ ] Git commit: polish: final SST v3.0 adjustments

Afternoon: Build & Deploy (2 hours)
[ ] Run all tests
[ ] Production build
[ ] Deploy to staging
[ ] Final validation
[ ] Tag v3.0.0
[ ] Deploy to production
[ ] Git commit: release: SST v3.0 with Director pattern

Success Criteria
[ ] Director controls all timing
[ ] Seamless opening → emergence → narrative
[ ] Particles emerge FROM text
[ ] 60+ FPS throughout
[ ] All SST v3.0 features working
[ ] Zero console errors
[ ] Clean, maintainable architecture
