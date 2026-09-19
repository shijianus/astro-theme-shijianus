---
title: "範例：Callouts 告示框與提示卡完整展示"
description: "全面展示支援的 13 種 Callout 語意類型、預設展開/摺疊版本與 Markdown 原始碼對比。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "callouts"]
category: "範例"
series: "功能範例"
math: false
mermaid: false
i18nKey: "example-callouts"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---

本篇範例專用於驗證與測試部落格主題在正文欄中的 **Callouts / Admonitions / 告示框** 渲染能力。

基於 GitHub Alerts 規範與安知魚設計美學，本主題原生支援 13 種不同語意的彩色提示卡片，所有卡片均在客戶端自動適配明亮與暗黑模式的高對比度色彩。

---

## 基礎標準告示框（Standard Callouts）

在引用塊第一行使用 `[!TYPE]` 語法即可宣告對應卡片。

### 1. Note（一般注意）

> [!NOTE]
> 這是標準的 **Note** 提示框，用於交代背景上下文與一般提示。

```markdown
> [!NOTE]
> 這是標準的 **Note** 提示框，用於交代背景上下文與一般提示。
```

### 2. Tip（實用技巧）

> [!TIP]
> **快速搜尋技巧**：按下 <kbd>Ctrl</kbd> + <kbd>K</kbd> 即可快速喚起全域文章搜尋調色盤！

```markdown
> [!TIP]
> **快速搜尋技巧**：按下 <kbd>Ctrl</kbd> + <kbd>K</kbd> 即可快速喚起全域文章搜尋調色盤！
```

### 3. Important（重點關注）

> [!IMPORTANT]
> 在建置生產版本前，必須確認環境變數 `BLOG_BUILD_TARGET=static` 已正確生效。

```markdown
> [!IMPORTANT]
> 在建置生產版本前，必須確認環境變數 `BLOG_BUILD_TARGET=static` 已正確生效。
```

### 4. Warning（風險警告）

> [!WARNING]
> 請勿在公開程式碼儲存庫中提交資料庫私鑰或雲端服務 AccessKey。

```markdown
> [!WARNING]
> 請勿在公開程式碼儲存庫中提交資料庫私鑰或雲端服務 AccessKey。
```

### 5. Caution & Danger（危險警示）

> [!CAUTION]
> 執行資料庫重構操作前請務必完成資料全量備份。

> [!DANGER]
> 直接刪除生產資料庫將導致所有評論與用戶資產永久損毀。

```markdown
> [!CAUTION]
> 執行資料庫重構操作前請務必完成資料全量備份。

> [!DANGER]
> 直接刪除生產資料庫將導致所有評論與用戶資產永久損毀。
```

### 6. Success（操作成功）

> [!SUCCESS]
> 靜態建置已順利完成，所有靜態路由生成完畢！

```markdown
> [!SUCCESS]
> 靜態建置已順利完成，所有靜態路由生成完畢！
```

### 7. Question, Quote, Info, Todo, Bug, Example

> [!QUESTION]
> 如何在零伺服器端依賴的前提下實現毫秒級全文檢索？

> [!QUOTE]
> 「優雅的程式碼不僅能被機器執行，更能像詩歌一樣向人類傳達思想。」

> [!INFO]
> 本部落格基於 Astro 6 與 Tailwind 4 建置，全站純靜態匯出。

> [!TODO]
> 計劃在下一個版本引入 WebAssembly 客戶端分詞檢索。

> [!BUG]
> 已修復舊版本在極端窄螢幕裝置下表格橫向截斷的排版問題。

> [!EXAMPLE]
> 範例資料已就緒，可直接複製原始碼進行二次開發。

```markdown
> [!QUESTION]
> 如何在零伺服器端依賴的前提下實現毫秒級全文檢索？

> [!QUOTE]
> 「優雅的程式碼不僅能被機器執行，更能像詩歌一樣向人類傳達思想。」

> [!INFO]
> 本部落格基於 Astro 6 與 Tailwind 4 建置，全站純靜態匯出。

> [!TODO]
> 計劃在下一個版本引入 WebAssembly 客戶端分詞檢索。

> [!BUG]
> 已修復舊版本在極端窄螢幕裝置下表格橫向截斷的排版問題。

> [!EXAMPLE]
> 範例資料已就緒，可直接複製原始碼進行二次開發。
```

---

## 可摺疊告示框（Collapsible Details Admonitions）

在標記類型後緊跟 `-`（預設收合）或 `+`（預設展開）即可生成原生摺疊卡片：

### 1. 預設收合的摺疊告示框（`[!TIP]-`）

> [!TIP]- 點擊展開查看：生產環境 Nginx 長效快取設定
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```

```markdown
> [!TIP]- 點擊展開查看：生產環境 Nginx 長效快取設定
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```
```

### 2. 預設展開的摺疊告示框（`[!NOTE]+`）

> [!NOTE]+ 預設展開的架構設計說明
> 該區域預設處於展開狀態，點擊標題欄可以將其平滑收合以節省螢幕空間。

```markdown
> [!NOTE]+ 預設展開的架構設計說明
> 該區域預設處於展開狀態，點擊標題欄可以將其平滑收合以節省螢幕空間。
```