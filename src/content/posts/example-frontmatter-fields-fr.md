---
title: "Exemple : Champs étendus du Front Matter et démonstration de validation Zod"
description: "Analyse complète des définitions de tous les champs Front Matter pris en charge par ce blog et de leurs comportements d'interaction avec le thème."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "démonstration", "frontmatter", "configuration"]
category: "Exemple"
series: "Exemples de fonctionnalités"
math: false
mermaid: false
i18nKey: "example-frontmatter-fields"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---

Cet exemple est dédié à l'analyse et à l'explication systématiques de tous les champs Front Matter définis par le **schéma Zod** de ce thème dans `src/content.config.ts`.

---

## 1. Liste des champs Front Matter pris en charge

| Nom du champ | Type | Valeur par défaut | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Obligatoire** | Titre principal de l'article |
| `pubDate` | `Date` | **Obligatoire** | Date de publication (AAAA-MM-JJ) |
| `updatedDate` | `Date` | Optionnel | Date de la dernière mise à jour |
| `description` | `string` | Optionnel | Résumé de l'article, utilisé pour le SEO et l'affichage des cartes |
| `author` | `string` | `'shijianus'` | Nom de l'auteur |
| `tags` | `array<string>` | `[]` | Liste des tags |
| `category` | `string` | Optionnel | Nom de la catégorie principale |
| `cover` | `string` | Optionnel | URL de l'image de couverture principale |
| `coverAlt` | `string` | Optionnel | Texte Alt de l'image de couverture |
| `featured` | `boolean` | `false` | Indique si l'article est mis en avant |
| `sticky` | `number` | `0` | Poids d'épinglage (plus la valeur est élevée, plus il apparaît en haut) |
| `draft` | `boolean` | `false` | Indicateur de brouillon (filtré automatiquement en production) |
| `postFormat` | `enum` | `'standard'` | Format d'article WordPress (`aside`, `status`, `quote`, `gallery`, etc.) |
| `toc` / `hideToc` | `boolean` | `true` / `false` | Active / force le masquage de la table des matières à droite |
| `math` | `boolean` | `false` | Active le rendu des formules mathématiques LaTeX |
| `mermaid` | `boolean` | `false` | Active le rendu des diagrammes vectoriels Mermaid |
| `series` | `string` | Optionnel | Nom de la série d'articles associée |
| `access` | `object` | Optionnel | Configuration de la protection par mot de passe et du blocage IP régional |

---

## 2. Exemple de déclaration Front Matter standard

```yaml
---
title: "Titre complet de l'article"
pubDate: 2026-08-28
description: "Ceci est un article de démonstration avec des métadonnées complètes."
author: "shijianus"
category: "Conception de systèmes"
tags: ["Astro", "Markdown", "Exemple"]
cover: "/media/shijianus/workbench.jpg"
featured: true
sticky: 1
toc: true
math: true
mermaid: true
postFormat: "standard"
---
```