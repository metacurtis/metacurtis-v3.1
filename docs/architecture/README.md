# SST v3.0 Architecture Overview

## Core Principles

1. **Single Source of Truth**: Atomic stores hold all state
2. **Unidirectional Data Flow**: Input → State → Events → Systems → Render
3. **Event-Driven Architecture**: BeatBus orchestrates all communication
4. **Modular Design**: Each system is independent and testable

## State Management

```
User Input
    ↓
StateController (only writer)
    ↓
Atomic Stores
    ↓
AtomicToBeatBus Bridge
    ↓
BeatBus Events
    ↓
All Systems Subscribe
```

## Module Structure

- `modules/orchestration/` - Event system
- `modules/state/` - State management
- `modules/webgl/` - Rendering
- `modules/theater/` - Main experience
- `modules/narrative/` - Story system
- `modules/memory/` - Fragment system
- `modules/camera/` - Choreography
- `modules/audio/` - Sound system
- `modules/effects/` - Visual polish

## Key Rules

1. ONLY StateController writes to atoms
2. ALL communication through BeatBus
3. NO circular dependencies
4. PURE functions where possible
