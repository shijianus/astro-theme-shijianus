#!/usr/bin/env node
/**
 * Automated Content Versioning & Date Synchronization Script
 * 
 * Rules:
 * 1. Tracks pure content hash (markdown body + content frontmatter, excluding version & updatedDate).
 * 2. Compares hash against src/data/content-version-manifest.json.
 * 3. If content diff is detected:
 *    - If author manually updated version in frontmatter, respect author's version.
 *    - If author did not update version, auto-increment patch version (e.g. v0.0.1 -> v0.0.2, v1.0.0 -> v1.0.1).
 *    - Never bump major or minor automatically.
 *    - Automatically record and update updatedDate to current build date (YYYY-MM-DD).
 * 4. Ensures all standards docs and blog posts have version, pubDate, and updatedDate properly maintained.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import yaml from 'js-yaml';

const ROOT_DIR = process.cwd();
const MANIFEST_PATH = path.resolve(ROOT_DIR, 'src/data/content-version-manifest.json');
const STANDARDS_DIR = path.resolve(ROOT_DIR, 'docs/standards');
const POSTS_DIR = path.resolve(ROOT_DIR, 'src/content/posts');

// Ensure parent directory exists
fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

let manifest = {};
if (fs.existsSync(MANIFEST_PATH)) {
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (err) {
    console.warn(`[Version Sync] Failed to read existing manifest, initializing fresh: ${err.message}`);
    manifest = {};
  }
}

/**
 * Increments the patch version number:
 * e.g. "v0.0.1" -> "v0.0.2", "v1.2.0" -> "v1.2.1", "1.0.0" -> "1.0.1"
 */
export function bumpPatchVersion(currentVersion) {
  if (!currentVersion || typeof currentVersion !== 'string') {
    return 'v0.0.1';
  }
  const hasV = currentVersion.startsWith('v');
  const clean = currentVersion.replace(/^v/, '').trim();
  const parts = clean.split('.');
  if (parts.length >= 3) {
    const major = parseInt(parts[0], 10) || 0;
    const minor = parseInt(parts[1], 10) || 0;
    const patch = (parseInt(parts[2], 10) || 0) + 1;
    return `${hasV ? 'v' : ''}${major}.${minor}.${patch}`;
  } else if (parts.length === 2) {
    const major = parseInt(parts[0], 10) || 0;
    const patch = (parseInt(parts[1], 10) || 0) + 1;
    return `${hasV ? 'v' : ''}${major}.${patch}`;
  } else {
    return `${hasV ? 'v' : ''}${clean}.1`;
  }
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatIsoDate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Splits markdown into { rawFrontmatter, body }
 */
function splitMarkdown(rawContent) {
  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { rawFrontmatter: '', body: rawContent, hasFrontmatter: false };
  }
  return { rawFrontmatter: match[1], body: match[2], hasFrontmatter: true };
}

/**
 * Computes SHA-256 of the content payload excluding version & updatedDate
 */
