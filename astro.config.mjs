import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://foxxelabs.ie',
  integrations: [mdx(), react()],
  // The globe is a static asset at public/llm-observatory/index.html (fixed 1920x1080).
  // view.html wraps it in a responsive, scale-to-fit shell. Point the pretty URL there
  // so it adapts to any screen; the raw index.html stays directly reachable.
  redirects: {
    '/llm-observatory': '/llm-observatory/view.html',
    '/llm-observatory/': '/llm-observatory/view.html'
  },
  markdown: {
    shikiConfig: {
      theme: 'nord',
      wrap: true
    }
  }
});
