#!/usr/bin/env node

/**
 * State Dependency Doctor - Self-Bootstrapping State Architecture Analyzer
 * 
 * Purpose: Complete analysis of state flow from boot → render
 * Maps: upstream/downstream dependencies, atoms, render path, previous attempts
 * 
 * Run: node scripts/doctor_state_dependency.cjs
 */

const fs = require('fs');
const path = require('path');

class StateDependencyDoctor {
  constructor() {
    this.rootDir = process.cwd();
    this.srcDir = path.join(this.rootDir, 'src');
    
    // Analysis results
    this.bootSequence = [];
    this.stateFlows = new Map();
    this.atoms = new Map();
    this.renderPath = [];
    this.dependencies = {
      upstream: new Map(),   // What feeds into each component
      downstream: new Map(), // What each component feeds
      bidirectional: new Map()
    };
    this.previousAttempts = [];
    this.issues = [];
    this.recommendations = [];
    
    // File categories
    this.categories = {
      entry: ['main.jsx', 'App.jsx'],
      state: ['atoms/', 'stores/', 'StateCore', 'state/'],
      events: ['BeatBus', 'EventEmitter', 'CentralEventClock'],
      rendering: ['WebGLCanvas', 'WebGLBackground', 'ConsciousnessTheater'],
      config: ['canon/', 'config/', 'constants/'],
      bridges: ['Bridge', 'Adapter', 'Controller']
    };
  }

