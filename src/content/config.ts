import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string().optional(),
    author: z.string().default('SmartKevin'),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }).optional(),
    tags: z.array(z.string()).default([]),
    space: z.string(), // e.g., "Technology", "Science"
    group: z.string(), // e.g., "Web Development", "Biology"
  }),
});

export const collections = {
  'posts': postsCollection,
};
