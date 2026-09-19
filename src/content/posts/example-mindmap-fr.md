---
title: "Exemple : Carte mentale interactive dynamique Markmap et extension à niveaux illimités"
description: "Présentation complète du rendu dynamique de cartes mentales Markmap basé sur Markdown, démontrant un empilement de 6 niveaux de profondeur, une syntaxe d'extension à niveaux illimités, un espace de protection de pliage de bloc unique par défaut, la diffusion multi-directionnelle des branches en cliquant sur les nœuds et une interaction immersive en plein écran."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "vitrine", "carte mentale", "Markmap", "diagrammes"]
category: "Exemple"
series: "功能示例"
math: false
mermaid: false
mindmap: true
i18nKey: "example-mindmap"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---
Cet exemple est spécifiquement conçu pour démontrer et tester le moteur de rendu **Markmap Mind Map interactif dynamique** dans le corps de l'article du blog, la structure de **superposition à 6 niveaux de profondeur** ainsi que le **mécanisme d'extension à profondeur infinie (Infinite Depth)**.

> [!TIP]
> **Règles de branches multidirectionnelles et de hiérarchie pour les cartes mentales** :
> 1. **Prise en charge de la profondeur infinie** : Basé sur l'analyse récursive de l'AST Markdown et la mise en page élastique D3, le moteur n'impose **aucune limite de niveau**, permettant une dérivation illimitée vers le bas en combinant `H1 ~ H6` avec des éléments de liste multi-niveaux (du Niveau 1 au Niveau N).
> 2. **Présentation par défaut en bloc unique** : Par défaut, seul le nœud racine central (Niveau 1) est affiché, accompagné d'un petit point lumineux pulsant sur la droite pour préserver le champ de lecture de l'article ;
> 3. **Dispersion multidirectionnelle au clic** : En cliquant sur un nœud avec un point ou du texte, les sous-branches correspondantes se **dispersent de manière fluide et multidirectionnelle**, permettant une exploration approfondie par niveaux (Drill-down) ;
> 4. **Contrôle complet via la barre d'outils** : Prise en charge de l'expansion en un clic de toutes les branches multidirectionnelles, de la réduction en un clic d'un bloc, du zoom avant/arrière, du centrage adaptatif, du mode plein écran immersif (Échap pour quitter) et de la copie du code source Markdown.

---

## I. Superposition à 6 niveaux de profondeur : Vue d'ensemble de l'architecture du système d'ingénierie full-stack moderne

La carte mentale ci-dessous présente intégralement les branches d'architecture en profondeur sur **6 niveaux (du Niveau 1 au Niveau 6)** :
- **Niveau 1 (H1)** : Cœur du système de niveau supérieur
- **Niveau 2 (H2)** : Domaines métier et infrastructures
- **Niveau 3 (H3)** : Sous-systèmes et pipelines centraux
- **Niveau 4 (H4)** : Modules techniques et protocoles
- **Niveau 5 (H5)** : Composants et unités fonctionnelles
- **Niveau 6 (Liste / H6)** : Implémentations algorithmiques et spécifications de bas niveau

```mindmap
# Système d'ingénierie full-stack moderne EpoCanvas
## 1. Pipeline de construction central et moteur de compilation
### Cluster de traitement d'AST (Arbre Syntaxique Abstrait)
#### Pipeline de sémantique Markdown / MDX
##### Extensions de syntaxe Unified / Remark
- Conversion de la syntaxe des tableaux GFM et des barrages
- Génération automatique d'ancres et d'ID pour les titres
##### Extension Markmap pour cartes mentales interactives multidirectionnelles
- Construction récursive de l'arbre AST (Transformer.transform)
- Mise en page hiérarchique élastique D3 (Algorithme Flextree)
- Machine à états interactive pour le pliage (payload.fold)
- Coloration dynamique des branches via palette (d3.scaleOrdinal)
##### Extension Rehype Katex pour les formules mathématiques
- Analyse des formules en ligne et des blocs de formules indépendants
- Prise en charge des définitions de macros et tolérance aux erreurs
#### Surlignage de code et shaders statiques
##### Compilateur à double thème Shiki
- Analyse des règles de syntaxe TextMate VSCode
- Pré-rendu à double thème clair/sombre sans hydratation
### Pipeline d'empaquetage et de construction
#### Rechargement à chaud des modules Vite 6
##### Chargement natif de modules ESM
- Compilation à la demande et mise à jour à chaud (HMR) en millisecondes
##### Optimisation du code statique Rollup
- Découpage intelligent du code (Code Splitting)
- Élimination des redondances par Tree-Shaking
## 2. Système d'interaction et d'îlots
### Conception de l'architecture Islands
#### Montage par îlots des composants côté client
##### Composants Client React 19
- Isolation d'état indépendante et communication par contexte
- Persistance de session (SessionStorage)
##### Îlots côté serveur Astro statique par défaut
- JS côté client nul par défaut (Zero-JS by Default)
- Activation à la demande des îlots interactifs (client:visible)
### Couche d'expérience visuelle et d'animations
#### Moteur de rendu Canvas
##### Fond dynamique Aurora / Starfield
- Accélération matérielle WebGL / Canvas 2D
- Mode économie d'énergie et pause automatique hors viewport
##### Style Glassmorphism (verre dépoli)
- Flou gaussien dynamique et ombres environnementales multiples
- Mise en page adaptative multi-plateformes (PC/Tablette/Mobile)
## 3. Système de sécurité, de confidentialité et de chiffrement par niveaux
### Moteur de hachage et de cryptographie
#### Normes cryptographiques modernes WebCrypto
##### Vérification par hachage SHA-256
- Vérification de hachage côté client sans exposition de texte en clair
- Déverrouillage persistant de session de niveau 1 (Session Persistent)
##### Masque anti-espionnage et interception de viewport
- Protection par flou gaussien/mosaïque/masque anti-spoiler de niveau 2
- Verrouillage immédiat hors viewport de niveau 3 (IntersectionObserver)
- Isolation des points de terminaison de déchiffrement segmenté
```

