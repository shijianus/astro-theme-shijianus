/**
 * External Encrypt Token Utilities
 *
 * Generates a non-obvious URL token from a SHA-256 password hash.
 * The token looks random but is deterministic for a given hash.
 *
 * Algorithm (deliberately obfuscated, not a simple substring):
 *   1. Take chars at positions [4..9] of the hash (6 chars)
 *   2. Reverse chars at positions [18..21] (4 chars)
 *   3. Take char at position 30 + char at position 55 (2 chars)
 *   4. XOR the byte at position 0 with the byte at position 63 → to hex (2 chars)
 *   5. Concatenate in order: step1 + step3 + step2 + step4 → 14 chars
 * Result: a 14-char hex-looking token, e.g. "7a3f2c--b94e01d8c52fa"
 *
 * The encrypted slug is: `{original-slug}--x{token}`
 * Example: content-formats-and-markup-mastery--x7a3f2cb94e01d8
 */

/**
 * Derive the encrypted URL token from a SHA-256 hash string.
 * The hash must be a 64-char lowercase hex string.
 */
export function deriveEncryptedToken(hash: string): string {
  const h = hash.toLowerCase().trim();
  if (h.length !== 64) {
    throw new Error(`Invalid hash length: expected 64, got ${h.length}`);
  }
  // Step 1: positions 4–9 (6 chars)
  const part1 = h.slice(4, 10);
  // Step 2: positions 18–21 reversed (4 chars)
  const part2 = h.slice(18, 22).split('').reverse().join('');
  // Step 3: char at position 30 and position 55 (2 chars)
  const part3 = h[30]! + h[55]!;
  // Step 4: XOR byte[0] with byte[63] → 1 byte → 2 hex chars
  const byte0 = parseInt(h.slice(0, 2), 16);
  const byte63 = parseInt(h.slice(62, 64), 16);
  const part4 = (byte0 ^ byte63).toString(16).padStart(2, '0');
  // Assemble: part1 + part3 + part2 + part4
  return part1 + part3 + part2 + part4;
}

/**
 * Build the full encrypted slug from the original article slug and password hash.
 * Returns e.g. "content-formats-and-markup-mastery--x7a3f2c94e01d8b3"
 */
export function buildEncryptedSlug(originalSlug: string, hash: string): string {
  const token = deriveEncryptedToken(hash);
  return `${originalSlug}--x${token}`;
}

/**
 * Check if a slug looks like an encrypted slug (has the --x pattern).
 * Returns the original slug if it's an encrypted slug, or null otherwise.
 */
export function parseEncryptedSlug(slug: string): { originalSlug: string; token: string } | null {
  const match = slug.match(/^(.+)--x([0-9a-f]{14})$/);
  if (!match) return null;
  return { originalSlug: match[1]!, token: match[2]! };
}

/**
 * Verify that an encrypted slug's token matches the given hash.
 */
export function verifyEncryptedSlug(slug: string, hash: string): boolean {
  const parsed = parseEncryptedSlug(slug);
  if (!parsed) return false;
  try {
    const expected = deriveEncryptedToken(hash);
    return parsed.token === expected;
  } catch {
    return false;
  }
}
