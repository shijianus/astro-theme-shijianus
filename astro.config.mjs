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
    for (const file of ['.env', '.dev.vars']) {
      const envPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx !== -1) {
              const k = trimmed.slice(0, eqIdx).trim();
              const v = trimmed.slice(eqIdx + 1).trim().replace(/^["'](.*)["']$/, '$1');
              if (k === key) return v;
            }
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

                  // PaymentIntent created — TG notification is strictly deferred until payment is completed and modal closes
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

                  const stripeSecretKey = getEnvVar('STRIPE_SECRET_KEY');
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

                  const tgToken = getEnvVar('TELEGRAM_BOT_TOKEN');
                  const tgChatId = getEnvVar('TELEGRAM_CHAT_ID');
                  if (tgToken && tgChatId) {
                    const ZERO_DECIMAL_CURRENCIES = new Set(['bif','clp','djf','gnf','jpy','kmf','krw','mga','pyg','rwf','ugx','vnd','xaf','xof','xpf']);
                    const formattedAmount = ZERO_DECIMAL_CURRENCIES.has(currency)
                      ? `${amount} ${currency.toUpperCase()}`
                      : `$${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
                    const pstFormatter = new Intl.DateTimeFormat('zh-CN', {
                      timeZone: 'America/Los_Angeles',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    });
                    const pstTime = `${pstFormatter.format(new Date()).replace(/\//g, '-')} PST`;
                    const triggerText = payload?.trigger === 'form_submitted'
                      ? '用户提交寄语并完成 (form_submitted)'
                      : payload?.trigger === 'page_unload'
                      ? '页面卸载/刷新拦截触发 (page_unload)'
                      : payload?.trigger === 'idle_timeout_30m'
                      ? '30分钟兜底超时自动发送 (idle_timeout_30m)'
                      : '模态框手动关闭触发 (modal_closed)';

                    const sanitize = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    const text = [
                      `🎉 <b>收到赞赏者的寄语祝福</b>`,
                      `━━━━━━━━━━━━━━━━━━`,
                      `💰 <b>赞赏金额</b>: <code>${formattedAmount}</code> <i>(支付已完成 ✓)</i>`,
                      `👤 <b>赞赏者</b>: <b>${sanitize(name)}</b>`,
                      `💬 <b>寄语祝福</b>: ${sanitize(message)}`,
                      `🌍 <b>地区 / IP</b>: <code>${sanitize(clientCountry)}</code> (Dev Server)`,
                      `💳 <b>支付通道</b>: ${sanitize(payload?.paymentMethod || 'Stripe Checkout (Cards / Apple Pay / Google Pay / Link)')}`,
                      `🆔 <b>订单标识</b>: <code>${sanitize(payload?.id || 'N/A')}</code>`,
                      `🕒 <b>完成时间</b>: <code>${pstTime}</code>`,
                      `⚡️ <b>触发机制</b>: <code>${triggerText}</code>`,
                      `━━━━━━━━━━━━━━━━━━`,
                    ].join('\n');
                    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ chat_id: tgChatId, text, parse_mode: 'HTML' }),
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

function commentsDevIntegration() {
  return {
    name: 'comments-dev-middleware',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const rawUrl = req.url || '';
          if (rawUrl === '/api/comments' || rawUrl.startsWith('/api/comments?') || rawUrl.startsWith('/api/comments/')) {
            try {
              const protocol = req.socket?.encrypted ? 'https' : 'http';
              const host = req.headers.host || 'localhost:4321';
              const fullUrl = new URL(rawUrl, `${protocol}://${host}`);

              const chunks = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              const bodyBuffer = Buffer.concat(chunks);
              const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '') && bodyBuffer.length > 0;

              const webHeaders = new Headers();
              for (const [key, value] of Object.entries(req.headers)) {
                if (Array.isArray(value)) {
                  for (const v of value) webHeaders.append(key, v);
                } else if (value !== undefined) {
                  webHeaders.set(key, value);
                }
              }

              const webReq = new Request(fullUrl.toString(), {
                method: req.method,
                headers: webHeaders,
                body: hasBody ? bodyBuffer : undefined,
              });

              const { onRequest } = await import('./functions/api/comments.ts');
              const webRes = await onRequest({
                request: webReq,
                env: {
                  ...process.env,
                  IS_DEV: 'true',
                  TELEGRAM_BOT_TOKEN: getEnvVar('TELEGRAM_BOT_TOKEN'),
                  TELEGRAM_CHAT_ID: getEnvVar('TELEGRAM_CHAT_ID'),
                  ADMIN_TOKEN: getEnvVar('ADMIN_TOKEN'),
                },
              });

              res.statusCode = webRes.status;
              webRes.headers.forEach((val, key) => {
                res.setHeader(key, val);
              });
              const resBody = await webRes.text();
              res.end(resBody);
              return;
            } catch (err) {
              console.error('[Dev Comments Middleware Error]:', err);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: err?.message || 'Dev comments middleware error' }));
              return;
            }
          }
          next();
        });
      },
    },
  };
}

function authDevIntegration() {
  return {
    name: 'auth-dev-middleware',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const rawUrl = req.url || '';
          if (rawUrl === '/api/auth' || rawUrl.startsWith('/api/auth?') || rawUrl.startsWith('/api/auth/')) {
            try {
              const protocol = req.socket?.encrypted ? 'https' : 'http';
              const host = req.headers.host || 'localhost:4321';
              const fullUrl = new URL(rawUrl, `${protocol}://${host}`);

              const chunks = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              const bodyBuffer = Buffer.concat(chunks);
              const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '') && bodyBuffer.length > 0;

              const webHeaders = new Headers();
              for (const [key, value] of Object.entries(req.headers)) {
                if (Array.isArray(value)) {
                  for (const v of value) webHeaders.append(key, v);
                } else if (value !== undefined) {
                  webHeaders.set(key, value);
                }
              }

              const webReq = new Request(fullUrl.toString(), {
                method: req.method,
                headers: webHeaders,
                body: hasBody ? bodyBuffer : undefined,
              });

              const { onRequest } = await import('./functions/api/auth.ts');
              const webRes = await onRequest({
                request: webReq,
                env: {
                  ...process.env,
                  IS_DEV: 'true',
                  EPOMAIL_BASE_URL: getEnvVar('EPOMAIL_BASE_URL'),
                  EPOMAIL_CLIENT_ID: getEnvVar('EPOMAIL_CLIENT_ID'),
                  EPOMAIL_CLIENT_SECRET: getEnvVar('EPOMAIL_CLIENT_SECRET'),
                  EPOMAIL_REDIRECT_URI: getEnvVar('EPOMAIL_REDIRECT_URI'),
                  ADMIN_TOKEN: getEnvVar('ADMIN_TOKEN'),
                },
              });

              res.statusCode = webRes.status;
              webRes.headers.forEach((val, key) => {
                res.setHeader(key, val);
              });
              const resBody = await webRes.text();
              res.end(resBody);
              return;
            } catch (err) {
              console.error('[Dev Auth Middleware Error]:', err);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: err?.message || 'Dev auth middleware error' }));
              return;
            }
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
  integrations: [
    epocanvasBrandIntegration(),
    chronralAiDevIntegration(),
    stripeAndGeoDevIntegration(),
    commentsDevIntegration(),
    authDevIntegration(),
    react(),
    mdx(),
  ],
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

