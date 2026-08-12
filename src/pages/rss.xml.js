import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const resources = await getCollection('resources', ({ data }) => {
    return data.draft !== true;
  });
  
  const news = await getCollection('news', ({ data }) => {
    return data.draft !== true;
  });
  
  // Order by last activity, matching /news. NOTE: this only affects the order of
  // items in the document — readers re-sort by pubDate, which stays the original
  // publication date below. So a June story that the dedupe gate folded today's
  // news into still surfaces as June in a subscriber's reader. Setting pubDate to
  // the last-activity date would fix that (the link/guid is stable, so readers
  // would treat it as an updated item rather than a new one), at the cost of
  // rewriting the published date of every folded story. Left as-is deliberately.
  const lastActivity = (post) =>
    Math.max(post.data.publishDate.valueOf(), post.data.updatedDate?.valueOf() ?? 0);

  const allPosts = [...resources, ...news].sort((a, b) => lastActivity(b) - lastActivity(a));

  return rss({
    title: 'Foxxe Labs | Resources & News',
    description: 'In-depth guides, analysis, and news on AI security, applications, and industry developments',
    site: context.site,
    items: allPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: `/${post.collection}/${post.slug}/`,
      categories: [post.data.category, ...post.data.tags]
    })),
    customData: `<language>en-us</language>`,
  });
}
