import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const TEST_FILE = path.resolve(process.cwd(), 'docs/standards/activity-level.md');
const MANIFEST_PATH = path.resolve(process.cwd(), 'src/data/content-version-manifest.json');

console.log('[Test] Testing automated version bumping on content modification...');

// Read original content & manifest
const originalContent = fs.readFileSync(TEST_FILE, 'utf8');
const originalManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const originalVer = originalManifest['docs/standards/activity-level.md'].version;

console.log(`[Test] Original version in manifest: ${originalVer}`);

try {
  // 1. Modify content without updating version
  const modifiedContent = originalContent + '\n\n<!-- auto-bump-test-marker -->\n';
  fs.writeFileSync(TEST_FILE, modifiedContent, 'utf8');

  // 2. Run version sync
  const output = execSync('node scripts/sync-content-versions.mjs', { encoding: 'utf8' });
  console.log(output);

  // 3. Inspect updated manifest and updated file frontmatter
  const updatedManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const updatedVer = updatedManifest['docs/standards/activity-level.md'].version;
  const newContent = fs.readFileSync(TEST_FILE, 'utf8');

  console.log(`[Test] Version after content modification: ${updatedVer}`);
  const match = newContent.match(/version:\s*"([^"]+)"/);
  console.log(`[Test] Version in frontmatter: ${match ? match[1] : 'NOT FOUND'}`);

  if (updatedVer !== 'v1.2.1' || (match && match[1] !== 'v1.2.1')) {
    throw new Error(`Auto-bump failed! Expected v1.2.1, got manifest: ${updatedVer}, file: ${match ? match[1] : 'none'}`);
  }

  console.log('[Test] Auto-bump verification SUCCESSFUL! ✓');
} finally {
  // Revert test modification
  fs.writeFileSync(TEST_FILE, originalContent, 'utf8');
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(originalManifest, null, 2), 'utf8');
  console.log('[Test] Reverted test file and manifest.');
}
