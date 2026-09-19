---
title: "Anzhiyu-style Markdown Capability Review: Table of Contents, Formatting, Hidden Content, Media, and Content Blocks"
pubDate: 2026-04-25
updatedDate: 2026-04-25
description: "A long example article specifically designed to stress test article scanning, table of contents levels, GFM, hidden content, special formatting, media display, and common content blocks."
author: "shijianus"
category: "Frontend Engineering"
group: "Markdown Examples"
cover: "/media/shijianus/workbench.jpg"
coverAlt: "markdown showcase desk"
featured: true
sticky: 4
tags: ["Astro", "Markdown", "Theme Refactoring", "UI", "Study"]
i18nKey: "anzhiyu-markdown-showcase"
lang: "en"
aiTranslatedFrom: "zh-CN"
---

# This is a long article specifically for testing theme capabilities

This article is not a regular essay, but a comprehensive check to verify whether the current article page truly approaches the An Zhiyu theme reading experience. It will simultaneously cover **article hero image scanning**, **category and tag recognition**, **directory hierarchy mapping**, **code block enhancement**, **GFM tables and task lists**, **hidden content**, **special fonts and formats**, **media display**, **content block combination**, and **long paragraph scrolling performance**.

If these capabilities can consistently appear in the same article, and the table of contents, sharing, comments, sidebar, tipping, and overall reading path do not fall apart, then this theme can truly be considered in a deliverable stage.

## Basic Format Scan

First, use a basic text to confirm that the most common Markdown semantics are stable and readable:

