---
title: "Exemple : panneaux repliables, accordéons et sélecteurs déroulants"
description: "Présentation complète des composants natifs details, groupes d'accordéons, repliements imbriqués et sélecteurs déroulants spéciaux."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "démonstration", "repliement", "menu déroulant"]
category: "Exemples"
series: "Exemples de fonctionnalités"
math: false
mermaid: false
i18nKey: "example-details-collapse"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---

Cet exemple est dédié à la validation et au test des composants **panneaux repliables (Details), groupes d'accordéons (Accordions) et sélecteurs déroulants spéciaux (Dropdown Selectors)** au sein du corps de l'article de blog.

Tous les composants sont implémentés en priorité sur la base de la sémantique native du navigateur ou d'une architecture Islands légère, garantissant un coût client nul ou minimal.

---

## 1. Panneau repliable natif stylisé (Single Details / Summary)

Prend en charge une animation de rotation fluide de la flèche et un effet de lueur sur la bordure de la carte.

<details class="article-accordion" open>
  <summary>
    <span>💡 Pourquoi un générateur de sites statiques peut-il atteindre une très haute concurrence ?</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Parce que le générateur statique compile tous les fichiers Markdown et composants en fichiers statiques HTML/CSS purs lors de la phase de build. Les nœuds CDN répondent directement aux requêtes sans aucune requête de base de données ni calcul côté serveur, si bien que la limite théorique de concurrence dépend uniquement de la bande passante réseau.</p>
  </div>
</details>

```html
<details class="article-accordion" open>
  <summary>
    <span>💡 Pourquoi un générateur de sites statiques peut-il atteindre une très haute concurrence ?</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Parce que le générateur statique compile tous les fichiers Markdown et composants en fichiers statiques HTML/CSS purs...</p>
  </div>
</details>
```

---

## 2. Groupe d'accordéons mutuellement exclusifs (Single-Open Accordion Group)

Lorsque l'un des éléments est déplié, les autres éléments dépliés du même groupe se ferment automatiquement et en douceur :

<div class="article-accordion-group" data-single="true">
  <details class="article-accordion" open>
    <summary>
      <span>🔒 1. Sécurité élevée au niveau physique</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>Absence de chaînes de connexion à une base de données publique et de processus backend dynamiques, offrant une immunité totale contre les injections SQL et les injections de commandes côté serveur.</p>
    </div>
  </details>

  <details class="article-accordion">
    <summary>
      <span>⚡ 2. Livraison mondiale via CDN en quelques millisecondes</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>Les fichiers statiques sont répartis sur des centaines de nœuds CDN périphériques dans le monde, garantissant des temps de réponse ultra-rapides. Le TTFB est généralement inférieur à 20 ms.</p>
    </div>
  </details>

  <details class="article-accordion">
    <summary>
      <span>💰 3. Coût de maintenance quasi nul</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>Avec des plateformes d'hébergement comme Cloudflare Pages, il est possible de fonctionner de manière stable sans acheter d'infrastructure serveur coûteuse.</p>
    </div>
  </details>
</div>

```html
<div class="article-accordion-group" data-single="true">
  <details class="article-accordion" open>
    <summary><span>🔒 1. Sécurité élevée au niveau physique</span>...</summary>
    <div class="accordion-content">...</div>
  </details>
  <details class="article-accordion">
    <summary><span>⚡ 2. Livraison mondiale via CDN en quelques millisecondes</span>...</summary>
    <div class="accordion-content">...</div>
  </details>
</div>
```

---

## 3. Sélecteurs déroulants spéciaux (Dropdown Selectors & Interactive Calc)

### 1. Sélecteur déroulant natif stylisé (Custom Styled Select)

<div class="article-select-box">
  <label>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    <span>Sélectionnez l'architecture d'exécution :</span>
  </label>
  <select class="article-select">
    <option value="static">🚀 Livraison purement statique (SSG - Recommandé)</option>
    <option value="ssr">⚙️ Rendu hybride côté serveur (SSR)</option>
    <option value="edge">🌐 Rendu en streaming par calcul périphérique (Edge)</option>
  </select>
</div>

```html
<div class="article-select-box">
  <label><span>Sélectionnez l'architecture d'exécution :</span></label>
  <select class="article-select">
    <option value="static">🚀 Livraison purement statique (SSG - Recommandé)</option>
    <option value="ssr">⚙️ Rendu hybride côté serveur (SSR)</option>
    <option value="edge">🌐 Rendu en streaming par calcul périphérique (Edge)</option>
  </select>
</div>
```

### 2. Calculateur de spécifications interactif (Interactive Calc Dropdown)

Lors de la sélection de différentes options,