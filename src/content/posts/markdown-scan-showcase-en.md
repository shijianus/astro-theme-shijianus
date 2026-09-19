---
title: "Full Example of Markdown Scanning and Display Capabilities"
pubDate: 2026-04-25
description: "Use a long article to run through the current Markdown scanning, table of contents hierarchy, hidden content, GFM tables, footnotes, code blocks, and special formatting all at once."
author: "shijianus"
category: "System Design"
group: "Markdown Examples"
cover: "/media/shijianus/system.jpg"
coverAlt: "markdown showcase board"
tags: ["Markdown", "Astro", "Config", "UI", "Theme Refactor"]
featured: true
sticky: 4
i18nKey: "markdown-scan-showcase"
lang: "en"
aiTranslatedFrom: "zh-CN"
---
This article is specifically designed to validate content scanning, table of contents (TOC) synchronization, style enhancement, and readability strategies within the theme. It is not a "conceptual overview" but rather a **genuine content sample suitable for smoke-testing the frontend theme**.

In the current version, I aim to cover the following aspects simultaneously within a single article:

- **Heading hierarchy scanning**
- **Code blocks and inline code**
- **Tables, task lists, and footnotes**
- **Special formatting, such as <mark>highlights</mark>, <kbd>Ctrl</kbd> + <kbd>K</kbd>, and <ruby>AnZhiYu<rt>AnZhiYu</rt></ruby>**
- **Hidden content and lightweight interactions**
- **Blockquotes, lists, dividers, collapsible details, and tip cards**

> If a theme only looks correct with "standard paragraphs + standard headings," it cannot yet be considered truly complete.

## Scanning Objectives

A theme's scanning of an article should not stop at just `title` and `description`. It must also simultaneously address:

1. The article's **actual hierarchical structure**, as this directly impacts the right-side TOC.
2. **Emphasis and rhythm** within the body text, since a full screen of plain text is inefficient for browsing.
3. **Semantic presentation** of code, lists, tables, and quotes, because technical blogs do not only output paragraphs.
4. Whether the article contains special content blocks such as **hidden content, tips, or supplementary notes**, as these affect the reading path.

### Why the TOC Cannot Rely Solely on "Indentation"

A common mistake is interpreting TOC hierarchy solely as `padding-left`. While this may appear hierarchical, once the depth increases:

- Whitespace expands drastically
- Clickable areas become compressed
- Active items become difficult to identify
- Users lose track of their current level while scrolling

Therefore, the goal of this TOC implementation is: **hierarchy must be authentic, indentation must be restrained, and the active path must be clearly visible**.

#### A Balanced Solution

The current approach does not involve significantly shifting third- and fourth-level headings to the right. Instead, it simultaneously employs:

- Small-step indentation
- Highlighting of the current item
- Subtle highlighting of the parent path
- Vertical guide lines
- Metadata for the current heading

This balances "knowing which level you are on" with "keeping the TOC clickable, scannable, and scrollable."

## Inline Formatting

The most common layer of enhancement in body text is the visualization of **inline information**. For example:

- Variable names can be written as `themeContract`
- Configuration items can be written as `siteConfig.post.comments`
- Status terms can be written as <mark>in progress</mark>
- Keyboard shortcuts can be written as <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
- Abbreviations can be written as <abbr title="Table of Contents">TOC</abbr> and <abbr title="Application Programming Interface">API</abbr>
- Specific terms can be written as <span class="article-inline-serif">serif emphasis</span> or <span class="article-inline-mono">mono emphasis</span>

Some content should not be fully expanded initially, for example:

- This is a `standard tip`
- This is an `emphasized term`
- This is `inline code`
- This is a `parameter name`
- This is a ||spoiler that appears only after clicking||
- This is %%password:24680|hidden content that appears only after entering the password%%

### Emphasis and Rhythm

When a paragraph contains **key sentences**, `configuration names`, <mark>status terms</mark>, and <kbd>keyboard shortcuts</kbd> simultaneously, readers can break down and understand the paragraph more quickly without needing to read every word.

#### Special Characters and Superscripts/Subscripts

For example:

- E = mc<sup>2</sup>
- H<sub>2</sub>O
- <ruby>frontend<rt>frontend</rt></ruby>
- <ruby>refactoring<rt>rebuild</rt></ruby>

## Tip Cards and Collapsible Blocks

Below is a custom tip card. It does not rely on additional plugins and uses only HTML permitted in Markdown:

<div class="article-note-card">
  <strong>Design Judgment</strong>
  <p>If a style or animation does not improve information localization efficiency, it should not be retained simply because it "looks cool."</p>
</div>

Further down is a collapsible block:

<details class="article-detail-card">
  <summary>Click to expand: What exactly is this Markdown sample testing?</summary>
  <p>It tests whether heading scanning, right-side TOC, GFM tables, task lists, footnotes, hidden content, inline styles, code blocks, and block-level typography all function cohesively.</p>
  <p>If any of these elements render incorrectly, it indicates that the theme's article layer is not yet truly stable.</p>