---

## II. Démonstration d'extension à profondeur infinie : Indentation de liste pure (7 niveaux et plus)

En plus de l'utilisation mixte des titres `H1 ~ H6`, le moteur Markdown permet d'implémenter une extension **à profondeur infinie (Niveau 1 -> Niveau 2 -> ... -> Niveau N)** à l'aide de **listes à indentation pure** :

```mindmap
- 🌐 Sujet racine : Cartographie des connaissances en informatique (Niveau 1)
  - 🖥️ Ingénierie des systèmes logiciels (Niveau 2)
    - 📦 Systèmes d'exploitation et noyaux (Niveau 3)
      - ⚙️ Planification des processus et des threads (Niveau 4)
        - 🔄 Primitives de synchronisation concurrente (Niveau 5)
          - 🔒 Mutex et sémaphores (Niveau 6)
            - ⚡ Instructions atomiques CAS au niveau matériel (Niveau 7)
              - ⏱️ Protocole de cohérence de cache MESI (Niveau 8)
                - 🔬 Barrières mémoire et réordonnancement des instructions du pipeline (Niveau 9)
  - 🧠 Intelligence artificielle et apprentissage automatique (Niveau 2)
    - 📊 Architectures d'apprentissage profond (Niveau 3)
      - 🤖 Modèles de langage de grande taille (LLM) (Niveau 4)
        - 🧩 Architecture Transformer (Niveau 5)
          - 👁️ Mécanisme d'auto-attention multi-têtes (Niveau 6)
            - 📐 Attention Scaled Dot-Product (Niveau 7)
```

---

## III. Recommandations de rédaction et d'optimisation pour l'extension à profondeur infinie

Lors de la rédaction de cartes mentales multi-niveaux et en profondeur, il est recommandé de suivre les meilleures pratiques d'ingénierie et de mise en page suivantes :

1. **Méthode de syntaxe mixte (recommandée pour les niveaux 1 à 6)** :
   - Utiliser prioritairement `#` à `######` pour exprimer l'ossature des niveaux 1 à 6, et adopter des listes à puces `-` ou `*` avec indentation pour les niveaux inférieurs au 6e.
2. **Méthode de liste pure (recommandée pour plus de 6 niveaux ou des structures légères)** :
   - Utiliser `- Nœud` et ajouter progressivement 2 ou 4 espaces d'indentation par niveau pour atteindre une **profondeur infinie théorique**.
3. **Contrôle du niveau d'expansion initial** :
   - Ajouter une configuration de paramètres JSON à la première ligne du bloc de code, par exemple `{"initialExpandLevel": 2, "height": "560px", "title": "Carte mentale ultra-profonde personnalisée"}`, pour que la carte s'ouvre par défaut à la profondeur spécifiée (par exemple, le 2e niveau de l'ossature), les niveaux plus profonds s'ouvrant à la demande.
4. **Exploration immersive sur grands écrans** :
   - Pour les cartes mentales de plus de 6 niveaux, utiliser judicieusement le **mode plein écran immersif (Fullscreen)** et le **centrage adaptatif (Fit View)** de la barre d'outils pour visualiser d'un coup d'œil les structures de connaissances complexes.