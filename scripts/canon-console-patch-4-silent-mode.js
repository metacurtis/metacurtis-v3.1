#!/usr/bin/env node
/* eslint-env node */
// scripts/canon-console-patch-4-silent-mode.js
// Purpose: Add debug flag and quiet reconnect behavior

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🔧 Canon Console Patch 4: Silent Mode & Graceful Reconnect');
console.log('============================================================');

async function applyPatch() {
  try {
    const injectPath = path.join(projectRoot, 'canon-console/browser/inject.js');
    let content = await fs.readFile(injectPath, 'utf-8');
    
    // Add debug flag at the top
    if (!content.includes('CC_DEBUG')) {
      const debugFlag = `// Debug flag - set window.__CANON_CONSOLE_DEBUG = true to see logs
const CC_DEBUG = typeof window !== 'undefined' && window.__CANON_CONSOLE_DEBUG;

`;
      content = content.replace(
        "import incidentStore",
        debugFlag + "import incidentStore"
      );
    }
    
    // Replace all console.log calls with CC_DEBUG checks
    content = content.replace(
      /console\.log\('\[Canon Console\]/g,
      "if (CC_DEBUG) console.log('[Canon Console]"
    );
    
    content = content.replace(
      /console\.error\('\[Canon Console\]/g,
      "if (CC_DEBUG) console.error('[Canon Console]"
    );
    
    // Fix scheduleReconnect to limit attempts
    const scheduleReconnectNew = `  scheduleReconnect() {
    // Give up quietly after max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (CC_DEBUG) console.log('[Canon Console] Max reconnect attempts reached, going quiet');
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;
    
    if (CC_DEBUG) console.log(\`[Canon Console] Reconnecting in \${delay}ms... (attempt \${this.reconnectAttempts}/\${this.maxReconnectAttempts})\`);
    setTimeout(() => this.connect(), delay);
  }`;
    
    content = content.replace(
      /scheduleReconnect\(\)\s*{[\s\S]*?^  \}/m,
      scheduleReconnectNew
    );
    
    // Add maxReconnectAttempts to constructor if not present
    if (!content.includes('maxReconnectAttempts')) {
      content = content.replace(
        'this.reconnectAttempts = 0;',
        'this.reconnectAttempts = 0;\n    this.maxReconnectAttempts = 5;'
      );
    }
    
    // Add window.CanonConsole export at the end
    if (!content.includes('window.CanonConsole')) {
      content = content.replace(
        '  } else {\n    canonConsole.init();\n  }',
        `  } else {
    canonConsole.init();
  }
  
  // Export for use
  window.CanonConsole = canonConsole;`
      );
    }
    
    await fs.writeFile(injectPath, content, 'utf-8');
    console.log('✅ Updated: canon-console/browser/inject.js');
    console.log('   - Added CC_DEBUG flag (window.__CANON_CONSOLE_DEBUG)');
    console.log('   - Limited reconnect attempts to 5');
    console.log('   - Console is quiet by default');
    console.log('   - Exposed window.CanonConsole for debugging');
    
    console.log('\n✨ Patch 4 complete: Silent mode enabled');
    
  } catch (error) {
    console.error('❌ Error applying patch:', error);
    process.exit(1);
  }
}

// Run the patch
applyPatch();