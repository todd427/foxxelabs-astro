import { defineCollection, z } from 'astro:content';

const resourcesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    updatedDate: z.date().optional(),
    category: z.string(),
    tags: z.array(z.string()),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    readingTime: z.string().optional(),
    furtherReading: z.array(z.object({
      title: z.string(),
      url: z.string(),
      source: z.string().optional()
    })).optional(),
    draft: z.boolean().default(false)
  })
});

const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    updatedDate: z.date().optional(),
    category: z.string(),
    tags: z.array(z.string()),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    source: z.string().optional(),
    sourceUrl: z.string().optional(),
    draft: z.boolean().default(false)
  })
});

export const collections = {
  'resources': resourcesCollection,
  'news': newsCollection,
};
