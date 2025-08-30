#!/bin/bash
# Update the emergence scaling in WebGLBackground to not constrain the particles

# Find this section in WebGLBackground.jsx around line 250-270:
# Scale emergence text for better spread

# Change FROM:
#   const desiredH = viewH * 0.8;
#   bp.atmosphericPositions[i + 0] *= textScale * 1.5;

# Change TO:
#   const desiredH = viewH * 1.0;  // Use full viewport height
#   bp.atmosphericPositions[i + 0] *= 1.0;  // Don't scale down

# The particles should now use the full viewport without being scaled down
