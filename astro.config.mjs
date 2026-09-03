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

import fs from 'fs';
import path from 'path';

function getEnvVar(key) {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const k = trimmed.slice(0, eqIdx).trim();
            const v = trimmed.slice(eqIdx + 1).trim();
            if (k === key) return v;
          }
        }
      }
    }
  } catch (_) {}
  return '';
}

function stripeAndGeoDevIntegration() {
  return {
    name: 'stripe-geo-dev-middleware',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && (req.url === '/api/geo-profile' || req.url.startsWith('/api/geo-profile?'))) {
            const url = new URL(req.url, 'http://localhost');
            const countryQuery = url.searchParams.get('country');
            const cfCountry = req.headers['cf-ipcountry'];
            const country = (countryQuery || cfCountry || 'GLOBAL').toString().toUpperCase();
            const isMainland = country === 'CN';
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify({ country, isMainland }));
            return;
          }
          if (req.url && (req.url === '/api/create-payment-intent' || req.url.startsWith('/api/create-payment-intent?')) && req.method === 'POST') {
            try {
              let bodyStr = '';
              req.on('data', (chunk) => {
                bodyStr += chunk;
              });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(bodyStr || '{}');
                  const rawAmount = typeof payload?.amount === 'number' ? payload.amount : 5;
                  const currency = (payload?.currency || 'usd').toLowerCase();
                  const name = payload?.name?.trim() || '';
                  const message = payload?.message?.trim() || '';
                  const clientCountry = payload?.country || 'GLOBAL';
                  let amountInCents = Math.round(rawAmount >= 50 && Number.isInteger(rawAmount) ? rawAmount : rawAmount * 100);
                  if (amountInCents < 50) amountInCents = 50;
                  if (amountInCents > 100000) amountInCents = 100000;

                  const stripeSecretKey = getEnvVar('STRIPE_SECRET_KEY');
                  if (!stripeSecretKey) {
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(500);
                    res.end(JSON.stringify({ ok: false, error: 'STRIPE_SECRET_KEY is not configured in environment.' }));
                    return;
                  }
                  const params = new URLSearchParams();
                  params.set('amount', String(amountInCents));
                  params.set('currency', currency);
                  params.set('automatic_payment_methods[enabled]', 'true');
                  params.set('description', `Support EpoCanvas / shijianus blog (${name || 'Anonymous'})`);
                  if (name) params.set('metadata[sponsor_name]', name);
                  if (message) params.set('metadata[sponsor_message]', message);
                  params.set('metadata[country]', clientCountry);

                  const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${stripeSecretKey}`,
                      'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: params.toString(),
                  });
                  const data = await stripeRes.json();
                  if (!stripeRes.ok || data.error) {
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(400);
                    res.end(JSON.stringify({ ok: false, error: data.error?.message || 'Stripe error' }));
                    return;
                  }

                  const tgToken = getEnvVar('TELEGRAM_BOT_TOKEN') || '8690822896:AAH7WQiDPd_Y7Crpn8Hlt6_3w3g2pF5D1ZA';
                  const tgChatId = getEnvVar('TELEGRAM_CHAT_ID') || '7963161588';
                  if (tgToken && tgChatId) {
                    const formattedAmount = `$${(amountInCents / 100).toFixed(2)} ${currency.toUpperCase()}`;
                    const sponsorName = name || '匿名支持者';
                    const sponsorMsg = message || '（未留言）';
                    const nowStr = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
                    const text = [
                      `🎉 *收到新的博客赞赏发起 (EpoCanvas)*`,
                      `━━━━━━━━━━━━━━━━━━`,
                      `💰 *赞赏金额*: \`${formattedAmount}\``,
                      `👤 *赞赏者*: *${sponsorName.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')}*`,
                      `💬 *留言寄语*: ${sponsorMsg.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')}`,
                      `🌍 *地区*: \`${clientCountry}\` (Dev Server)`,
                      `💳 *支付通道*: Stripe Checkout (Cards / Apple Pay / Google Pay)`,
                      `🆔 *订单标识*: \`${data.id || 'N/A'}\``,
                      `🕒 *提交时间*: \`${nowStr}\``,
                      `━━━━━━━━━━━━━━━━━━`,
                    ].join('\n');
                    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ chat_id: tgChatId, text, parse_mode: 'MarkdownV2' }),
                    }).catch(() => {});
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(200);
                  res.end(
                    JSON.stringify({
                      ok: true,
                      clientSecret: data.client_secret,
                      id: data.id,
                      amount: amountInCents,
                      currency,
                    }),
                  );
                } catch (err) {
                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(500);
                  res.end(JSON.stringify({ ok: false, error: err?.message || 'Server error' }));
                }
              });
            } catch (err) {
              next();
            }
            return;
          }
          if (req.url && (req.url === '/api/create-checkout-session' || req.url.startsWith('/api/create-checkout-session?')) && req.method === 'POST') {
            try {
              let bodyStr = '';
              req.on('data', (chunk) => {
                bodyStr += chunk;
              });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(bodyStr || '{}');
                  const amount = typeof payload?.amount === 'number' ? payload.amount : 5;
                  const currency = (payload?.currency || 'usd').toLowerCase();
                  const name = payload?.name?.trim() || '';
                  const message = payload?.message?.trim() || '';
                  const clientCountry = payload?.country || 'GLOBAL';
                  const returnUrl = payload?.returnUrl || 'http://localhost:4321/?stripe_return=1&session_id={CHECKOUT_SESSION_ID}';

                  const ZERO_DECIMAL = new Set(['bif','clp','gnf','jpy','kmf','krw','mga','pyg','rwf','ugx','vnd','xaf','xof','xpf']);
                  let unitAmount = amount;
                  if (!ZERO_DECIMAL.has(currency)) {
                    unitAmount = Math.round(amount * 100);
                    if (unitAmount < 50) unitAmount = 50;
                  }

                  // Determine language & product localization for Stripe Checkout App-Overview
                  const rawLocale = (payload?.locale || '').toLowerCase();
                  let stripeLocale = 'auto';
                  let productName = '赞赏支持 shijianus 博客';
                  let productDesc = '感谢您的慷慨赞赏与支持！';

                  if (rawLocale === 'zh-hant' || rawLocale === 'zh-tw' || rawLocale === 'zh-hk') {
                    stripeLocale = 'zh-HK';
                    productName = '讚賞支持 shijianus 博客';
                    productDesc = '感謝您的慷慨讚賞與支持！';
                  } else if (rawLocale === 'en') {
                    stripeLocale = 'en';
                    productName = 'Support shijianus Blog';
                    productDesc = 'Thank you for your generous support!';
                  } else if (rawLocale.startsWith('zh')) {
                    stripeLocale = 'zh';
                    productName = '赞赏支持 shijianus 博客';
                    productDesc = '感谢您的慷慨赞赏与支持！';
                  } else {
                    if (clientCountry === 'CN') {
                      stripeLocale = 'zh';
                      productName = '赞赏支持 shijianus 博客';
                      productDesc = '感谢您的慷慨赞赏与支持！';
                    } else if (clientCountry === 'HK' || clientCountry === 'TW' || clientCountry === 'MO') {
                      stripeLocale = 'zh-HK';
                      productName = '讚賞支持 shijianus 博客';
                      productDesc = '感謝您的慷慨讚賞與支持！';
                    } else if (clientCountry === 'US' || clientCountry === 'GB' || clientCountry === 'CA' || clientCountry === 'AU') {
                      stripeLocale = 'en';
                      productName = 'Support shijianus Blog';
                      productDesc = 'Thank you for your generous support!';
                    } else {
                      stripeLocale = 'auto';
                      productName = '赞赏支持 shijianus 博客';
                      productDesc = '感谢您的慷慨赞赏与支持！';
                    }
                  }

                  const stripeSecretKey =
                    getEnvVar('STRIPE_SECRET_KEY') ||
                    atob('c2tfdGVzdF81MVNNdGhWM0V5RkdTaHBBR1NIeWx0R3NMNm1jUm4yaXV1cjMyZFo3UHNkT2x0RE16S3VsWmRUS0xJaE5jS1Y5eVN4aVlydjNDeENjVzE5OFBYc3ZJTGlHSTAwRkg5dlBmRnE=');
                  if (!stripeSecretKey) {
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(500);
                    res.end(JSON.stringify({ ok: false, error: 'STRIPE_SECRET_KEY is not configured in environment.' }));
                    return;
                  }

                  const params = new URLSearchParams();
                  params.set('ui_mode', 'embedded');
                  params.set('mode', 'payment');
                  params.set('return_url', returnUrl);
                  params.set('redirect_on_completion', 'if_required');
                  if (stripeLocale && stripeLocale !== 'auto') {
                    params.set('locale', stripeLocale);
                  }
                  params.set('line_items[0][price_data][currency]', currency);
                  params.set('line_items[0][price_data][unit_amount]', String(unitAmount));
                  params.set('line_items[0][price_data][product_data][name]', productName);
                  params.set('line_items[0][price_data][product_data][description]', productDesc);
                  params.set('line_items[0][quantity]', '1');
                  params.set('customer_creation', 'always');
                  if (name) params.set('metadata[sponsor_name]', name);
                  if (message) params.set('metadata[sponsor_message]', message);
                  params.set('metadata[country]', clientCountry);
                  params.set('metadata[source]', 'blog_reward_embedded_checkout');
                  params.set('metadata[payment_method]', 'Stripe Checkout Session (Cards / Apple Pay / Google Pay)');

                  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${stripeSecretKey}`,
                      'Content-Type': 'application/x-www-form-urlencoded',
                      'Stripe-Version': '2025-06-30.basil',
                    },
                    body: params.toString(),
                  });
                  const data = await stripeRes.json();
                  if (!stripeRes.ok || data.error) {
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(400);
                    res.end(JSON.stringify({ ok: false, error: data.error?.message || 'Stripe error' }));
                    return;
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(200);
                  res.end(
                    JSON.stringify({
                      ok: true,
                      clientSecret: data.client_secret,
                      sessionId: data.id,
                      amount,
                      currency,
                    }),
                  );
                } catch (err) {
                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(500);
                  res.end(JSON.stringify({ ok: false, error: err?.message || 'Server error' }));
                }
              });
            } catch (err) {
              next();
            }
            return;
          }
          if (req.url && (req.url === '/api/record-blessing' || req.url.startsWith('/api/record-blessing?')) && req.method === 'POST') {
            try {
              let bodyStr = '';
              req.on('data', (chunk) => {
                bodyStr += chunk;
              });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(bodyStr || '{}');
                  const amount = typeof payload?.amount === 'number' ? payload.amount : 500;
                  const currency = (payload?.currency || 'usd').toLowerCase();
                  const name = payload?.name?.trim() || '匿名支持者';
                  const message = payload?.message?.trim() || '（支持作者，感谢创作！）';
                  const clientCountry = payload?.country || 'GLOBAL';

                  const tgToken = getEnvVar('TELEGRAM_BOT_TOKEN') || '8690822896:AAH7WQiDPd_Y7Crpn8Hlt6_3w3g2pF5D1ZA';
                  const tgChatId = getEnvVar('TELEGRAM_CHAT_ID') || '7963161588';
                  if (tgToken && tgChatId) {
                    const formattedAmount = `$${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
                    const nowStr = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
                    const text = [
                      `🎉 *收到新的博客赞赏与寄语祝福 (EpoCanvas)*`,
                      `━━━━━━━━━━━━━━━━━━`,
                      `💰 *赞赏金额*: \`${formattedAmount}\` *(支付已完成 ✓)*`,
                      `👤 *赞赏者*: *${name.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')}*`,
                      `💬 *寄语祝福*: ${message.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')}`,
                      `🌍 *地区*: \`${clientCountry}\` (Dev Server)`,
                      `💳 *支付通道*: Stripe Checkout`,
                      `🆔 *订单标识*: \`${payload?.id || 'N/A'}\``,
                      `🕒 *完成时间*: \`${nowStr}\``,
                      `━━━━━━━━━━━━━━━━━━`,
                    ].join('\n');
                    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ chat_id: tgChatId, text, parse_mode: 'MarkdownV2' }),
                    }).catch(() => {});
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(200);
                  res.end(JSON.stringify({ ok: true, message: 'Blessing recorded successfully' }));
                } catch (err) {
                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(500);
                  res.end(JSON.stringify({ ok: false, error: err?.message || 'Server error' }));
                }
              });
            } catch (err) {
              next();
            }
            return;
          }
          next();
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
  integrations: [epocanvasBrandIntegration(), chronralAiDevIntegration(), stripeAndGeoDevIntegration(), react(), mdx()],
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

