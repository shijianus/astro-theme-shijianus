---
title: "Static Site Generators (SSG) and Blog Theme Content Formats: A Comprehensive Guide from Mainstream Support to Special Features, Dropdown Interactions, and Typography Enhancements"
pubDate: 2026-08-28
updatedDate: 2026-08-28
description: "A systematic overview of content format support across major static site generators and blog systems such as Hugo, Jekyll, Eleventy, Astro, Hexo, WordPress, and more. Covers Markdown, MDX, HTML, AsciiDoc, Org-mode, RST, full WordPress Post Formats implementation, interactive dropdown switchers, accordion collapses, KaTeX math, Mermaid diagrams, and encryption capabilities."
author: "shijianus"
category: "System Design"
group: "Technical Specification"
featured: true
sticky: 10
postFormat: "standard"
markup: "markdown"
tags: ["SSG", "Markdown", "MDX", "Astro", "Theme Formats", "EpoCanvas", "Typography Guidelines", "UI", "Mindmap", "Mind Map"]
mermaid: true
mindmap: true
i18nKey: "content-formats-and-markup-mastery"
lang: "en"
isAiGenerated: true
aiTranslatedFrom: "zh-CN"
---

# Static Site Generators (SSG) and Theme Content Format Panorama

In modern static site generators (SSG) and standalone blog‑theme projects, **the ability to parse and render article content formats** directly determines the creative boundaries for authors and the reading experience for audiences.

This guide surveys the major SSG ecosystem (**Hugo, Jekyll, Eleventy, Astro, Pelican, Hexo, WordPress, VitePress**, etc.), establishes a comprehensive taxonomy that spans **basic markup, extended documentation languages, WordPress Post Formats, interactive dropdown switchers, accordion collapses, LaTeX math, Mermaid diagrams, and encryption/decryption special features**, and provides live, plug‑and‑play rendering demos.

---

## 1. Content Format Support Across Mainstream Static Site Generators (SSG)

Different static site generators adopt distinct philosophies for content parsing. The table below systematically summarizes native and extended format support for each major engine:

| Static Site Generator / Platform | Core Parsing Engine | Natively Supported Formats | Extended / External Tool Support | Front Matter Serialization |
| :--- | :--- | :--- | :--- | :--- |
| **Hugo** | Goldmark (Go) | `.md` (CommonMark/GFM), `.html`, `.org` (Org‑mode) | `.adoc` (Asciidoctor), `.rst` (rst2html), `.pdc` (Pandoc) | YAML (`---`), TOML (`+++`), JSON (`{}`) |
| **Astro (this blog’s architecture)** | Vite + Unified/Remark + MDX | `.md` (GFM), `.mdx` (JSX), `.html`, `.astro` components | Mountable AST loaders for Org/AsciiDoc/RST | YAML, TOML, JSON |
| **Jekyll** | Kramdown (Ruby) | `.md` (Kramdown/GFM), `.html` | `.textile` (Textile plugin) | YAML |
| **Eleventy (11ty)** | JavaScript template pipeline | `.md`, `.html`, `.liquid`, `.njk`, `.ejs`, `.webc` | MDX (plugin), custom template extensions | YAML, JSON, JS/11tydata |
| **Hexo** | Marked / Hexo‑Renderer | `.md` (GFM), `.html`, EJS/Pug templates | Org‑mode / Pandoc (plugin) | YAML, JSON |
| **Pelican** | Python Docutils | `.md` (Markdown), `.rst` (reStructuredText) | `.asciidoc` (Asciidoctor) | YAML, Markdown metadata |
| **WordPress (Headless/Theme)** | Gutenberg Block Engine | HTML5 Blocks, Shortcodes, Post Formats | Classic Editor HTML | JSON block metadata / Post Meta |
| **VitePress / Docusaurus** | Markdown‑It / MDX | `.md`, `.mdx`, Vue/React components | Custom container syntax (`::: tip`) | YAML |

> [!NOTE]
> **Ecosystem Insight**: Hugo leverages Go’s high‑concurrency model to natively support Markdown and Org‑mode, while modern front‑end‑focused SSGs like **Astro** capitalize on **MDX and island architecture** to embed dynamic UI (e.g., the dropdown switcher, password modal, vinyl record) directly within content with ultimate flexibility.

---

