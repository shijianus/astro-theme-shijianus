---
title: "文章存取控制實驗室"
pubDate: 2026-04-26
updatedDate: 2026-04-26
description: "用於驗證密碼存取控制是否依伺服器端規則生效，並確認受限內文不會在未解鎖時直接輸出到頁面。"
author: "shijianus"
category: "系統設計"
group: "安全實驗"
cover: "/media/shijianus/system.jpg"
coverAlt: "文章存取控制實驗室"
featured: false
sticky: 1
tags: ["存取控制", "安全", "伺服器端渲染"]
access:
  passwordHash: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"
  message: "這篇文章啟用了伺服器端存取控制。輸入正確密碼後才會繼續渲染內文。"
i18nKey: "access-control-lab"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---

# 這是一篇受保護的文章

如果你在未解鎖狀態下直接查看這篇文章，以下內文不會被伺服器端輸出到頁面中，而不是簡單地先輸出再用前端隱藏。

## 解鎖後你應該驗證什麼

1.  未輸入密碼時，內文不會出現在 HTML 中。
2.  輸入正確密碼 `12345` 後，伺服器端會寫入短時存取憑證。
3.  再次重新整理當前文章時，不需要重複輸入密碼。
4.  首頁卡片、最新文章和摘要不會洩漏受保護內文。

## 這層規則目前支援什麼

-   密碼存取
-   指定 IP 可見
-   指定 IP 不可見
-   指定國家或地區可見
-   指定國家或地區不可見

## Frontmatter 寫法範例

以下幾段寫法都可以直接放進文章 frontmatter：

```yaml
access:
  passwordHash: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"
  message: "輸入正確密碼後繼續閱讀。"
```

```yaml
access:
  blockedCountries: ["CN"]
  message: "目前地區無法存取這篇文章。"
```

```yaml
access:
  allowedIps: ["203.0.113.7", "198.51.100.*", "192.0.2.0/24"]
  message: "目前網路位址不在允許範圍內。"
```

如果你只想允許某一個國家或地區存取，也可以直接寫：

```yaml
access:
  allowedCountries: ["US", "GB", "HK"]
```

## 為什麼推薦使用 passwordHash

雖然目前仍相容直接寫 `password`，但更推薦在 Markdown 中只寫 `passwordHash`。這樣主題只會在伺服器端做比對，不需要把明文密碼保存在內容配置中。

如果你需要自己產生雜湊值，目前主題內部使用的是 `SHA-256`。推薦在本地先把密碼轉成雜湊，再寫入 frontmatter，而不是把明文密碼直接放進文章原始檔。

## 為什麼這層不會把受限內文提前洩漏出去

這套實作並非「先把全文輸出，再靠前端隱藏」。受限文章頁面走的是伺服器端判斷：

1.  未滿足密碼或地區/IP 規則時，伺服器端只會返回鎖定面板。
2.  內文、目錄、相關文章和公開摘要都不會在未解鎖時渲染進頁面。
3.  首頁、分頁、最新文章、搜尋索引和側邊欄也不會把受限文章混進去。

## 結論

這篇文章主要是給你後續做煙霧測試用的。只要鎖定頁、解鎖頁、重新整理後的保留狀態都正常，就說明這套存取控制已經從「概念功能」進入了可實際使用的狀態。