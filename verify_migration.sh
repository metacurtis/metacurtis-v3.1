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
