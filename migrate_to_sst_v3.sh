#!/bin/bash
# SST v3.0 Complete Migration Script with Guard Rails
# Run this to migrate from v2.1 to v3.0 safely

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 SST v3.0 Migration Script${NC}"
echo -e "${BLUE}================================${NC}"

# ============ SAFETY FIRST ============
echo -e "\n${YELLOW}📸 Creating safety checkpoint...${NC}"

# Create backup directory
BACKUP_DIR=".migration_backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup critical files
echo "Backing up critical files to $BACKUP_DIR..."
cp -R src/engine/ConsciousnessEngine.js "$BACKUP_DIR/" 2>/dev/null || true
cp -R src/config/canonical "$BACKUP_DIR/" 2>/dev/null || true
cp -R src/stores/atoms "$BACKUP_DIR/" 2>/dev/null || true

# Git checkpoint
if [ -d .git ]; then
    git add -A
    git commit -m "checkpoint: before SST v3.0 migration - working v2.1 system" || true
    git tag pre-v3-migration --force
    echo -e "${GREEN}✅ Git checkpoint created (tag: pre-v3-migration)${NC}"
fi

# Disable bash history expansion
set +H

# ============ STEP 1: CANONICAL AUTHORITY ============
echo -e "\n${YELLOW}📋 Creating Canonical Authority Bridge...${NC}"

cat > src/config/canonical/canonicalAuthority.js << 'CANON_EOF'
// CANONICAL AUTHORITY - SST v3.0 Unified Access Point
// This replaces all v2.1 imports throughout the system

import { SST_V3_CONFIG, getStageByName, getStageByScroll, isFeatureEnabled } from '../sst3/sst-v3.0-config.js';
import { TIER_BEHAVIORS, TIER_BEHAVIOR_SETS, applyBehavior, getBehaviorUniforms } from '../sst3/tier-behaviors.js';
import { NARRATIVE_DIALOGUE, getDialogueSegment, getParticleCuesForStage } from '../sst3/narrative-dialogue.js';
import { MEMORY_FRAGMENTS, getFragmentsForStage, getActiveFragments } from '../sst3/memory-fragments.js';

export const Canonical = {
  // Version info
  version: '3.0.0',
  authority: 'ABSOLUTE',
  
  // Core configuration
  stages: SST_V3_CONFIG.stages,
  // Fixed stage order based on IDs
  stageOrder: Object.values(SST_V3_CONFIG.stages).sort((a,b) => a.id - b.id).map(s => s.name),
  performance: SST_V3_CONFIG.performance,
  features: SST_V3_CONFIG.features,
  tierSystem: SST_V3_CONFIG.tierSystem,
  
  // Stage access methods (v2.1 compatible)
  getStageByName,
  getStageByScroll,
  getStageByIndex: (index) => {
    const sortedStages = Object.values(SST_V3_CONFIG.stages).sort((a,b) => a.id - b.id);
    return sortedStages[index] || null;
  },
  
  // Tier behaviors
  behaviors: { 
    definitions: TIER_BEHAVIORS, 
    sets: TIER_BEHAVIOR_SETS,
    apply: applyBehavior,
    getUniforms: getBehaviorUniforms
  },
  
  // Narrative system
  dialogue: NARRATIVE_DIALOGUE,
  getDialogueSegment,
  getParticleCuesForStage,
  
  // Memory fragments
  fragments: MEMORY_FRAGMENTS,
  getFragmentsForStage,
  getActiveFragments,
  
  // Feature checking
  isFeatureEnabled,
  
  // System constants (v2.1 compatibility)
  SYSTEM_CONSTANTS: {
    TOTAL_STAGES: 7,
    MIN_STAGE_INDEX: 0,
    MAX_STAGE_INDEX: 6,
    OPERATIONAL_PARTICLES: 15000,
    SHOWCASE_PARTICLES: 17000,
    TARGET_FPS: 60,
    LIGHTHOUSE_TARGET: 90
  }
};

// Development exposure
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  window.CANONICAL = Canonical;
  console.log(`📋 SST v${Canonical.version} Canonical Authority loaded`);
  console.log('🔧 Available: window.CANONICAL');
}

export default Canonical;
CANON_EOF

echo -e "${GREEN}✅ Canonical Authority created${NC}"

