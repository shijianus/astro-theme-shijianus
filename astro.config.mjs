// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import remarkGfm from 'remark-gfm';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [react(), mdx()],
  markdown: {
    remarkPlugins: [remarkGfm],
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['lucide-react']
    },
    optimizeDeps: {
      include: ['lucide-react']
    }
  }
});
