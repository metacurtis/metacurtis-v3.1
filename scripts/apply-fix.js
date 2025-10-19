/* eslint-env node */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

class FixApplicator {
  constructor() {
    this.backupDir = join(projectRoot, '.fix-backups');
    this.results = [];
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  createBackup(filepath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = filepath.replace(/\//g, '_');
    const backupPath = join(this.backupDir, `${filename}.${timestamp}.backup`);
    copyFileSync(filepath, backupPath);
    return backupPath;
  }

  applyFix(fixConfig) {
    const { file, fixes, description } = fixConfig;
    const filepath = join(projectRoot, file);
    
    console.log(`\n📝 Processing: ${file}`);
    console.log(`   ${description || 'Applying fixes...'}`);
    
    if (!existsSync(filepath)) {
      console.log(`   ❌ File not found: ${filepath}`);
      this.results.push({ file, status: 'not_found' });
      return false;
    }

    const backup = this.createBackup(filepath);
    console.log(`   📁 Backup: ${backup}`);

    let content = readFileSync(filepath, 'utf8');
    let modified = false;

    fixes.forEach((fix, index) => {
      const { find, replace } = fix;
      
      if (content.includes(find)) {
        content = content.replace(find, replace);
        console.log(`   ✅ Applied fix #${index + 1}`);
        modified = true;
      } else {
        console.log(`   ⏭️  Fix #${index + 1} pattern not found`);
      }
    });

    if (modified) {
      writeFileSync(filepath, content, 'utf8');
      console.log(`   ✅ File updated successfully`);
      this.results.push({ file, status: 'fixed', backup });
    } else {
      console.log(`   ℹ️  No changes needed`);
      this.results.push({ file, status: 'unchanged' });
    }

    return modified;
  }

  async applyFixFile(fixFilePath) {
    console.log('🚀 MC3V Fix Applicator v1.0\n');
    
    try {
      const fixPath = join(projectRoot, fixFilePath);
      const { default: fixConfig } = await import(fixPath);
      
      console.log(`📋 Fix: ${fixConfig.name || 'Unnamed Fix'}`);
      console.log(`📝 Description: ${fixConfig.description}`);

      for (const fix of fixConfig.fixes) {
        this.applyFix(fix);
      }

      const fixed = this.results.filter(r => r.status === 'fixed').length;
      console.log(`\n✅ Fixed: ${fixed} files`);
      
      if (fixConfig.postApply) {
        await fixConfig.postApply();
      }
      
      console.log('\n✨ Done!');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

if (process.argv[2]) {
  const applicator = new FixApplicator();
  applicator.applyFixFile(process.argv[2]);
} else {
  console.log('Usage: node scripts/apply-fix.js <fix-file>');
}
