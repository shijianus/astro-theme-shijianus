---
title: "Exemple : Test complet des formats spéciaux et fonctionnalités avancées d'Astro"
description: "Un test complet et unique de tous les 13 types de callouts, formats de publication, sélecteurs déroulants, accordéons, déchiffrement de mots de passe, formules, diagrammes et composants de mise en page."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "vitrine", "tout-en-un", "test"]
category: "Exemple"
series: "Exemples de fonctionnalités"
math: true
mermaid: true
postFormat: "standard"
i18nKey: "example-all-special-formats"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---

Cet article est un **exemple de test d'acceptation complet et de stress panoramique (All-in-one Master Showcase)**, conçu pour tester rapidement et automatiquement tous les formats et fonctionnalités spéciales de la colonne de contenu.

---

## 1. Encadrés d'information (Callouts)

> [!TIP]
> **Astuce** : Utilisez le raccourci clavier <kbd>Ctrl</kbd> + <kbd>K</kbd> pour lancer la recherche.

> [!WARNING]
> **Avertissement** : Veuillez conserver votre clé privée en toute sécurité.

---

## 2. Sélecteurs déroulants et accordéons (Dropdowns & Accordions)

<div class="article-dropdown-switcher">
<div class="article-dropdown-switcher__header">
<div class="article-dropdown-switcher__title">
<span>Sélectionner le framework :</span>
</div>
<select class="article-select dropdown-switcher__select">
<option value="react-tab">⚛️ React 19</option>
<option value="vue-tab">🟢 Vue 3.5</option>
</select>
</div>
<div class="article-dropdown-switcher__body">
<div class="article-dropdown-panel is-active" data-panel="react-tab">
<p>Le code du composant React 19 a été chargé.</p>
</div>
<div class="article-dropdown-panel" data-panel="vue-tab">
<p>Le code du composant monofichier Vue 3.5 a été chargé.</p>
</div>
</div>
</div>

<details class="article-accordion" open>
  <summary>
    <span>💡 Cliquez pour développer : Explication de l'optimisation des performances</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Astro utilise l'architecture Islands et livre par défaut 0 Ko de JS.</p>
  </div>
</details>

---

## 3. Formules mathématiques et diagrammes Mermaid (Math & Mermaid)

Formules en ligne : $E = mc^2$, intégrale de Gauss : $\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$.

Équations de Maxwell en bloc :

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}, \quad \nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
$$

```mermaid
graph LR
    A[Code source Markdown] --> B[Compilateur de build Astro]
    B --> C[Livraison HTML purement statique]
```

---

## 4. Déchiffrement sécurisé de mot de passe et flou gaussien

<div class="article-encrypted-box" data-hash="d7fb6c64b9aa44cc0c3b427edaa623369dee1a9778329801f68fdaa34b09d351" data-hint="💡 Indice de vérification : Pour la clé de démonstration, entrez directement shijianus2026">
  <div class="encrypted-box__lock">
    <div class="encrypted-box__icon">🔒</div>
    <div class="encrypted-box__title">Actif chiffré protégé</div>
    <div class="encrypted-box__desc">Veuillez entrer le mot de passe autorisé pour déverrouiller.</div>
    <button class="encrypted-box__btn" type="button">Cliquez pour entrer le mot de passe et déverrouiller</button>
  </div>
  <div class="encrypted-box__content">
    <div class="admonition admonition-success">
      <div class="admonition-title"><span>🎉 Déchiffrement réussi</span></div>
      <div class="admonition-content">
        <p>Jeton privé : <code>shijian_sec_9988_a1b2c3d4e5f6</code></p>
      </div>
    </div>
  </div>
</div>

- Texte flou gaussien : <span class="blur-text">Passez la souris pour voir le contenu spoiler !</span>
- Mosaïque de censure : <span class="mosaic-text">Données confidentielles : SHA256-7f83b1657ff1fc53</span>
- Spoiler Discord : ||Masque de spoiler à double barre verticale||
- Verrouillage en ligne : %%Contenu caché par pourcentage%%

---

## 5. Formats de publication (Notes, Statuts, Audio et Galerie)

<div class="article-aside">
  <p><strong>💡 Note</strong> : Restez concentré, livrez continuellement de la valeur pure.</p>
</div>

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="Pochette d'album" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">Marche dans la Voie Lactée</div>
    <div class="audio-card__author">shijianus · Bruit blanc original pour la concentration</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>