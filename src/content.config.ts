import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * External Encrypt Entry Schema
 *
 * Supports 4 URL modes:
 *   1. suffix (default): /posts/{original-slug}--x{token}/
 *      → hash-derived token, or user-provided `token` field
 *   2. standalone:       /posts/{slug}/
 *      → completely custom URL, not extending the original slug
 *   3. shared:           /posts/{sharedSlug}/
 *      → one URL shared across multiple articles
 *   4. cross-article:    `contentSlug` renders another MD file's content
 *
 * Multiple entries per article: use `externalEncrypts: []`
 * Single entry (backward compat): use `externalEncrypt: {}`
 *
 * Conflict resolution:
 *   - If a custom slug collides with an existing post, a warning is logged
 *     and a new URL is auto-assigned.
 *   - Duplicate sharedSlug across articles is intentional — first one wins
 *     for content rendering.
 */
const ExternalEncryptEntrySchema = z.object({
  /** Unique ID for this config within the article (auto-generated if omitted) */
  id: z.string().optional(),

  /** SHA-256 of the password (64-char hex string) */
  hash: z.string(),

  /**
   * Custom suffix token (4–48 lowercase alphanumeric chars).
   * Overrides the hash-derived token. Produces: /posts/{slug}--x{token}/
   */
  token: z.string().optional(),

  /**
   * Standalone slug — a completely independent URL, not extending the original slug.
   * Example: slug: "ssg-secret-annex" → /posts/ssg-secret-annex/
   * Conflicts with existing posts are auto-resolved.
   */
  slug: z.string().optional(),

  /**
   * Shared slug — allows multiple articles to point to the same encrypted URL.
   * Example: sharedSlug: "team-internal" → /posts/team-internal/
   * The FIRST article that defines this sharedSlug owns the content rendering.
   */
  sharedSlug: z.string().optional(),

  /**
   * Cross-article content reference.
   * When visiting this encrypted URL, render the content of another post
   * instead of the current one. Use the other post's ID (filename without extension).
   * Example: contentSlug: "my-other-post"
   */
  contentSlug: z.string().optional(),

  /** Optional hint text shown in the password gate UI */
  hint: z.string().optional(),

  /**
   * Whether to show the "enter encrypted version" entry button in the normal article.
   * Set to false to make this a secret URL (no button shown, link shared privately).
   * Default: true
   */
  showButton: z.boolean().default(true),

  /** Custom label for the entry button. Defaults to the article title. */
  title: z.string().optional(),
});

const postsCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    outdateDays: z.number().int().positive().optional(),
    validDays: z.number().int().positive().optional(),
    description: z.string().optional(),
    summary: z.string().optional(),
    aiSummary: z.string().optional(),
    ai_summary: z.string().optional(),
    author: z.string().default('shijianus'),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }).optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    space: z.string().optional(),
    group: z.string().optional(),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    coverVideo: z.string().optional(),
    coverVideoPoster: z.string().optional(),
    postFormat: z.enum(['standard', 'aside', 'status', 'quote', 'gallery', 'video', 'audio', 'link', 'chat', 'image']).default('standard').optional(),
    markup: z.string().optional(),
    toc: z.boolean().default(true).optional(),
    hideToc: z.boolean().default(false).optional(),
    math: z.boolean().default(false).optional(),
    mermaid: z.boolean().default(false).optional(),
    mindmap: z.boolean().default(false).optional(),
    series: z.string().optional(),
    access: z.object({
      password: z.string().optional(),
      passwordHash: z.string().optional(),
      allowedCountries: z.array(z.string()).default([]),
      blockedCountries: z.array(z.string()).default([]),
      allowedIps: z.array(z.string()).default([]),
      blockedIps: z.array(z.string()).default([]),
      message: z.string().optional(),
    }).optional(),
    featured: z.boolean().default(false),
    sticky: z.number().int().default(0),
    draft: z.boolean().default(false),

    /** Single encrypted variant (backward compatible) */
    externalEncrypt: ExternalEncryptEntrySchema.optional(),

    /** Multiple encrypted variants — use this for 2+ encrypted URLs per article */
    externalEncrypts: z.array(ExternalEncryptEntrySchema).optional(),
  }),
});

export const collections = {
  'posts': postsCollection,
};
