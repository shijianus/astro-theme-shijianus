---
title: "範例：富媒體嵌入、文章格式與聊天氣泡展示"
description: "全面展示 WordPress 風格文章格式、影音黑膠唱片、書籤卡片與聊天氣泡對話流。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["範例", "展示", "embeds", "post-formats"]
category: "範例"
series: "功能範例"
math: false
mermaid: false
i18nKey: "example-embeds"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---

本篇範例專用於展示與測試部落格正文中的 **富媒體嵌入（Embeds）、WordPress 文章格式（Post Formats）與雙人對話流（Chat Dialogue）**。

---

## 一、便條與微語錄（Aside & Status）

### 1. Aside 便條卡片

<div class="article-aside">
  <p><strong>💡 隨筆備忘</strong>：靜態網站的真正價值不在於炫技，而是在於交付極速、零伺服器維護負擔的純粹閱讀體驗。</p>
</div>

### 2. Status 狀態動態

<div class="article-status">
  <div class="article-status__header">
    <div class="article-status__user">
      <img class="article-status__avatar" src="/media/shijianus/avatar.jpg" alt="作者頭像" />
      <div>
        <div class="article-status__name">shijianus</div>
        <div class="article-status__meta">發佈於 2026-08-28 14:32 · 🇨🇳 杭州</div>
      </div>
    </div>
    <div class="article-status__badge">
      <span>📱 來自 極客工坊 Mac Studio</span>
    </div>
  </div>
  <p class="article-status__content">
    今天終於完成了正文欄全部格式擴展與視覺重構！從 KaTeX、Mermaid 到互動式下拉選單與黑膠唱片，靜態交付太棒了 🚀✨
  </p>
</div>

---

## 二、黑膠唱片音訊卡片（Audio Vinyl Card）

音訊播放時，唱片封面將自動觸發無級平滑旋轉動效：

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="唱片封面" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">星河漫步 (Ambient Focus)</div>
    <div class="audio-card__author">shijianus · 原創深度專注白噪音</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>

---

## 三、外部連結書籤卡片（Bookmark Card）

<a class="article-bookmark" href="https://github.com/anzhiyu-c/hexo-theme-anzhiyu" target="_blank" rel="noopener">
  <div class="article-bookmark__content">
    <div class="article-bookmark__title">anzhiyu-c / hexo-theme-anzhiyu (安知魚主題官方儲存庫)</div>
    <p class="article-bookmark__desc">AnZhiYu 是 Hexo 平臺上廣受讚譽的極客部落格主題，以出色的微動效與資訊密度設計成為業界標竿。</p>
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

## 四、雙人聊天氣泡對話流（Organic Animated Dialogue Stream）

配置 `data-animate="true"` 啟用真實打字時序傳送動效、動態頭像（`footer_mini_logo__media`）與專屬提示音，首次滑入時觸發：

<div class="article-chat" data-animate="true" data-sound="true">
  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">開發者 <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:15</div>
      <div class="chat-bubble">
        你好！請問在 Astro 中實現 <code>KaTeX</code> 和 <code>Mermaid</code> 的靜態渲染會不會拖慢前端頁面載入速度？
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="架構師 shijianus" />
    <div class="chat-body">
      <div class="chat-author">架構師 <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:16</div>
      <div class="chat-bubble">
        完全不會！因為 <code>remark-math</code> 和 <code>rehype-katex</code> 在建構期（Build-time）就已經把公式編譯成了純 HTML/MathML 字串，瀏覽器端 <strong>0 JS 執行時負擔</strong>；而 Mermaid 圖表也是動態按需非同步載入 ESM 模組，首頁載入極其輕快！⚡
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
      <div class="chat-author">開發者 <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:17</div>
      <div class="chat-bubble">
        太棒了！這個根據訊息長短變化的打字動畫和動態頭像效果非常棒！🎉
      </div>
    </div>
  </div>
</div>

---

## 五、互動式單位與匯率高精度換算器（Interactive Unit Converter）

<div class="interactive-unit-converter" data-default="1"></div>