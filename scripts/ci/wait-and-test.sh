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
