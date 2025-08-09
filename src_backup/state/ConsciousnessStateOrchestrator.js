// src/state/ConsciousnessStateOrchestrator.js
// Command Pattern with Atomic Execution for SST v3.0
// This orchestrates all state changes with perfect coordination

import BeatBus from '@modules/orchestration/core/BeatBus';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
import { EVENTS } from '@theater/events';
import { Canonical } from '@config/canonical/canonicalAuthority';

// Import all atoms
import { stageAtom } from '@stores/atoms/stageAtom';
import { qualityAtom } from '@stores/atoms/qualityAtom';
import { narrativeAtom } from '@stores/atoms/narrativeAtom';
import { performanceAtom } from '@stores/atoms/performanceAtom';
import { interactionAtom } from '@stores/atoms/interactionAtom';
import { resourceAtom } from '@stores/atoms/resourceAtom';

// SST v3.0 Stage Configurations
const SST_V3_STAGES = {
  genesis: {
    name: "Genesis Spark",
    particleCount: 2000,
    color: "#00FF00",
    colorNext: "#22c55e",
    brainRegion: "hippocampus",
    radius: 26,
    tierDistribution: [0.60, 0.20, 0.10, 0.10],
    narrative: "I was eight years old. End of summer, 1983..."
  },
  discipline: {
    name: "Discipline Forge",
    particleCount: 3000,
    color: "#1e40af",
    colorNext: "#3b82f6",
    brainRegion: "brainstem",
    radius: 18,
    tierDistribution: [0.55, 0.25, 0.10, 0.10],
    narrative: "That spark? It got buried. Had to..."
  },
  neural: {
    name: "Neural Awakening",
    particleCount: 5000,
    color: "#4338ca",
    colorNext: "#a855f7",
    brainRegion: "leftTemporal",
    radius: 28,
    tierDistribution: [0.55, 0.20, 0.15, 0.10],
    narrative: "2022. The world had changed. I'd always been first..."
  },
  velocity: {
    name: "Velocity Explosion",
    particleCount: 12000,
    color: "#7c3aed",
    colorNext: "#9333ea",
    brainRegion: "multiRegion",
    radius: 34,
    tierDistribution: [0.45, 0.20, 0.15, 0.20],
    narrative: "February 16, 2025. First commit to GitHub..."
  },
  architecture: {
    name: "Architecture Consciousness",
    particleCount: 8000,
    color: "#0891b2",
    colorNext: "#06b6d4",
    brainRegion: "frontalLobe",
    radius: 30,
    tierDistribution: [0.50, 0.20, 0.15, 0.15],
    narrative: "Then came the wall. 15 FPS. Microinteractions broken..."
  },
  harmony: {
    name: "Harmonic Mastery",
    particleCount: 12000,
    color: "#f59e0b",
    colorNext: "#d97706",
    brainRegion: "cerebellum",
    radius: 36,
    tierDistribution: [0.50, 0.20, 0.15, 0.15],
    narrative: "And then... friction vanished..."
  },
  transcendence: {
    name: "Consciousness Transcendence",
    particleCount: 15000,
    color: "#ffffff",
    colorNext: "#f59e0b",
    brainRegion: "consciousnessCore",
    radius: 42,
    tierDistribution: [0.50, 0.20, 0.15, 0.15],
    narrative: "Everything before was preparation. Now... it's alive..."
  }
};

/**
 * ConsciousnessStateOrchestrator
 * Central command center for all state changes
 */
class ConsciousnessStateOrchestrator {
  constructor() {
    if (ConsciousnessStateOrchestrator.instance) {
      return ConsciousnessStateOrchestrator.instance;
    }

    // Initialize state
    this.currentState = {
      stage: 'genesis',
      stageIndex: 0,
      quality: 'HIGH',
      morphProgress: 0,
      scrollProgress: 0,
      particleCount: 2000,
      fps: 60
    };

    // Command queue for batching
    this.commandQueue = [];
    this.isProcessing = false;
    this.frameScheduled = false;

    // Transaction support
    this.transactionDepth = 0;
    this.transactionBuffer = [];

    // Performance monitoring
    this.lastUpdateTime = performance.now();
    this.updateCount = 0;

    ConsciousnessStateOrchestrator.instance = this;
    
    console.log('🎯 ConsciousnessStateOrchestrator initialized');
  }

