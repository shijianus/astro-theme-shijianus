---
title: "示例：Markmap 動態交互式思維導圖與無限層級擴展"
description: "全面展示基於 Markdown 的 Markmap 動態思維導圖渲染，演示 6 層深度堆疊、無限層級擴展語法、預設單塊摺疊保護空間、點擊節點多向擴散分支與全螢幕沉浸式互動。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["範例", "展示", "思維導圖", "markmap", "圖表"]
category: "範例"
series: "功能範例"
math: false
mermaid: false
mindmap: true
i18nKey: "example-mindmap"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---
本篇範例專用於展示與測試部落格正文中的 **Markmap 動態互動式思維導圖** 渲染引擎、**6 層深度堆疊** 結構以及 **無限層級（Infinite Depth）擴展機制**。

> [!TIP]
> **思維導圖多向分支與層級規則**：
> 1. **無限深度支援**：引擎基於 Markdown AST 遞迴解析與 D3 彈性佈局，**無任何層級上限**，支援 `H1 ~ H6` 結合多級列表項無限向下衍生（Level 1 至 Level N）。
> 2. **預設單塊呈現**：預設狀態下僅展示 1 塊核心根節點（Level 1），右側附帶脈衝光暈小圓點，保護文章閱讀視野；
> 3. **點擊多向散開**：點擊帶有圓點或文字的節點，對應子分支將**平滑多向散開**，支援逐層下鑽（Drill-down）；
> 4. **工具欄全能控制**：支援一鍵展開全部多向分支、一鍵收起單塊、放大/縮小、置中自適應、全螢幕沉浸模式（Esc 退出）與複製 Markdown 原始碼。

---

## 一、6 層深度堆疊：現代前端全棧工程系統架構全景

以下思維導圖完整展示了 **6 層深度（Level 1 至 Level 6）** 的縱深架構分支：
- **Level 1 (H1)**：頂層系統核心
- **Level 2 (H2)**：業務領域與基礎設施
- **Level 3 (H3)**：核心子系統與管道
- **Level 4 (H4)**：技術模組與協議
- **Level 5 (H5)**：元件與功能單元
- **Level 6 (List / H6)**：演算法實現與底層細節規範

```mindmap
# EpoCanvas 現代前端全棧工程系統
## 1. 核心構建管道與編譯引擎
### AST 抽象語法樹處理集群
#### Markdown / MDX 語義解析流水線
##### Unified / Remark 語法拓展
- GFM 表格與刪除線語法轉換
- 自動生成 Heading 錨點與 ID
##### Markmap 互動式多向思維導圖拓展
- 遞迴 AST 樹構建 (Transformer.transform)
- D3 層次化彈性佈局 (Flextree Algorithm)
- 互動式摺疊狀態機 (payload.fold)
- 動態調色板分支染色 (d3.scaleOrdinal)
##### Rehype Katex 數學公式拓展
- 行內公式與獨立塊公式解析
- 宏定義支援與錯誤容錯回退
#### 程式碼高亮與靜態著色器
##### Shiki 雙主題編譯器
- VSCode TextMate 語法規則解析
- 淺色/深色模式雙主題預渲染零水合
### 打包與構建流水線
#### Vite 6 模組熱重載
##### ESM 原生模組載入
- 毫秒級按需編譯與熱更新 (HMR)
##### Rollup 靜態程式碼優化
- 智慧程式碼分塊 (Code Splitting)
- Tree-Shaking 冗餘消除
## 2. 互動與群島體系
### Islands 架構設計
#### 客戶端元件分島掛載
##### React 19 Client Components
- 獨立狀態隔離與上下文通訊
- 會話持久化 (SessionStorage)
##### Astro 靜態優先服務端 Islands
- 零執行時客戶端 JS (Zero-JS by Default)
- 按需啟用互動島嶼 (client:visible)
### 動效與視覺體驗層
#### Canvas 渲染引擎
##### Aurora 極光 / Starfield 動態背景
- WebGL / Canvas 2D 硬體加速
- 節能模式與視口離開自動暫停
##### Glassmorphism 毛玻璃擬物風格
- 動態高斯模糊與多重環境陰影
- 響應式全端自適應佈局 (PC/Pad/Mobile)
## 3. 安全隱私與分級加密體系
### 散列與密碼學引擎
#### WebCrypto 現代瀏覽器密碼標準
##### SHA-256 雜湊校驗
- 零明文外露客戶端散列驗證
- 1級會話持久解鎖 (Session Persistent)
##### 防窺遮罩與視口攔截
- 2級高斯模糊/馬賽克/劇透遮罩保護
- 3級視口離開即鎖 (IntersectionObserver)
- 外聯分段解密端點隔離
```

---

## 二、無限層級擴展演示：純列表無限縮排（7 層及以上）

除了混合使用 `H1 ~ H6` 標題之外，Markdown 引擎支援使用**純縮排列表**實現 **無限深度（Level 1 -> Level 2 -> ... -> Level N）** 的無縫拓展：

```mindmap
- 🌐 根主題：計算機科學知識圖譜 (Level 1)
  - 🖥️ 軟體系統工程 (Level 2)
    - 📦 作業系統與核心 (Level 3)
      - ⚙️ 行程與執行緒調度 (Level 4)
        - 🔄 並發同步原語 (Level 5)
          - 🔒 互斥鎖與訊號量 (Level 6)
            - ⚡ 硬體級 CAS 原子指令 (Level 7)
              - ⏱️ Cache Coherency MESI 協議 (Level 8)
                - 🔬 記憶體屏障與流水線指令重排 (Level 9)
  - 🧠 人工智慧與機器學習 (Level 2)
    - 📊 深度學習架構 (Level 3)
      - 🤖 大語言模型 (LLM) (Level 4)
        - 🧩 Transformer 架構 (Level 5)
          - 👁️ 多頭自注意力機制 (Level 6)
            - 📐 Scaled Dot-Product Attention (Level 7)
```

---

## 三、無限層級擴展的書寫與優化建議

在編寫多層級與深度導圖時，推薦遵循以下工程與排版最佳實踐：

1. **語法混合法（推薦 1~6 層）**：
   - 優先使用 `#` 至 `######` 表達 1~6 級骨幹脈絡，第 6 級以下採用無序列表 `-` 或 `*` 縮排向下衍生。
2. **純列表法（推薦 6 層以上或輕量結構）**：
   - 使用 `- 節點` 並逐層添加 2 個或 4 個空格縮排，可實現理論上的**任意無限深度**。
3. **初始展開層級控制**：
   - 在程式碼塊首行添加 JSON 參數配置，例如 `{"initialExpandLevel": 2, "height": "560px", "title": "自訂超深導圖"}`，即可讓導圖預設展開到指定深度（如骨幹第 2 層），其餘深層按需展開。
4. **大螢幕與沉浸式探索**：
   - 對於 6 層以上的深度導圖，善用工具欄的 **全螢幕沉浸模式（Fullscreen）** 與 **自適應置中（Fit View）**，讓複雜的知識脈絡一覽無餘。