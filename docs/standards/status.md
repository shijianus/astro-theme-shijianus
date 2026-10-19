---
title: "EpoCanvas 系統狀態與服務邊界：可驗證性、故障模式與運維責任"
description: "以可追溯證據說明 EpoCanvas 的靜態建置、邊緣函式、D1 資料、支付與通知邊界，並區分已實作、已測試、線上觀測與尚待規劃的狀態資訊。"
pubDate: 2026-10-18
updatedDate: 2026-10-18
author: "EpoCanvas 工程團隊"
category: "工程規範"
group: "EpoCanvas Standards"
tags: ["EpoCanvas", "系統狀態", "服務邊界", "D1", "故障處理", "可驗證性"]
toc: true
math: false
mermaid: false
mindmap: false
draft: false
lang: "zh-Hant"
i18nKey: "ees-status-topology"
version: "v1.0.1"
---

# EpoCanvas 系統狀態與服務邊界

<div class="article-aside">
  <p><span class="badge badge-primary">EES-005</span> <span class="badge badge-success">運行邊界</span> <span class="badge badge-warning">以證據為準</span></p>
  <p>本規範不是即時監控儀表板，也不把未經監控資料支持的性能數字寫成 SLA。它定義目前程式碼可確認的服務邊界、失敗行為、證據等級與後續觀測要求。</p>
</div>

> [!IMPORTANT]
> 「已部署」不等於「持續可用」，「本地測試通過」也不等於「生產端到端已驗證」。任何狀態宣告都必須附帶來源、測試或生產觀測證據；沒有證據時，標示為 `PROPOSED`。

## 1. 證據等級

本頁使用四種狀態標籤，避免把架構描述、測試結果與營運承諾混在一起：

| 標籤 | 含義 | 可以支持的說法 |
| :--- | :--- | :--- |
| `SOURCE-VERIFIED` | 可由目前倉庫的程式碼、設定或資料結構直接核對 | 「存在此路由」、「這個 API 會讀取 D1」、「缺少密鑰時回傳錯誤」 |
| `TEST-VERIFIED` | 有可重跑的自動化測試、建置日誌或明確測試產物 | 「在某個提交與指定環境通過某項測試」 |
| `LIVE-VERIFIED` | 有帶時間、提交版本與生產端證據的實際觀測 | 「在某個時間窗內，指定網址回應 200」 |
| `PROPOSED` | 尚未由目前程式碼或有效觀測證明的設計、指標或承諾 | 「未來應增加探針」、「建議建立錯誤預算」 |

本頁沒有為服務設定公開可用性百分比、固定 RTT、固定冷啟動時間或固定資料保留期限。這些數值若日後要成為承諾，必須先建立監控定義、採樣方法、維護窗口與公開報告。

## 2. 目前可由原始碼確認的服務拓撲

### 2.1 靜態內容與建置模式

`astro.config.mjs` 依 `BLOG_BUILD_TARGET` 選擇輸出模式：

- `static` 模式輸出靜態站點，並在公開建置流程中設定 `PUBLIC_STATIC_EXPORT=1`；
- 非靜態模式使用 Astro Node adapter，供需要伺服器執行時的路由使用；
- `package.json` 提供 `build:static`、`pages:build` 與 Cloudflare Pages 部署指令。

這些是建置選項，不是對每一個路由實際部署狀態的即時保證。部署是否完成，必須以對應提交的建置與部署紀錄確認。

### 2.2 邊緣 API 與資料儲存

目前 `functions/api/` 包含評論、帳號、控制台資料、支付意圖、Checkout Session、匯率、地理資訊與讚賞等 API。`functions/_lib/types.ts` 將 `DB`/`USER_DB` 描述為 D1-like binding；實際環境是否綁定資料庫由部署設定決定。

評論 API 的邊界目前可由 `functions/api/comments.ts` 確認：

1. 有 D1 時，評論表會保存文章識別、父子關係、作者資料、內容、會話、IP/地區、狀態、Reaction 與時間欄位；
2. 沒有 D1 時，開發或 fallback 路徑使用程序記憶體資料，開發環境另有本地落盤邏輯；這不是耐久性資料庫，也不是靜態快照；
3. 讀取支援最新/最熱排序，公開回應會遮蔽其他使用者的電子郵件、IP、User-Agent 與會話令牌；
4. D1 查詢失敗時目前可能回傳空評論集合以維持頁面可讀，這不應被解讀為「資料庫內沒有評論」。

### 2.3 支付與通知

