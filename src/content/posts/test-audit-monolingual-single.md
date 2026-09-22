---
title: "单语言独立文章隔离审计测试"
description: "用于核验在没有任何翻译变体时，单个 article-translation-variant 的行为。"
pubDate: 2026-09-21
author: "shijianus"
category: "审计测试"
tags: ["i18n", "audit", "monolingual"]
lang: "zh-CN"
---

# 单语言独立文章隔离审计测试

## 第一节：单文章变体存在性
即使没有多语言翻译，系统也应将正文包装进单个 .article-translation-variant[data-lang="zh-CN"] 中，确保样式与排版一致。

## 第二节：语言切换栏静默
单语言文章不应呈现任何多语言切换按钮，避免无效交互。
