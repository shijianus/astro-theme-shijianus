import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from '@playwright/test';

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
export async function withGuestbook(test) {
  const dist = resolve(process.env.GESTURE_DIST || 'dist');
  await stat(resolve(dist, 'guestbook/index.html'));
  const bundle = await build({
    stdin: {
      contents:
        "import {onRequest as comments} from './functions/api/comments.ts'; import {onRequest as gestures} from './functions/api/gestures.ts'; export default {fetch(request,env){return (new URL(request.url).pathname === '/api/gestures' ? gestures : comments)({request,env});}}",
      resolveDir: process.cwd(),
    },
    bundle: true,
    format: 'esm',
    write: false,
  });
  const worker = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: bundle.outputFiles[0].text,
      compatibilityDate: '2026-04-27',
      d1Databases: ['DB'],
      bindings: { IS_DEV: 'true' },
    }),
  );
  let browser, server;
  try {
    const db = await worker.getD1Database('DB');
    await worker.dispatchFetch('http://test.local/api/gestures?id=missing&trackView=0');
    server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://127.0.0.1:' + server.address().port);
        if (['/api/comments', '/api/gestures'].includes(url.pathname)) {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const r = await worker.dispatchFetch(url.href, {
            method: req.method,
            headers: req.headers,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          });
          res.writeHead(r.status, Object.fromEntries(r.headers));
          res.end(Buffer.from(await r.arrayBuffer()));
          return;
        }
        let path = resolve(dist, '.' + decodeURIComponent(url.pathname));
        if (!path.startsWith(dist + sep)) {
          res.writeHead(404).end();
          return;
        }
        if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
        const buffer = await readFile(path);
        res.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream' }).end(buffer);
      } catch {
        res.writeHead(404).end();
      }
    });
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    const base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch();
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    await ctx.route('**/*', (route) =>
      new URL(route.request().url()).origin === base ? route.continue() : route.abort(),
    );
    const page = await ctx.newPage();
    page.setDefaultTimeout(7000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (entry) => {
      if (entry.type() === 'error' && /hydrat|Minified React error/i.test(entry.text()))
        errors.push(entry.text());
    });
    const add = async (id, message, options = {}) => {
      const defaults = {
        id,
        post_slug: 'guestbook',
        parent_id: null,
        post_type: 'gesture',
        tag: 'chat',
        author_id: 'reader_1',
        author_name: '青禾',
        author_role: 'reader',
        message,
        created_at: '2026-08-08T09:00:00Z',
        updated_at: '2026-08-08T09:00:00Z',
        ...options,
      };
      const keys = Object.keys(defaults);
      return db
        .prepare(
          'INSERT INTO comments (' + keys.join(',') + ') VALUES (' + keys.map(() => '?').join(',') + ')',
        )
        .bind(...Object.values(defaults))
        .run();
    };
    await test({ db, page, ctx, base, add, errors });
  } finally {
    await browser?.close();
    if (server) {
      server.closeAllConnections();
      await new Promise((done) => server.close(done));
    }
    await worker.dispose();
  }
}
export const sizes = [
  [1920, 1080],
  [1440, 900],
  [1280, 800],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [360, 800],
];
