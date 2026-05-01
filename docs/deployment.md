# Deployment

## Static mirror: GitHub Pages

1. Commit the root workflow at `.github/workflows/deploy.yml`.
2. In the GitHub repository settings, set **Pages > Source** to `GitHub Actions`.
3. If you deploy to `https://<user>.github.io/<repo>/`, change `SITE_URL` and `SITE_BASE` in the workflow. For this repository, the runtime API is expected to stay on Cloudflare Pages, so keep `PUBLIC_RUNTIME_API_BASE=https://shijianus-blog.pages.dev`.
4. If you deploy to a custom domain, keep `SITE_BASE=/` and optionally add `public/CNAME`.

`npm run build:static` produces the GitHub Pages-safe output. Protected or IP-restricted content will render as a locked shell in the static mirror; runtime APIs stay on Cloudflare.

## Full runtime: Cloudflare Pages + Functions + D1

1. Copy `.dev.vars.example` to `.dev.vars` for local Pages Functions development.
2. Create the Pages project once:

```bash
npx wrangler pages project create shijianus-blog --production-branch main
```

3. Create the D1 database:

```bash
npx wrangler d1 create shijianus-blog-db
```

4. Paste the returned binding block into `wrangler.jsonc` under `d1_databases`, but keep the binding name as `DB`.
5. Apply migrations to the remote D1 database:

```bash
npx wrangler d1 migrations apply DB --remote
```

6. Bulk-upload runtime secrets and vars to the Pages project. `wrangler pages secret bulk` accepts `.env`-style files:

```bash
npx wrangler pages secret bulk /tmp/shijianus-pages-secrets.env --project-name shijianus-blog
```

Recommended secrets:

- `IPINFO_TOKENS`
- `GEMINI_API_KEYS`
- `MODELSCOPE_API_KEY`
- `WORKERS_AI_MODEL`
- `SUPPORT_USDT_ADDRESS`
- `RATE_LIMIT_SALT`
- `ALLOW_ORIGINS`

7. Build and run locally with Functions:

```bash
npm run pages:dev
```

8. Deploy static assets plus Functions to the production branch:

```bash
npm run cf:deploy
```

This repository is currently wired to the Cloudflare Pages project `shijianus-blog` and the D1 database `shijianus-blog-db`. `npm run cf:d1:migrate` and `npm run cf:deploy` already target that production setup.

## Quick public verification

Expose the local site before formal deployment:

```bash
cloudflared tunnel --url http://127.0.0.1:8788
```

That gives you a temporary public URL for reward, AI summary, and music flow checks before the real Cloudflare Pages deployment.
