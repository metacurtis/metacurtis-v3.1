#!/bin/bash
# Canon Dev-OS Fencepost Test Runner

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Canon Fencepost Test Starting...${NC}"

# Start dev server in background
echo "Starting dev server..."
npm run dev > /dev/null 2>&1 &
DEV_PID=$!

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    kill $DEV_PID 2>/dev/null
    exit $1
}

# Trap exits to ensure cleanup
trap 'cleanup $?' EXIT INT TERM

# Wait for server to be ready (max 30 seconds)
echo "Waiting for dev server to be ready..."
COUNTER=0
until curl -s http://localhost:5173 > /dev/null 2>&1; do
    sleep 1
    COUNTER=$((COUNTER + 1))
    if [ $COUNTER -gt 30 ]; then
        echo -e "${RED}❌ Dev server failed to start after 30 seconds${NC}"
        exit 1
    fi
    echo -n "."
done
echo -e "\n${GREEN}✓ Dev server ready${NC}"

# Give it another second to fully initialize
sleep 2

# Run the fencepost test
echo -e "${YELLOW}Running fencepost check...${NC}"
npm run ci:fencepost
TEST_RESULT=$?

# Report result
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Fencepost test PASSED${NC}"
else
    echo -e "${RED}❌ Fencepost test FAILED${NC}"
fi

# Cleanup happens via trap
exit $TEST_RESULT
