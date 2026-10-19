---
title: "EpoCanvas 版本與架構規範：語意化變更、部署追溯與授權邊界"
description: "說明 EpoCanvas 如何管理內容與程式版本、Git 提交追溯、Astro 建置分層、依賴契約，以及程式碼、文章與第三方依賴的不同授權邊界。"
pubDate: 2026-10-18
updatedDate: 2026-10-18
author: "EpoCanvas 工程團隊"
category: "工程規範"
group: "EpoCanvas Standards"
tags: ["EpoCanvas", "版本管理", "SemVer", "Git SHA", "架構分層", "授權"]
toc: true
math: false
mermaid: false
mindmap: false
draft: false
lang: "zh-Hant"
i18nKey: "ees-version-protocol"
version: "v1.0.0"
---

# EpoCanvas 版本與架構規範

<div class="article-aside">
  <p><span class="badge badge-primary">EES-004</span> <span class="badge badge-success">版本與架構</span> <span class="badge badge-warning">以倉庫證據為準</span></p>
  <p>本規範描述版本如何被命名、變更如何被追溯，以及不同內容與程式資產適用的授權。它不把某個歷史部署標識或未驗證的性能數字當成永久產品版本。</p>
</div>

> [!IMPORTANT]
> 版本號只描述變更意義；真正的部署身份仍必須回到 Git Commit SHA、建置輸出與部署記錄。沒有提交、建置與目標環境證據的版本標籤，不足以證明線上已更新。

## 1. 版本識別的三個層次

EpoCanvas 同時處理三種容易被混淆的識別：

| 識別 | 作用 | 來源 |
| :--- | :--- | :--- |
| 內容版本 | 描述某篇規範或文章的語意變更 | Markdown front matter 的 `version` 與 `updatedDate` |
| 程式提交 | 精確指出源碼狀態 | Git Commit SHA |
| 部署/建置識別 | 指出某份產物在哪個環境生成或上線 | 建置日誌、Pages deployment ID 或平台紀錄 |

內容版本可以相同於不同環境；部署識別也可能因重新建置而不同。因此，問題回報至少應同時提供頁面網址、內容版本（若有）、提交或部署識別與發生時間。

## 2. 內容版本與 SemVer

內容版本採用 `MAJOR.MINOR.PATCH` 的語意化思路：

- `MAJOR`：內容契約、資料語義或使用方式發生不相容變更；
- `MINOR`：新增向後相容的章節、字段、規則或功能說明；
- `PATCH`：勘誤、例子修正、文字澄清、連結更新與不改變契約的排版調整。

目前倉庫的 `scripts/sync-content-versions.mjs` 會計算排除 `version`/`updatedDate` 的內容雜湊：首次發現的檔案使用既定預設版本；內容變更而作者沒有手動提升版本時，工具會自動增加 patch；作者明確修改版本時，工具會保留該版本並更新日期。

這個腳本管理的是內容檔案，不是 npm 套件版本，也不是 Cloudflare 平台的部署版本。建置時自動修改內容 front matter 或版本清單時，應檢查差異並在適當提交中記錄，而不是把產生檔案當成未審核的黑盒結果。

## 3. 何時需要提升版本

### 3.1 內容與政策

新增或改寫評論規則、隱私說明、工程指標、權限契約時，至少需要 `MINOR` 或更高層級的人工判斷。若文字修正會改變使用者原本可以依賴的行為，不能只做 `PATCH`。

### 3.2 API 與資料結構

以下變更應視為高風險，必須附帶相容性說明與測試：

1. API 請求或回應字段改名、刪除或改變型別；
2. 評論、帳號、讚賞或支付資料表的 migration；
3. 鑑權、會話、管理員 token 或公開資料遮蔽規則；
4. 文章路由、加密文章路由或多語言解析規則；
5. 會導致既有文章無法建置或既有瀏覽器互動失效的 UI/Markdown 契約。

### 3.3 修正與重構

只修復錯字、補充來源、調整不改變行為的 CSS 或優化內部實作時，可以使用 `PATCH`。如果修復同時更正了對外政策、公開資料範圍或可觀察行為，應在提交訊息與變更說明中明確寫出影響。

## 4. Git SHA 與發布追溯

