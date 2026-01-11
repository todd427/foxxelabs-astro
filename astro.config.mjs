import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://foxxelabs.ie',
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      theme: 'nord',
      wrap: true
    }
  }
});