function computeContentPayloadHash(rawFrontmatter, body) {
  // Strip version: and updatedDate: lines from frontmatter
  const strippedFrontmatter = rawFrontmatter
    .split('\n')
    .filter((line) => !/^\s*(version|updatedDate)\s*:/i.test(line))
    .join('\n');
  const payload = `${strippedFrontmatter.trim()}\n---\n${body.trim()}`;
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * Updates or injects version and updatedDate in rawFrontmatter
 */
function injectFrontmatterFields(rawFrontmatter, fields) {
  let fm = rawFrontmatter;

  for (const [key, val] of Object.entries(fields)) {
    if (val === undefined || val === null) continue;
    const formattedVal = typeof val === 'string' && !val.startsWith('"') && !/^\d{4}-\d{2}-\d{2}$/.test(val)
      ? `"${val}"`
      : val;

    const regex = new RegExp(`(^|\\n)\\s*${key}\\s*:.*(?=\\n|$)`, 'g');
    if (regex.test(fm)) {
      fm = fm.replace(regex, `$1${key}: ${formattedVal}`);
    } else {
      // Append right at the end of frontmatter
      fm = `${fm.trimEnd()}\n${key}: ${formattedVal}`;
    }
  }

  return fm;
}

/**
 * Finds all markdown/mdx files in a directory recursively
 */
function findFiles(dir, exts = ['.md', '.mdx']) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Known default versions for standards documents
 */
const DEFAULT_STANDARDS_VERSIONS = {
  'docs/standards/index.md': 'v2.6.0',
  'docs/standards/activity-level.md': 'v1.2.0',
  'docs/standards/content-density.md': 'v1.1.0',
  'docs/standards/version.md': 'v1.0.0',
  'docs/standards/status.md': 'v1.0.0',
};

async function syncVersions() {
  const todayStr = formatIsoDate(new Date());
  console.log(`[Version Sync] Starting content version synchronization (Build Date: ${todayStr})...`);

  const standardsFiles = findFiles(STANDARDS_DIR);
  const postsFiles = findFiles(POSTS_DIR);
  const allFiles = [...standardsFiles, ...postsFiles];

  let updatedCount = 0;
  let initializedCount = 0;

  for (const filePath of allFiles) {
    const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const { rawFrontmatter, body, hasFrontmatter } = splitMarkdown(rawContent);

    if (!hasFrontmatter) continue;

    let parsedMeta = {};
    try {
      parsedMeta = yaml.load(rawFrontmatter) || {};
    } catch (e) {
      console.warn(`[Version Sync] Failed to parse YAML in ${relPath}: ${e.message}`);
      continue;
    }

    const currentHash = computeContentPayloadHash(rawFrontmatter, body);
    const existing = manifest[relPath];

    if (!existing) {
      // New file or first run
      const defaultVer = DEFAULT_STANDARDS_VERSIONS[relPath] || 'v0.0.1';
      const version = parsedMeta.version ? String(parsedMeta.version) : defaultVer;
      const pubDate = parsedMeta.pubDate
        ? (parsedMeta.pubDate instanceof Date ? formatIsoDate(parsedMeta.pubDate) : String(parsedMeta.pubDate))
        : todayStr;
      const updatedDate = parsedMeta.updatedDate
        ? (parsedMeta.updatedDate instanceof Date ? formatIsoDate(parsedMeta.updatedDate) : String(parsedMeta.updatedDate))
        : pubDate;

      manifest[relPath] = {
        contentHash: currentHash,
        version,
        pubDate,
        updatedDate,
      };

      // Check if frontmatter needs version or updatedDate written
      const needsUpdate = !parsedMeta.version || !parsedMeta.updatedDate;
      if (needsUpdate) {
        const newFm = injectFrontmatterFields(rawFrontmatter, {
          version,
          updatedDate,
        });
        fs.writeFileSync(filePath, `---\n${newFm.trim()}\n---\n${body}`, 'utf8');
      }
      initializedCount++;
    } else {
      // Existing record in manifest
      const fileVersion = parsedMeta.version ? String(parsedMeta.version) : undefined;

      if (currentHash !== existing.contentHash) {
        // Content changed!
        let finalVersion;
        if (fileVersion && fileVersion !== existing.version) {
          // Author manually updated version in frontmatter! Respect author's version.
          finalVersion = fileVersion;
          console.log(`[Version Sync] ${relPath} updated by author with new version: ${finalVersion}`);
        } else {
          // Author did NOT update version. Auto-bump patch version.
          finalVersion = bumpPatchVersion(existing.version || fileVersion || 'v0.0.1');
          console.log(`[Version Sync] ${relPath} content diff detected. Auto-bumping patch version: ${existing.version} -> ${finalVersion}`);
        }

        const finalUpdatedDate = todayStr;
        const newFm = injectFrontmatterFields(rawFrontmatter, {
          version: finalVersion,
          updatedDate: finalUpdatedDate,
        });
        fs.writeFileSync(filePath, `---\n${newFm.trim()}\n---\n${body}`, 'utf8');

        manifest[relPath] = {
          contentHash: currentHash,
          version: finalVersion,
          pubDate: existing.pubDate || (parsedMeta.pubDate ? String(parsedMeta.pubDate) : todayStr),
          updatedDate: finalUpdatedDate,
        };
        updatedCount++;
      } else {
        // Content did not change
        // If author manually edited version in frontmatter without body diff, sync manifest
        if (fileVersion && fileVersion !== existing.version) {
          manifest[relPath].version = fileVersion;
        }
      }
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`[Version Sync] Complete. Initialized: ${initializedCount}, Bumped/Updated: ${updatedCount}. Manifest saved to ${path.relative(ROOT_DIR, MANIFEST_PATH)}.`);
}

syncVersions().catch((err) => {
  console.error('[Version Sync] Fatal error during sync:', err);
  process.exit(1);
});