</details>

### Blockquotes

> "It is not about making the theme flashy, but about making the information clear."
>
> For technical blogs, what truly matters is structure, order, and feedback, not floating decorations.

#### Secondary Quotes and Explanations

> The TOC is important not because it resembles documentation, but because it makes long-form content navigable.

## Code Blocks

A technical article must be able to accommodate code blocks in different languages simultaneously.

### TypeScript

```ts
type TocNode = {
  id: string;
  depth: 2 | 3 | 4;
  title: string;
  children: TocNode[];
};

function buildCompactToc(nodes: TocNode[]) {
  return nodes.map((node) => ({
    ...node,
    offset: Math.max(0, node.depth - 2) * 12,
    activePath: false,
  }));
}
```

### Bash

```bash
npm install
npm run build
npm run preview:host
```

### CSS

```css
#card-toc .toc-item.is-active > .toc-link {
  background: var(--theme-main);
  color: var(--white);
  box-shadow: inset 3px 0 0 rgba(255, 255, 255, 0.34);
}
```

#### Principles for Using Inline Code

Do not write entire sentences as `inline code`. Only true configuration names, function names, or keywords should be formatted as code, such as `navigator.share()`, `remark-gfm`, and `scrollIntoView()`.

## GFM Tables

The table below is used to verify headers, alignment, borders, and mobile scrolling:

| Module | Goal | Current Strategy | Notes |
| --- | --- | --- | --- |
| Homepage Category Cards | Align with AnZhiYu hover | Use real icons + compressed expansion animation | Specifically verify `lime` |
| TOC | Authentic hierarchy without wasting space | Tree structure + light indentation + active path | Balances click efficiency |
| Comment Section | Directly publishable | Retain only the message box and public comment stream | Do not expose test entry points |
| Share Section | Correspond to real social media | Construct share parameters individually for each platform | Not just copying links |

### Task List

- [x] Covers standard paragraphs and multi-level headings
- [x] Covers inline code and code blocks
- [x] Covers spoilers and password-protected hidden content
- [x] Covers tables and task lists
- [x] Covers collapsible blocks, tip cards, and blockquotes
- [ ] Continue adding support for more Anzhiyu-specific content block syntax[^future]

#### Mixed Ordered and Unordered Lists

1. First, define the article structure.
2. Next, determine the mapping for the table of contents on the right.
3. Then, decide on the visual hierarchy for each type of content block.

- The focus is not on the number of features
- But on whether the presentation is orderly
- And whether different modules can truly work together

## Footnotes

Footnotes are also part of the content scanning process, as they affect the typography and anchor behavior at the end of the article. Here are two examples: an explanatory footnote[^scan-note] and an engineering-judgment footnote[^engineering-note].

### Cross-Paragraph Supplements

When the main text contains content that is "worth mentioning but shouldn't interrupt the main flow," footnotes are usually more effective than cramming the entire paragraph into parentheses.

#### When Not to Use Footnotes

If the information is essential for understanding the main point, it should not be hidden in a footnote. Footnotes are suitable for supplementary information, not for carrying core arguments.

## Combining Content Blocks

The following section intentionally mixes multiple capabilities to ensure the theme does not "render correctly in isolation but distort when combined."

<div class="article-note-card article-note-card--accent">
  <strong>Combination Test</strong>
  <p>This paragraph simultaneously contains <mark>highlighted text</mark>, <kbd>key bindings</kbd>, <ruby>term<rt>term</rt></ruby>, `inline code`, and a footnote reference[^combo].</p>
</div>

If an article contains:

- Explanatory paragraphs
- Hierarchical headings
- Code blocks
- Tables
- Blockquotes
- Inline emphasis
- Hidden content
- Collapsible supplements

and the theme can still maintain reading order, then this layer of the content system is truly stable.

### How to Use This as a Smoke Test Article

You can use this article directly to verify the following:

1. Whether the table of contents on the right correctly identifies H2 / H3 / H4.
2. Whether the active item, parent path, and scroll positioning are natural.
3. Whether code blocks, tables, and task lists have a unified visual style.
4. Whether hidden content is interactive.
5. Whether the vertical rhythm between sharing, comments, sidebar, and main content is harmonious.

#### Final Conclusion

A publishable blog theme should not look normal only in the simplest articles. It should be able to withstand samples that "intentionally max out content complexity all at once."

---

[^scan-note]: The "scanning" here includes both frontmatter field scanning and rendering scanning of headings, summaries, body hierarchy, and interactive content.
[^engineering-note]: If the table of contents relies solely on visual indentation to simulate hierarchy, it will eventually expose issues with positioning and clickable areas in long articles.
[^future]: For example, more complete Anzhiyu tag syntax, reusable tip block aliases, and a content component set closer to the original theme.
[^combo]: The purpose of the combination test is to prevent the theme from performing correctly only under a single content type.