# ============ STEP 2: TIER SYSTEM ============
echo -e "\n${YELLOW}🎯 Creating TierSystem...${NC}"

cat > src/engine/TierSystem.js << 'TIER_EOF'
// TierSystem.js - Manages tier distribution and behavior application
import seedrandom from 'seedrandom';

export class TierSystem {
  constructor(config) {
    this.config = config;
    this.behaviors = config.behaviors.definitions;
    this.behaviorSets = config.behaviors.sets;
  }
  
  // Distribute particles according to stage ratios
  distributeParticles(totalCount, stageName) {
    const stage = this.config.stages[stageName];
    if (!stage) throw new Error(`Unknown stage: ${stageName}`);
    
    const distribution = stage.tierRatios.map(ratio => 
      Math.round(totalCount * ratio)
    );
    
    // Ensure exact count
    const sum = distribution.reduce((a, b) => a + b, 0);
    if (sum !== totalCount) {
      distribution[0] += totalCount - sum;
    }
    
    console.log(`🎯 Tier distribution for ${stageName}: [${distribution.join(', ')}] = ${totalCount}`);
    return distribution;
  }
  
  // Apply tier-specific behaviors with RNG guard
  applyTierBehavior(particleIndex, tier, stageName, rng = Math.random) {
    const behaviors = this.behaviorSets[tier];
    const stage = this.config.stages[stageName];
    
    const behaviorData = {
      tier,
      behaviors: behaviors.map(b => this.behaviors[b]),
      sizeMultiplier: this.getTierSize(tier),
      opacityRange: this.getTierOpacity(tier),
      spriteIndex: this.selectSprite(tier, stage, rng)
    };
    
    // Apply special behaviors based on features
    if (tier === 0 && this.config.features.noiseClusteringTier1) {
      behaviorData.clustering = this.applyNoiseClustering(particleIndex, rng);
    }
    
    if (tier === 3 && this.config.features.centerWeightingTier4) {
      behaviorData.centerWeight = this.applyCenterWeighting(particleIndex, stage.brainRegion);
    }
    
    return behaviorData;
  }
  
  // Get tier-specific size multiplier
  getTierSize(tier) {
    return this.config.tierSystem.sizeMultipliers[tier] || 1.0;
  }
  
  // Get tier-specific opacity range
  getTierOpacity(tier) {
    return this.config.tierSystem.opacityRanges[tier] || [0.5, 1.0];
  }
  
  // Select sprite for tier with RNG guard
  selectSprite(tier, stage, rng = Math.random) {
    const tierKey = `tier${tier + 1}`;
    const sprites = stage.sprites[tierKey];
    if (!sprites || sprites.length === 0) return 0;
    
    const index = Math.floor(rng() * sprites.length);
    return sprites[index];
  }
  
  // Placeholder methods for special behaviors
  applyNoiseClustering(particleIndex, rng) {
    return {
      factor: 0.8 + rng() * 0.4,
      offset: particleIndex * 0.1
    };
  }
  
  applyCenterWeighting(particleIndex, brainRegion) {
    return {
      weight: 0.7,
      region: brainRegion
    };
  }
  
  // Get shader uniforms for a stage
  getStageUniforms(stageName) {
    const stage = this.config.stages[stageName];
    const behaviors = [];
    
    // Collect all behaviors for this stage
    stage.tierRatios.forEach((ratio, tier) => {
      if (ratio > 0) {
        behaviors.push(...this.behaviorSets[tier]);
      }
    });
    
    return this.config.behaviors.getUniforms(behaviors);
  }
}

export default TierSystem;
TIER_EOF

echo -e "${GREEN}✅ TierSystem created${NC}"

# ============ STEP 3: CONSCIOUSNESS ENGINE V3 ============
echo -e "\n${YELLOW}🧠 Creating ConsciousnessEngine v3...${NC}"

# Backup original engine
cp src/engine/ConsciousnessEngine.js "$BACKUP_DIR/ConsciousnessEngine_original.js" 2>/dev/null || true

cat > src/engine/ConsciousnessEngine.js << 'ENGINE_EOF'
// ConsciousnessEngine v3.0 - Updated for SST v3.0
import seedrandom from 'seedrandom';
import { Canonical } from '../config/canonical/canonicalAuthority.js';
import { ConsciousnessPatterns } from '../components/webgl/consciousness/ConsciousnessPatterns.js';
import { getPointSpriteAtlasSingleton } from '../components/webgl/consciousness/PointSpriteAtlas.js';
import TierSystem from './TierSystem.js';