## 2. Front Matter Serialization Format Guidelines

The metadata block at the top of a blog post (Front Matter) determines routing, title, dates, categories, cover images, and protection status. This theme supports all mainstream serialization modes:

### 1. YAML (most widely used, recommended default)

```yaml
---
title: "Article Title"
pubDate: 2026-08-28
author: "shijianus"
tags: ["Astro", "Markdown"]
featured: true
postFormat: "aside"
---
```

### 2. TOML (common in Hugo)

```toml
+++
title = "Article Title"
pubDate = 2026-08-28T00:00:00Z
author = "shijianus"
tags = ["Astro", "Markdown"]
featured = true
+++
```

### 3. JSON (API‑driven and headless scenarios)

```json
{
  "title": "Article Title",
  "pubDate": "2026-08-28T00:00:00.000Z",
  "author": "shijianus",
  "tags": ["Astro", "Markdown"],
  "featured": true
}
```

---

## 3. Comparison of Lightweight Markup and Non‑Markdown Formats, with Migration Mappings

Authors may work with lightweight markup languages other than Markdown. Below are the syntax highlights of the most common formats and their equivalent rendering in this theme:

### 1. AsciiDoc (.adoc / .asciidoc)

AsciiDoc is popular for technical books and long‑form engineering manuals, offering rich admonition blocks and attribute systems:

```asciidoc
// AsciiDoc source syntax
= AsciiDoc Technical Specification
:author: shijianus
:toc: macro

[NOTE]
====
This is an AsciiDoc‑style note card.
====

[cols="1,2,1", options="header"]
|===
| Module | Description | Status
| Core Engine | Astro 6 static pipeline | Ready
|===
```

**Equivalent Markdown / MDX in this theme**:

> [!NOTE]
> This is a native note card rendered by the Astro theme, with identical styling and interaction.

| Module | Description | Status |
| :--- | :--- | :---: |
| **Core Engine** | Astro 6 static pipeline | <span class="badge badge-success">Ready</span> |

---

### 2. Emacs Org‑Mode (.org)

Org‑mode is Emacs’s powerhouse for knowledge management, task tracking, and documentation:

```ini
#+TITLE: Emacs Org‑Mode Practice Notes
#+DATE: 2026-08-28
#+TAGS: Emacs OrgMode

* TODO Phase One: Enhanced Markdown Scanning [1/2]
- [X] Fix table overflow on mobile
- [ ] Complete Org‑mode syntax converter

#+BEGIN_QUOTE
“Org‑mode is not just a format; it’s an executable thinking workflow.”
#+END_QUOTE
```

**Standard static GFM task list rendering (read‑only) in this theme**:

- [x] Fix table overflow on mobile
- [ ] Complete Org‑mode syntax converter

> [!QUOTE]
> “Org‑mode is not just a format; it’s an executable thinking workflow.”

#### Interactive Task List with Linked Progress Bar

In tutorials, hands‑on guides, and deployment manuals, a static `[ ]` checklist offers limited interactivity. This theme adds **real‑time checkable task lists (`.article-task-tracker`)** that automatically update a progress bar and unlock downstream commands once all critical steps are completed—perfect for “level‑up” style checklists:

<div class="article-task-tracker" data-storage-key="content-format-tutorial-demo">
  <div class="task-tracker__header">
    <div class="task-tracker__title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      <span>Static Site Engineering Pre‑Deployment Checklist (Interactive Real‑Time Check)</span>
    </div>
    <span class="task-tracker__count">1/4 steps completed (25%)</span>
  </div>
  <div class="task-tracker__bar-wrap">
    <div class="task-tracker__fill" style="width: 25%;"></div>
  </div>
  <ul class="task-checklist">
    <li class="task-checklist-item is-done">
      <input type="checkbox" checked id="chk-step-1" />
      <div class="task-item-body">
        <label for="chk-step-1" class="task-item-label">Step 1: Complete a full local code backup and Git commit</label>
        <div class="task-item-desc">Verify a clean working tree and record the backup hash in the development audit log.</div>
      </div>
    </li>
    <li class="task-checklist-item">
----------------------------------------

---

> **Note:** This is an AI-assisted partial translation. The full article (78KB+) exceeds the AI context window. The complete English version is in preparation. [Read the original Chinese version](/posts/content-formats-and-markup-mastery/).