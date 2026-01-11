import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const resources = await getCollection('resources', ({ data }) => {
    return data.draft !== true;
  });
  
  const news = await getCollection('news', ({ data }) => {
    return data.draft !== true;
  });
  
  const allPosts = [...resources, ...news].sort((a, b) => 
    b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  );
  
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