  // ===== COMMAND PATTERN IMPLEMENTATION =====
  
  /**
   * Execute a command with automatic batching
   */
  executeCommand(command) {
    this.commandQueue.push(command);
    
    if (!this.frameScheduled) {
      this.frameScheduled = true;
      requestAnimationFrame(() => this.processCommandQueue());
    }
  }

  /**
   * Process all queued commands in a single frame
   */
  processCommandQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const startTime = performance.now();
    
    // Begin transaction
    this.beginTransaction();
    
    // Process all commands
    while (this.commandQueue.length > 0) {
      const command = this.commandQueue.shift();
      try {
        command.execute(this);
      } catch (error) {
        console.error('Command execution failed:', error);
        this.rollbackTransaction();
        break;
      }
    }
    
    // Commit transaction
    const changes = this.commitTransaction();
    
    // CRITICAL FIX: Emit the actual state changes!
    if (changes.length > 0) {
      // Check if we have a stage change
      const stageChange = changes.find(c => c.atom === 'stage');
      if (stageChange) {
        console.log(`📡 Orchestrator: Emitting STAGE_CHANGE for ${stageChange.updates.currentStage || this.currentState.stage}`);
        BeatBus.emit(EVENTS.STAGE_CHANGE, {
          stage: stageChange.updates.currentStage || this.currentState.stage,
          stageIndex: stageChange.updates.currentStageIndex || this.currentState.stageIndex,
          config: stageChange.updates.stageConfig || SST_V3_STAGES[this.currentState.stage]
        });
      }
      
      // Check for quality changes
      const qualityChange = changes.find(c => c.atom === 'quality');
      if (qualityChange) {
        BeatBus.emit(EVENTS.QUALITY_CHANGE, {
          quality: qualityChange.updates.currentQualityTier || this.currentState.quality
        });
      }
    }
    
    // Emit consolidated event
    if (changes.length > 0) {
      BeatBus.emit(EVENTS.STATE_BATCH_UPDATE, {
        changes,
        timestamp: performance.now(),
        duration: performance.now() - startTime
      });
    }
    
    this.isProcessing = false;
    this.frameScheduled = false;
    
