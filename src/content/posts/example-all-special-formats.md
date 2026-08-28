---
title: "示例：Astro 特殊格式与特异功能综合测试大全"
description: "一站式跑全所有 13 种 Callout、Post Formats、下拉框切换器、手风琴、密码解密、公式、图表与排版组件。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "all-in-one", "test"]
category: "Examples"
series: "功能示例"
math: true
mermaid: true
postFormat: "standard"
---

本篇为 **一站式综合验收与全景压测示范文章（All-in-one Master Showcase）**，用于快速自动化测试正文栏的所有格式与特异功能。

---

## 1. 告示框（Callouts）

> [!TIP]
> **技巧**：使用快捷键 <kbd>Ctrl</kbd> + <kbd>K</kbd> 唤起搜索。

> [!WARNING]
> **警告**：请妥善保管私钥。

---

## 2. 下拉框与手风琴（Dropdowns & Accordions）

<div class="article-dropdown-switcher">
<div class="article-dropdown-switcher__header">
<div class="article-dropdown-switcher__title">
<span>选择框架：</span>
</div>
<select class="article-select dropdown-switcher__select">
<option value="react-tab">⚛️ React 19</option>
<option value="vue-tab">🟢 Vue 3.5</option>
</select>
</div>
<div class="article-dropdown-switcher__body">
<div class="article-dropdown-panel is-active" data-panel="react-tab">
<p>React 19 组件代码已加载。</p>
</div>
<div class="article-dropdown-panel" data-panel="vue-tab">
<p>Vue 3.5 单文件组件代码已加载。</p>
</div>
</div>
</div>

<details class="article-accordion" open>
  <summary>
    <span>💡 点击展开：性能优化说明</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Astro 采用 Islands 架构，默认交付 0KB JS。</p>
  </div>
</details>

---

## 3. 数学公式与 Mermaid 图表（Math & Mermaid）

行内公式：$E = mc^2$，高斯积分：$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$。

块级麦克斯韦方程：

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}, \quad \nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
$$

```mermaid
graph LR
    A[Markdown 源码] --> B[Astro 构建编译器]
    B --> C[纯静态 HTML 交付]
```

---

## 4. 安全密码解密与高斯模糊

<div class="article-encrypted-box" data-password="shijianus2026" data-hint="💡 验证提示：演示密钥请直接输入 shijianus2026">
  <div class="encrypted-box__lock">
    <div class="encrypted-box__icon">🔒</div>
    <div class="encrypted-box__title">受保护加密资产</div>
    <div class="encrypted-box__desc">请输入授权密码后解锁。</div>
    <button class="encrypted-box__btn" type="button">点击输入密码解锁</button>
  </div>
  <div class="encrypted-box__content">
    <div class="admonition admonition-success">
      <div class="admonition-title"><span>🎉 解密成功</span></div>
      <div class="admonition-content">
        <p>私有令牌：<code>shijian_sec_9988_a1b2c3d4e5f6</code></p>
      </div>
    </div>
  </div>
</div>

- 高斯模糊文字：<span class="blur-text">悬浮即可看清剧透内容！</span>
- 黑幕马赛克：<span class="mosaic-text">机密数据：SHA256-7f83b1657ff1fc53</span>
- Discord 剧透：||双竖线剧透遮罩||
- 内联锁：%%百分号隐藏内容%%

---

## 5. Post Formats（便签、状态、音频与画廊）

<div class="article-aside">
  <p><strong>💡 随笔</strong>：保持专注，持续交付纯粹价值。</p>
</div>

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="唱片封面" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">星河漫步</div>
    <div class="audio-card__author">shijianus · 原创专注白噪音</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>
