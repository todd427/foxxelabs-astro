import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://foxxelabs.ie',
  integrations: [mdx(), react()],
  // The interactive globe lives as a static asset at public/llm-observatory/index.html.
  // `astro dev` doesn't auto-serve a directory's index.html, so map the pretty URL to it.
  redirects: {
    '/llm-observatory': '/llm-observatory/index.html',
    '/llm-observatory/': '/llm-observatory/index.html'
  },
  markdown: {
    shikiConfig: {
      theme: 'nord',
      wrap: true
    }
  }
});