const STAGE_SCHEMA_VERSION = 'v3.0';

class ConsciousnessEngine {
  constructor() {
    this.isInitialized = false;
    this.blueprintCache = new Map();
    this.currentTier = 'HIGH';
    this.currentStage = 'genesis';
    this.tierSystem = new TierSystem(Canonical);
    
    // Bind event handler for proper cleanup
    this.onQualityChange = (event) => {
      if (!event?.detail?.tier) {
        console.warn('🧠 Engine: Invalid AQS event', event);
        return;
      }
      
      const { tier, particles } = event.detail;
      const oldTier = this.currentTier;
      this.currentTier = tier;
      
      console.log(`🧠 Engine: Quality changed ${oldTier} → ${tier}`);
      
      window.dispatchEvent(new CustomEvent('engineTierChange', {
        detail: { tier, particles, stage: this.currentStage }
      }));
    };
    
    this.listenToAQS();
    console.log(`🧠 ConsciousnessEngine v3.0: Initialized with tier system`);
  }

  listenToAQS() {
    if (!window.addEventListener) return;
    window.addEventListener('aqsQualityChange', this.onQualityChange);
  }

  getRNG(stageName, tier) {
    const seed = `${stageName}|${tier}|${STAGE_SCHEMA_VERSION}`;
    return seedrandom(seed);
  }

  async generateConstellationParticleData(particleCount, options = {}) {
    const { stageName = 'genesis' } = options;
    this.currentStage = stageName;
    
    const cacheKey = `${stageName}-${this.currentTier}-${particleCount}`;
    if (this.blueprintCache.has(cacheKey)) {
      console.log(`🧠 Engine: Using cached blueprint for ${cacheKey}`);
      return this.blueprintCache.get(cacheKey);
    }
    
    console.log(`🧠 Engine v3.0: Generating blueprint for ${stageName} (${particleCount} particles)`);
    
    const stage = Canonical.getStageByName(stageName);
    if (!stage) throw new Error(`Unknown stage: ${stageName}`);
    
    const rng = this.getRNG(stageName, this.currentTier);
    const distribution = this.tierSystem.distributeParticles(particleCount, stageName);
    
    // Pre-allocate arrays
    const maxParticles = 17000;
    const atmosphericPositions = new Float32Array(maxParticles * 3);
    const allenAtlasPositions = new Float32Array(maxParticles * 3);
    const animationSeeds = new Float32Array(maxParticles * 3);
    const sizeMultipliers = new Float32Array(maxParticles);
    const opacityData = new Float32Array(maxParticles);
    const atlasIndices = new Float32Array(maxParticles);
    const tierData = new Float32Array(maxParticles);
    
    const brainPattern = ConsciousnessPatterns.getBrainRegionInfo(stageName);
    const atlas = getPointSpriteAtlasSingleton();
    
    let particleIndex = 0;
    
    // Generate particles by tier
    distribution.forEach((count, tier) => {
      for (let i = 0; i < count && particleIndex < maxParticles; i++, particleIndex++) {
        const behaviorData = this.tierSystem.applyTierBehavior(particleIndex, tier, stageName, rng);
        
        this.generateParticle(
          particleIndex,
          tier,
          stageName,
          brainPattern,
          behaviorData,
          rng,
          atlas,
          atmosphericPositions,
          allenAtlasPositions,
          animationSeeds,
          sizeMultipliers,
          opacityData,
          atlasIndices,
          tierData
        );
      }
    });
    
    const blueprint = {
      stageName,
      tier: this.currentTier,
      particleCount,
      maxParticles,
      distribution,
      tierCounts: distribution,
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      timestamp: Date.now(),
      version: 'v3.0'
    };
    
    this.blueprintCache.set(cacheKey, blueprint);
    
    if (this.blueprintCache.size > 20) {
      const firstKey = this.blueprintCache.keys().next().value;
      this.blueprintCache.delete(firstKey);
    }
    
    return blueprint;
  }

