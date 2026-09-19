---
title: "範例：Front Matter 擴充欄位與 Zod 驗證展示"
description: "全面解析本部落格所有支援的 Front Matter 欄位定義及其驅動的主題互動行為。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["範例", "展示", "frontmatter", "config"]
category: "範例"
series: "功能範例"
math: false
mermaid: false
i18nKey: "example-frontmatter-fields"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---

本篇範例專用於系統解析與說明本主題在 `src/content.config.ts` 中透過 **Zod Schema** 定義的所有 Front Matter 欄位。

---

## 一、支援的 Front Matter 欄位清單

| 欄位名稱 | 類型 | 預設值 | 作用說明 |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **必填** | 文章主標題 |
| `pubDate` | `Date` | **必填** | 發佈日期 (YYYY-MM-DD) |
| `updatedDate` | `Date` | 可選 | 最近更新日期 |
| `description` | `string` | 可選 | 文章摘要，用於 SEO 與卡片展示 |
| `author` | `string` | `'shijianus'` | 作者署名 |
| `tags` | `array<string>` | `[]` | 標籤列表 |
| `category` | `string` | 可選 | 主分類名稱 |
| `cover` | `string` | 可選 | 封面主圖 URL |
| `coverAlt` | `string` | 可選 | 封面圖 Alt 文字 |
| `featured` | `boolean` | `false` | 是否設為精選推薦文章 |
| `sticky` | `number` | `0` | 置頂權重 (數值越大越靠前) |
| `draft` | `boolean` | `false` | 草稿標識 (生產建構自動過濾) |
| `postFormat` | `enum` | `'standard'` | WordPress 文章形態 (`aside`, `status`, `quote`, `gallery` 等) |
| `toc` / `hideToc` | `boolean` | `true` / `false` | 是否啟用 / 強制隱藏右側目錄 |
| `math` | `boolean` | `false` | 是否啟用 LaTeX 數學公式渲染 |
| `mermaid` | `boolean` | `false` | 是否啟用 Mermaid 向量圖表渲染 |
| `series` | `string` | 可選 | 關聯的文章系列名稱 |
| `access` | `object` | 可選 | 密碼保護與地區 IP 攔截配置 |

---

## 二、標準 Front Matter 宣告範例

```yaml
---
title: "文章完整標題"
pubDate: 2026-08-28
description: "這是一篇包含完整元資料的示範文章。"
author: "shijianus"
category: "系統設計"
tags: ["Astro", "Markdown", "範例"]
cover: "/media/shijianus/workbench.jpg"
featured: true
sticky: 1
toc: true
math: true
mermaid: true
postFormat: "standard"
---
```