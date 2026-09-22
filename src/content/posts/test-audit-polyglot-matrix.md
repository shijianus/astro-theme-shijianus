---
title: "多语言全矩阵极限审计测试 (中文版)"
description: "用于核验多语言架构在面对 10 种语言时的完整渲染与切换能力。"
pubDate: 2026-09-21
author: "shijianus"
category: "审计测试"
tags: ["i18n", "audit", "polyglot"]
lang: "zh-CN"
i18nKey: "test-audit-polyglot-matrix"
---

# 多语言全矩阵极限审计测试

本文章作为 Antigravity 审计核验测试用例，用于验证 10 种语言变体的编译、DOM 挂载与动态切换机制。

## 第一节：测试目的
验证 `.article-translation-variant[data-lang="zh-CN"]` 是否成功挂载到 DOM，并处于初始激活状态。

## 第二节：交互说明
用户点击顶部语言切换栏时，应能在 10 种语言变体间平滑切换，DOM 内仅激活目标语言。
