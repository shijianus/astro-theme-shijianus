---
title: "Example: Front Matter Extended Fields and Zod Validation Showcase"
description: "A comprehensive analysis of all supported Front Matter field definitions in this blog and their theme interaction behaviors."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "frontmatter", "config"]
category: "Example"
series: "Feature Examples"
math: false
mermaid: false
i18nKey: "example-frontmatter-fields"
lang: "en"
aiTranslatedFrom: "zh-CN"
---

This example is specifically designed to systematically parse and explain all Front Matter fields defined in this theme via **Zod Schema** in `src/content.config.ts`.

---

## 1. List of Supported Front Matter Fields

| Field Name | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Required** | Main article title |
| `pubDate` | `Date` | **Required** | Publication date (YYYY-MM-DD) |
| `updatedDate` | `Date` | Optional | Last updated date |
| `description` | `string` | Optional | Article summary, used for SEO and card display |
| `author` | `string` | `'shijianus'` | Author's name |
| `tags` | `array<string>` | `[]` | List of tags |
| `category` | `string` | Optional | Main category name |
| `cover` | `string` | Optional | Cover image URL |
| `coverAlt` | `string` | Optional | Cover image Alt text |
| `featured` | `boolean` | `false` | Whether to mark as a featured article |
| `sticky` | `number` | `0` | Pin weight (higher value means higher priority) |
| `draft` | `boolean` | `false` | Draft flag (automatically filtered in production builds) |
| `postFormat` | `enum` | `'standard'` | WordPress post format (`aside`, `status`, `quote`, `gallery`, etc.) |
| `toc` / `hideToc` | `boolean` | `true` / `false` | Whether to enable / force hide the right-side table of contents |
| `math` | `boolean` | `false` | Whether to enable LaTeX math formula rendering |
| `mermaid` | `boolean` | `false` | Whether to enable Mermaid vector diagram rendering |
| `series` | `string` | Optional | Name of the associated article series |
| `access` | `object` | Optional | Password protection and regional IP blocking configuration |

---

## 2. Standard Front Matter Declaration Example

```yaml
---
title: "Full article title"
pubDate: 2026-08-28
description: "This is a demonstration article with complete metadata."
author: "shijianus"
category: "System Design"
tags: ["Astro", "Markdown", "Example"]
cover: "/media/shijianus/workbench.jpg"
featured: true
sticky: 1
toc: true
math: true
mermaid: true
postFormat: "standard"
---
```