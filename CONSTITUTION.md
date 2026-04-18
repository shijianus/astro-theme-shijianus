# shijianus Theme Constitution

## 1. Objective

This project rebuilds the visual language and configuration depth inspired by `hexo-theme-anzhiyu`, but the deliverable is a distinct `shijianus` theme implemented with Astro, React, and Tailwind.

The goal is not pixel-for-pixel imitation. The goal is:

1. Preserve the strengths of the reference theme: rich homepage structure, strong author identity, clear article flow, flexible sidebar modules, and config-driven toggles.
2. Remove all upstream branding from user-facing surfaces.
3. Establish a maintainable architecture that is easy to extend with remote APIs later.

## 2. Brand Rules

1. User-facing copy must only use the `shijianus` brand.
2. The names `AnZhiYu`, `anzhiyu`, `anheyu`, and `安知鱼` must not appear in rendered UI, footer copy, demo content, or test assertions.
3. Reference-theme source code may exist temporarily for local comparison, but new runtime code must not depend on its branding, templates, or assets as brand identifiers.

## 3. Product Direction

The visual target is:

1. Geek-oriented but readable.
2. Distinctive without becoming hostile to ordinary readers.
3. Editorial first, dashboard second.
4. Fast to scan, easy to extend, and stable across desktop and mobile.

## 4. Architectural Principles

1. Config first.
2. Content driven.
3. Section based.
4. Server-render by default, add React only for interaction.
5. Keep data transformation separate from rendering.

Required implications:

1. Site identity, navigation, hero text, sidebar cards, footer links, and section toggles must live in typed config objects, not scattered inline strings.
2. Post lists, tag lists, category summaries, archive groups, and related-post data must be produced by reusable helper functions.
3. Components must consume normalized view models whenever practical.
4. Future API integration must be possible by swapping data providers rather than rewriting page markup.

## 5. Theme Compatibility Contract

The Astro theme must preserve the following compatibility ideas from the reference theme:

1. Homepage sections can be independently enabled or disabled.
2. Sidebar cards can be independently enabled or disabled.
3. Post metadata display is configurable.
4. The design supports author card, archive card, tag card, announcement/status card, and related-post modules.
5. Navigation and footer links come from config.
6. The theme supports local content now and external API data later.

This does not require one-to-one parity with every Hexo feature. It requires a matching level of extensibility and switchability.

## 6. Styling Rules

1. Use Tailwind utilities for composition and plain CSS variables for theme tokens.
2. Keep radii at `8px` or below.
3. Avoid decorative gradients, floating blobs, and ornamental card nesting.
4. Images must support the layout and not act as filler.
5. Typography must remain stable across viewport sizes.
6. Dark mode must be deliberate, not just inverted colors.
7. The homepage hero must feel like the product surface, not a marketing banner.

## 7. Implementation Rules

1. Every substantial section change must be backed up with a git commit.
2. Before replacing a section, define its config surface first.
3. Do not hardcode placeholder brand names from previous experiments.
4. Do not introduce dependencies unless they remove real complexity.
5. Do not silently break route structure, content schema, or future data contracts.

## 8. Testing Rules

Before delivery:

1. Run a production build.
2. Run the site locally.
3. Validate the key routes with Puppeteer.
4. Capture desktop and mobile screenshots.
5. Check that no forbidden upstream brand name appears in rendered pages.
6. Check that interactive controls still work after hydration.

## 9. Delivery Standard

A task is not complete unless:

1. The homepage is structurally coherent.
2. The article page is readable and themed.
3. Navigation, sidebar, and footer are brand-consistent.
4. The codebase has a clear config contract for future iteration.
5. Browser validation has been completed.
