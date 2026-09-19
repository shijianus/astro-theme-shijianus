---
title: "Markdown 掃描與展示能力全量示例"
pubDate: 2026-04-25
description: "用一篇長文把目前的 Markdown 掃描、目錄層級、隱藏內容、GFM 表格、腳注、程式碼區塊和特殊格式一次性跑全。"
author: "shijianus"
category: "系統設計"
group: "Markdown 範例"
cover: "/media/shijianus/system.jpg"
coverAlt: "markdown 展示板"
tags: ["Markdown", "Astro", "配置", "UI", "主題重構"]
featured: true
sticky: 4
i18nKey: "markdown-scan-showcase"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---
這篇文章專門用來驗證主題中的內容掃描、目錄同步、樣式增強與可讀性策略。它不是一篇「概念說明」，而是一篇 **真正可以拿來煙測前端主題** 的內容樣本。

在當前版本裡，我希望用一篇文章同時覆蓋：

- **標題層級掃描**
- **程式碼區塊與行內程式碼**
- **表格、任務清單與腳註**
- **特殊格式，如 <mark>標記</mark>、<kbd>Ctrl</kbd> + <kbd>K</kbd>、<ruby>安知魚<rt>AnZhiYu</rt></ruby>**
- **隱藏內容與輕量互動**
- **引用、清單、分隔區、詳情摺疊和提示卡**

> 如果一個主題只在「普通段落 + 普通標題」裡看起來正常，它就還不能算真正完成。

## 掃描目標

主題對一篇文章的掃描，不應該只停在 `title` 和 `description`。至少還要同時關心：

1. 文章的 **實際層級結構**，因為這會直接影響右側目錄。
2. 正文中的 **強調與節奏**，因為一整屏純文字無法高效瀏覽。
3. 程式碼、清單、表格和引用的 **語意化展示**，因為技術部落格不只會輸出段落。
4. 文章是否包含 **隱藏、提示、補充說明** 等特殊內容區塊，因為它們會影響閱讀路徑。

### 為什麼 TOC 不能只做「縮排」

一個常見錯誤，是把目錄層級只理解成 `padding-left`。這樣看起來像有層次，但一旦層級變深：

- 留白會急劇變大
- 可點擊區域被壓縮
- 激活項不容易判斷
- 使用者捲動時不知道自己處在哪一層

所以這一版 TOC 處理的目標是：**層級要真實，縮排要克制，激活路徑要明顯**。

#### 兩全其美的方案

現行的方案不是把三級、四級標題全部大幅右移，而是同時使用：

- 小步進縮排
- 目前項目高亮
- 父路徑弱高亮
- 縱向引導線
- 目前標題元資訊

這樣能兼顧「知道自己在第幾層」和「目錄依然可點、可掃、可捲動」。

## 行內格式

正文裡最常見的一層增強，是**行內資訊**的可視化。比如：

- 變數名可以寫成 `themeContract`
- 設定項可以寫成 `siteConfig.post.comments`
- 狀態詞可以寫成 <mark>in progress</mark>
- 快捷鍵可以寫成 <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
- 縮寫可以寫成 <abbr title="Table of Contents">TOC</abbr> 與 <abbr title="Application Programming Interface">API</abbr>
- 特定詞可以寫成 <span class="article-inline-serif">serif emphasis</span> 或 <span class="article-inline-mono">mono emphasis</span>

有些內容甚至不應該一開始完全展開，例如：

- 這是一個 `普通提示`
- 這是一個 `帶強調的詞`
- 這是一個 `行內程式碼`
- 這是一個 `參數名`
- 這是一個 ||需要點擊後才顯示的 spoiler||
- 這是一個 %%password:24680|需要輸入密碼後才顯示的隱藏內容%%

### 強調與節奏

當一段話裡同時出現 **重點句**、`設定名`、<mark>狀態詞</mark> 與 <kbd>快捷鍵</kbd> 時，讀者就能更快地把段落拆開理解，而不需要逐字閱讀。

#### 特殊字元與上下標

例如：

- E = mc<sup>2</sup>
- H<sub>2</sub>O
- <ruby>前端<rt>frontend</rt></ruby>
- <ruby>重構<rt>rebuild</rt></ruby>

## 提示卡與摺疊區塊

下面是一個自訂提示卡，它不依賴額外外掛，只使用 Markdown 中允許的 HTML：

<div class="article-note-card">
  <strong>設計判斷</strong>
  <p>如果一項樣式或動效沒有改善資訊定位效率，它就不應該只因為「看起來炫」而被保留。</p>
</div>

再往下是一個摺疊區塊：

<details class="article-detail-card">
  <summary>點擊展開：這次 Markdown 樣本到底在測什麼</summary>
  <p>它在測標題掃描、右側 TOC、GFM 表格、任務清單、腳註、隱藏內容、行內樣式、程式碼區塊與區塊型排版是否一起成立。</p>
  <p>如果其中任何一項渲染失真，說明主題的文章層還沒有真正穩定。</p>
</details>