  async analyze() {
    console.log('🔬 State Dependency Doctor - Self-Bootstrapping Analysis\n');
    console.log('=' .repeat(80));
    
    try {
      // Phase 1: Map boot sequence
      console.log('\n📊 Phase 1: Mapping Boot Sequence...');
      await this.mapBootSequence();
      
      // Phase 2: Discover all atoms
      console.log('\n⚛️ Phase 2: Discovering Atoms...');
      await this.discoverAtoms();
      
      // Phase 3: Map state flows
      console.log('\n🔄 Phase 3: Mapping State Flows...');
      await this.mapStateFlows();
      
      // Phase 4: Trace render path
      console.log('\n🎨 Phase 4: Tracing Render Path...');
      await this.traceRenderPath();
      
      // Phase 5: Map dependencies
      console.log('\n🕸️ Phase 5: Mapping Dependencies...');
      await this.mapDependencies();
      
      // Phase 6: Detect previous attempts
      console.log('\n🕵️ Phase 6: Detecting Previous State Layer Attempts...');
      await this.detectPreviousAttempts();
      
      // Phase 7: Health check
      console.log('\n❤️ Phase 7: Health Check...');
      await this.performHealthCheck();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  }

  async mapBootSequence() {
    // Start from main.jsx
    const mainPath = path.join(this.srcDir, 'main.jsx');
    if (fs.existsSync(mainPath)) {
      const content = fs.readFileSync(mainPath, 'utf8');
      
      // Track initialization order
      const imports = this.extractImports(content);
      const renders = content.match(/createRoot|render|ReactDOM/g);
      
      this.bootSequence.push({
        file: 'main.jsx',
        stage: 'entry',
        imports: imports.length,
        initializes: renders ? renders.length : 0
      });
      
      // Follow App.jsx
      const appPath = path.join(this.srcDir, 'App.jsx');
      if (fs.existsSync(appPath)) {
        const appContent = fs.readFileSync(appPath, 'utf8');
        
        // Check what App initializes
        const stateInits = appContent.match(/use\w+Store|useAtom|useState/g) || [];
        const effectInits = appContent.match(/useEffect|useLayoutEffect/g) || [];
        
        this.bootSequence.push({
          file: 'App.jsx',
          stage: 'app',
          stateInits: stateInits.length,
          effectInits: effectInits.length,
          components: this.extractComponents(appContent)
        });
      }
    }
    
    // Check for initialization modules
    const initFiles = this.findFiles(this.srcDir, /init|setup|bootstrap/i);
    for (const file of initFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const exports = content.match(/export\s+(const|function|class)\s+(\w+)/g) || [];
      
      this.bootSequence.push({
        file: path.relative(this.srcDir, file),
        stage: 'initialization',
        exports: exports.length,
        isAsync: content.includes('async') || content.includes('Promise')
      });
    }
    
    console.log(`  ✓ Found ${this.bootSequence.length} boot stages`);
  }

  async discoverAtoms() {
    // Find all atom definitions
    const atomPaths = [
      path.join(this.srcDir, 'stores', 'atoms'),
      path.join(this.srcDir, 'state', 'atoms'),
      path.join(this.srcDir, 'atoms')
    ];
    
    for (const atomPath of atomPaths) {
      if (fs.existsSync(atomPath)) {
        const files = fs.readdirSync(atomPath)
          .filter(f => f.endsWith('.js') || f.endsWith('.jsx'));
        
        for (const file of files) {
          const filePath = path.join(atomPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Extract atom definitions - Fixed regex with global flag
          const atomRegex = /export\s+const\s+(\w+)\s*=\s*atom\(/g;
          const atomMatches = content.match(atomRegex) || [];
          
          for (const match of atomMatches) {
            const atomNameMatch = match.match(/export\s+const\s+(\w+)/);
            if (atomNameMatch) {
              const atomName = atomNameMatch[1];
              
              // Get default value
              const defaultMatch = content.match(new RegExp(`${atomName}\\s*=\\s*atom\\(([^)]+)\\)`));
              let defaultValue = 'unknown';
              if (defaultMatch) {
                defaultValue = defaultMatch[1].trim();
              }
              
              // Check for derived atoms
              const isDerived = content.includes(`get(${atomName}`) || 
                              content.includes('derived');
              
              this.atoms.set(atomName, {
                name: atomName,
                file: path.relative(this.srcDir, filePath),
                defaultValue,
                isDerived,
                consumers: [],
                producers: []
              });
            }
          }
        }
      }
    }
    
    // Find atom usage
    const allFiles = this.findFiles(this.srcDir, /\.(jsx?|tsx?)$/);
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.srcDir, file);
      
      for (const [atomName, atomInfo] of this.atoms) {
        // Check if file uses this atom
        if (content.includes(`useAtom(${atomName}`) || 
            content.includes(`useAtomValue(${atomName}`) ||
            content.includes(`useSetAtom(${atomName}`)) {
          atomInfo.consumers.push(relativePath);
        }
        
        // Check if file sets this atom
        if (content.includes(`set${atomName}`) || 
            content.includes(`${atomName}.set`)) {
          atomInfo.producers.push(relativePath);
        }
      }
    }
    
    console.log(`  ✓ Discovered ${this.atoms.size} atoms`);
  }

  async mapStateFlows() {
    // Map how state flows through the system - Fixed with global flags
    const flowPatterns = [
      { pattern: /BeatBus\.emit\(['"](\w+)['"]/g, type: 'event_emit' },
      { pattern: /BeatBus\.on\(['"](\w+)['"]/g, type: 'event_listen' },
      { pattern: /set(\w+)\(/g, type: 'state_set' },
      { pattern: /use(\w+)Store/g, type: 'store_use' },
      { pattern: /dispatch\(\{[^}]*type:\s*['"](\w+)['"]/g, type: 'dispatch' }
    ];
    
    const files = this.findFiles(this.srcDir, /\.(jsx?|tsx?)$/);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.srcDir, file);
      
      const flows = [];
      
      for (const { pattern, type } of flowPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          flows.push({
            type,
            target: match[1] || 'unknown',
            line: this.getLineNumber(content, match.index)
          });
        }
      }
      
      if (flows.length > 0) {
        this.stateFlows.set(relativePath, flows);
      }
    }
    
    console.log(`  ✓ Mapped ${this.stateFlows.size} files with state flows`);
  }

  async traceRenderPath() {
    // Trace from state change to render
    const renderTrace = [];
    
    // Start from WebGL components
    const webglFiles = this.findFiles(this.srcDir, /WebGL|Canvas|Render/);
    
    for (const file of webglFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.srcDir, file);
      
      // What props does it receive?
      const propsMatch = content.match(/function\s+\w+\s*\((\{[^}]+\}|\w+)\)/);
      let props = [];
      if (propsMatch) {
        const propsStr = propsMatch[1];
        if (propsStr.startsWith('{')) {
          props = propsStr.match(/\w+/g) || [];
        }
      }
      
      // What state does it use?
      const stateHooks = content.match(/use\w+/g) || [];
      
      // What triggers re-renders?
      const dependencies = [];
      const effectRegex = /useEffect\([^,]+,\s*\[([^\]]*)\]/g;
      let effectMatch;
      while ((effectMatch = effectRegex.exec(content)) !== null) {
        const deps = effectMatch[1].split(',').map(d => d.trim()).filter(Boolean);
        dependencies.push(...deps);
      }
      
      renderTrace.push({
        component: relativePath,
        props,
        stateHooks: [...new Set(stateHooks)],
        dependencies: [...new Set(dependencies)],
        isWebGL: content.includes('three') || content.includes('THREE')
      });
    }
    
    this.renderPath = renderTrace;
    console.log(`  ✓ Traced ${renderTrace.length} components in render path`);
  }

  async mapDependencies() {
    const files = this.findFiles(this.srcDir, /\.(jsx?|tsx?)$/);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.srcDir, file).replace(/\\/g, '/');
      
      // Extract imports (upstream dependencies)
      const imports = this.extractImports(content);
      const upstream = imports
        .filter(imp => imp.startsWith('.') || imp.startsWith('src/'))
        .map(imp => this.resolveImportPath(file, imp));
      
      this.dependencies.upstream.set(relativePath, upstream);
      
      // Track exports (what downstream can consume)
      const exports = content.match(/export\s+(const|function|class|default)\s+(\w+)?/g) || [];
      
      // For each export, find who imports it
      const downstream = [];
      for (const otherFile of files) {
        if (otherFile === file) continue;
        
        const otherContent = fs.readFileSync(otherFile, 'utf8');
        const otherRelative = path.relative(this.srcDir, otherFile).replace(/\\/g, '/');
        
        // Check if other file imports from this file
        if (otherContent.includes(`from '${relativePath}'`) ||
            otherContent.includes(`from './${relativePath}'`) ||
            otherContent.includes(`from '../${relativePath}'`)) {
          downstream.push(otherRelative);
        }
      }
      
      this.dependencies.downstream.set(relativePath, downstream);
      
      // Identify bidirectional dependencies (potential issues)
      for (const dep of upstream) {
        const depDownstream = this.dependencies.downstream.get(dep) || [];
        if (depDownstream.includes(relativePath)) {
          const pair = [relativePath, dep].sort().join(' <-> ');
          if (!this.dependencies.bidirectional.has(pair)) {
            this.dependencies.bidirectional.set(pair, {
              files: [relativePath, dep],
              type: 'circular'
            });
          }
        }
      }
    }
    
    console.log(`  ✓ Mapped ${this.dependencies.upstream.size} files with dependencies`);
    console.log(`  ⚠️ Found ${this.dependencies.bidirectional.size} bidirectional dependencies`);
  }

  async detectPreviousAttempts() {
    // Look for evidence of previous state management attempts
    const patterns = [
      { pattern: /StateCore|stateCore/, name: 'StateCore' },
      { pattern: /StateManager|stateManager/, name: 'StateManager' },
      { pattern: /StateBridge|stateBridge/, name: 'StateBridge' },
      { pattern: /StateAdapter|stateAdapter/, name: 'StateAdapter' },
      { pattern: /GlobalState|globalState/, name: 'GlobalState' },
      { pattern: /AppState|appState/, name: 'AppState' },
      { pattern: /Redux|redux/, name: 'Redux' },
      { pattern: /MobX|mobx/, name: 'MobX' },
      { pattern: /Recoil|recoil/, name: 'Recoil' },
      { pattern: /Valtio|valtio/, name: 'Valtio' }
    ];
    
    const files = this.findFiles(this.srcDir, /\.(jsx?|tsx?)$/);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.srcDir, file).replace(/\\/g, '/');
      
      for (const { pattern, name } of patterns) {
        if (pattern.test(content)) {
          // Check if it's commented out
          const lines = content.split('\n');
          const matchingLines = lines
            .map((line, idx) => ({ line, idx: idx + 1 }))
            .filter(({ line }) => pattern.test(line));
          
          const commentedLines = matchingLines.filter(({ line }) => 
            line.trim().startsWith('//') || 
            line.trim().startsWith('/*') ||
            line.trim().startsWith('*')
          );
          
          if (matchingLines.length > 0) {
            this.previousAttempts.push({
              pattern: name,
              file: relativePath,
              totalOccurrences: matchingLines.length,
              commentedOccurrences: commentedLines.length,
              isActive: commentedLines.length < matchingLines.length,
              lines: matchingLines.slice(0, 3).map(m => m.idx)
            });
          }
        }
      }
    }
    
    // Check for orphaned state files
    const stateFiles = this.findFiles(this.srcDir, /state|store/i);
    for (const file of stateFiles) {
      const relativePath = path.relative(this.srcDir, file).replace(/\\/g, '/');
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file is imported anywhere
      let isImported = false;
      for (const otherFile of files) {
        if (otherFile === file) continue;
        const otherContent = fs.readFileSync(otherFile, 'utf8');
        if (otherContent.includes(relativePath)) {
          isImported = true;
          break;
        }
      }
      
      if (!isImported && !relativePath.includes('test')) {
        this.previousAttempts.push({
          pattern: 'Orphaned State File',
          file: relativePath,
          totalOccurrences: 1,
          commentedOccurrences: 0,
          isActive: false,
          isOrphaned: true
        });
      }
    }
    
    console.log(`  ✓ Found ${this.previousAttempts.length} previous state attempts`);
  }

  async performHealthCheck() {
    // Check boot sequence health
    if (this.bootSequence.length === 0) {
      this.issues.push({
        severity: 'critical',
        category: 'boot',
        message: 'No boot sequence detected - missing main.jsx or App.jsx'
      });
    }
    
    // Check for disconnected atoms
    for (const [atomName, atomInfo] of this.atoms) {
      if (atomInfo.consumers.length === 0 && !atomInfo.isDerived) {
        this.issues.push({
          severity: 'warning',
          category: 'atoms',
          message: `Atom '${atomName}' has no consumers`,
          file: atomInfo.file
        });
      }
      
      if (atomInfo.producers.length === 0 && !atomInfo.isDerived) {
        this.issues.push({
          severity: 'info',
          category: 'atoms',
          message: `Atom '${atomName}' is never updated`,
          file: atomInfo.file
        });
      }
    }
    
    // Check for circular dependencies
    for (const [pair, info] of this.dependencies.bidirectional) {
      this.issues.push({
        severity: 'warning',
        category: 'dependencies',
        message: `Circular dependency: ${pair}`,
        files: info.files
      });
    }
    
    // Check render path integrity
    const webglComponents = this.renderPath.filter(r => r.isWebGL);
    if (webglComponents.length === 0) {
      this.issues.push({
        severity: 'warning',
        category: 'render',
        message: 'No WebGL components found in render path'
      });
    }
    
    // Check for state flow issues
    const emitters = new Set();
    const listeners = new Set();
    
    for (const [file, flows] of this.stateFlows) {
      for (const flow of flows) {
        if (flow.type === 'event_emit') {
          emitters.add(flow.target);
        } else if (flow.type === 'event_listen') {
          listeners.add(flow.target);
        }
      }
    }
    
    // Events with no listeners
    for (const event of emitters) {
      if (!listeners.has(event)) {
        this.issues.push({
          severity: 'warning',
          category: 'events',
          message: `Event '${event}' is emitted but never listened to`
        });
      }
    }
    
    // Listeners with no emitters
    for (const event of listeners) {
      if (!emitters.has(event)) {
        this.issues.push({
          severity: 'info',
          category: 'events',
          message: `Event '${event}' has listener but is never emitted`
        });
      }
    }
    
    console.log(`  ✓ Found ${this.issues.length} health issues`);
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 STATE DEPENDENCY ANALYSIS REPORT');
    console.log('='.repeat(80));
    
    // Boot Sequence
    console.log('\n�� BOOT SEQUENCE:');
    console.log('─'.repeat(40));
    for (const stage of this.bootSequence) {
      console.log(`  ${stage.stage.padEnd(15)} ${stage.file}`);
      if (stage.stateInits) {
        console.log(`    → State inits: ${stage.stateInits}`);
      }
      if (stage.effectInits) {
        console.log(`    → Effect inits: ${stage.effectInits}`);
      }
    }
    
    // Atoms
    console.log('\n⚛️ DISCOVERED ATOMS:');
    console.log('─'.repeat(40));
    if (this.atoms.size === 0) {
      console.log('  ⚠️ No atoms found - check stores/atoms directory');
    } else {
      for (const [name, info] of this.atoms) {
        const status = info.consumers.length === 0 ? '⚠️ UNUSED' : 
                      info.producers.length === 0 ? '📝 READ-ONLY' : '✅ ACTIVE';
        console.log(`  ${status} ${name}`);
        console.log(`    File: ${info.file}`);
        console.log(`    Default: ${info.defaultValue.substring(0, 50)}`);
        console.log(`    Consumers: ${info.consumers.length} | Producers: ${info.producers.length}`);
      }
    }
    
    // Render Path
    console.log('\n🎨 RENDER PATH:');
    console.log('─'.repeat(40));
    for (const component of this.renderPath) {
      const type = component.isWebGL ? '🎮 WebGL' : '🖼️ React';
      console.log(`  ${type} ${component.component}`);
      if (component.props.length > 0) {
        console.log(`    Props: ${component.props.join(', ')}`);
      }
      if (component.stateHooks.length > 0) {
        console.log(`    Hooks: ${component.stateHooks.join(', ')}`);
      }
      if (component.dependencies.length > 0) {
        console.log(`    Deps: ${component.dependencies.join(', ')}`);
      }
    }
    
    // State Flows
    console.log('\n🔄 STATE FLOW SUMMARY:');
    console.log('─'.repeat(40));
    const flowSummary = new Map();
    for (const [file, flows] of this.stateFlows) {
      for (const flow of flows) {
        const key = `${flow.type}: ${flow.target || 'unknown'}`;
        flowSummary.set(key, (flowSummary.get(key) || 0) + 1);
      }
    }
    
    const sortedFlows = Array.from(flowSummary.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [flow, count] of sortedFlows) {
      console.log(`  ${flow.padEnd(40)} ${count}x`);
    }
    
    // Previous Attempts
    if (this.previousAttempts.length > 0) {
      console.log('\n🕵️ PREVIOUS STATE LAYER ATTEMPTS:');
      console.log('─'.repeat(40));
      
      const activeAttempts = this.previousAttempts.filter(a => a.isActive);
      const inactiveAttempts = this.previousAttempts.filter(a => !a.isActive);
      
      if (activeAttempts.length > 0) {
        console.log('  Active:');
        for (const attempt of activeAttempts) {
          console.log(`    • ${attempt.pattern} in ${attempt.file}`);
          console.log(`      ${attempt.totalOccurrences} occurrences (${attempt.commentedOccurrences} commented)`);
        }
      }
      
      if (inactiveAttempts.length > 0) {
        console.log('  Inactive/Commented:');
        for (const attempt of inactiveAttempts) {
          const type = attempt.isOrphaned ? 'ORPHANED' : 'COMMENTED';
          console.log(`    • [${type}] ${attempt.pattern} in ${attempt.file}`);
        }
      }
    }
    
    // Health Issues
    if (this.issues.length > 0) {
      console.log('\n❤️ HEALTH CHECK RESULTS:');
      console.log('─'.repeat(40));
      
      const critical = this.issues.filter(i => i.severity === 'critical');
      const warnings = this.issues.filter(i => i.severity === 'warning');
      const info = this.issues.filter(i => i.severity === 'info');
      
      if (critical.length > 0) {
        console.log('  🔴 Critical Issues:');
        for (const issue of critical) {
          console.log(`    • ${issue.message}`);
        }
      }
      
      if (warnings.length > 0) {
        console.log('  🟡 Warnings:');
        for (const issue of warnings.slice(0, 5)) {
          console.log(`    • ${issue.message}`);
        }
        if (warnings.length > 5) {
          console.log(`    ... and ${warnings.length - 5} more`);
        }
      }
      
      if (info.length > 0) {
        console.log('  🔵 Info:');
        for (const issue of info.slice(0, 3)) {
          console.log(`    • ${issue.message}`);
        }
        if (info.length > 3) {
          console.log(`    ... and ${info.length - 3} more`);
        }
      }
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('─'.repeat(40));
    
    // Generate smart recommendations based on analysis
    if (this.atoms.size === 0 && this.stateFlows.size > 0) {
      console.log('  ⚠️ No atoms found but state flows exist');
      console.log('     → Check if atoms are defined with different pattern');
      console.log('     → Or create new atoms in stores/atoms/');
    } else if (this.atoms.size > 0 && this.stateFlows.size > 0) {
      console.log('  ✅ State infrastructure exists - ready for StateCore integration');
      console.log('     → Create StateCore as central authority');
      console.log('     → Bridge existing atoms through BeatBus');
      console.log('     → Maintain current WebGL render path');
    }
    
    const unusedAtoms = Array.from(this.atoms.values())
      .filter(a => a.consumers.length === 0);
    if (unusedAtoms.length > 0) {
      console.log(`  ⚠️ Remove or connect ${unusedAtoms.length} unused atoms`);
    }
    
    if (this.dependencies.bidirectional.size > 0) {
      console.log(`  ⚠️ Resolve ${this.dependencies.bidirectional.size} circular dependencies`);
    }
    
    const orphanedFiles = this.previousAttempts
      .filter(a => a.isOrphaned);
    if (orphanedFiles.length > 0) {
      console.log(`  🧹 Clean up ${orphanedFiles.length} orphaned state files`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✨ Analysis complete! Ready for StateCore integration.');
    console.log('='.repeat(80));
  }

  // Helper methods
  extractImports(content) {
    const imports = [];
    const importRegex = /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }

  extractComponents(content) {
    const components = [];
    const componentRegex = /<(\w+)/g;
    let match;
    while ((match = componentRegex.exec(content)) !== null) {
      const name = match[1];
      if (name[0] === name[0].toUpperCase() && !['React', 'Fragment'].includes(name)) {
        components.push(name);
      }
    }
    return [...new Set(components)];
  }

  findFiles(dir, pattern) {
    const files = [];
    
    function traverse(currentDir) {
      if (!fs.existsSync(currentDir)) return;
      
      const entries = fs.readdirSync(currentDir);
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!entry.startsWith('.') && entry !== 'node_modules' && entry !== 'dist') {
            traverse(fullPath);
          }
        } else if (pattern.test(entry)) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  resolveImportPath(fromFile, importPath) {
    if (!importPath.startsWith('.')) {
      return importPath;
    }
    
    const fromDir = path.dirname(fromFile);
    const resolved = path.join(fromDir, importPath);
    return path.relative(this.srcDir, resolved).replace(/\\/g, '/');
  }

  getLineNumber(content, index) {
    const lines = content.substring(0, index).split('\n');
    return lines.length;
  }
}

// Self-bootstrap and run
async function main() {
  const doctor = new StateDependencyDoctor();
  await doctor.analyze();
}

main().catch(console.error);
