---
title: "封面、图床与视频适配实验室"
pubDate: 2026-04-26
updatedDate: 2026-04-26
description: "集中验证文章头图、远程图床、本地资源、视频封面、失效回退和不同宽度下的媒体展示效果。"
author: "shijianus"
category: "前端工程"
group: "媒体适配"
coverVideo: "/media/shijianus/avatar-dynamic.mp4"
coverVideoPoster: "/media/shijianus/workbench.jpg"
coverAlt: "封面与媒体适配实验室"
featured: true
sticky: 2
tags: ["媒体适配", "Markdown", "主题重构", "Astro"]
---

# 封面与媒体适配总检

这篇文章专门用来测试 `post-hero__cover`、正文图片、远程图床、视频与默认占位图是否都能稳定工作。现在的规则是：

- 文章头图可以直接使用本地图片
- 文章头图也可以使用本地视频并带 `poster`
- 正文中的图片如果加载失败，会自动回退到默认封面
- 正文中的视频如果没有 `poster`，会自动补上默认封面

## 本地图片

下面这张图使用的是本地资源：

![本地工作台图片](/media/shijianus/workbench.jpg)

## 远程图床图片

下面故意混入一张远程图片，用来确认远端资源也能正常显示：

![远程示例图](https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80)

## 失效图片回退

下面这张图是一个故意写错的地址，用来确认默认占位图会自动补上：

![失效图片回退测试](/media/shijianus/does-not-exist.jpg)

## 原生视频

正文视频同样需要支持本地地址，并在不同设备上保持可控播放：

<video src="/media/shijianus/avatar-dynamic.mp4" poster="/media/shijianus/default.png" muted loop playsinline controls></video>

## 没有 poster 的视频

下面这个视频不写 `poster`，用来验证主题是否会自动补默认占位：

<video src="/media/shijianus/avatar-dynamic.mp4" muted loop playsinline controls></video>

## 宽图、窄图与长图

![宽图示例](/media/shijianus/hero.jpg)

![竖向二维码长图](/media/shijianus/tg-group.jpg)

当这些内容同时出现时，页面需要保证：

1. 图片不会撑破正文宽度。
2. 视频在手机端仍能正常展示控制条。
3. 失效资源不会留下破碎占位。
4. 头图视频失效时会自动回退到默认图片。

## 结论

如果你在烟测里看到这篇文章的头图可以播放、正文图片能按宽度收束、错误图片被默认封面替代、正文视频可播放，那么这一层媒体适配就已经可以继续进入更细的视觉打磨。
