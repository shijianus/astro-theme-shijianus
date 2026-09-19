---
title: "Beispiel: Rich-Media-Einbettungen, Post-Formate und Chatblasen-Anzeige"
description: "Umfassende Demonstration von WordPress-Stil Post-Formaten, Video-/Audio-Schallplatten, Lesezeichenkarten und Chatblasen-Dialogflüssen."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["Beispiel", "Vorführung", "Einbettungen", "Post-Formate"]
category: "Beispiel"
series: "功能示例"
math: false
mermaid: false
i18nKey: "example-embeds"
lang: "de"
aiTranslatedFrom: "zh-CN"
---
Dieses Beispiel dient der Demonstration und dem Testen von **Rich-Media-Einbettungen (Embeds)**, WordPress Post-Formaten und Zwei-Personen-Dialogflüssen (Chat-Dialog) im Blog-Beitragstext.

---

## I. Notizen und Kurzbeiträge (Aside & Status)

### 1. Aside Notizkarte

<div class="article-aside">
  <p><strong>💡 Memo</strong>: Der wahre Wert statischer Websites liegt nicht in der Demonstration technischer Fähigkeiten, sondern in der Bereitstellung eines extrem schnellen, wartungsfreien und reinen Leseerlebnisses.</p>
</div>

### 2. Status-Update

<div class="article-status">
  <div class="article-status__header">
    <div class="article-status__user">
      <img class="article-status__avatar" src="/media/shijianus/avatar.jpg" alt="Autoren-Avatar" />
      <div>
        <div class="article-status__name">shijianus</div>
        <div class="article-status__meta">Veröffentlicht am 28.08.2026 14:32 · 🇨🇳 Hangzhou</div>
      </div>
    </div>
    <div class="article-status__badge">
      <span>📱 Von Geek Workshop Mac Studio</span>
    </div>
  </div>
  <p class="article-status__content">
    Heute habe ich endlich die vollständige Formaterweiterung und visuelle Neugestaltung der Inhaltsspalte abgeschlossen! Von KaTeX und Mermaid bis hin zu interaktiven Dropdowns und Vinyl-Schallplatten – die statische Bereitstellung ist einfach fantastisch 🚀✨
  </p>
</div>

---

## II. Audio-Vinyl-Karte

Beim Abspielen des Audios wird das Albumcover automatisch eine stufenlose, sanfte Rotationsanimation auslösen:

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="Albumcover" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">Sternenwanderung (Ambient Focus)</div>
    <div class="audio-card__author">shijianus · Originaler tiefer Fokus-Weißrausch</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>

---

## III. Lesezeichenkarte für externe Links (Bookmark Card)

<a class="article-bookmark" href="https://github.com/anzhiyu-c/hexo-theme-anzhiyu" target="_blank" rel="noopener">
  <div class="article-bookmark__content">
    <div class="article-bookmark__title">anzhiyu-c / hexo-theme-anzhiyu (Offizielles Repository des AnZhiYu-Themes)</div>
    <p class="article-bookmark__desc">AnZhiYu ist ein hochgelobtes Geek-Blog-Theme auf der Hexo-Plattform, das mit seinen hervorragenden Mikroanimationen und seinem Informationsdichte-Design zum Industriestandard geworden ist.</p>
    <div class="article-bookmark__site">
      <span class="badge badge-primary">GitHub</span>
      <span>github.com · ⭐ 2.8k Sterne</span>
    </div>
  </div>
  <div class="article-bookmark__icon">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
  </div>
</a>

## IV. Dialogfluss mit animierten Chatblasen für zwei Personen (Organic Animated Dialogue Stream)

Konfigurieren Sie `data-animate="true"`, um realistische Tippanimationen, dynamische Avatare (`footer_mini_logo__media`) und exklusive Benachrichtigungstöne zu aktivieren, die beim ersten Einblenden ausgelöst werden:

<div class="article-chat" data-animate="true" data-sound="true">
  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Entwickler <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:15</div>
      <div class="chat-bubble">
        Hallo! Würde die Implementierung der statischen Wiedergabe von <code>KaTeX</code> und <code>Mermaid</code> in Astro die Ladezeit der Frontend-Seite verlangsamen?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Architekt shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architekt <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:16</div>
      <div class="chat-bubble">
        Überhaupt nicht! Da <code>remark-math</code> und <code>rehype-katex</code> die Formeln bereits zur Build-Zeit in reine HTML/MathML-Strings kompilieren, gibt es auf der Browserseite <strong>keine JS-Laufzeitbelastung</strong>; und Mermaid-Diagramme werden dynamisch bei Bedarf als ESM-Module asynchron geladen, was den ersten Bildschirm extrem schnell macht! ⚡
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
      <div class="chat-author">Entwickler <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:17</div>
      <div class="chat-bubble">
        Fantastisch! Die Tippanimation, die sich an die Länge der Nachricht anpasst, und der dynamische Avatar-Effekt sind großartig! 🎉
      </div>
    </div>
  </div>
</div>

---

## V. Interaktiver Einheiten- und hochpräziser Währungsumrechner (Interactive Unit Converter)

<div class="interactive-unit-converter" data-default="1"></div>