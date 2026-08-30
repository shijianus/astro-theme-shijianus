/**
 * External Encrypt Token & Routing Utilities
 *
 * This module handles all URL generation, verification, and conflict detection
 * for the external encrypt system.
 *
 * URL Modes:
 *   1. suffix   → /posts/{original-slug}--x{token}/     (default, derived from hash)
 *   2. standalone → /posts/{custom-slug}/               (user-specified, independent)
 *   3. shared   → /posts/{shared-slug}/                 (shared across multiple articles)
 *
 * Token Modes (for suffix):
 *   A. Auto-derived: deterministic from SHA-256 hash (looks random, 14 hex chars)
 *   B. Custom:       user-specified token (4–48 lowercase alphanumeric)
 */

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface ExternalEncryptConfig {
  id?: string;
  hash: string;
  token?: string | null;
  slug?: string | null;
  sharedSlug?: string | null;
  contentSlug?: string | null;
  hint?: string | null;
  showButton?: boolean;
  title?: string | null;
}

export interface EncryptedRouteMatch {
  post: { id: string; data: { externalEncrypt?: ExternalEncryptConfig; externalEncrypts?: ExternalEncryptConfig[] } };
  config: ExternalEncryptConfig;
  encryptedSlug: string;
  originalPostId: string;
}

