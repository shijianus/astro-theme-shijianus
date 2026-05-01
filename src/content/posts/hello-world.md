---
title: "主题重构启动记录"
pubDate: 2026-04-02
description: "第一篇重构记录，确定新的主题不是旧主题的壳，而是一套真正可维护的 Astro 实现。"
author: "shijianus"
category: "前端工程"
group: "迁移记录"
cover: "/media/shijianus/frontend.jpg"
coverAlt: "frontend workspace"
featured: true
sticky: 3
tags: ["Astro", "Tailwind", "主题重构"]
---

# 为什么要重做

之前的实现最大的问题不是功能少，而是结构不清楚。页面上混杂了试验性的品牌、风格和局部组件，最终既不像原主题，也没有形成自己的秩序。

## 这次重构的判断

这次的主题重构有两个前提：

1. 保留原主题强结构首页、侧栏模块和卡片体系的优点。
2. 把实现方式完全切换到 Astro + React + Tailwind 的内容优先架构。

```ts
const themeContract = {
  brand: 'shijianus',
  runtime: 'Astro Islands',
  interaction: ['loading', 'copy-code', 'comments', 'dock'],
};
```

## 首页应该先解决什么

首页不是宣传页，它首先是一张信息地图。读者进入第一页，需要很快看见：

- 品牌与作者身份
- 当前有哪些主要分类
- 最近有哪些值得读的文章
- 侧栏里还能继续往哪里走

## 之后的方向

后续所有板块都会围绕同一个目标继续调整：让这套主题既有技术感，又不会把普通读者挡在门外。
