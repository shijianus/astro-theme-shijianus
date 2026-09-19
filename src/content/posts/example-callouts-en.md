---
title: "Example: Full Display of Callouts and Hint Cards"
description: "A comprehensive display of 13 supported Callout semantic types, comparing default expanded/collapsed versions with Markdown source code."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "callouts"]
category: "Example"
series: "功能示例"
math: false
mermaid: false
i18nKey: "example-callouts"
lang: "en"
aiTranslatedFrom: "zh-CN"
---
This example is dedicated to verifying and testing the blog theme's rendering capabilities for **Callouts / Admonitions** in the main content area.

Based on the GitHub Alerts specification and AnzhiFish design aesthetics, this theme natively supports 13 different semantic colored cards, all of which automatically adapt to high‑contrast colors in both light and dark modes on the client side.

---

## Standard Callouts

Declare the corresponding card by using the `[!TYPE]` syntax on the first line of a blockquote.

### 1. Note (General Note)

> [!NOTE]
> This is the standard **Note** callout, used to provide background context and general tips.

```markdown
> [!NOTE]
> This is the standard **Note** callout, used to provide background context and general tips.
```

### 2. Tip (Practical Tip)

> [!TIP]
> **Quick Search Tip**: Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to instantly summon the global article search palette!

```markdown
> [!TIP]
> **Quick Search Tip**: Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to instantly summon the global article search palette!
```

### 3. Important (Key Focus)

> [!IMPORTANT]
> Before building a production version, ensure the environment variable `BLOG_BUILD_TARGET=static` is correctly applied.

```markdown
> [!IMPORTANT]
> Before building a production version, ensure the environment variable `BLOG_BUILD_TARGET=static` is correctly applied.
```

### 4. Warning (Risk Warning)

> [!WARNING]
> Do not commit database private keys or cloud service AccessKeys to a public code repository.

```markdown
> [!WARNING]
> Do not commit database private keys or cloud service AccessKeys to a public code repository.
```

### 5. Caution & Danger (Hazard Alerts)

> [!CAUTION]
> Be sure to complete a full data backup before performing any database restructuring operations.

> [!DANGER]
> Deleting the production database directly will permanently destroy all comments and user assets.

```markdown
> [!CAUTION]
> Be sure to complete a full data backup before performing any database restructuring operations.

> [!DANGER]
> Deleting the production database directly will permanently destroy all comments and user assets.
```

### 6. Success (Operation Successful)

> [!SUCCESS]
> Static build completed successfully; all static routes have been generated!

```markdown
> [!SUCCESS]
> Static build completed successfully; all static routes have been generated!
```

### 7. Question, Quote, Info, Todo, Bug, Example

> [!QUESTION]
> How can millisecond‑level full‑text search be achieved without any server‑side dependencies?

> [!QUOTE]
> “Elegant code not only runs on machines but also conveys ideas to humans like poetry.”

> [!INFO]
> This blog is built with Astro 6 and Tailwind 4, and the entire site is exported as pure static files.

> [!TODO]
> Plan to introduce WebAssembly client‑side tokenized search in the next version.

> [!BUG]
> Fixed a layout issue in older versions where tables were horizontally truncated on extremely narrow screens.

> [!EXAMPLE]
> Sample data is ready; you can copy the source code directly for further development.

```markdown
> [!QUESTION]
> How can millisecond‑level full‑text search be achieved without any server‑side dependencies?

> [!QUOTE]
> “Elegant code not only runs on machines but also conveys ideas to humans like poetry.”

> [!INFO]
> This blog is built with Astro 6 and Tailwind 4, and the entire site is exported as pure static files.

> [!TODO]
> Plan to introduce WebAssembly client‑side tokenized search in the next version.

> [!BUG]
> Fixed a layout issue in older versions where tables were horizontally truncated on extremely narrow screens.

> [!EXAMPLE]
> Sample data is ready; you can copy the source code directly for further development.
```

---

## Collapsible Details Admonitions

Add `-` (collapsed by default) or `+` (expanded by default) immediately after the type marker to generate a native collapsible card:

### 1. Collapsible Callout Collapsed by Default (`[!TIP]-`)

> [!TIP]- Click to expand: Production‑environment Nginx long‑term cache configuration
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```

```markdown
> [!TIP]- Click to expand: Production‑environment Nginx long‑term cache configuration
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```
```

### 2. Collapsible Callout Expanded by Default (`[!NOTE]+`)

> [!NOTE]+ Architecture design description (expanded by default)
> This section is expanded by default; clicking the title bar will smoothly collapse it to save screen space.

```markdown
> [!NOTE]+ Architecture design description (expanded by default)
> This section is expanded by default; clicking the title bar will smoothly collapse it to save screen space.
```