---
title: "範例：Mermaid 11 圖表與視覺化展示"
description: "全面展示 Mermaid 架構流程圖、時序圖、甘特圖、統計圓餅圖與 GitGraph 分支圖。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["範例", "展示", "mermaid", "圖表"]
category: "範例"
series: "功能示例"
math: false
mermaid: true
i18nKey: "example-mermaid"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---
本篇範例專用於展示與測試部落格正文中的 **Mermaid 11 向量圖表** 編譯與渲染能力。

圖表基於純文字程式碼宣告，客戶端按需非同步載入 ESM 引擎，自動適配明暗主題。

---

## 一、系統架構決策流程圖（Flowchart）

```mermaid
graph TD
    A[讀者發起文章訪問] --> B{是否設定存取密碼?}
    B -->|是| C[喚起毛玻璃密碼彈窗]
    C --> D{密碼核驗}
    D -->|正確| E[解密正文並播放動畫]
    D -->|錯誤| F[觸發視窗震動與警示]
    B -->|否| E
    E --> G[載入 KaTeX 公式與 Mermaid 圖表]
    G --> H[呈現沉浸式閱讀介面]
```

---

## 二、客戶端互動時序圖（Sequence Diagram）

```mermaid
sequenceDiagram
    autonumber
    actor User as 讀者 (User)
    participant Browser as 客戶端瀏覽器
    participant PostPage as 文章渲染引擎
    participant Security as 加密安全模組

    User->>Browser: 點擊受保護的內容區域
    Browser->>PostPage: 喚起密碼輸入對話框
    User->>Browser: 輸入解密密鑰
    Browser->>Security: 校驗存取 Hash
    alt 校驗通過
        Security-->>Browser: 返回解鎖令牌
        Browser->>PostPage: 呈現解密正文
    else 校驗失敗
        Security-->>Browser: 返回密碼錯誤
        Browser->>User: 觸發對話框震動警示
    end
```

---

## 三、專案里程碑甘特圖（Gantt Chart）

```mermaid
gantt
    title 部落格主題重構工程推進計畫
    dateFormat  YYYY-MM-DD
    section 基礎架構
    Markdown 掃描引擎升級     :done,    des1, 2026-08-01, 2026-08-07
    表格樣式重構與防衝突      :done,    des2, 2026-08-08, 2026-08-14
    section 核心特性
    KaTeX 公式與 Mermaid 接入 :done,    des3, 2026-08-15, 2026-08-20
    加密彈窗與特殊功能實現     :active,  des4, 2026-08-21, 2026-08-28
    section 驗收交付
    全景壓測與視覺審計         :         des5, 2026-08-29, 2026-08-31
```

---

## 四、技術棧程式碼佔比餅圖（Pie Chart）

```mermaid
pie title 部落格前端技術棧佔比
    "TypeScript / Astro" : 48
    "React 19 Components" : 26
    "Tailwind 4 & CSS" : 18
    "Markdown & Assets" : 8
```