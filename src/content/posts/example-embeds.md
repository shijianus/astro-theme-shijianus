---
title: "示例：富媒体嵌入、Post Formats 与聊天气泡展示"
description: "全面展示 WordPress 风格 Post Formats、视频/音频黑胶唱片、书签卡片与聊天气泡对话流。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "embeds", "post-formats"]
category: "Examples"
series: "功能示例"
math: false
mermaid: false
---

本篇示例专用于展示与测试博客正文中的 **富媒体嵌入（Embeds）、WordPress Post Formats 与双人对话流（Chat Dialogue）**。

---

## 一、便签与微语录（Aside & Status）

### 1. Aside 便签卡片

<div class="article-aside">
  <p><strong>💡 随笔备忘</strong>：静态站点的真正价值不在于炫技，而在于交付极速、零服务端维护负担的纯粹阅读体验。</p>
</div>

### 2. Status 状态动态

<div class="article-status">
  <div class="article-status__header">
    <div class="article-status__user">
      <img class="article-status__avatar" src="/media/shijianus/avatar.jpg" alt="作者头像" />
      <div>
        <div class="article-status__name">shijianus</div>
        <div class="article-status__meta">发布于 2026-08-28 14:32 · 🇨🇳 杭州</div>
      </div>
    </div>
    <div class="article-status__badge">
      <span>📱 来自 极客工坊 Mac Studio</span>
    </div>
  </div>
  <p class="article-status__content">
    今天终于完成了正文栏全部格式扩展与视觉重构！从 KaTeX、Mermaid 到交互式下拉框与黑胶唱片，静态交付太爽了 🚀✨
  </p>
</div>

---

## 二、黑胶唱片音频卡片（Audio Vinyl Card）

音频播放时，唱片封面将自动触发无级平滑旋转动效：

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="唱片封面" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">星河漫步 (Ambient Focus)</div>
    <div class="audio-card__author">shijianus · 原创深度专注白噪音</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>

---

## 三、外部链接书签卡片（Bookmark Card）

<a class="article-bookmark" href="https://github.com/anzhiyu-c/hexo-theme-anzhiyu" target="_blank" rel="noopener">
  <div class="article-bookmark__content">
    <div class="article-bookmark__title">anzhiyu-c / hexo-theme-anzhiyu (安知鱼主题官方仓库)</div>
    <p class="article-bookmark__desc">AnZhiYu 是 Hexo 平台上广受赞誉的极客博客主题，以出色的微动效与信息密度设计成为行业标杆。</p>
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

## 四、双人聊天气泡对话流（Organic Animated Dialogue Stream）

配置 `data-animate="true"` 开启真实打字时序发送动效、动态头像（`footer_mini_logo__media`）与专属提示音，首次滑入时触发：

<div class="article-chat" data-animate="true" data-sound="true">
  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">开发者 <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:15</div>
      <div class="chat-bubble">
        你好！请问在 Astro 中实现 <code>KaTeX</code> 和 <code>Mermaid</code> 的静态渲染会不会拖慢前端页面加载速度？
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="架构师 shijianus" />
    <div class="chat-body">
      <div class="chat-author">架构师 <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:16</div>
      <div class="chat-bubble">
        完全不会！因为 <code>remark-math</code> 和 <code>rehype-katex</code> 在构建期（Build-time）就已经把公式编译成了纯 HTML/MathML 字符串，浏览器端 <strong>0 JS 运行时负担</strong>；而 Mermaid 图表也是动态按需异步加载 ESM 模块，首屏极其轻快！⚡
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
      <div class="chat-author">开发者 <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:17</div>
      <div class="chat-bubble">
        太棒了！这个根据消息长短变化的打字动画和动态头像效果非常棒！🎉
      </div>
    </div>
  </div>
</div>

---

## 五、交互式单位与汇率高精度换算器（Interactive Unit Converter）

<div class="interactive-unit-converter" data-default="1"></div>

