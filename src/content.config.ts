import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postsCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    outdateDays: z.number().int().positive().optional(),
    validDays: z.number().int().positive().optional(),
    description: z.string().optional(),
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
  }),
});

export const collections = {
  'posts': postsCollection,
};
