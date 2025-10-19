#!/bin/bash
# Fix all import paths for SST v3.0 migration based on actual file structure

echo "🔧 Fixing all import paths for Canonical Authority..."
echo "================================================"

# Define the correct import paths for each file location
declare -A IMPORT_PATHS=(
    # From src root
    ["src/App.jsx"]="./config/canonical/canonicalAuthority.js"
    
    # From src/engine
    ["src/engine/ConsciousnessEngine.js"]="../config/canonical/canonicalAuthority.js"
    ["src/engine/TierSystem.js"]="../config/canonical/canonicalAuthority.js"
    
    # From src/stores/atoms
    ["src/stores/atoms/qualityAtom.js"]="../../config/canonical/canonicalAuthority.js"
    ["src/stores/atoms/stageAtom.js"]="../../config/canonical/canonicalAuthority.js"
    ["src/stores/atoms/clockAtom.js"]="../../config/canonical/canonicalAuthority.js"
    
    # From src/components/consciousness
    ["src/components/consciousness/ConsciousnessTheater.jsx"]="../../config/canonical/canonicalAuthority.js"
    
    # From src/components/webgl
    ["src/components/webgl/WebGLBackground.jsx"]="../../config/canonical/canonicalAuthority.js"
    ["src/components/webgl/WebGLCanvas.jsx"]="../../config/canonical/canonicalAuthority.js"
    
    # From src/components/webgl/consciousness
    ["src/components/webgl/consciousness/ConsciousnessPatterns.js"]="../../../config/canonical/canonicalAuthority.js"
    ["src/components/webgl/consciousness/PointSpriteAtlas.js"]="../../../config/canonical/canonicalAuthority.js"
    
    # From src/components/ui/narrative
    ["src/components/ui/narrative/MemoryFragments.jsx"]="../../../config/canonical/canonicalAuthority.js"
    ["src/components/ui/narrative/StageNavigation.jsx"]="../../../config/canonical/canonicalAuthority.js"
    
    # From src/components/ui/navigation
    ["src/components/ui/navigation/StageController.jsx"]="../../../config/canonical/canonicalAuthority.js"
    
    # From src/components/dev
    ["src/components/dev/DevPerformanceMonitor.jsx"]="../../config/canonical/canonicalAuthority.js"
    
    # From src/hooks
    ["src/hooks/useMemoryFragments.js"]="../config/canonical/canonicalAuthority.js"
    ["src/hooks/useAdaptiveQuality.js"]="../config/canonical/canonicalAuthority.js"
    
    # From src/utils/performance
    ["src/utils/performance/AdaptiveQualitySystem.js"]="../../config/canonical/canonicalAuthority.js"
)

# Function to fix a single file
fix_file() {
    local file=$1
    local correct_path=$2
    
    if [ -f "$file" ]; then
        # Check if file contains any canonicalAuthority import
        if grep -q "canonicalAuthority.js" "$file" 2>/dev/null; then
            echo "Fixing: $file"
            echo "  Path: $correct_path"
            
            # Replace any existing canonicalAuthority import with the correct path
            sed -i.bak "s|\".*canonicalAuthority\.js\"|\"$correct_path\"|g" "$file"
            
            # Also fix any Canonical imports that might be using old paths
            sed -i "s|from ['\"].*canonicalAuthority['\"]|from \"$correct_path\"|g" "$file"
        fi
    fi
}

# Fix known files
echo -e "\n📋 Fixing known import locations..."
for file in "${!IMPORT_PATHS[@]}"; do
    fix_file "$file" "${IMPORT_PATHS[$file]}"
done

# Find and fix any other files that might import Canonical
echo -e "\n📋 Searching for other files with Canonical imports..."
other_files=$(grep -r "canonicalAuthority\|Canonical.*from" src/ \
    --include="*.js" --include="*.jsx" -l 2>/dev/null | \
    grep -v ".bak" || true)

for file in $other_files; do
    # Skip if already processed
    if [[ -n "${IMPORT_PATHS[$file]}" ]]; then
        continue
    fi
    
    echo "Found additional file: $file"
    
    # Calculate depth and build path
    depth=$(echo "$file" | tr '/' ' ' | wc -w)
    depth=$((depth - 2))  # Subtract for 'src' and filename
    
    path=""
    for ((i=0; i<$depth; i++)); do
        path="../$path"
    done
    path="${path}config/canonical/canonicalAuthority.js"
    
    fix_file "$file" "$path"
done

# Clean up backup files
echo -e "\n🧹 Cleaning up backup files..."
find src/ -name "*.bak" -type f -delete

# Verify the fixes
echo -e "\n✅ Import path fixes complete!"
echo -e "\n📋 Current Canonical imports:"
grep -r "canonicalAuthority.js" src/ --include="*.js" --include="*.jsx" | grep -v ".bak" | head -10

# Check for any broken imports
echo -e "\n🔍 Checking for potentially broken imports..."
broken=$(grep -r "\.\.\/\.\.\/\.\.\/\.\..*canonicalAuthority" src/ --include="*.js" --include="*.jsx" 2>/dev/null || true)
if [ -n "$broken" ]; then
    echo -e "⚠️  Found potentially broken imports (too many ../)"
    echo "$broken"
else
    echo -e "✅ No broken import paths detected"
fi

echo -e "\n🎉 Import path fixing complete!"
