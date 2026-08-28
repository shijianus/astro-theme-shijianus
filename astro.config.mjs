// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcssVite from '@tailwindcss/vite'; // Renamed to avoid conflict with postcss plugin
import mdx from '@astrojs/mdx';
import remarkGfm from 'remark-gfm';
// import tailwindcss from 'tailwindcss'; // REMOVED: PostCSS plugin is @tailwindcss/postcss
import autoprefixer from 'autoprefixer';
import tailwindPostcss from '@tailwindcss/postcss'; // ADDED: Correct PostCSS plugin

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { printBrandBanner } from './scripts/brand-banner.mjs';

function epocanvasBrandIntegration() {
  let hasPrinted = false;
  return {
    name: 'epocanvas-brand-banner',
    hooks: {
      'astro:server:setup': () => {
        if (!hasPrinted) {
          hasPrinted = true;
          printBrandBanner();
        }
      },
      'astro:server:start': () => {
        if (!hasPrinted) {
          hasPrinted = true;
          printBrandBanner();
        }
      },
    },
  };
}

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
  integrations: [epocanvasBrandIntegration(), react(), mdx()],
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      wrap: false,
    },
  },
  vite: {
    plugins: [tailwindcssVite()], // Use the vite plugin here
    css: {
      postcss: {
        plugins: [
          tailwindPostcss(), // Use the correct postcss plugin here
          autoprefixer(),
        ],
      },
    },
    ssr: {
      noExternal: ['lucide-react'],
    },
    optimizeDeps: {
      include: ['lucide-react'],
    },
  },
});

