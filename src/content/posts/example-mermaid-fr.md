---
title: "Exemple : Graphiques et visualisations Mermaid 11"
description: "Présentation complète des diagrammes de flux d'architecture Mermaid, des diagrammes de séquence, des diagrammes de Gantt, des graphiques circulaires statistiques et des diagrammes de branche GitGraph."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "vitrine", "mermaid", "diagrammes"]
category: "Exemple"
series: "功能示例"
math: false
mermaid: true
i18nKey: "example-mermaid"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---
Cet exemple est dédié à la démonstration et au test des capacités de compilation et de rendu des **diagrammes vectoriels Mermaid 11** dans le corps du blog.

Les diagrammes sont déclarés via du code texte brut, le client charge de manière asynchrone le moteur ESM à la demande et s'adapte automatiquement aux thèmes clair et sombre.

---

## 1. Diagramme de flux de décision de l'architecture système (Flowchart)

```mermaid
graph TD
    A[Le lecteur initie la visite de l'article] --> B{Mot de passe d'accès défini ?}
    B -->|Oui| C[Afficher la fenêtre de saisie du mot de passe (effet flou)]
    C --> D{Vérification du mot de passe}
    D -->|Correct| E[Décrypter le contenu et lancer l'animation]
    D -->|Incorrect| F[Déclencher le tremblement de la fenêtre et l'alerte]
    B -->|Non| E
    E --> G[Charger les formules KaTeX et les diagrammes Mermaid]
    G --> H[Présenter l'interface de lecture immersive]
```

---

## 2. Diagramme de séquence d'interaction client (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Lecteur (User)
    participant Browser as Navigateur client
    participant PostPage as Moteur de rendu d'article
    participant Security as Module de sécurité cryptographique

    User->>Browser: Cliquer sur la zone de contenu protégée
    Browser->>PostPage: Afficher la boîte de dialogue de saisie du mot de passe
    User->>Browser: Entrer la clé de décryptage
    Browser->>Security: Vérifier le hash d'accès
    alt Vérification réussie
        Security-->>Browser: Retourner le jeton de déverrouillage
        Browser->>PostPage: Présenter le contenu décrypté
    else Vérification échouée
        Security-->>Browser: Retourner le mot de passe incorrect
        Browser->>User: Déclencher l'alerte de vibration de la boîte de dialogue
    end
```

---

## 3. Diagramme de Gantt des jalons du projet (Gantt Chart)

```mermaid
gantt
    title Plan de progression du projet de refonte du thème du blog
    dateFormat  YYYY-MM-DD
    section Infrastructure de base
    Mise à niveau du moteur d'analyse Markdown     :done,    des1, 2026-08-01, 2026-08-07
    Refonte du style des tableaux et prévention des conflits      :done,    des2, 2026-08-08, 2026-08-14
    section Fonctionnalités principales
    Intégration des formules KaTeX et Mermaid :done,    des3, 2026-08-15, 2026-08-20
    Mise en œuvre de la fenêtre d'encryptage et des fonctions spéciales     :active,  des4, 2026-08-21, 2026-08-28
    section Livraison et acceptation
    Tests de charge panoramiques et audit visuel         :         des5, 2026-08-29, 2026-08-31
```

---

## 4. Diagramme circulaire de répartition du code de la stack technologique (Pie Chart)

```mermaid
pie title Répartition de la stack technologique frontale du blog
    "TypeScript / Astro" : 48
    "React 19 Components" : 26
    "Tailwind 4 & CSS" : 18
    "Markdown & Assets" : 8
```