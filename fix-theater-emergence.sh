#!/bin/bash

# Replace lines 85-87 with the correct BeatBus.emit call
sed -i '85,87c\
      BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {\
        text: "HELLO CURTIS",\
        count: 2000\
      });' src/theater/TheaterDirector.js

echo "Fixed missing function call"
