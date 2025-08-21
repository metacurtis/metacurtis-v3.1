#!/usr/bin/env node
/**
 * Codebase Health Check Doctor
 * Run before any major changes to verify system integrity
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const CRITICAL_FILES = [
  'src/App.jsx',
  'src/main.jsx',
  'vite.config.js',
  'jsconfig.json'
];

class HealthCheckDoctor {
  constructor() {
    this.issues = [];
    this.warnings = [];
  }

  checkCriticalFiles() {
    console.log('Checking critical files...');
    CRITICAL_FILES.forEach(file => {
      const fullPath = path.join(ROOT, file);
      if (!fs.existsSync(fullPath)) {
        this.issues.push(`Missing critical file: ${file}`);
      }
    });
  }

  checkImports() {
    console.log('Verifying imports...');
    const srcFiles = this.getAllFiles(path.join(ROOT, 'src'), ['.js', '.jsx']);
    
    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const imports = content.match(/import .* from ['"]([^'"]+)['"]/g) || [];
      
      imports.forEach(imp => {
        const match = imp.match(/from ['"]([^'"]+)['"]/);
        if (match) {
          const importPath = match[1];
          
          // Check alias imports
          if (importPath.startsWith('@/')) {
            const resolved = importPath.replace('@/', 'src/');
            const possiblePaths = [
              path.join(ROOT, resolved),
              path.join(ROOT, resolved + '.js'),
              path.join(ROOT, resolved + '.jsx'),
              path.join(ROOT, resolved, 'index.js'),
              path.join(ROOT, resolved, 'index.jsx')
            ];
            
            if (!possiblePaths.some(p => fs.existsSync(p))) {
              this.issues.push(`Broken import in ${path.relative(ROOT, file)}: ${importPath}`);
            }
          }
          
          // Check for non-standard aliases
          if (importPath.startsWith('@') && !importPath.startsWith('@/')) {
            const alias = importPath.split('/')[0];
            if (!['@theater', '@engine', '@modules'].includes(alias)) {
              this.warnings.push(`Non-standard alias in ${path.relative(ROOT, file)}: ${alias}`);
            }
          }
        }
      });
    });
  }

  checkWebGLHealth() {
    console.log('Checking WebGL components...');
    
    const webglFiles = [
      'src/components/webgl/WebGLCanvas.jsx',
      'src/components/webgl/WebGLBackground.jsx'
    ];
    
    webglFiles.forEach(file => {
      const fullPath = path.join(ROOT, file);
      if (!fs.existsSync(fullPath)) {
        this.issues.push(`Missing WebGL component: ${file}`);
      } else {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (!content.includes('from \'three\'') && !content.includes('from "three"')) {
          this.warnings.push(`WebGL component doesn't import Three.js: ${file}`);
        }
      }
    });
  }

  checkBuildSystem() {
    console.log('Checking build system...');
    
    try {
      execSync('npm run build --dry-run', { stdio: 'pipe' });
    } catch (e) {
      this.warnings.push('Build system may have issues (dry-run failed)');
    }
    
    // Check for conflicting dependencies
    try {
      const result = execSync('npm ls three', { encoding: 'utf8' });
      const matches = result.match(/three@/g);
      if (matches && matches.length > 1) {
        this.warnings.push('Multiple Three.js versions detected');
      }
    } catch (e) {
      // npm ls will error if there are issues
      this.warnings.push('Dependency tree has issues');
    }
  }

  checkAliases() {
    console.log('Checking alias configuration...');
    
    const jsconfig = path.join(ROOT, 'jsconfig.json');
    if (fs.existsSync(jsconfig)) {
      const config = JSON.parse(fs.readFileSync(jsconfig, 'utf8'));
      const paths = config.compilerOptions?.paths || {};
      
      // Standard aliases that should exist
      if (!paths['@/*']) {
        this.issues.push('Missing standard @/ alias in jsconfig.json');
      }
      
      // Check for orphaned aliases
      Object.keys(paths).forEach(alias => {
        if (alias !== '@/*' && alias !== '@/modules/*') {
          const targetPath = paths[alias][0];
          const resolved = path.join(ROOT, targetPath.replace('/*', ''));
          if (!fs.existsSync(resolved)) {
            this.issues.push(`Orphaned alias: ${alias} points to non-existent ${targetPath}`);
          }
        }
      });
    }
  }

  getAllFiles(dir, extensions) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      if (item === 'node_modules' || item.startsWith('.')) return;
      
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('CODEBASE HEALTH CHECK REPORT');
    console.log('='.repeat(60) + '\n');
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('✅ Codebase is healthy - safe to proceed with changes\n');
      return true;
    }
    
    if (this.issues.length > 0) {
      console.log('❌ CRITICAL ISSUES (must fix before proceeding):\n');
      this.issues.forEach(issue => console.log(`  - ${issue}`));
      console.log();
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS (should review):\n');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
      console.log();
    }
    
    console.log('📋 RECOMMENDATIONS:');
    console.log('  1. Fix all critical issues before making architectural changes');
    console.log('  2. Create a backup branch: git branch backup-$(date +%Y%m%d)');
    console.log('  3. Run this health check after each major change');
    console.log('  4. Keep imports simple - prefer @/ over custom aliases\n');
    
    return this.issues.length === 0;
  }
}

// Run health check
const doctor = new HealthCheckDoctor();
doctor.checkCriticalFiles();
doctor.checkImports();
doctor.checkWebGLHealth();
doctor.checkBuildSystem();
doctor.checkAliases();

const isHealthy = doctor.generateReport();
process.exit(isHealthy ? 0 : 1);
