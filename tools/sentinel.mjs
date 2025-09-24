#!/usr/bin/env node
/* eslint-env node */
// Canon Dev-OS sentinel entrypoint — forwards to the canonical guard implementation.
// Keeps legacy tooling (tools/sst-guard.mjs) as the single source of logic while
// exposing the newer tools/sentinel.mjs path used by CI and npm scripts.

import './sst-guard.mjs';