- `functions/api/create-checkout-session.ts` 與 `functions/api/create-payment-intent.ts` 對接 Stripe；缺少 `STRIPE_SECRET_KEY` 時會拒絕建立支付請求。
- 目前程式碼沒有證明 Stripe 失效時會自動切換到其他支付通道，也沒有在本頁宣稱此類故障轉移。
- Telegram Bot 通知使用環境變數注入的 token/chat ID；通知失敗與核心資料落地是分開的錯誤邊界，不能把「訊息送達」當成支付成功證據。
- API 與通知的真實可用性仍需透過指定時間窗的生產測試或監控證據確認。

## 3. 服務狀態如何理解

### 3.1 `SOURCE-VERIFIED` 的最低狀態

下表只描述程式碼存在的能力，不描述目前線上是否健康：

| 元件 | 可確認能力 | 失敗或限制 |
| :--- | :--- | :--- |
| Astro 內容管線 | Markdown/MDX 內容、獨立規範路由與靜態輸出設定 | 建置錯誤會阻止產物生成；未經部署不能視為線上可見 |
| Cloudflare Pages 目標 | `pages:build` 與 `wrangler pages deploy` 指令存在 | 部署命令本身不提供持續監控，也不證明自動回滾 |
| 評論 API | D1 持久化、排序、回覆、Reaction 與身份驗證分支 | D1 不可用時可能使用程序 fallback 或回傳空集合 |
| 帳號 API | 會話、Epomail/本地讀者流程與角色判定 | 會話會過期；管理權限受服務端驗證約束 |
| Stripe API | 建立 Checkout Session/PaymentIntent 的路由 | 依賴環境密鑰與 Stripe 可用性；沒有源碼證據支持自動故障轉移 |
| Telegram 通知 | 可選的評論/讚賞事件通知 | 依賴 token、chat ID 與外部網路；不是交易提交的唯一依據 |

### 3.2 `TEST-VERIFIED` 與 `LIVE-VERIFIED`

一份合格的測試或線上狀態紀錄至少要包含：

- 測試/觀測時間與時區；
- Git Commit SHA 或部署識別；
- 目標網址、API、請求條件與使用的資料類型；
- 通過與失敗的原始結果；
- 是否為預覽、開發、沙盒或生產環境。

缺少上述資料的截圖、單次手動點擊或舊版報告，不足以支持持續性 SLA。這也是為什麼本規範不直接沿用歷史頁面中的全球節點數、固定延遲與固定成功率。

## 4. 故障邊界與降級原則

目前可確認與尚待設計的行為如下：

| 故障 | 已由程式碼確認的行為 | 尚不能宣稱的能力 |
| :--- | :--- | :--- |
| D1 暫時不可用 | 評論 API 有記憶體 fallback/錯誤處理分支 | 不等於跨節點一致、不等於可恢復的持久快照 |
| 評論查詢失敗 | 可能回應空集合並保留正文頁面 | 不等於最近留言快照，也不等於資料已刪除 |
| Stripe 密鑰缺失 | 建立支付請求時回傳錯誤 | 不等於會自動改走微信、支付寶、PayPal 或其他通道 |
| Telegram 發送失敗 | 記錄通知錯誤，核心請求可與通知分離 | 不等於系統會由定時任務自動補發 |
| 靜態建置失敗 | 不應產生可交付的完整產物 | 不等於平台會自動回滾到某個已知健康版本 |

## 5. `PROPOSED`：未來應補齊的運維能力

以下項目是建議中的工程工作，不是目前已啟用的功能：

1. 建立匿名 `GET /health` 或等價狀態端點，分離靜態站點、D1、支付與通知的健康語義；
2. 為 D1 讀取、評論寫入、Stripe 沙盒與 Telegram 通知建立可重跑的合成測試，並標記沙盒資料；
3. 設計錯誤預算、維護窗口、告警閾值與生產報告格式，而不是直接填入固定 SLA 數字；
4. 為評論 API 的空集合 fallback 增加可辨識的 `degraded` 訊號，避免讀者誤認為「目前沒有評論」；
5. 若未來需要持久化 fallback，應明確定義資料一致性、重試、冪等與恢復責任；
6. 建立以部署 SHA 為索引的建置、部署、回滾與安全事件紀錄。

## 6. 發布前狀態核對

- [ ] 建置命令、輸出模式與目標專案已確認。
- [ ] 變更已提交，Commit SHA 可回溯到本次產物。
- [ ] D1 migration 與環境變數變更已在對應環境驗證。
- [ ] 評論、登入、支付與通知等受影響 API 有明確測試結果。
- [ ] 若宣稱線上狀態，已附帶生產網址、時間與原始結果。
- [ ] 所有未實作的監控、SLA、容災或故障轉移內容已標為 `PROPOSED`。

最後更新：2026-10-18。
