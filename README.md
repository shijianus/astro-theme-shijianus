# astro-theme-shijianus

[Simplified Chinese](./README.zh-CN.md) | [Traditional Chinese](./README.zh-TW.md)

`astro-theme-shijianus` is an Astro-first personal blog theme rebuilt from the long-term strengths of Hexo and Anzhiyu: strong author identity, dense but readable layouts, practical content tooling, and a workflow that can be reproduced on any device with a few commands.

This repository currently serves both as the theme workbench and the example site used to verify the theme in real conditions.

## Highlights

- Astro 6 + React 19 + Tailwind 4 theme architecture.
- Responsive layouts tuned for both desktop and mobile, with mobile checks treated as a first-class requirement.
- Anzhiyu-inspired interaction layers: right-click menu, console panel, rich post tools, reward region panels, local search, and author-focused page structure.
- Runtime Simplified Chinese and Traditional Chinese switching powered by `translateLink`.
- Local managed comments with admin testing shortcuts for real interaction verification.
- Markdown scaffolding commands for posts, drafts, and pages.
- Git remote / push / publish commands so creators can point the project at their own upstream repository.
- Clean rebuild commands designed to feel familiar if you come from a Hexo workflow.

## Stack

- Astro
- React
- Tailwind CSS
- TypeScript
- MD / MDX content collections
- `opencc-js` for Simplified/Traditional Chinese conversion

## Quick Start

```sh
git clone https://github.com/shijianus/astro-theme-shijianus.git
cd astro-theme-shijianus
npm install
npm run dev
```

The local dev server binds to `0.0.0.0`, so it can be opened from other devices on the same network.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Astro dev server on `0.0.0.0`. |
| `npm run build` | Build the static site into `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run preview:host` | Preview the production build on `0.0.0.0` for other devices. |
| `npm run clean` | Remove `dist`, `.astro`, and `node_modules/.vite`. Equivalent to a lightweight `hexo clean`. |
| `npm run build:clean` | Clean first, then rebuild. Equivalent to `hexo clean && hexo generate` in spirit. |
| `npm run new:post -- "Post Title"` | Create a post Markdown file in `src/content/posts/`. |
| `npm run new:draft -- "Draft Title"` | Create a draft Markdown file in `src/content/posts/`. |
| `npm run new:page -- "Page Title"` | Create a Markdown page in `src/pages/`. |
| `npm run repo:remote -- --repo <git-url>` | Add or update a Git remote. |
| `npm run repo:push -- --remote origin --branch main` | Push the current branch to GitHub. |
| `npm run repo:publish -- --repo <git-url> --branch main --message "..."` | Stage, commit, and push all current changes in one command. |

## Writing Workflow

### Post template

```sh
npm run new:post -- "Readable Geek Interfaces"
```

Generated files follow the Astro content schema used by this project:

```md
---
title: "Readable Geek Interfaces"
description: ""
pubDate: 2026-04-24T00:00:00.000Z
updatedDate: 2026-04-24T00:00:00.000Z
tags:
  - note
category: uncategorized
cover: ""
coverAlt: "Readable Geek Interfaces"
draft: false
---
```

### Draft template

```sh
npm run new:draft -- "Rebuild Notes"
```

### Markdown page template

```sh
npm run new:page -- "friends"
```

This creates a Markdown page route under `src/pages/` and wires it to the shared `BlogLayout`.

## Multilingual Support

The documentation language is English by default, with additional Simplified Chinese and Traditional Chinese guides in this repository.

The site runtime currently supports:

- Simplified Chinese (`zh-CN`)
- Traditional Chinese (`zh-Hant`)

The floating `translateLink` control is now functional and uses `opencc-js` to switch the rendered interface between Simplified and Traditional Chinese. The same toggle is also available from the right-click menu.

## Admin Testing Workflow

For local comment integration, article pages include built-in testing shortcuts.

Recommended flow:

1. Open any post page.
2. In the local testing strip inside the comment panel, switch to the admin test preset.
3. Load the demo comments for the current thread.
4. Verify the real management flow: pin, limit, edit, delete, reply, quote, and like.
5. Switch to the reader test preset to validate the normal reader flow.

This is intentionally faster than manually editing `localStorage`, and it makes mobile / desktop comment testing much easier.

## GitHub Workflow

### Set your theme upstream

```sh
npm run repo:remote -- --repo https://github.com/shijianus/astro-theme-shijianus.git
```

### Push to your theme repository

```sh
npm run repo:push -- --remote origin --branch main
```

### Publish in one step

```sh
npm run repo:publish -- --repo https://github.com/shijianus/astro-theme-shijianus.git --branch main --message "chore: publish theme update"
```

### Example: publish a generated site or site-facing repository

```sh
npm run repo:publish -- --repo https://github.com/shijianus/shijianus.github.io.git --branch main --message "chore: publish site"
```

`repo:publish` stages all current changes before committing and pushing. Use it when you want the convenience of a one-shot publish command.

## Reproducing The Theme On Any Device

Use the same routine on every machine:

```sh
git clone <your-repo-url>
cd <your-project-folder>
npm install
npm run build:clean
npm run preview:host
```

If you only need local development:

```sh
npm run dev
```

If you need a fresh content file:

```sh
npm run new:post -- "New Article"
```

If you need to publish:

```sh
npm run repo:publish -- --repo <your-github-repo.git> --branch main --message "chore: publish"
```

## Project Layout

```text
.
├── public/
├── scaffolds/
├── scripts/
├── src/
│   ├── components/
│   ├── config/
│   ├── content/
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   └── styles/
└── themes/anzhiyu/
```

`themes/anzhiyu/` is kept as an upstream reference and compatibility source while the Astro theme continues to absorb and refine the parts that still make sense in this codebase.

## License

This project is released under the [MIT License](./LICENSE).
