---
title: "示例：Callouts 告示框与提示卡完整展示"
description: "全面展示支持的 13 种 Callout 语义类型、默认展开/折叠版本与 Markdown 源码对比。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "callouts"]
category: "Examples"
series: "功能示例"
math: false
mermaid: false
---

本篇示例专用于验证与测试博客主题在正文栏中的 **Callouts / Admonitions / 告示框** 渲染能力。

基于 GitHub Alerts 规范与安知鱼设计美学，本主题原生支持 13 种不同语义的彩色提示卡片，所有卡片均在客户端自动适配明亮与暗黑模式的高对比度色彩。

---

## 基础标准告示框（Standard Callouts）

在引用块第一行使用 `[!TYPE]` 语法即可声明对应卡片。

### 1. Note（常规注意）

> [!NOTE]
> 这是标准的 **Note** 提示框，用于交代背景上下文与常规提示。

```markdown
> [!NOTE]
> 这是标准的 **Note** 提示框，用于交代背景上下文与常规提示。
```

### 2. Tip（实用技巧）

> [!TIP]
> **快捷搜索技巧**：按下 <kbd>Ctrl</kbd> + <kbd>K</kbd> 即可快速唤起全局文章搜索调色板！

```markdown
> [!TIP]
> **快捷搜索技巧**：按下 <kbd>Ctrl</kbd> + <kbd>K</kbd> 即可快速唤起全局文章搜索调色板！
```

### 3. Important（重点关注）

> [!IMPORTANT]
> 在构建生产版本前，必须确认环境变量 `BLOG_BUILD_TARGET=static` 已正确生效。

```markdown
> [!IMPORTANT]
> 在构建生产版本前，必须确认环境变量 `BLOG_BUILD_TARGET=static` 已正确生效。
```

### 4. Warning（风险警告）

> [!WARNING]
> 请勿在公开代码仓库中提交数据库私钥或云服务 AccessKey。

```markdown
> [!WARNING]
> 请勿在公开代码仓库中提交数据库私钥或云服务 AccessKey。
```

### 5. Caution & Danger（危险警示）

> [!CAUTION]
> 执行数据库重构操作前请务必完成数据全量备份。

> [!DANGER]
> 直接删除生产数据库将导致全部评论与用户资产永久损毁。

```markdown
> [!CAUTION]
> 执行数据库重构操作前请务必完成数据全量备份。

> [!DANGER]
> 直接删除生产数据库将导致全部评论与用户资产永久损毁。
```

### 6. Success（操作成功）

> [!SUCCESS]
> 静态构建已顺利完成，所有静态路由生成完毕！

```markdown
> [!SUCCESS]
> 静态构建已顺利完成，所有静态路由生成完毕！
```

### 7. Question, Quote, Info, Todo, Bug, Example

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

## 可折叠告示框（Collapsible Details Admonitions）

在标记类型后紧跟 `-`（默认收起）或 `+`（默认展开）即可生成原生折叠卡片：

### 1. 默认收起的折叠告示框（`[!TIP]-`）

> [!TIP]- 点击展开查看：生产环境 Nginx 长效缓存配置
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

### 2. 默认展开的折叠告示框（`[!NOTE]+`）

> [!NOTE]+ 默认展开的架构设计说明
> 该区域默认处于展开状态，点击标题栏可以将其平滑收起以节省屏幕空间。

```markdown
> [!NOTE]+ 默认展开的架构设计说明
> 该区域默认处于展开状态，点击标题栏可以将其平滑收起以节省屏幕空间。
```
