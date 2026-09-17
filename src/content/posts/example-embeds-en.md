---
title: "Example: Rich Media Embeds, Post Formats, and Chat Bubbles Showcase"
description: "A comprehensive showcase of WordPress-style Post Formats, video/audio vinyl records, bookmark cards, and chat bubble dialogue streams."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "embeds", "post-formats"]
category: "Examples"
series: "Feature Examples"
math: false
mermaid: false
i18nKey: "example-embeds"
lang: "en"
aiTranslatedFrom: "zh-CN"
---

This example article is dedicated to showcasing and testing **Rich Media Embeds, WordPress Post Formats, and Two-Person Chat Dialogue** within blog post content.

---

## I. Asides and Status Updates

### 1. Aside Cards

<div class="article-aside">
  <p><strong>💡 Quick Note</strong>: The true value of static sites isn't about showing off technical prowess, but about delivering a pure reading experience that's lightning-fast and free from server-side maintenance burdens.</p>
</div>

### 2. Status Updates

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
    Today, I finally completed all format extensions and visual refactoring for the main content area! From KaTeX and Mermaid to interactive dropdowns and vinyl record players, static delivery is just awesome! 🚀✨
  </p>
</div>

---

## II. Audio Vinyl Cards

When audio plays, the record cover will automatically trigger a smooth, stepless rotation animation:

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="Record Cover" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">Stellar Stroll (Ambient Focus)</div>
    <div class="audio-card__author">shijianus · Original Deep Focus White Noise</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>

---

## III. External Link Bookmark Cards

<a class="article-bookmark" href="https://github.com/anzhiyu-c/hexo-theme-anzhiyu" target="_blank" rel="noopener">
  <div class="article-bookmark__content">
    <div class="article-bookmark__title">anzhiyu-c / hexo-theme-anzhiyu (AnZhiYu Theme Official Repository)</div>
    <p class="article-bookmark__desc">AnZhiYu is a highly acclaimed geek blog theme for the Hexo platform, setting an industry standard with its excellent micro-animations and information density design.</p>
    <div class="article-bookmark__site">
      <span class="badge badge-primary">GitHub</span>
      <span>github.com · ⭐ 2.8k Stars</span>
    </div>
  </div>
  <div class="article-bookmark__icon">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
  </div>
</a>

---

## IV. Organic Animated Dialogue Stream

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
        Hello! Will implementing static rendering of `KaTeX` and `Mermaid` in Astro slow down frontend page load speed?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Architect shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architect <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:16</div>
      <div class="chat-bubble">
        Not at all! Because `remark-math` and `rehype-katex` compile formulas into pure HTML/MathML strings during the build-time, there's **zero JS runtime burden** on the browser side; and Mermaid diagrams are also dynamically loaded as ESM modules on demand, making the initial page load extremely fast! ⚡
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
        That's fantastic! The typing animation that varies with message length and the dynamic avatar effect are both excellent! 🎉
      </div>
    </div>
  </div>
</div>

---

## V. Interactive High-Precision Unit and Currency Converter

<div class="interactive-unit-converter" data-default="1"></div>