  generateParticle(
    index, tier, stageName, brainPattern, behaviorData, rng, atlas,
    atmosphericPositions, allenAtlasPositions, animationSeeds,
    sizeMultipliers, opacityData, atlasIndices, tierData
  ) {
    const i3 = index * 3;
    const stage = Canonical.getStageByName(stageName);
    
    // Atmospheric position
    const spread = tier === 0 ? 40 : tier === 1 ? 30 : tier === 2 ? 20 : 15;
    atmosphericPositions[i3] = (rng() - 0.5) * spread;
    atmosphericPositions[i3 + 1] = (rng() - 0.5) * spread;
    atmosphericPositions[i3 + 2] = (rng() - 0.5) * spread * 0.5;
    
    // Brain position (v3.0 uses brainCoordinates)
    if (tier === 3 && stage.brainCoordinates) {
      const coords = stage.brainCoordinates;
      if (coords.center) {
        allenAtlasPositions[i3] = coords.center[0] + (rng() - 0.5) * coords.radius;
        allenAtlasPositions[i3 + 1] = coords.center[1] + (rng() - 0.5) * coords.radius;
        allenAtlasPositions[i3 + 2] = coords.center[2] + (rng() - 0.5) * coords.radius * 0.5;
      }
    } else if (brainPattern && brainPattern.coordinates) {
      // Fallback to v2.1 pattern if available
      const points = brainPattern.coordinates.points;
      const pointIndex = Math.floor(rng() * points.length);
      const point = points[pointIndex];
      const variation = tier === 3 ? 0.3 : 1.0;
      
      allenAtlasPositions[i3] = point[0] + (rng() - 0.5) * variation;
      allenAtlasPositions[i3 + 1] = point[1] + (rng() - 0.5) * variation;
      allenAtlasPositions[i3 + 2] = point[2] + (rng() - 0.5) * variation;
    } else {
      // Generic brain distribution
      const brainSpread = tier === 0 ? 25 : tier === 1 ? 20 : 15;
      allenAtlasPositions[i3] = (rng() - 0.5) * brainSpread;
      allenAtlasPositions[i3 + 1] = (rng() - 0.5) * brainSpread;
      allenAtlasPositions[i3 + 2] = (rng() - 0.5) * brainSpread * 0.5;
    }
    
    // Animation seeds
    animationSeeds[i3] = rng();
    animationSeeds[i3 + 1] = rng();
    animationSeeds[i3 + 2] = rng();
    
    // Apply behavior data
    tierData[index] = tier;
    sizeMultipliers[index] = behaviorData.sizeMultiplier;
    const opacityRange = behaviorData.opacityRange;
    opacityData[index] = opacityRange[0] + rng() * (opacityRange[1] - opacityRange[0]);
    atlasIndices[index] = behaviorData.spriteIndex || atlas.getContextualSpriteIndex(stageName, index);
  }

  getActiveParticleCount(stageName) {
    const stage = Canonical.getStageByName(stageName);
    if (!stage) return 5000; // Safe default
    
    const baseCount = stage.particles;
    
    const qualityMultipliers = {
      LOW: 0.6,
      MEDIUM: 0.8,
      HIGH: 0.9,
      ULTRA: 1.0
    };
    
    return Math.round(baseCount * (qualityMultipliers[this.currentTier] || 1.0));
  }

  dispose() {
    this.blueprintCache.clear();
    window.removeEventListener('aqsQualityChange', this.onQualityChange);
  }
}

const getConsciousnessEngineSingleton = () => {
  if (!globalThis.__CONSCIOUSNESS_ENGINE__) {
    globalThis.__CONSCIOUSNESS_ENGINE__ = new ConsciousnessEngine();
  }
  return globalThis.__CONSCIOUSNESS_ENGINE__;
};

export default getConsciousnessEngineSingleton();
ENGINE_EOF

echo -e "${GREEN}✅ ConsciousnessEngine v3 created${NC}"

# ============ STEP 4: MIGRATE IMPORTS ============
echo -e "\n${YELLOW}�� Migrating imports from v2.1 to v3.0...${NC}"

# Platform-specific sed
SED="sed"
[[ $(uname) == "Darwin" ]] && SED="gsed"

# Find and process files
files=$(grep -r "sstV2Stages\|SST_V2_CANONICAL" src/ --include="*.js" --include="*.jsx" -l 2>/dev/null || true)

