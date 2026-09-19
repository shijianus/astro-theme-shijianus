---
title: "测试i18n双向容错解析文章"
pubDate: 2026-09-19
updatedDate: 2026-09-19
description: "主文章显式指定了自定义 i18nKey，用于测试英文子篇在未显式提供 i18nKey 时能否凭借双向文件名基名推导正常关联并显示。"
author: "shijianus"
category: "测试验证"
cover: "/media/shijianus/default.png"
coverAlt: "测试i18n双向容错解析文章"
tags: ["测试", "i18n", "容错"]
i18nKey: "custom-resilient-key-2026"
lang: "zh-CN"
---

# 测试i18n双向容错解析文章

这篇文章的主文章定义了自定义 `i18nKey: "custom-resilient-key-2026"`。

## 中文测试段落

如果双向容错推导机制生效，英文子篇即使省略 `i18nKey`，系统也能通过公共文件名基名（`test-i18n-resilience`）将其成功提取并渲染为第二个 `.article-translation-variant`！
