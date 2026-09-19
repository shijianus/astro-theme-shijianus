---
title: "安知魚式 Markdown 能力總檢：目錄、格式、隱藏內容、媒體與內容塊"
pubDate: 2026-04-25
updatedDate: 2026-04-25
description: "一篇專門用於壓力測試文章掃描、目錄層級、GFM、隱藏內容、特殊格式、媒體展示與常見內容塊的長範例文章。"
author: "shijianus"
category: "前端工程"
group: "Markdown 範例"
cover: "/media/shijianus/workbench.jpg"
coverAlt: "Markdown 展示桌"
featured: true
sticky: 4
tags: ["Astro", "Markdown", "主題重構", "UI", "學習"]
i18nKey: "anzhiyu-markdown-showcase"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---
# 這是一篇專門用來驗收主題能力的長文章

這篇文章不是普通隨筆，而是用來集中驗證當前文章頁是否已經真正接近安知魚主題閱讀體驗的一次總檢。它會同時覆蓋 **文章頭圖掃描**、**分類與標籤識別**、**目錄層級映射**、**程式碼塊增強**、**GFM 表格與任務列表**、**隱藏內容**、**特殊字體與格式**、**媒體展示**、**內容塊組合** 與 **長段落滾動表現**。

如果這些能力能夠在同一篇文章裡穩定出現，而且目錄、分享、評論、側欄、打賞與整體閱讀路徑都沒有散架，那麼這套主題才算真的進入可交付階段。

## 基礎格式掃描

先用一段基礎文本確認最常見的 Markdown 語義已經穩定可讀：