if [ -z "$files" ]; then
    echo -e "${GREEN}✅ No v2.1 imports found${NC}"
else
    for file in $files; do
        echo "Updating $file..."
        
        # Calculate relative path depth
        depth=$(echo "$file" | tr '/' '\n' | grep -c '^')
        prefix=""
        for ((i=1; i<$depth; i++)); do
            prefix="../$prefix"
        done
        
        # Create backup
        cp "$file" "$file.v2backup"
        
        # Replace imports
        $SED -i "s|import.*sstV2Stages.*|import { Canonical } from \"${prefix}config/canonical/canonicalAuthority.js\";|g" "$file"
        $SED -i "s|import.*SST_V2_CANONICAL.*|import { Canonical } from \"${prefix}config/canonical/canonicalAuthority.js\";|g" "$file"
        
        # Replace usage patterns
        $SED -i 's/SST_V2_CANONICAL\.get\.stageByName/Canonical.getStageByName/g' "$file"
        $SED -i 's/SST_V2_CANONICAL\.get\.stageByIndex/Canonical.getStageByIndex/g' "$file"
        $SED -i 's/SST_V2_CANONICAL\.STAGE_DEFINITIONS/Canonical.stages/g' "$file"
        $SED -i 's/SST_V2_CANONICAL\.STAGE_ORDER/Canonical.stageOrder/g' "$file"
        $SED -i 's/SST_V2_CANONICAL\.SYSTEM_CONSTANTS/Canonical.SYSTEM_CONSTANTS/g' "$file"
        $SED -i 's/SST_V2_CANONICAL/Canonical/g' "$file"
        
        # Update console logs
        $SED -i 's/SST v2\.0/SST v3.0/g' "$file"
        $SED -i 's/SST v2\.1/SST v3.0/g' "$file"
    done
    
    echo -e "${GREEN}✅ Imports migrated for ${words[*]} files${NC}"
fi

# ============ STEP 5: MEMORY FRAGMENTS HOOK ============
echo -e "\n${YELLOW}💎 Creating Memory Fragments hook...${NC}"

cat > src/hooks/useMemoryFragments.js << 'FRAG_EOF'
import { useEffect, useState, useCallback } from 'react';
import { Canonical } from '../config/canonical/canonicalAuthority.js';

export function useMemoryFragments(stageName, scrollPercent, activeNarrativeSegment) {
  const [activeFragments, setActiveFragments] = useState([]);
  const [fragmentStates, setFragmentStates] = useState({});

  useEffect(() => {
    const active = Canonical.getActiveFragments(stageName, scrollPercent, activeNarrativeSegment);
    setActiveFragments(active);
    
    // Initialize states for new fragments
    active.forEach(frag => {
      if (!fragmentStates[frag.id]) {
        setFragmentStates(prev => ({
          ...prev,
          [frag.id]: { state: 'pending', startTime: null }
        }));
      }
    });
  }, [stageName, scrollPercent, activeNarrativeSegment]);

  const triggerFragment = useCallback((fragmentId) => {
    const fragment = activeFragments.find(f => f.id === fragmentId);
    if (!fragment) return;

    // Update state
    setFragmentStates(prev => ({
      ...prev,
      [fragmentId]: { state: 'triggering', startTime: Date.now() }
    }));

    // Emit particle effect
    if (fragment.particleEffect?.onTrigger) {
      window.dispatchEvent(new CustomEvent('fragmentParticleEffect', {
        detail: {
          fragmentId,
          effect: fragment.particleEffect.onTrigger,
          stage: stageName
        }
      }));
    }

    // Play audio
    if (fragment.audio?.onTrigger) {
      // Audio implementation would go here
      console.log(`🔊 Playing: ${fragment.audio.onTrigger}`);
    }

    // Transition to active
    setTimeout(() => {
      setFragmentStates(prev => ({
        ...prev,
        [fragmentId]: { ...prev[fragmentId], state: 'active' }
      }));
    }, 500);
  }, [activeFragments, stageName]);

  const dismissFragment = useCallback((fragmentId) => {
    const fragment = activeFragments.find(f => f.id === fragmentId);
    
    setFragmentStates(prev => ({
      ...prev,
      [fragmentId]: { ...prev[fragmentId], state: 'dismissing' }
    }));

    // Emit dismiss effect
    if (fragment?.particleEffect?.onDismiss) {
      window.dispatchEvent(new CustomEvent('fragmentParticleEffect', {
        detail: {
          fragmentId,
          effect: fragment.particleEffect.onDismiss,
          stage: stageName
        }
      }));
    }

    setTimeout(() => {
      setFragmentStates(prev => ({
        ...prev,
        [fragmentId]: { ...prev[fragmentId], state: 'completed' }
      }));
    }, 500);
  }, [activeFragments, stageName]);

  return {
    activeFragments,
    fragmentStates,
    triggerFragment,
    dismissFragment
  };
}

