---
title: "Exemple : Affichage complet des encadrés et des cartes d'information"
description: "Démonstration complète des 13 types sémantiques d'encadrés pris en charge, comparaison des versions par défaut dépliées/repliées et du code source Markdown."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "vitrine", "encadrés"]
category: "Exemple"
series: "功能示例"
math: false
mermaid: false
i18nKey: "example-callouts"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---

Cet exemple est dédié à la validation et aux tests de la capacité de rendu des **Callouts / Admonitions / boîtes d’avertissement** du thème du blog dans la zone de contenu.

Basé sur la spécification GitHub Alerts et l’esthétique de conception AnZhiYu, ce thème prend en charge nativement 13 types de cartes d’alerte colorées avec des sémantiques différentes, toutes les cartes s’adaptent automatiquement côté client aux modes clair et sombre avec des couleurs à fort contraste.

---

## Boîtes d’avertissement standard (Standard Callouts)

Utilisez la syntaxe `[!TYPE]` sur la première ligne d’un bloc de citation pour déclarer la carte correspondante.

### 1. Note (remarque courante)

> [!NOTE]
> Ceci est une boîte d’avertissement **Note** standard, utilisée pour fournir le contexte de fond et des remarques générales.

```markdown
> [!NOTE]
> 这是标准的 **Note** 提示框，用于交代背景上下文与常规提示。
```

### 2. Tip (astuce pratique)

> [!TIP]
> **Astuce de recherche rapide** : appuyez sur <kbd>Ctrl</kbd> + <kbd>K</kbd> pour faire apparaître rapidement la palette de recherche globale des articles !

```markdown
> [!TIP]
> **快捷搜索技巧**：按下 <kbd>Ctrl</kbd> + <kbd>K</kbd> 即可快速唤起全局文章搜索调色板！
```

### 3. Important (attention particulière)

> [!IMPORTANT]
> Avant de construire la version de production, il faut s’assurer que la variable d’environnement `BLOG_BUILD_TARGET=static` est correctement appliquée.

```markdown
> [!IMPORTANT]
> 在构建生产版本前，必须确认环境变量 `BLOG_BUILD_TARGET=static` 已正确生效。
```

### 4. Warning (avertissement de risque)

> [!WARNING]
> Ne soumettez pas de clés privées de base de données ou d’AccessKey de services cloud dans un dépôt de code public.

```markdown
> [!WARNING]
> 请勿在公开代码仓库中提交数据库私钥或云服务 AccessKey。
```

### 5. Caution & Danger (mise en garde et danger)

> [!CAUTION]
> Avant d’effectuer une refonte de la base de données, assurez‑vous d’avoir réalisé une sauvegarde complète des données.

> [!DANGER]
> Supprimer directement la base de données de production entraînera la perte permanente de tous les commentaires et des actifs des utilisateurs.

```markdown
> [!CAUTION]
> 执行数据库重构操作前请务必完成数据全量备份。

> [!DANGER]
> 直接删除生产数据库将导致全部评论与用户资产永久损毁。
```

### 6. Success (opération réussie)

> [!SUCCESS]
> La construction statique s’est terminée avec succès, toutes les routes statiques ont été générées !

```markdown
> [!SUCCESS]
> 静态构建已顺利完成，所有静态路由生成完毕！
```

### 7. Question, Quote, Info, Todo, Bug, Example

> [!QUESTION]
> Comment implémenter une recherche en texte intégral à la milliseconde près sans dépendance côté serveur ?

> [!QUOTE]
> « Le code élégant ne se contente pas d’être exécuté par la machine, il transmet également des idées aux humains comme un poème. »

> [!INFO]
> Ce blog est construit avec Astro 6 et Tailwind 4, et exporté entièrement en mode statique.

> [!À FAIRE]
> Il est prévu d'introduire la recherche de segmentation de mots côté client WebAssembly dans la prochaine version.

> [!BUG]
> Correction du problème de mise en page où les tableaux étaient tronqués horizontalement sur les appareils à écran extrêmement étroit dans les anciennes versions.

> [!EXEMPLE]
> Les données d'exemple sont prêtes, vous pouvez copier directement le code source pour un développement secondaire.

```markdown
> [!QUESTION]
> 如何在零服务端依赖的前提下实现毫秒级全文检索？

> [!QUOTE]
> “优雅的代码不仅能被机器执行，更能像诗歌一样向人类传达思想。”

> [!INFO]
> 本博客基于 Astro 6 与 Tailwind 4 构建，全站纯静态导出。

> [!TODO]
> 计划在下一个版本引入 WebAssembly 客户端分词检索。

> [!BUG]
> 已修复旧版本在极端窄屏设备下表格横向截断的排版问题。

> [!EXAMPLE]
> 示例数据已就绪，可直接复制源码进行二次开发。
```

---

## Boîtes d'avertissement dépliables (Collapsible Details Admonitions)

En suivant le type de balise avec `-` (plié par défaut) ou `+` (déplié par défaut), vous pouvez générer des cartes pliables natives :

### 1. Boîte d'avertissement dépliable (pliée par défaut) (`[!TIP]-`)

> [!TIP]- Cliquez pour développer et voir : Configuration du cache à long terme de Nginx en environnement de production
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```

```markdown
> [!TIP]- Cliquez pour développer et voir : Configuration du cache à long terme de Nginx en environnement de production
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```
```

### 2. Boîte d'avertissement dépliable (dépliée par défaut) (`[!NOTE]+`)

> [!NOTE]+ Description de la conception architecturale (dépliée par défaut)
> Cette zone est dépliée par défaut. Cliquez sur la barre de titre pour la replier en douceur et économiser de l'espace à l'écran.

```markdown
> [!NOTE]+ 默认展开的架构设计说明
> 该区域默认处于展开状态，点击标题栏可以将其平滑收起以节省屏幕空间。
```