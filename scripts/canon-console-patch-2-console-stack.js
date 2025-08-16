#!/usr/bin/env node
// scripts/canon-console-patch-2-console-stack.js
// Purpose: Fix console error stack capture to preserve original stacks

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🔧 Canon Console Patch 2: Fix Console Error Stack Capture');
console.log('==========================================================');

async function applyPatch() {
  try {
    const sinkPath = path.join(projectRoot, 'canon-console/sinks/consoleSink.js');
    const content = await fs.readFile(sinkPath, 'utf-8');
    
    // Find and replace the capture method
    const captureMethodOld = /capture\(level,\s*args\)\s*{[\s\S]*?^  \}/m;
    
    const captureMethodNew = `capture(level, args) {
    // Call original
    this.originalConsole[level]?.(...args);
    
    // If an Error object is present, prefer its message/stack
    const errArg = args.find(a => a instanceof Error);
    const message = errArg
      ? String(errArg.message || errArg.toString())
      : args.map(a => {
          if (typeof a === 'object') {
            try { 
              return JSON.stringify(a, null, 2); 
            } catch { 
              return String(a); 
            }
          }
          return String(a);
        }).join(' ');
    
    // Determine if we should capture
    if (!this.shouldCapture(level, message)) {
      return;
    }
    
    // Determine code and severity
    const { code, severity, tags } = this.analyze(level, message);
    
    // Create incident - use Error's stack if available
    const incident = new Incident({
      code,
      severity,
      message: message.substring(0, 500),
      tags: [...tags, 'console', level],
      evidence: {
        stack: errArg?.stack || (level === 'error' ? new Error().stack : null),
        raw: args
      }
    });
    
    this.store.add(incident);
  }`;
    
    let updatedContent = content;
    
    // Check if we need to update
    if (!content.includes('errArg?.stack')) {
      updatedContent = content.replace(captureMethodOld, captureMethodNew);
      
      await fs.writeFile(sinkPath, updatedContent, 'utf-8');
      console.log('✅ Updated: canon-console/sinks/consoleSink.js');
      console.log('   - Now captures original Error stacks');
      console.log('   - Preserves error context properly');
    } else {
      console.log('ℹ️  consoleSink.js already has stack capture fix');
    }
    
    console.log('\n✨ Patch 2 complete: Error stack capture fixed');
    
  } catch (error) {
    console.error('❌ Error applying patch:', error);
    process.exit(1);
  }
}

// Run the patch
applyPatch();