export default useMemoryFragments;
FRAG_EOF

echo -e "${GREEN}✅ Memory Fragments hook created${NC}"

# ============ STEP 6: VERIFICATION SCRIPT ============
echo -e "\n${YELLOW}🔍 Creating verification script...${NC}"

cat > verify_migration.sh << 'VERIFY_EOF'
#!/bin/bash
# SST v3.0 Migration Verification Script

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Verifying SST v3.0 Migration...${NC}"
echo "================================"

# Check for any remaining v2 imports
echo -e "\n📋 Checking for v2.1 imports..."
v2_count=$(grep -r "sstV2Stages\|SST_V2_CANONICAL" src/ --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
if [ "$v2_count" -gt 0 ]; then
  echo -e "${RED}❌ Found $v2_count remaining v2.1 references:${NC}"
  grep -r "sstV2Stages\|SST_V2_CANONICAL" src/ --include="*.js" --include="*.jsx" -n | head -5
else
  echo -e "${GREEN}✅ No v2.1 imports found${NC}"
fi

# Check for Canonical imports
echo -e "\n📋 Checking Canonical imports..."
canonical_count=$(grep -r "canonicalAuthority" src/ --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
if [ "$canonical_count" -gt 0 ]; then
  echo -e "${GREEN}✅ Found $canonical_count Canonical imports${NC}"
else
  echo -e "${RED}❌ No Canonical imports found - migration may have failed${NC}"
fi

# Check for new files
echo -e "\n📋 Checking for new v3.0 files..."
files_to_check=(
  "src/config/canonical/canonicalAuthority.js"
  "src/engine/TierSystem.js"
  "src/hooks/useMemoryFragments.js"
)

for file in "${files_to_check[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ Found: $file${NC}"
  else
    echo -e "${RED}❌ Missing: $file${NC}"
  fi
done

# Check console logs
echo -e "\n📋 Checking for v2.x version strings in console logs..."
v2_logs=$(grep -r "console.*SST v2\." src/ --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
if [ "$v2_logs" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $v2_logs v2.x version strings in console logs${NC}"
else
  echo -e "${GREEN}✅ No v2.x console logs found${NC}"
fi

# Summary
echo -e "\n${YELLOW}📊 Migration Summary:${NC}"
echo "================================"
echo -e "V2 References Remaining: $v2_count"
echo -e "V3 Canonical Imports: $canonical_count"
echo -e "Migration Status: $([ "$v2_count" -eq 0 ] && [ "$canonical_count" -gt 0 ] && echo -e "${GREEN}COMPLETE${NC}" || echo -e "${RED}INCOMPLETE${NC}")"

echo -e "\n${GREEN}✅ Verification complete!${NC}"
VERIFY_EOF

chmod +x verify_migration.sh

echo -e "${GREEN}✅ Verification script created${NC}"

# ============ RUN VERIFICATION ============
echo -e "\n${YELLOW}🔍 Running verification...${NC}"
./verify_migration.sh

# ============ FINAL STEPS ============
echo -e "\n${BLUE}📋 Migration Complete!${NC}"
echo "================================"
echo -e "${GREEN}Next steps:${NC}"
echo "1. Run: npm run validate:sst3"
echo "2. Run: npm run dev"
echo "3. Check console for 'SST v3.0.0 CANONICAL active'"
echo "4. Test stage transitions and particle rendering"
echo ""
echo -e "${YELLOW}Rollback if needed:${NC}"
echo "cp -R $BACKUP_DIR/* src/"
echo "git checkout pre-v3-migration"
echo ""
echo -e "${GREEN}🚀 Happy transcending with SST v3.0!${NC}"
