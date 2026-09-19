---
title: "Exemple : Présentation complète des encadrés d'alerte (Callouts)"
description: "Présentation exhaustive des 13 types sémantiques de Callouts pris en charge, des versions dépliées/repliées par défaut et de la comparaison avec le code source Markdown."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "démonstration", "callouts"]
category: "Exemples"
series: "Exemples de fonctionnalités"
math: false
mermaid: false
i18nKey: "example-callouts"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---

Cet exemple est spécifiquement conçu pour vérifier et tester la capacité de rendu des **Callouts / Admonitions / Encadrés d'alerte** dans la colonne de contenu du thème de blog.

Basé sur la spécification GitHub Alerts et l'esthétique de conception d'Anzhiyu, ce thème prend nativement en charge 13 types de cartes d'information colorées aux sémantiques distinctes. Toutes les cartes s'adaptent automatiquement côté client aux couleurs à fort contraste des modes clair et sombre.

---

## Encadrés d'alerte standards (Standard Callouts)

Utilisez la syntaxe `[!TYPE]` sur la première ligne d'un bloc de citation pour déclarer la carte correspondante.

### 1. Note (Remarque standard)

> [!NOTE]
> C'est un encadré **Note** standard, utilisé pour fournir le contexte et les remarques courantes.

```markdown
> [!NOTE]
> C'est un encadré **Note** standard, utilisé pour fournir le contexte et les remarques courantes.
```

### 2. Tip (Astuce pratique)

> [!TIP]
> **Astuce de recherche rapide** : appuyez sur <kbd>Ctrl</kbd> + <kbd>K</kbd> pour invoquer instantanément la palette de recherche globale des articles !

```markdown
> [!TIP]
> **Astuce de recherche rapide** : appuyez sur <kbd>Ctrl</kbd> + <kbd>K</kbd> pour invoquer instantanément la palette de recherche globale des articles !
```

### 3. Important (Point crucial)

> [!IMPORTANT]
> Avant de générer la version de production, assurez-vous que la variable d'environnement `BLOG_BUILD_TARGET=static` est correctement appliquée.

```markdown
> [!IMPORTANT]
> Avant de générer la version de production, assurez-vous que la variable d'environnement `BLOG_BUILD_TARGET=static` est correctement appliquée.
```

### 4. Warning (Avertissement de risque)

> [!WARNING]
> Ne commitez jamais de clés privées de base de données ou de clés d'accès (AccessKey) de services cloud dans un dépôt de code public.

```markdown
> [!WARNING]
> Ne commitez jamais de clés privées de base de données ou de clés d'accès (AccessKey) de services cloud dans un dépôt de code public.
```

### 5. Caution & Danger (Alertes de danger)

> [!CAUTION]
> Effectuez impérativement une sauvegarde complète des données avant d'exécuter toute opération de refactoring de la base de données.

> [!DANGER]
> La suppression directe de la base de données de production entraînera la destruction permanente de tous les commentaires et des actifs des utilisateurs.

```markdown
> [!CAUTION]
> Effectuez impérativement une sauvegarde complète des données avant d'exécuter toute opération de refactoring de la base de données.

> [!DANGER]
> La suppression directe de la base de données de production entraînera la destruction permanente de tous les commentaires et des actifs des utilisateurs.
```

### 6. Success (Opération réussie)

> [!SUCCESS]
> La génération statique s'est terminée avec succès, toutes les routes statiques ont été générées !

```markdown
> [!SUCCESS]
> La génération statique s'est terminée avec succès, toutes les routes statiques ont été générées !
```

### 7. Question, Quote, Info, Todo, Bug, Example

> [!QUESTION]
> Comment implémenter une recherche plein texte en millisecondes sans aucune dépendance côté serveur ?

> [!QUOTE]
> « Un code élégant ne se contente pas d'être exécuté par des machines, il transmet des idées aux humains comme un poème. »

> [!INFO]
> Ce blog est construit avec Astro 6 et Tailwind 4, avec une exportation entièrement statique du site.

> [!TODO]
> Il est prévu d'introduire la recherche par tokenisation côté client via WebAssembly dans la prochaine version.

> [!BUG]
> Le problème de mise en page entraînant la troncature horizontale des tableaux sur les écrans extrêmement étroits a été corrigé dans les anciennes versions.

> [!EXAMPLE]
> Les données d'exemple sont prêtes, vous pouvez copier le code source directement pour le réutiliser.

```markdown
> [!QUESTION]
> Comment implémenter une recherche plein texte en millisecondes sans aucune dépendance côté serveur ?

> [!QUOTE]
> « Un code élégant ne se contente pas d'être exécuté par des machines, il transmet des idées aux humains comme un poème. »

> [!INFO]
> Ce blog est construit avec Astro 6 et Tailwind 4, avec une exportation entièrement statique du site.

> [!TODO]
> Il est prévu d'introduire la recherche par tokenisation côté client via WebAssembly dans la prochaine version.

> [!BUG]
> Le problème de mise en page entraînant la troncature horizontale des tableaux sur les écrans extrêmement étroits a été corrigé dans les anciennes versions.

> [!EXAMPLE]
> Les données d'exemple sont prêtes, vous pouvez copier le code source directement pour le réutiliser.
```

---

## Encadrés d'alerte repliables (Collapsible Details Admonitions)

Ajoutez un `-` (replié par défaut) ou un `+` (déplié par défaut) immédiatement après le type de marqueur pour générer une carte repliable native :

### 1. Encadré replié par défaut (`[!TIP]-`)

> [!TIP]- Cliquez pour déplier : Configuration de cache long terme Nginx pour l'environnement de production
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```

```markdown
> [!TIP]- Cliquez pour déplier : Configuration de cache long terme Nginx pour l'environnement de production
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```
```

### 2. Encadré déplié par défaut (`[!NOTE]+`)

> [!NOTE]+ Explication de la conception architecturale dépliée par défaut
> Cette zone est dépliée par défaut. Cliquez sur la barre de titre pour la replier en douceur et économiser de l'espace à l'écran.

```markdown
> [!NOTE]+ Explication de la conception architecturale dépliée par défaut
> Cette zone est dépliée par défaut. Cliquez sur la barre de titre pour la replier en douceur et économiser de l'espace à l'écran.
```