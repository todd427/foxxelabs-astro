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
    // Intelligence fields — persisted to frontmatter (not just Supabase) so the
    // dedupe gate is a pure function of repo state.
    significance: z.enum(['high', 'medium', 'low']).optional(),
    entities: z.array(z.string()).default([]),
    irishEuAngle: z.boolean().optional(),
    // Story timeline: each near-duplicate development is folded in here as a
    // dated entry by the dedupe gate instead of minting a redundant article.
    updates: z.array(z.object({
      date: z.coerce.date(),
      note: z.string(),
      sourceUrl: z.string().optional()
    })).default([]),
    draft: z.boolean().default(false)
  })
});

export const collections = {
  'resources': resourcesCollection,
  'news': newsCollection,
};
