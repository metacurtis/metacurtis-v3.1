#!/bin/bash
# Remove the problematic conditional hook calls
sed -i '206,207d' src/hooks/useAdaptiveQuality.js
sed -i '148s/useCentralClock/\/\/ useCentralClock/' src/hooks/useAdaptiveQuality.js