- Here is **bold text** to confirm that body text emphasis is neither too bright nor blurry.
- Here is *italic text* to confirm that the body text rhythm is not interrupted.
- Here is ~~strikethrough~~ to check if GFM extensions are active.
- Here is `inline code` to confirm inline code block margins, rounded corners, and font size.
- Here is an [external link to Astro](https://astro.build/) to confirm link color and hover feedback.

This paragraph will also deliberately mix Chinese, English, numbers, and symbols, such as `Astro 6 + React 19 + Tailwind 4`, to ensure that character spacing and line breaks do not appear cramped in a real long article.

### Special Formats and Special Fonts

The following items are not content that ordinary blogs write daily, but they are very suitable for testing whether the article system has sufficiently complete expressive capabilities:

- `<mark>高亮文本</mark>` is used to test highlight marking.
- `<kbd>Ctrl</kbd> + <kbd>K</kbd>` is used to test keyboard shortcut performance.
- `<ruby>目录<rt>mulu</rt></ruby>` is used to test furigana typesetting.
- `<abbr title="Application Programming Interface">API</abbr>` is used to test acronym explanations.
- Inline superscript example: E = mc<sup>2</sup>.
- Inline subscript example: H<sub>2</sub>O and log<sub>n</sub>.

You can also directly insert a block of native HTML with different fonts:

<p>
  <span style="font-family: 'Times New Roman', serif; font-size: 1.08em; letter-spacing: 0.04em;">This sentence uses a serif rhythm.</span>
  <br />
  <span style="font-family: 'Courier New', monospace; font-size: 0.96em;">const typographyMode = "editorial + geek";</span>
</p>

<div class="article-note-card article-note-card--accent">
  <strong>Special Format Combination Stress Test</strong>
  <p>This section simultaneously covers <mark>highlighting</mark>, <kbd>keybinds</kbd>, `inline code`, different font weights, and native HTML, aiming to confirm that body text enhancements are not limited to a single content form.</p>
</div>

### Hidden Content and Spoilers

The current theme already supports several front-end enhanced inline content types:

- Spoiler Mask: ||This is a spoiler text that will be displayed after clicking, used to confirm that the buttonized mask has been correctly scanned.||
- Click to Show: %%This is a hidden hint that will expand after clicking.%%

This layer now only retains front-end visibility enhancements and no longer provides "front-end password hiding," a method easily mistaken for a security feature. When true password access is required, server-side access control in the article's frontmatter should be used.

If both interactions in this section are normal, it indicates that the body text enhancement script is consistent with Markdown rendering and has not mistakenly affected plain text nodes like `code`, `pre`, or other protected elements.

## Table of Contents Hierarchy Stress Test

This section is specifically for verifying whether the table of contents' hierarchy compression scheme has simultaneously met two objectives:

1. Hierarchy must be accurate; H4s cannot be disguised as H2s.
2. Indentation should not be excessive, otherwise the table of contents will lose practical clickability due to too much whitespace.

### First-level Grouping: Information Structure

When the table of contents truly aligns with the article's structure, readers don't need to read titles word-for-word to roughly determine if a section is a general overview, a sub-point, or an addendum. The task of the table of contents is not to "copy all titles," but to help readers build an article map.

#### Second-level Grouping: Hierarchy Clues

If the table of contents has no indentation at all, all titles will be crammed onto the same horizontal line, making it difficult for readers to quickly distinguish which title belongs to which section. Conversely, if each level uses excessive indentation, the table of contents will quickly lose click efficiency.

#### Second-level Grouping: Jump Efficiency

A truly usable solution typically doesn't involve further increasing indentation, but rather adding path highlighting, active branch markers, active item backgrounds, and numbering hints on top of small indentations, allowing both hierarchical relationships and operational efficiency to coexist.

### First-level Grouping: Reading Path

This section is used to test another common scenario: readers scan the table of contents from top to bottom, then stop at a certain H3, and finally click directly to jump to the middle of the body text.

#### Second-level Grouping: Current Position

If the current positioning area can stably display the active title, current level, and total sequence number, it can significantly improve the sense of direction when reading long articles.

#### Second-level Grouping: Table of Contents Scrolling

When the active title switches, the table of contents list itself should also follow, but it should not forcibly regain focus when the user manually scrolls the table of contents.

### First-level Grouping: Extremely Long Article

If the article is long enough, the table of contents should remain fixed and available, rather than losing its sticky behavior due to an incorrect card height strategy.

#### Second-level Grouping: H4 Density Test

This section will be supplemented with more H4s later, aiming to create more prominent deep-level nodes in the table of contents and further observe if compressed indentation remains readable.

##### Third-level Supplement: H5 Path Compression

This level is used to confirm that as the table of contents goes deeper, the clickable area does not become too narrow due to increased nesting. In other words, **deeper levels do not mean smaller interactive areas**.

###### Fourth-level Terminal: H6 Anchor Test

If you can still clearly see the position of this level in the right-hand table of contents, and after clicking, the anchor jump is accurate and the current path highlighting is stable, then the scanning for deeper-level headings has been completed.

#### Second-level Grouping: Extra Node A

This is extra node A, used to create a longer table of contents list.

#### Second-level Grouping: Extra Node B

This is extra node B, used to create a longer table of contents list.

#### Second-level Grouping: Extra Node C

This is extra node C, used to create a longer table of contents list.

## Lists, Tasks, and Tables

The following set of content primarily verifies whether GFM extensions have been fully integrated.

### Unordered Lists and Ordered Lists

- Homepage structure first.
- Article page table of contents first.
- The comment section should remain intuitive.

1. First, check if the table of contents is reliable.
2. Next, check if sharing and tipping are convenient.
3. Finally, check if comments can actually be published.

### Task List

- [x] Header Image and Meta Information Scan
- [x] Tag and category aggregation
- [x] Table of Contents hierarchy correction
- [x] Tipping and sharing structure overhaul
- [ ] Integrate real remote comment data
- [ ] Supplement more Anzhiyu-style content tags

### Table

| Module | Current Goal | Acceptance Criteria |
| --- | --- | --- |
| Homepage Category Cards | Align with Anzhiyu's animations | Consistent icon angle, zoom strategy, and hover rhythm |
| TOC | Accurate hierarchy and maintains clickability | H2/H3/H4 are distinguishable, clear active path |
| Tipping Pop-up | Only display valid information | Area selection + QR code, and automatically avoids viewport |
| Sharing Tools | Truly corresponds to different platforms | Not just copying links, but generating corresponding sharing content |
| Comment Section | Directly publishable | Vertical layout, fixed height, scroll to browse public comments |

## Quotes, collapsible blocks, and long code

> A mature blog theme should not only look good in screenshots, but also work consistently and stably in real long-form articles.

This quote primarily tests whether the hierarchy and rhythm of the blockquote are appropriate for the main text.

<details>
  <summary>Click to expand the collapsible block and check if summary/details already have a readable style</summary>
  <p>Collapsible blocks are very suitable for secondary explanations, supplementary materials, and temporary notes. They are intentionally placed here as native HTML, rather than theme-specific tags, to maintain the portability of the Markdown content itself.</p>
  <p>If you later switch your article system from local Markdown to an API or CMS, these standard HTML structures will be more stable than theme-specific shortcodes.</p>
</details>

### TypeScript Code Block

```ts
type TocNode = {
  id: string;
  depth: 2 | 3 | 4;
  title: string;
  children: TocNode[];
};

export function compressTocIndent(nodes: TocNode[], offset = 0): TocNode[] {
  return nodes.map((node) => ({
    ...node,
    children: compressTocIndent(node.children, offset + 1),
  }));
}

const sharePayload = {
  title: "安知鱼式主题对齐",
  summary: "把目录、分享、评论与打赏的真实使用路径一起补齐。",
  platforms: ["wechat", "weibo", "x", "telegram", "email"],
};
```

### Bash Code Block

```bash
npm install
npm run build
npm run preview -- --host 0.0.0.0
```

### CSS Code Block

```css
#card-toc .toc-item {
  padding-left: calc(var(--toc-level, 0) * 12px);
}

#card-toc .toc-item.is-active-branch > .toc-link {
  background: color-mix(in srgb, var(--theme-main) 10%, var(--card-bg));
}

.post-share-grid__surface {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

## Images, Horizontal Rules, and Footnotes

The image below is mainly used to confirm that images in the main text do not exceed the article width in long-form content, and maintain a consistent spacing relationship with the surrounding context.

![Workbench and Writing Environment](/media/shijianus/workbench.jpg)

---

Footnotes are also a common structure in long-form articles. We are now using them to test if GFM footnote capabilities are active. [^toc]

[^toc]: The footnote text here will be placed at the bottom of the article to verify footnote numbering, jumps, and main text spacing.

## Media and Embeds Supplement

If this article is to be used as a comprehensive theme check, the media blocks within the main text also need to be thoroughly reviewed:

<figure>
  <video src="/media/shijianus/avatar-dynamic.mp4" poster="/media/shijianus/default.png" muted loop playsinline controls></video>
  <figcaption>Local video + poster, used to confirm that media in the main text remains stably contained at different widths.</figcaption>
</figure>

<figure>
  <img src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80" alt="Remote Image Bed Example" />
  <figcaption>Remote image hosting images, used to confirm that cross-origin resources and main text spacing do not conflict with each other.</figcaption>
</figure>

If remote resources fail, the main text enhancement script will revert them to default placeholder images instead of leaving broken empty frames.

## Common Content Block Equivalence Demonstration

This section no longer just tests basic Markdown, but rather complements some of the most common content blocks in daily blog themes that are also most easily lost during migration. Here, native HTML and the current theme's styles are used for an equivalent demonstration, focusing on verifying typography, spacing, and responsiveness, rather than binding to a specific old theme's private syntax.

<div class="article-demo-stack">
  <div class="article-demo-tabs">
    <div class="article-demo-tabs__nav">
      <span>Tag Panel</span>
      <span>Step-by-step Instructions</span>
      <span>Adaptation Conclusion</span>
    </div>
    <div class="article-demo-tabs__panel">
      This group simulates common tabs / buttons content areas, verifying whether buttonized information blocks still have sufficient hierarchy within the main text without disrupting its flow.
    </div>
  </div>

  <div class="article-demo-timeline">
    <div class="article-demo-timeline__item">
      <strong>Stage 1: Structural Alignment</strong>
      <span>First align the skeleton of the article page, homepage, table of contents, and fixed sidebar, ensuring readers won't lose navigation before the comments area or footer.</span>
    </div>
    <div class="article-demo-timeline__item">
      <strong>Stage 2: Interaction Closure</strong>
      <span>Clean up duplicate buttons, placing share, language, account, and settings each in clearer locations to avoid competing for space.</span>
    </div>
    <div class="article-demo-timeline__item">
      <strong>Stage 3: Content Refill</strong>
      <span>Add media, hidden content, QR codes, site cards, and long-article stress testing to ensure that real long articles won't fall apart.</span>
    </div>
  </div>

  <div class="article-demo-gallery">
    <img src="/media/shijianus/workbench.jpg" alt="Workbench Screen" />
    <img src="/media/shijianus/hero.jpg" alt="Homepage Hero Image Block" />
    <img src="/media/shijianus/tg-group.jpg" alt="QR Code and Long Image Test" />
  </div>

  <div class="article-demo-links">
    <div class="article-demo-link-card">
      <strong>Site Card</strong>
      <span>Equivalent to common site-card / link-card, testing whether card-style links in the body still retain sufficient clickable area.</span>
    </div>
    <div class="article-demo-link-card">
      <strong>Media Card</strong>
      <span>Combined with image hosting, QR codes, and video thumbnail testing to confirm that content of various sizes does not disrupt the body width or whitespace rhythm.</span>
    </div>
  </div>
</div>

## Long Paragraph Scrolling Stress Test

The real issues usually don't appear in a short demo article, but in a sufficiently long article that contains multiple modules, a table of contents, and floating tools. Therefore, we deliberately add two longer sections of body text here to test, during scrolling, whether the content transition after the article's header image, the breathing of the main text, the sticky sidebar, the active items in the table of contents, and the reading gap between the reward area and the comments section remain stable.

A stable article page should not require users to understand component structures, tech stacks, or interaction motives. Users actually perceive only three things: first, whether they can quickly find the paragraph they want to read; second, whether the entry points for sharing, rewarding, or commenting appear precisely when needed, without large interruptions to the main text; third, whether the page can maintain order when the article is long, the table of contents has many nodes, and comments continue to grow. As long as these three conditions are met, the theme shifts from “looks like a theme” to “a content system that can be used long‑term.”

Finally, a summary from the author’s perspective: aligning the Anzhiyu theme does not mean copying every line of the template verbatim, but rather re‑examining the design judgments that have been validated through long‑term use, and reproducing them within the Astro ecosystem in a way that better fits the current project structure. What truly deserves replication is not the old tech stack, but its judgment regarding information hierarchy, interaction feedback, reading flow, and module ordering. If these judgments have been fully validated in this article, then this alignment work can truly be considered ready for delivery.