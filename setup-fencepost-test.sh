#!/bin/bash
# One-touch Canon Dev-OS Fencepost Test Setup

echo "🚀 Setting up Canon Fencepost Testing..."

# 1. Create the robust CI runner script
mkdir -p scripts/ci
cat << 'RUNNER' > scripts/ci/run-fencepost-test.sh
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
RUNNER

# 2. Make the runner executable
chmod +x scripts/ci/run-fencepost-test.sh

# 3. Create a wait-and-test script for parallel execution
cat << 'WAITER' > scripts/ci/wait-and-test.sh
#!/bin/bash
# Wait for server then test

echo "Waiting 5 seconds for server startup..."
sleep 5

# Check if server is actually up
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "Server is up, running fencepost test..."
    npm run ci:fencepost
else
    echo "Server not responding, trying anyway..."
    npm run ci:fencepost
fi
WAITER

chmod +x scripts/ci/wait-and-test.sh

# 4. Update package.json with all test scripts
npm pkg set scripts.test:fencepost="./scripts/ci/run-fencepost-test.sh"
npm pkg set scripts.ci:fencepost:wait="./scripts/ci/wait-and-test.sh"

# 5. Install npm-run-all if not present (for parallel execution)
if ! npm list npm-run-all > /dev/null 2>&1; then
    echo "Installing npm-run-all for parallel execution..."
    npm install --save-dev npm-run-all
fi

# 6. Add the parallel test option
npm pkg set scripts.ci:test:parallel="npm-run-all --parallel --race dev ci:fencepost:wait"

# 7. Create a simple test all script
npm pkg set scripts.test:all="npm run canon:critical:verify && npm run test:fencepost"

echo ""
echo "✅ Setup complete! You now have these commands:"
echo ""
echo "  npm run test:fencepost      # Start server, test, cleanup (recommended)"
echo "  npm run ci:test:parallel    # Run server and test in parallel"
echo "  npm run ci:fencepost         # Just the test (server must be running)"
echo "  npm run test:all            # Verify Canon + run fencepost test"
echo ""
echo "Try it now with: npm run test:fencepost"
