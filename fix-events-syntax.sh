#!/bin/bash

# Backup the file
cp src/theater/events.js src/theater/events.js.bak

# Fix the trailing comma issue
sed -i "s/DIRECTOR_ERROR: 'DIRECTOR_ERROR',$/DIRECTOR_ERROR: 'DIRECTOR_ERROR'/" src/theater/events.js

echo "Fixed trailing comma in events.js"
echo "Backup saved as events.js.bak"
