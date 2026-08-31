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

function chronralAiDevIntegration() {
  return {
    name: 'chronral-ai-dev-middleware',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && (req.url === '/api/ai-summary' || req.url.startsWith('/api/ai-summary?')) && req.method === 'POST') {
            try {
              let bodyStr = '';
              req.on('data', (chunk) => {
                bodyStr += chunk;
              });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(bodyStr || '{}');
                  const { processAiSummaryRequest } = await import('./src/lib/server-ai-summary.ts');
                  const result = await processAiSummaryRequest(payload, {
                    instanceAiBaseUrl: process.env.INSTANCE_AI_BASE_URL,
                    instanceAiApiKey: process.env.INSTANCE_AI_API_KEY,
                    instanceAiModel: process.env.INSTANCE_AI_MODEL,
                    groqApiKey: process.env.GROQ_API_KEY,
                    groqModel: process.env.GROQ_MODEL,
                  });
                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(200);
                  res.end(JSON.stringify(result));
                } catch (err) {
                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(500);
                  res.end(JSON.stringify({ ok: false, error: err?.message || 'Server error' }));
                }
              });
            } catch (err) {
              next();
            }
          } else {
            next();
          }
        });
      },
    },
  };
}

const mindmapLang = {
  name: 'mindmap',
  scopeName: 'source.mindmap',
  displayName: 'Mindmap',
  patterns: [{ include: 'source.gfm' }],
};

const markmapLang = {
  name: 'markmap',
  scopeName: 'source.markmap',
  displayName: 'Markmap',
  patterns: [{ include: 'source.gfm' }],
};

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
  integrations: [epocanvasBrandIntegration(), chronralAiDevIntegration(), react(), mdx()],
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      langs: [mindmapLang, markmapLang],
      transformers: [
        {
          pre(node) {
            const lang = this.options?.lang;
            if (lang === 'mindmap' || lang === 'markmap') {
              node.properties['data-language'] = lang;
              node.properties['class'] = ((node.properties['class'] || '') + ` language-${lang} mindmap-block`).trim();
            }
          },
        },
      ],
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