生產發布應遵守以下最低流程：

1. 在工作區確認目標變更與既有使用者修改的邊界；
2. 以單一、可描述的提交保存一個獨立邏輯組，輸出完整或短 SHA；
3. 執行與變更風險相稱的建置、單元測試或瀏覽器測試；
4. 以同一提交或明確的建置產物部署至目標 Cloudflare Pages 專案；
5. 保存部署識別、目標網址、驗證時間與失敗輸出。

Git 提交是追溯源碼的證據，不是線上可用性的證據。若工作區含有未提交的其他修改，不應把整個工作區誤當成該提交的純淨發布物；發布前應隔離、提交或明確排除它們。

## 5. 目前架構的責任分層

本節只描述目前倉庫可確認的責任邊界：

| 層 | 目前責任 | 主要證據 |
| :--- | :--- | :--- |
| 內容層 | Markdown/MDX front matter、規範正文、文章資產與內容版本 | `src/content.config.ts`、`docs/standards/`、`src/content/posts/` |
| 渲染層 | Astro 路由、Markdown/MDX、React islands、靜態或 Node 輸出模式 | `astro.config.mjs`、`src/pages/`、`src/layouts/` |
| 業務層 | 評論、帳號、支付、讚賞、控制台與通知 API | `functions/api/`、`functions/_lib/` |
| 儲存與外部服務層 | D1 binding、Epomail、Stripe、Telegram 與 Cloudflare Pages | 環境型別、API 實作與部署設定 |
| 表現層 | 主題 CSS、文章元件、響應式佈局與互動增強 | `src/components/`、`src/styles/` |

「採用某個框架」不等於所有性能、可用性或第三方服務行為都由本倉庫保證。每一層的外部依賴都必須以實際環境配置與測試結果為準。

## 6. 依賴契約

`package.json` 是目前直接依賴版本範圍的主要來源。當升級 Astro、React、Tailwind、Markdown/數學插件、Stripe SDK、Lucide 或其他關鍵套件時，至少檢查：

- 內容集合 schema 與 front matter 解析；
- 靜態輸出與 Node/Functions 路由；
- React client directive、水合與表單狀態；
- Markdown 表格、程式碼、數學式、Mermaid、加密內容與互動增強；
- 支付、帳號、評論 API 的請求格式與錯誤處理；
- 生產建置大小、瀏覽器相容性與既有視覺回歸結果。

上游套件的版本與許可證以 lockfile、套件本身及其授權文件為準，不應只依賴本頁的摘要。

## 7. 授權邊界

目前倉庫根目錄的 `LICENSE` 是 MIT License，適用範圍應以該文件與各檔案的實際聲明為準。文章頁的版權元件另以 CC BY-NC-SA 4.0 對文章內容作公開展示說明。兩者不是同一個授權：

1. **程式碼**：優先依根目錄 MIT License；第三方套件仍受各自授權約束。
2. **文章正文與內容素材**：除另有特別聲明外，依文章頁所標示的 CC BY-NC-SA 4.0 條件使用；轉載應保留作者、來源與授權資訊，商業使用需另行確認。
3. **商標、帳號、密鑰、個人資料與第三方素材**：不因程式碼或文章授權而自動取得使用權。
4. **生成資產與外部服務內容**：需回到其來源、平台條款與單獨聲明判斷。

因此，本規範不再使用「整個 EpoCanvas 是專有獨占授權」這種會與根目錄 MIT License 衝突的總括說法。若某個元件有不同授權，應在該元件或其附帶文件中明確標註。

## 8. 發布前檢查表

- [ ] 變更類型與 SemVer 層級已說明。
- [ ] front matter 的 `version`、`updatedDate` 與版本清單已同步。
- [ ] API、資料庫、身份或內容路由變更有相容性說明。
- [ ] 建置與測試結果包含環境、時間與提交 SHA。
- [ ] 部署只針對正確的 Pages 專案，不跨專案使用產物。
- [ ] 程式碼、文章、第三方素材與秘密資料的授權/保密邊界清楚。
- [ ] 未驗證的性能、SLA、監控或容災內容已標為待驗證或 `PROPOSED`。

最後更新：2026-10-18。
