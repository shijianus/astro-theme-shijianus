---
title: "EpoCanvas 運維文件總覽"
description: "集中整理 EpoCanvas 的發布、驗收、事件處理與回滾邊界；本入口不代表任何一次部署已經執行。"
pubDate: 2026-10-20
updatedDate: 2026-10-20
author: "EpoCanvas 工程團隊"
category: "專案管理"
group: "Project Operations"
tags: ["運維", "發布流程", "事件處理", "回滾", "可追溯性"]
toc: true
draft: false
lang: "zh-Hant"
---

# EpoCanvas 運維文件總覽

<div class="article-aside">
  <p><span class="badge badge-primary">OPS-000</span> <span class="badge badge-success">操作入口</span> <span class="badge badge-warning">需依授權執行</span></p>
  <p>本入口整理發布與事件處理文件。它描述應如何操作與留下證據，不代表本次文件工作已經推送、部署、修改生產資料或完成線上驗收。</p>
</div>

> [!IMPORTANT]
> 任何生產推送、Cloudflare Pages 部署、D1 migration、真實支付或需要外部憑證的操作，都必須先確認授權、目標專案、分支、環境變數與回滾方式。文件存在不等於操作已獲批准。

## 官方運維文件

| 文件 | 內容 |
| :--- | :--- |
| [發布與事件處理手冊](/operations/release-and-incident-runbook/) | 發布前檢查、提交與追溯、部署邊界、線上驗證、事故分級、止損與回滾 |
| [系統狀態與服務邊界](/status/) | 靜態頁面、邊緣 API、D1、Stripe、Telegram 的服務責任與證據等級 |
| [專案路線圖](/roadmap/) | 已落地、已知差異、建議工作與外部阻塞 |

## 證據要求

運維報告應區分 `SOURCE-VERIFIED`、`TEST-VERIFIED`、`LIVE-VERIFIED`、`KNOWN-GAP`、`PROPOSED` 與 `BLOCKED`。如果沒有實際執行命令、提交/部署識別、網址、時間與原始結果，不得把「應該可以」寫成「已部署」或「已恢復」。

最後更新：2026-10-20。
