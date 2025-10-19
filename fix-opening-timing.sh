#!/bin/bash
# Fix opening sequence timing to match SST v3.0

# Update TheaterDirector.js typing speed
sed -i 's/typeSpeed: 50,/typeSpeed: 100,/' src/theater/TheaterDirector.js
sed -i 's/lineDelay: 300/lineDelay: 500/' src/theater/TheaterDirector.js

# Add more time for each phase
sed -i 's/await this.sleep(2000);/await this.sleep(3000);/' src/theater/TheaterDirector.js

echo "✅ Slowed down typing speed and phase timing"
