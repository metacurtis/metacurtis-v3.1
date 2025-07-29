// SST v3.0 PRODUCTION - Updated with correct imports
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SST_V3_CONFIG, getStageByName, getStageByScroll } from '@/config/sst3/sst-v3.0-config.js';
import { NARRATIVE_DIALOGUE, getDialogueAtTime } from '@/config/sst3/narrative-dialogue.js';
import { MEMORY_FRAGMENTS, getActiveFragments } from '@/config/sst3/memory-fragments.js';
import { stageAtom } from '@/stores/atoms/stageAtom';
import { qualityAtom } from '@/stores/atoms/qualityAtom';
import { useMemoryFragments } from '@/hooks/useMemoryFragments.js';
import WebGLCanvas from '@/components/webgl/WebGLCanvas';
import DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor';

// Copy rest of the component code but replace all Canonical references with SST_V3_CONFIG
