---
title: "Exemple : Intégrations de médias riches, formats de publication et bulles de chat"
description: "Démonstration complète des formats de publication de style WordPress, des cartes audio/vidéo vinyle, des cartes de signets et des flux de dialogue de bulles de chat."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "vitrine", "intégrations", "formats-de-publication"]
category: "Exemple"
series: "Exemples de fonctionnalités"
math: false
mermaid: false
i18nKey: "example-embeds"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---

Cet exemple est dédié à la démonstration et au test des **intégrations de médias riches (Embeds), des formats de publication WordPress et des flux de dialogue à deux personnes (Chat Dialogue)** dans le corps de l'article de blog.

---

## I. Notes et micro-citations (Aside & Status)

### 1. Carte de note (Aside)

<div class="article-aside">
  <p><strong>💡 Mémo rapide</strong> : La véritable valeur des sites statiques ne réside pas dans la démonstration technique, mais dans la livraison d'une expérience de lecture pure, ultra-rapide et sans aucune charge de maintenance côté serveur.</p>
</div>

### 2. Statut (Status)

<div class="article-status">
  <div class="article-status__header">
    <div class="article-status__user">
      <img class="article-status__avatar" src="/media/shijianus/avatar.jpg" alt="Avatar de l'auteur" />
      <div>
        <div class="article-status__name">shijianus</div>
        <div class="article-status__meta">Publié le 28-08-2026 à 14:32 · 杭州 🇨🇳</div>
      </div>
    </div>
    <div class="article-status__badge">
      <span>📱 Depuis Mac Studio de l'Atelier du Geek</span>
    </div>
  </div>
  <p class="article-status__content">
    Aujourd'hui, j'ai enfin terminé l'extension complète des formats et la refonte visuelle de la colonne de contenu ! De KaTeX et Mermaid aux listes déroulantes interactives et aux cartes vinyle, la livraison statique est tellement géniale 🚀✨
  </p>
</div>

---

## II. Carte audio vinyle (Audio Vinyl Card)

Lors de la lecture audio, la pochette du disque déclenchera automatiquement une animation de rotation fluide et continue :

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="Pochette de disque" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">Promenade dans la Voie lactée (Ambient Focus)</div>
    <div class="audio-card__author">shijianus · Bruit blanc original pour une concentration profonde</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>

---

## III. Carte de signet pour lien externe (Bookmark Card)

<a class="article-bookmark" href="https://github.com/anzhiyu-c/hexo-theme-anzhiyu" target="_blank" rel="noopener">
  <div class="article-bookmark__content">
    <div class="article-bookmark__title">anzhiyu-c / hexo-theme-anzhiyu (Dépôt officiel du thème AnZhiYu)</div>
    <p class="article-bookmark__desc">AnZhiYu est un thème de blog geek très apprécié sur la plateforme Hexo, qui est devenu une référence de l'industrie grâce à ses excellentes micro-animations et à sa conception axée sur la densité d'informations.</p>
    <div class="article-bookmark__site">
      <span class="badge badge-primary">GitHub</span>
      <span>github.com · ⭐ 2,8k étoiles</span>
    </div>
  </div>
  <div class="article-bookmark__icon">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
  </div>
</a>

---

## IV. Flux de dialogue animé avec bulles de chat à deux personnes (Organic Animated Dialogue Stream)

Configurez `data-animate="true"` pour activer l'animation de saisie en temps réel, l'avatar dynamique (`footer_mini_logo__media`) et les sons de notification exclusifs, déclenchés lors du premier défilement :

<div class="article-chat" data-animate="true" data-sound="true">
  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Développeur <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:15</div>
      <div class="chat-bubble">
        Bonjour ! L'implémentation du rendu statique de <code>KaTeX</code> et <code>Mermaid</code> dans Astro ne ralentira-t-elle pas la vitesse de chargement de la page front-end ?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Architecte shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architecte <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:16</div>
      <div class="chat-bubble">
        Absolument pas ! Car <code>remark-math</code> et <code>rehype-katex</code> compilent déjà les formules en chaînes HTML/MathML pures pendant la phase de construction (Build-time), ce qui signifie <strong>aucune charge d'exécution JS</strong> côté navigateur ; et les diagrammes Mermaid sont également chargés de manière asynchrone et à la demande en tant que modules ESM, rendant le premier affichage extrêmement rapide ! ⚡
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
      <div class="chat-author">Développeur <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:17</div>
      <div class="chat-bubble">
        C'est génial ! Cette animation de saisie qui varie en fonction de la longueur du message et l'effet d'avatar dynamique sont excellents ! 🎉
      </div>
    </div>
  </div>
</div>

---

## V. Convertisseur interactif d'unités et de devises de haute précision (Interactive Unit Converter)

<div class="interactive-unit-converter" data-default="1"></div>