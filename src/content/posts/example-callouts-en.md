---
title: "Example: Complete Display of Callouts and Hint Cards"
description: "A comprehensive display of 13 supported Callout semantic types, default expanded/collapsed versions, and a comparison with Markdown source code."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "callouts"]
category: "Example"
series: "功能示例"
math: false
mermaid: false
i18nKey: "example-callouts"
lang: "en"
aiTranslatedFrom: "zh-CN"
---
This example is dedicated to verifying and testing the blog theme's rendering capabilities for **Callouts / Admonitions / Notice Boxes** in the main content area.

Based on the GitHub Alerts specification and Anzhiyu design aesthetics, this theme natively supports 13 different semantic colored notice cards, all of which automatically adapt to high‑contrast colors for light and dark modes on the client side.

---

## Standard Callouts

Declare the corresponding card by using the `[!TYPE]` syntax on the first line of a blockquote.

### 1. Note (General Note)

> [!NOTE]
> This is the standard **Note** callout, used to provide background context and general tips.

```markdown
> [!NOTE]
> 这是标准的 **Note** 提示框，用于交代背景上下文与常规提示。
```

### 2. Tip (Practical Tip)

> [!TIP]
> **Quick Search Tip**: Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to quickly summon the global article search palette!

```markdown
> [!TIP]
> **快捷搜索技巧**：按下 <kbd>Ctrl</kbd> + <kbd>K</kbd> 即可快速唤起全局文章搜索调色板！
```

### 3. Important (Key Focus)

> [!IMPORTANT]
> Before building a production version, ensure the environment variable `BLOG_BUILD_TARGET=static` is correctly applied.

```markdown
> [!IMPORTANT]
> 在构建生产版本前，必须确认环境变量 `BLOG_BUILD_TARGET=static` 已正确生效。
```

### 4. Warning (Risk Warning)

> [!WARNING]
> Do not commit database private keys or cloud service AccessKeys to public code repositories.

```markdown
> [!WARNING]
> 请勿在公开代码仓库中提交数据库私钥或云服务 AccessKey。
```

### 5. Caution & Danger (Hazard Warning)

> [!CAUTION]
> Before performing database restructuring operations, be sure to complete a full data backup.

> [!DANGER]
> Directly deleting the production database will permanently destroy all comments and user assets.

```markdown
> [!CAUTION]
> 执行数据库重构操作前请务必完成数据全量备份。

> [!DANGER]
> 直接删除生产数据库将导致全部评论与用户资产永久损毁。
```

### 6. Success (Operation Successful)

> [!SUCCESS]
> Static build completed successfully, all static routes have been generated!

```markdown
> [!SUCCESS]
> 静态构建已顺利完成，所有静态路由生成完毕！
```

### 7. Question, Quote, Info, Todo, Bug, Example

> [!QUESTION]
> How can millisecond‑level full‑text search be achieved without any server‑side dependencies?

> [!QUOTE]
> “Elegant code not only can be executed by machines, but also conveys ideas to humans like poetry.”

> [!INFO]
> This blog is built with Astro 6 and Tailwind 4, and the entire site is exported as pure static files.

> [!TODO]
> Plan to introduce WebAssembly client‑side tokenization search in the next version.

> [!BUG]
> Fixed a layout issue in older versions where tables were horizontally truncated on extremely narrow screens.

> [!EXAMPLE]
> Sample data is ready and can be directly copied for source code reuse.

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

## Collapsible Details Admonitions

Appending `-` (collapsed by default) or `+` (expanded by default) after the marker type generates a native collapsible card:

### 1. Collapsible Callout Collapsed by Default (`[!TIP]-`)

> [!TIP]- Click to expand: Production environment Nginx long‑term cache configuration
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```

```markdown
> [!TIP]- 点击展开查看：生产环境 Nginx 长效缓存配置
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```
```

### 2. Collapsible Callout Expanded by Default (`[!NOTE]+`)

> [!NOTE]+ Expanded by default architecture design description
> This area is expanded by default; clicking the title bar can smoothly collapse it to save screen space.

```markdown
> [!NOTE]+ 默认展开的架构设计说明
> 该区域默认处于展开状态，点击标题栏可以将其平滑收起以节省屏幕空间。
```