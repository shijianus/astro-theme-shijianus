---
title: "把主题配置做成可接 API 的契约"
pubDate: 2026-04-08
description: "真正方便后续接 API 的方式，不是先写请求，而是先把页面依赖的数据形状稳定下来。"
author: "shijianus"
category: "系统设计"
group: "配置契约"
cover: "/media/shijianus/system.jpg"
coverAlt: "system board"
featured: true
sticky: 2
tags: ["API", "Config", "Architecture"]
---

# 为什么先做契约

如果一个主题的每个板块都直接在模板里读取原始数据，那么一旦以后要从本地 Markdown 切到 API，几乎每个页面都要重写。

## 当前的处理方式

这次我先把这些能力抽离成统一的 helper：

- 文章排序
- 归档聚合
- 分类聚合
- 标签聚合
- 相关文章推荐

## 这样做的收益

当数据源变化时，理论上只需要替换数据入口，而不是改动 UI 组件本身。

## 对主题扩展的意义

这意味着以后要接：

- 自定义 dashboard API
- 外部搜索 API
- 远程文章摘要服务

都不会把当前的组件层撕开重来。