### 引用區塊

> 「不是把主題做得花，而是把資訊做得清楚。」
>
> 對技術部落格來說，真正重要的是結構、秩序和回饋，而不是漂浮的裝飾。

#### 二級引用與說明

> 目錄之所以重要，不是因為它像文件，而是因為它能让長文變得可導航。

## 程式碼區塊

一篇技術文章至少要能同時容納不同語言的程式碼區塊。

### TypeScript

```ts
type TocNode = {
  id: string;
  depth: 2 | 3 | 4;
  title: string;
  children: TocNode[];
};

function buildCompactToc(nodes: TocNode[]) {
  return nodes.map((node) => ({
    ...node,
    offset: Math.max(0, node.depth - 2) * 12,
    activePath: false,
  }));
}
```

### Bash

```bash
npm install
npm run build
npm run preview:host
```

### CSS

```css
#card-toc .toc-item.is-active > .toc-link {
  background: var(--theme-main);
  color: var(--white);
  box-shadow: inset 3px 0 0 rgba(255, 255, 255, 0.34);
}
```

#### 行內程式碼的使用原則

不要把整句都寫成 `inline code`，只應該把真正的設定名、函式名或關鍵字收成程式碼態，例如 `navigator.share()`、`remark-gfm`、`scrollIntoView()`。

## GFM 表格

下面的表格用來驗證表頭、對齊、邊框和行動裝置捲動：

| 模組 | 目標 | 當前策略 | 備註 |
| --- | --- | --- | --- |
| 首頁分類卡 | 對齊安知魚 hover | 用真實圖示 + 壓縮擴展動畫 | 特別驗證 `lime` |
| 目錄 | 層級真實但不浪費空間 | 樹形結構 + 輕縮排 + 激活路徑 | 兼顧點擊效率 |
| 評論區 | 可直接發布 | 只保留留言框與公開評論流 | 不暴露測試入口 |
| 分享區 | 對應真實社媒 | 每個平台單獨構造分享參數 | 不只複製連結 |

### 任務列表

- [x] 涵蓋普通段落與多級標題
- [x] 涵蓋行內程式碼與程式碼區塊
- [x] 涵蓋 spoiler 與 password hidden
- [x] 涵蓋表格與任務列表
- [x] 涵蓋摺疊區塊、提示卡與引用
- [ ] 繼續補齊更多安知魚特有的內容區塊語法[^future]

#### 有序列表與無序列表混合

1. 先確定文章結構。
2. 再確定右側目錄的映射。
3. 然後決定每種內容區塊的視覺層次。

- 重點不是功能數量
- 而是展示是否有秩序
- 以及不同模組是否真的能共同工作

## 腳註

腳註本身也是內容掃描的一部分，因為它會影響文章尾部的排版與錨點行為。這裡放兩個例子：一個解釋性腳註[^scan-note]，一個偏工程判斷的腳註[^engineering-note]。

### 跨段補充

當正文裡出現「順帶一提，但不想打斷主線」的內容時，腳註通常比把整段都塞進括號裡更有效。

#### 什麼時候不該用腳註

如果那段資訊對主線理解是必要的，就不應該藏到腳註裡。腳註適合補充，不適合承載核心論點。

## 內容區塊的組合

下面這段內容故意把多種能力混在一起，確保主題不會「單項能渲染，組合就失真」。

<div class="article-note-card article-note-card--accent">
  <strong>組合測試</strong>
  <p>當前段落同時包含 <mark>高亮</mark>、<kbd>鍵位</kbd>、<ruby>術語<rt>term</rt></ruby>、`inline code` 與腳註引用[^combo]。</p>
</div>

如果一篇文章裡既有：

- 說明性段落
- 分級標題
- 程式碼區塊
- 表格
- 引用
- 行內強調
- 隱藏內容
- 摺疊補充

而主題仍然能維持閱讀秩序，那麼這一層內容系統才算真的穩定下來。

### 作為煙測文章怎麼用

你可以直接拿這篇文章驗證以下事項：

1. 右側目錄是否正確識別到 H2 / H3 / H4。
2. 當前激活項、父路徑和滾動定位是否自然。
3. 程式碼區塊、表格與任務列表是否有統一視覺。
4. 隱藏內容是否可互動。
5. 分享、評論、側欄和正文之間的垂直節奏是否協調。

#### 最後的結論

一個可發布的博客主題，不應該只在最簡單的文章裡看起來正常。它應該能經得住這種「故意把內容複雜度一次性拉滿」的樣本。

---

[^scan-note]: 這裡的「掃描」既包括 frontmatter 欄位掃描，也包括標題、摘要、正文層級與互動內容的渲染掃描。
[^engineering-note]: 如果目錄只靠視覺縮排模擬層級，它遲早會在長文中暴露出定位和可點擊區域的問題。
[^future]: 比如更完整的安知魚標籤語法、可重用提示區塊別名，以及更接近原主題的內容元件集。
[^combo]: 組合測試的目的，是防止主題只在單一內容類型下表現正常。