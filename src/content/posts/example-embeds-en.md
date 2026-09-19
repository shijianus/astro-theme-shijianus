---
title: "Example: Rich Media Embeds, Post Formats, and Chat Bubble Display"
description: "A comprehensive showcase of WordPress-style Post Formats, video/audio vinyl records, bookmark cards, and chat bubble dialogue flow."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "embeds", "post-formats"]
category: "Example"
series: "功能示例"
math: false
mermaid: false
i18nKey: "example-embeds"
lang: "en"
aiTranslatedFrom: "zh-CN"
---
This example is dedicated to showcasing and testing **Rich Media Embeds, WordPress Post Formats, and Chat Dialogue** within blog posts.

---

## I. Notes and Micro-Quotes (Aside & Status)

### 1. Aside Note Card

<div class="article-aside">
  <p><strong>💡 Memo</strong>: The true value of a static site isn't about showing off technical prowess, but about delivering a pure reading experience with extreme speed and zero server-side maintenance burden.</p>
</div>

### 2. Status Update

<div class="article-status">
  <div class="article-status__header">
    <div class="article-status__user">
      <img class="article-status__avatar" src="/media/shijianus/avatar.jpg" alt="Author's Avatar" />
      <div>
        <div class="article-status__name">shijianus</div>
        <div class="article-status__meta">Posted on 2026-08-28 14:32 · 🇨🇳 Hangzhou</div>
      </div>
    </div>
    <div class="article-status__badge">
      <span>📱 From Geek Workshop Mac Studio</span>
    </div>
  </div>
  <p class="article-status__content">
    Finally completed all format extensions and visual refactoring for the main content column today! From KaTeX and Mermaid to interactive dropdowns and vinyl records, static delivery is just awesome 🚀✨
  </p>
</div>

---

## II. Audio Vinyl Card

When audio plays, the album cover will automatically trigger a stepless smooth rotation animation:

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="Album Cover" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">Stellar Stroll (Ambient Focus)</div>
    <div class="audio-card__author">shijianus · Original Deep Focus White Noise</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>

---

## III. External Link Bookmark Card

<a class="article-bookmark" href="https://github.com/anzhiyu-c/hexo-theme-anzhiyu" target="_blank" rel="noopener">
  <div class="article-bookmark__content">
    <div class="article-bookmark__title">anzhiyu-c / hexo-theme-anzhiyu (AnZhiYu Theme Official Repository)</div>
    <p class="article-bookmark__desc">AnZhiYu is a highly acclaimed geek blog theme on the Hexo platform, setting an industry standard with its excellent micro-animations and information density design.</p>
    <div class="article-bookmark__site">
      <span class="badge badge-primary">GitHub</span>
      <span>github.com · ⭐ 2.8k Stars</span>
    </div>
  </div>
  <div class="article-bookmark__icon">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
  </div>
</a>

## 4. Two-Person Chat Bubble Dialogue Stream (Organic Animated Dialogue Stream)

Configure `data-animate="true"` to enable realistic typing animation, dynamic avatars (`footer_mini_logo__media`), and exclusive notification sounds, triggered on first scroll-in:

<div class="article-chat" data-animate="true" data-sound="true">
  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Developer <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:15</div>
      <div class="chat-bubble">
        Hello! Will implementing static rendering of <code>KaTeX</code> and <code>Mermaid</code> in Astro slow down front-end page loading speed?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="架构师 shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architect <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:16</div>
      <div class="chat-bubble">
        Not at all! Because <code>remark-math</code> and <code>rehype-katex</code> compile formulas into pure HTML/MathML strings during the build phase (Build-time), there's <strong>0 JS runtime burden</strong> on the browser side; and Mermaid diagrams are dynamically loaded as ESM modules on demand, making the initial screen extremely fast! ⚡
      </div>
    </div>
  </div>

  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Developer <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:17</div>
      <div class="chat-bubble">
        Awesome! This typing animation that varies with message length and the dynamic avatar effect are fantastic! 🎉
      </div>
    </div>
  </div>
</div>

---

## 5. Interactive Unit and Exchange Rate High-Precision Converter (Interactive Unit Converter)

<div class="interactive-unit-converter" data-default="1"></div>