- 這裡有 **加粗文本**，用來確認正文強調不會過亮也不會糊掉。
- 這裡有 *斜體文本*，用來確認正文節奏不被打斷。
- 這裡有 ~~刪除線~~，用於檢查 GFM 擴展是否已經生效。
- 這裡有 `inline code`，用於確認行內程式碼塊邊距、圓角和字號。
- 這裡有 [外部連結到 Astro](https://astro.build/)，用於確認連結色和 hover 反饋。

這一段還會刻意混入中文、英文、數字與符號，例如 `Astro 6 + React 19 + Tailwind 4`，以便確認字距和換行在真實長文裡不會顯得擁擠。

### 特殊格式與特殊字體

下面這些項目不是普通部落格每天都會寫到的內容，但它們非常適合拿來測試文章系統是否具備足夠完整的表達能力：

- `<mark>高亮文本</mark>` 用來測試重點標記。
- `<kbd>Ctrl</kbd> + <kbd>K</kbd>` 用來測試快捷鍵表現。
- `<ruby>目錄<rt>mulu</rt></ruby>` 用來測試注音排版。
- `<abbr title="Application Programming Interface">API</abbr>` 用來測試縮寫詞解釋。
- 行內上標示例：E = mc<sup>2</sup>。
- 行內下標示例：H<sub>2</sub>O 與 log<sub>n</sub>。

還可以直接插入一段帶有不同字體的原生 HTML：

<p>
  <span style="font-family: 'Times New Roman', serif; font-size: 1.08em; letter-spacing: 0.04em;">This sentence uses a serif rhythm.</span>
  <br />
  <span style="font-family: 'Courier New', monospace; font-size: 0.96em;">const typographyMode = "editorial + geek";</span>
</p>

<div class="article-note-card article-note-card--accent">
  <strong>特殊格式組合壓測</strong>
  <p>這一塊同時覆蓋 <mark>高亮標記</mark>、<kbd>鍵位</kbd>、`inline code`、不同字重與原生 HTML，目的是確認正文增強不是只在單一內容形態下成立。</p>
</div>

### 隱藏內容與劇透

當前主題已經支援幾種前端增強型的內聯內容：

- 劇透遮罩：||這是一段會在點擊後顯示的劇透文本，用來確認按鈕化遮罩已經正確掃描。||
- 直接點擊顯示：%%這裡是一段隱藏提示，點擊後會展開。%%

這一層現在只保留前端可見性增強，不再提供「前端密碼隱藏」這種容易被誤認為安全能力的寫法。真正需要密碼訪問時，應使用文章 frontmatter 裡的服務端訪問控制。

如果這一段的兩個互動都正常，說明正文增強腳本已經與 Markdown 渲染保持一致，沒有把普通文本節點誤傷到 `code`、`pre` 或其他受保護元素。

## 目錄層級壓測

這一節專門用於驗證目錄的層級壓縮方案是否已同時滿足兩個目標：

1. 層級關係必須準確，不能把 H4 偽裝成 H2。
2. 縮排不能過大，否則目錄會因留白太多而失去實際可點擊性。

### 第一層分組：資訊結構

當目錄真正貼近文章結構時，讀者並不需要逐字閱讀標題，也能大致判斷這段內容是總論、子論點，還是補充項。目錄的任務不是「把所有標題抄一遍」，而是協助讀者建立文章地圖。

#### 第二層分組：層級線索

如果目錄完全沒有縮排，所有標題就會擠在同一條水平線上，讀者很難一眼分辨哪個標題屬於哪個部分。反過來，如果每一層都使用過大的縮排，目錄又會迅速失去點擊效率。

#### 第二層分組：跳轉效率

真正可用的方案，通常不是繼續擴大縮排，而是在小縮排基礎上增加路徑高亮、活動分支標記、激活項背景與編號提示，讓層級關係和操作效率同時成立。

### 第一層分組：閱讀路徑

這一段用來測試另一種常見場景：讀者先從上往下掃目錄，然後停在某個 H3，最後直接點擊跳轉到正文中部。

#### 第二層分組：當前定位

當前定位區域如果能穩定顯示活動標題、當前層級與總序號，就能顯著提升長文閱讀時的方向感。

#### 第二層分組：目錄滾動

當活動標題切換時，目錄列表自身也應該保持跟隨，但不能在使用者手動滾動目錄時強行搶回焦點。

### 第一層分組：極端長文

如果文章足夠長，目錄仍然需要保持固定可用，而不是因為卡片高度策略錯誤直接失去 sticky 行為。

#### 第二層分組：H4 密度測試

這一段後面會繼續補一批 H4，目的是讓目錄出現更明顯的深層節點，進一步觀察壓縮縮排是否仍然可讀。

##### 第三層補充：H5 路徑壓縮

這一層用來確認目錄在繼續深入時，不會因為層級增加就把可點擊區域壓縮得過窄。也就是說，**層級變深，不代表交互面積可以變小**。

###### 第四層末級：H6 錨點試驗

如果你在右側目錄裡仍然能看清這一級的位置，而且點擊後錨點跳轉準確、當前路徑高亮穩定，那麼更深一級的標題掃描就已經補齊了。

#### 第二層分組：額外節點 A

這裡是額外節點 A，用於製造更長的目錄列表。

#### 第二層分組：額外節點 B

這裡是額外節點 B，用於製造更長的目錄列表。

#### 第二層分組：額外節點 C

這裡是額外節點 C，用於製造更長的目錄列表。

## 列表、任務和表格

下面這組內容主要驗證 GFM 擴展是否已經完整接入。

### 無序列表與有序列表

- 首頁結構優先。
- 文章頁目錄優先。
- 評論區應該保持直觀。

1. 先看目錄是否可靠。
2. 再看分享與打賞是否順手。
3. 最後看評論區是否真的可發佈。

### 任務列表

- [x] 頭圖與元資訊掃描
- [x] 標籤與分類聚合
- [x] 目錄層級修正
- [x] 打賞與分享結構整改
- [ ] 接入真實遠端評論資料
- [ ] 補足更多安知魚式內容標籤

### 表格

| 模組 | 當前目標 | 驗收標準 |
| --- | --- | --- |
| 首頁分類卡 | 對齊安知魚動效 | 圖示角度、放大策略和 hover 節奏一致 |
| TOC | 層級準確且不失可點性 | H2/H3/H4 可辨識，活動路徑明確 |
| 打賞彈層 | 只展示有效資訊 | 區域選擇 + 二維碼，且自動避讓視口 |
| 分享工具 | 真正對應不同平台 | 不只是複製連結，而是生成對應分享內容 |
| 評論區 | 可直接發布 | 縱向排布、固定高度、滾動瀏覽公開評論 |

## 引用、折疊塊和長程式碼

> 一個成熟的部落格主題，不應該只在螢幕截圖裡看起來像樣，而應該在真實長文裡持續穩定地工作。

這段引用主要測試 blockquote 的層級感和正文節奏是否合適。

<details>
  <summary>點擊展開折疊塊，檢查 summary/details 是否已經有可讀樣式</summary>
  <p>折疊塊非常適合放二級說明、補充材料和臨時附註。這裡故意放成原生 HTML，而不是主題私有標籤，目的是保持 Markdown 內容本身的可遷移性。</p>
  <p>如果你以後把文章系統從本地 Markdown 切到 API 或 CMS，這類標準 HTML 結構會比主題私有短代碼更穩。</p>
</details>

### TypeScript 程式碼區塊

```ts
type TocNode = {
  id: string;
  depth: 2 | 3 | 4;
  title: string;
  children: TocNode[];
};

export function compressTocIndent(nodes: TocNode[], offset = 0): TocNode[] {
  return nodes.map((node) => ({
    ...node,
    children: compressTocIndent(node.children, offset + 1),
  }));
}

const sharePayload = {
  title: "安知鱼式主题对齐",
  summary: "把目录、分享、评论与打赏的真实使用路径一起补齐。",
  platforms: ["wechat", "weibo", "x", "telegram", "email"],
};
```

### Bash 程式碼區塊

```bash
npm install
npm run build
npm run preview -- --host 0.0.0.0
```

### CSS 程式碼區塊

```css
#card-toc .toc-item {
  padding-left: calc(var(--toc-level, 0) * 12px);
}

#card-toc .toc-item.is-active-branch > .toc-link {
  background: color-mix(in srgb, var(--theme-main) 10%, var(--card-bg));
}

.post-share-grid__surface {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

## 圖片、分割線與腳註

下面這張圖片主要用來確認正文圖片在長文中不會超出文章寬度，並且與上下文保持穩定的留白關係。

![工作台與寫作環境](/media/shijianus/workbench.jpg)

---

腳註也是長文很常見的結構，現在用它來測試 GFM 腳註能力是否已經生效。[^toc]

[^toc]: 這裡的腳註文字會被放到文章底部，用來驗證腳註編號、跳轉和正文間距。

## 媒體與嵌入補充

如果要把這篇文章當成主題總檢，還需要把正文裡的媒體塊一起壓一遍：

<figure>
  <video src="/media/shijianus/avatar-dynamic.mp4" poster="/media/shijianus/default.png" muted loop playsinline controls></video>
  <figcaption>本地影片 + poster，用來確認正文媒體在不同寬度下仍然穩定收束。</figcaption>
</figure>

<figure>
  <img src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80" alt="遠程圖床示例" />
  <figcaption>遠程圖床圖片，用來確認跨域資源與正文留白不會互相打架。</figcaption>
</figure>

如果遠端資源失效，正文增強腳本會把它們回退到預設佔位圖，而不是留下破損空框。

## 常見內容塊等價演示

這一節不再只測基礎 Markdown，而是補齊一些日常部落格主題裡最常見、也最容易在遷移時遺失的內容塊。這裡使用原生 HTML 和當前主題樣式做等價演示，重點驗證排版、間距和響應式，而不是綁定某個舊主題的私有語法。

<div class="article-demo-stack">
  <div class="article-demo-tabs">
    <div class="article-demo-tabs__nav">
      <span>標籤面板</span>
      <span>步驟說明</span>
      <span>適配結論</span>
    </div>
    <div class="article-demo-tabs__panel">
      這一組模擬常見的 tabs / btns 內容區，驗證按鈕化資訊塊在正文裡是否仍有足夠層次，同時不會把正文節奏打斷。
    </div>
  </div>

  <div class="article-demo-timeline">
    <div class="article-demo-timeline__item">
      <strong>階段一：結構對齊</strong>
      <span>先把文章頁、首頁、目錄與固定側欄的骨架拉齊，確保讀者不會在評論區或頁腳前失去導覽。</span>
    </div>
    <div class="article-demo-timeline__item">
      <strong>階段二：交互收口</strong>
      <span>清理重複按鈕，將分享、語言、帳號和設定分別放到更明確的位置，避免互相搶佔空間。</span>
    </div>
    <div class="article-demo-timeline__item">
      <strong>階段三：內容回填</strong>
      <span>補充媒體、隱藏內容、二維碼、站點卡片與長文壓測，保證真正寫長文時不會散架。</span>
    </div>
  </div>

  <div class="article-demo-gallery">
    <img src="/media/shijianus/workbench.jpg" alt="工作台畫面" />
    <img src="/media/shijianus/hero.jpg" alt="首頁頭圖區塊" />
    <img src="/media/shijianus/tg-group.jpg" alt="二維碼與長圖測試" />
  </div>

  <div class="article-demo-links">
    <div class="article-demo-link-card">
      <strong>站點卡片</strong>
      <span>等價於常見的 site-card / link-card，驗證卡片化連結在正文裡是否仍能保持足夠點擊面積。</span>
    </div>
    <div class="article-demo-link-card">
      <strong>媒體卡片</strong>
      <span>配合圖床、二維碼和影片封面測試，確認不同尺寸內容不會把正文寬度和留白節奏打亂。</span>
    </div>
  </div>
</div>

## 長段落滾動壓測

真正的問題通常不會出現在一篇很短的演示文裡，而會出現在一篇足夠長、包含多種模組、又帶目錄與懸浮工具的文章裡。因此這裡故意補兩段更長的正文，來測試滾動時文章頭圖後的內容銜接、正文呼吸感、側欄 sticky、目錄活動項、打賞區與評論區之間的閱讀落差是否仍然穩定。

一個穩定的文章頁，不應該要求使用者理解元件結構、技術棧或交互動機。使用者真正感受到的只有三件事：第一，我能不能快速找到我想看的段落；第二，當我準備分享、打賞或評論時，這些入口是否在我需要的時候剛好出現，而不是大面積打斷正文；第三，當文章已經很長、目錄節點很多、評論也在持續增長時，這個頁面還能否維持秩序。只要這三件事成立，主題就已經從「看起來像一個主題」變成「真正可以長期使用的內容系統」。

最後再補一段更偏作者視角的總結：對齊安知魚主題並不意味著把每一行模板照搬過來，而是把它那些已經被長期使用驗證過的設計判斷重新理解一遍，然後在 Astro 體系裡用更適合當前工程結構的方式復現出來。真正值得復刻的不是舊技術棧，而是它對資訊優先級、交互回饋、閱讀路徑和模組秩序的判斷力。如果這些判斷已經在這篇文章裡被完整驗證，那麼這次對齊工作才算真正進入了可以交付的階段。