export interface ConflictWarning {
  type: 'collides-with-post' | 'duplicate';
  encryptedSlug: string;
  postId: string;
  otherPostId?: string;
  autoResolvedTo?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Token algorithm
// ────────────────────────────────────────────────────────────────────────────

const TOKEN_PATTERN = /^[a-z0-9]{4,48}$/;

/**
 * Validate a user-provided custom token (suffix mode).
 */
export function validateCustomToken(token: string): string {
  const t = token.toLowerCase().trim();
  if (!TOKEN_PATTERN.test(t)) {
    throw new Error(`Invalid custom token "${token}": must be 4–48 lowercase alphanumeric chars`);
  }
  return t;
}

/**
 * Derive the URL token from a SHA-256 hash using a non-obvious multi-step algorithm.
 * Input must be a 64-char lowercase hex string.
 * Output: 14 lowercase hex chars (looks random, is deterministic).
 *
 * Algorithm:
 *   1. h[4..9]          (6 chars)
 *   2. h[30] + h[55]    (2 chars)
 *   3. h[18..21] reversed (4 chars)
 *   4. byte[0] XOR byte[63] → hex (2 chars)
 *   concat: p1+p2+p3+p4 → 14 chars
 */
export function deriveEncryptedToken(hash: string): string {
  const h = hash.toLowerCase().trim();
  if (h.length !== 64) {
    throw new Error(`Invalid hash length: expected 64, got ${h.length}`);
  }
  const part1 = h.slice(4, 10);
  const part2 = h[30]! + h[55]!;
  const part3 = h.slice(18, 22).split('').reverse().join('');
  const byte0 = parseInt(h.slice(0, 2), 16);
  const byte63 = parseInt(h.slice(62, 64), 16);
  const part4 = (byte0 ^ byte63).toString(16).padStart(2, '0');
  return part1 + part2 + part3 + part4;
}

/**
 * Resolve the effective suffix token for a config in suffix mode.
 */
export function resolveToken(hash: string, customToken?: string | null): string {
  if (customToken) return validateCustomToken(customToken);
  return deriveEncryptedToken(hash);
}

// ────────────────────────────────────────────────────────────────────────────
// Slug builders
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build the suffix-mode encrypted slug.
 * Result: "{original-slug}--x{token}"
 */
export function buildEncryptedSlug(
  originalSlug: string,
  hash: string,
  customToken?: string | null,
): string {
  const token = resolveToken(hash, customToken);
  return `${originalSlug}--x${token}`;
}

/**
 * Resolve the full encrypted slug for a given post + config.
 * Handles all URL modes: suffix, standalone, shared.
 */
export function resolveConfigSlug(postId: string, config: ExternalEncryptConfig): string {
  if (config.slug) {
    // Standalone mode: completely custom slug
    return config.slug.toLowerCase().replace(/^\/+|\/+$/g, '');
  }
  if (config.sharedSlug) {
    // Shared mode: one URL across multiple articles
    return config.sharedSlug.toLowerCase().replace(/^\/+|\/+$/g, '');
  }
  // Suffix mode (default): extends original slug
  return buildEncryptedSlug(postId, config.hash, config.token ?? null);
}

/**
 * Parse a suffix-mode encrypted slug (--x pattern).
 */
export function parseEncryptedSlug(
  slug: string,
): { originalSlug: string; token: string } | null {
  const match = slug.match(/^(.+)--x([a-z0-9]{4,48})$/);
  if (!match) return null;
  return { originalSlug: match[1]!, token: match[2]! };
}

/**
 * Verify that a given slug matches a config's expected encrypted slug.
 */
export function verifyConfigSlug(
  slug: string,
  postId: string,
  config: ExternalEncryptConfig,
): boolean {
  const expected = resolveConfigSlug(postId, config);
  return slug === expected;
}

// ────────────────────────────────────────────────────────────────────────────
// Multi-config helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get all external encrypt configs for a post.
 * Handles both `externalEncrypt` (single) and `externalEncrypts` (array).
 * Assigns auto-generated IDs if not present.
 */
export function getPostEncryptConfigs(postData: {
  externalEncrypt?: ExternalEncryptConfig | null;
  externalEncrypts?: ExternalEncryptConfig[] | null;
}): ExternalEncryptConfig[] {
  if (postData.externalEncrypts && postData.externalEncrypts.length > 0) {
    return postData.externalEncrypts.map((c, i) => ({
      ...c,
      id: c.id ?? `enc-${i}`,
    }));
  }
  if (postData.externalEncrypt) {
    return [{ ...postData.externalEncrypt, id: postData.externalEncrypt.id ?? 'enc-0' }];
  }
  return [];
}

// ────────────────────────────────────────────────────────────────────────────
// Conflict detection & resolution
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build a map of all encrypted slugs across all posts, detect conflicts,
 * and return:
 *   - slugMap: Map<encryptedSlug, EncryptedRouteMatch> (first-wins for shared)
 *   - warnings: ConflictWarning[]
 *
 * @param posts All posts from getCollection
 * @param existingPostIds Set of all normal post IDs (to detect collisions)
 */
export function buildEncryptedSlugMap<P extends { id: string; data: { externalEncrypt?: ExternalEncryptConfig | null; externalEncrypts?: ExternalEncryptConfig[] | null } }>(
  posts: P[],
  existingPostIds: Set<string>,
): {
  slugMap: Map<string, { post: P; config: ExternalEncryptConfig }>;
  warnings: ConflictWarning[];
  allEncryptedSlugs: string[];
} {
  const slugMap = new Map<string, { post: P; config: ExternalEncryptConfig }>();
  const warnings: ConflictWarning[] = [];
  const sharedSlugsAdded = new Set<string>();
  const allEncryptedSlugs: string[] = [];

  for (const post of posts) {
    const configs = getPostEncryptConfigs(post.data);

    for (const config of configs) {
      let encSlug = resolveConfigSlug(post.id, config);

      // Check collision with real post IDs
      if (existingPostIds.has(encSlug)) {
        const autoSlug = buildEncryptedSlug(post.id, config.hash, (config.token ?? '') + 'x');
        warnings.push({
          type: 'collides-with-post',
          encryptedSlug: encSlug,
          postId: post.id,
          autoResolvedTo: autoSlug,
        });
        console.warn(
          `[ExternalEncrypt] ⚠️  Encrypted slug "${encSlug}" for post "${post.id}" collides with an existing post ID! Auto-resolved to "${autoSlug}".`
        );
        encSlug = autoSlug;
      }

      // Shared slugs: first article wins, others are intentional duplicates
      if (config.sharedSlug) {
        if (sharedSlugsAdded.has(encSlug)) {
          // Not a warning — intentional sharing; just add a mapping from this post too
          // (the content will be rendered from whichever post first registered it)
          continue;
        }
        sharedSlugsAdded.add(encSlug);
      } else if (slugMap.has(encSlug)) {
        // True duplicate (not shared) — warn and auto-resolve
        const other = slugMap.get(encSlug)!.post.id;
        const autoSlug = buildEncryptedSlug(post.id, config.hash, (config.token ?? '') + 'alt');
        warnings.push({
          type: 'duplicate',
          encryptedSlug: encSlug,
          postId: post.id,
          otherPostId: other,
          autoResolvedTo: autoSlug,
        });
        console.warn(
          `[ExternalEncrypt] ⚠️  Duplicate encrypted slug "${encSlug}" for posts "${post.id}" and "${other}". Auto-resolved for "${post.id}" to "${autoSlug}".`
        );
        encSlug = autoSlug;
      }

      slugMap.set(encSlug, { post, config });
      allEncryptedSlugs.push(encSlug);
    }
  }

  return { slugMap, warnings, allEncryptedSlugs };
}

/**
 * Find the encrypted route match for a given slug.
 * Checks all posts' configs efficiently.
 */
export function findEncryptedRouteMatch<P extends { id: string; data: { externalEncrypt?: ExternalEncryptConfig | null; externalEncrypts?: ExternalEncryptConfig[] | null } }>(
  slug: string,
  posts: P[],
): { post: P; config: ExternalEncryptConfig } | null {
  const parsed = parseEncryptedSlug(slug);

  for (const post of posts) {
    const configs = getPostEncryptConfigs(post.data);
    for (const config of configs) {
      // Fast path: if suffix pattern, check original slug prefix first
      if (parsed && !config.slug && !config.sharedSlug) {
        if (parsed.originalSlug !== post.id) continue;
      }
      if (verifyConfigSlug(slug, post.id, config)) {
        return { post, config };
      }
    }
  }

  return null;
}
