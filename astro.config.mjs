import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://foxxelabs.ie',
  integrations: [mdx(), react()],
  markdown: {
    shikiConfig: {
      theme: 'nord',
      wrap: true
    }
  }
});