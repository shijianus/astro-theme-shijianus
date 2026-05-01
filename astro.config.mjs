// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';
import remarkGfm from 'remark-gfm';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
const buildTarget = process.env.BLOG_BUILD_TARGET === 'static' ? 'static' : 'server';
const isStaticBuild = buildTarget === 'static';
const site = process.env.SITE_URL || 'https://shijian.us';
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  site,
  base,
  output: isStaticBuild ? 'static' : 'server',
  ...(isStaticBuild
    ? {}
    : {
        adapter: node({
          mode: 'standalone',
        }),
      }),
  devToolbar: {
    enabled: false,
  },
  integrations: [react(), mdx(), tailwind()],
  markdown: {
    remarkPlugins: [remarkGfm],
  },
  vite: {
    plugins: [],
    ssr: {
      noExternal: ['lucide-react'],
    },
    optimizeDeps: {
      include: ['lucide-react'],
    },
  },
});