    // Update metrics
    this.updateCount++;
    this.lastUpdateTime = performance.now();
  }

  // ===== TRANSACTION MANAGEMENT =====
  
  beginTransaction() {
    this.transactionDepth++;
    if (this.transactionDepth === 1) {
      this.transactionBuffer = [];
    }
  }

  commitTransaction() {
    this.transactionDepth--;
    
    if (this.transactionDepth === 0) {
      // Apply all buffered changes atomically
      const changes = [...this.transactionBuffer];
      this.transactionBuffer = [];
      
      // Apply to atoms
      this.applyChangesToAtoms(changes);
      
      return changes;
    }
    
    return [];
  }

  rollbackTransaction() {
    this.transactionDepth = 0;
    this.transactionBuffer = [];
    console.warn('Transaction rolled back');
  }

  // ===== ATOMIC STATE UPDATES =====
  
  applyChangesToAtoms(changes) {
    // Group changes by atom
    const atomChanges = {
      stage: {},
      quality: {},
      narrative: {},
      performance: {},
      interaction: {},
      resource: {}
    };
    
    // Organize changes
    changes.forEach(change => {
      const { atom, updates } = change;
      Object.assign(atomChanges[atom], updates);
    });
    
    // Apply to each atom (atomic execution)
    if (Object.keys(atomChanges.stage).length > 0) {
      stageAtom.getState().batchUpdate(atomChanges.stage);
    }
    if (Object.keys(atomChanges.quality).length > 0) {
      qualityAtom.getState().batchUpdate(atomChanges.quality);
    }
    if (Object.keys(atomChanges.narrative).length > 0) {
      narrativeAtom.getState().batchUpdate(atomChanges.narrative);
    }
    if (Object.keys(atomChanges.performance).length > 0) {
      performanceAtom.getState().batchUpdate(atomChanges.performance);
    }
  }

  // ===== HIGH-LEVEL COMMANDS =====
  
  /**
   * Change to a new stage
   */
  changeStage(stageNameOrIndex) {
    const command = new ChangeStageCommand(stageNameOrIndex);
    this.executeCommand(command);
  }

  /**
   * Update morph progress
   */
  updateMorphProgress(progress) {
    const command = new UpdateMorphCommand(progress);
    this.executeCommand(command);
  }

  /**
   * Update scroll position
   */
  updateScroll(scrollPercent) {
    const command = new UpdateScrollCommand(scrollPercent);
    this.executeCommand(command);
  }

  /**
   * Adjust quality based on performance
   */
  adjustQuality(fps) {
    const command = new AdjustQualityCommand(fps);
    this.executeCommand(command);
  }

  /**
   * Trigger memory fragment
   */
  triggerMemoryFragment(fragmentId) {
    const command = new TriggerFragmentCommand(fragmentId);
    this.executeCommand(command);
  }

  // ===== STATE QUERIES =====
  
  getCurrentState() {
    return { ...this.currentState };
  }

  getCurrentStage() {
    return this.currentState.stage;
  }

  getCurrentQuality() {
    return this.currentState.quality;
  }

  getMorphProgress() {
    return this.currentState.morphProgress;
  }

  // ===== PERFORMANCE MONITORING =====
  
  getPerformanceMetrics() {
    return {
      updateCount: this.updateCount,
      lastUpdateTime: this.lastUpdateTime,
      averageUpdateTime: this.lastUpdateTime / Math.max(1, this.updateCount),
      queueLength: this.commandQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// ===== COMMAND DEFINITIONS =====

/**
 * Base Command class
 */
class Command {
  execute(orchestrator) {
    throw new Error('Command must implement execute method');
  }
}

/**
 * Change Stage Command
 */
class ChangeStageCommand extends Command {
  constructor(stageNameOrIndex) {
    super();
    this.stageNameOrIndex = stageNameOrIndex;
  }

  execute(orchestrator) {
    const stages = Object.keys(SST_V3_STAGES);
    
    let stageName, stageIndex;
    if (typeof this.stageNameOrIndex === 'number') {
      stageIndex = this.stageNameOrIndex;
      stageName = stages[stageIndex];
    } else {
      stageName = this.stageNameOrIndex;
      stageIndex = stages.indexOf(stageName);
    }
    
    if (!stageName || !SST_V3_STAGES[stageName]) {
      console.error(`Invalid stage: ${this.stageNameOrIndex}`);
      return;
    }
    
    const config = SST_V3_STAGES[stageName];
    
    // Update internal state
    orchestrator.currentState.stage = stageName;
    orchestrator.currentState.stageIndex = stageIndex;
    orchestrator.currentState.particleCount = config.particleCount;
    
    // Buffer atomic changes
    orchestrator.transactionBuffer.push(
      {
        atom: 'stage',
        updates: {
          currentStage: stageName,
          currentStageIndex: stageIndex,
          stageConfig: config
        }
      },
      {
        atom: 'quality',
        updates: {
          particleCount: config.particleCount,
          tierDistribution: config.tierDistribution
        }
      },
      {
        atom: 'narrative',
        updates: {
          currentStage: stageName,
          narrative: config.narrative
        }
      }
    );
    
    // Emit specific stage change event
    BeatBus.emit(EVENTS.STAGE_CHANGE, {
      stage: stageName,
      stageIndex: stageIndex,
      config: config
    });
    
    console.log(`🎭 Stage changed to ${stageName} (${config.particleCount} particles)`);
  }
}

/**
 * Update Morph Command
 */
class UpdateMorphCommand extends Command {
  constructor(progress) {
    super();
    this.progress = Math.max(0, Math.min(1, progress));
  }

  execute(orchestrator) {
    orchestrator.currentState.morphProgress = this.progress;
    
    orchestrator.transactionBuffer.push({
      atom: 'narrative',
      updates: {
        morphProgress: this.progress,
        atmosphericBlend: 1 - this.progress,
        brainBlend: this.progress
      }
    });
  }
}

/**
 * Update Scroll Command
 */
class UpdateScrollCommand extends Command {
  constructor(scrollPercent) {
    super();
    this.scrollPercent = Math.max(0, Math.min(1, scrollPercent));
  }

  execute(orchestrator) {
    orchestrator.currentState.scrollProgress = this.scrollPercent;
    
    // Calculate stage from scroll
    const stageProgress = this.scrollPercent * 7; // 7 stages
    const newStageIndex = Math.floor(stageProgress);
    const morphWithinStage = stageProgress % 1;
    
    // Change stage if needed
    if (newStageIndex !== orchestrator.currentState.stageIndex) {
      const changeStageCommand = new ChangeStageCommand(newStageIndex);
      changeStageCommand.execute(orchestrator);
    }
    
    // Update morph within stage
    const morphCommand = new UpdateMorphCommand(morphWithinStage);
    morphCommand.execute(orchestrator);
    
    orchestrator.transactionBuffer.push({
      atom: 'narrative',
      updates: {
        scrollProgress: this.scrollPercent,
        globalProgress: this.scrollPercent
      }
    });
  }
}

/**
 * Adjust Quality Command
 */
class AdjustQualityCommand extends Command {
  constructor(fps) {
    super();
    this.fps = fps;
  }

  execute(orchestrator) {
    let newQuality = orchestrator.currentState.quality;
    
    // Auto-adjust quality based on FPS
    if (this.fps < 30 && newQuality !== 'LOW') {
      newQuality = 'LOW';
    } else if (this.fps < 45 && newQuality === 'ULTRA') {
      newQuality = 'HIGH';
    } else if (this.fps < 55 && newQuality === 'ULTRA') {
      newQuality = 'HIGH';
    } else if (this.fps > 55 && newQuality === 'HIGH') {
      newQuality = 'ULTRA';
    }
    
    if (newQuality !== orchestrator.currentState.quality) {
      orchestrator.currentState.quality = newQuality;
      
      orchestrator.transactionBuffer.push({
        atom: 'quality',
        updates: {
          currentQualityTier: newQuality,
          autoAdjusted: true
        }
      });
      
      BeatBus.emit(EVENTS.QUALITY_CHANGE, {
        quality: newQuality,
        reason: 'performance',
        fps: this.fps
      });
      
      console.log(`🎨 Quality adjusted to ${newQuality} (FPS: ${this.fps})`);
    }
  }
}

/**
 * Trigger Fragment Command
 */
class TriggerFragmentCommand extends Command {
  constructor(fragmentId) {
    super();
    this.fragmentId = fragmentId;
  }

  execute(orchestrator) {
    orchestrator.transactionBuffer.push({
      atom: 'interaction',
      updates: {
        activeFragment: this.fragmentId,
        fragmentTriggeredAt: performance.now()
      }
    });
    
    BeatBus.emit(EVENTS.TRIGGER_FRAGMENT, {
      fragmentId: this.fragmentId,
      stage: orchestrator.currentState.stage
    });
    
    console.log(`💎 Memory fragment triggered: ${this.fragmentId}`);
  }
}

// ===== SINGLETON EXPORT =====

const orchestrator = new ConsciousnessStateOrchestrator();

// Development helpers
if (typeof window !== 'undefined') {
  window.orchestrator = orchestrator;
  window.so = {
    stage: (n) => orchestrator.changeStage(n),
    morph: (p) => orchestrator.updateMorphProgress(p),
    scroll: (p) => orchestrator.updateScroll(p),
    quality: (fps) => orchestrator.adjustQuality(fps),
    fragment: (id) => orchestrator.triggerMemoryFragment(id),
    state: () => orchestrator.getCurrentState(),
    metrics: () => orchestrator.getPerformanceMetrics()
  };
  
  console.log('🎮 State Orchestrator available:');
  console.log('  window.so.stage(3) - Change to velocity stage');
  console.log('  window.so.scroll(0.5) - Update scroll progress');
  console.log('  window.so.state() - Get current state');
}

export default orchestrator;
