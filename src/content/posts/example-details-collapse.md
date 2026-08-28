---
title: "示例：折叠面板、手风琴与下拉框格式展示"
description: "全面展示原生 details、手风琴折叠组、嵌套折叠与特殊的下拉框选择器组件。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "collapse", "dropdown"]
category: "Examples"
series: "功能示例"
math: false
mermaid: false
---

本篇示例专用于验证与测试博客正文中的 **折叠面板（Details）、手风琴组（Accordions）以及特殊的下拉框（Dropdown Selectors）** 组件。

所有组件均优先基于浏览器原生语义或轻量 Islands 架构实现，确保交付零或极小客户端开销。

---

## 一、原生美化折叠（Single Details / Summary）

支持平滑箭头旋转动画与卡片边框流光。

<details class="article-accordion" open>
  <summary>
    <span>💡 为什么静态站点生成器能达到极高并发？</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>因为静态生成器在构建期已将所有 Markdown 与组件编译为纯 HTML/CSS 静态文件，CDN 节点直接响应请求而无需经过任何数据库查询或后端计算，理论并发上限取决于网络吞吐量。</p>
  </div>
</details>

```html
<details class="article-accordion" open>
  <summary>
    <span>💡 为什么静态站点生成器能达到极高并发？</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>因为静态生成器在构建期已将所有 Markdown 与组件编译为纯 HTML/CSS 静态文件...</p>
  </div>
</details>
```

---

## 二、互斥手风琴折叠组（Single-Open Accordion Group）

展开其中任意一项时，同组内的其他展开项将自动平滑关闭：

<div class="article-accordion-group" data-single="true">
  <details class="article-accordion" open>
    <summary>
      <span>🔒 1. 物理层面的高安全性</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>没有公网数据库连接串与动态后端进程，完全免疫 SQL 注入与服务端命令注入攻击。</p>
    </div>
  </details>

  <details class="article-accordion">
    <summary>
      <span>⚡ 2. 毫秒级全球 CDN 交付</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>静态文件分布在全球数百个 CDN 边缘节点，就近极速命中，TTFB 普遍小于 20ms。</p>
    </div>
  </details>

  <details class="article-accordion">
    <summary>
      <span>💰 3. 几乎为零的维护成本</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>配合 Cloudflare Pages 等托管平台，无需购买昂贵的服务器主机即可稳定运行。</p>
    </div>
  </details>
</div>

```html
<div class="article-accordion-group" data-single="true">
  <details class="article-accordion" open>
    <summary><span>🔒 1. 物理层面的高安全性</span>...</summary>
    <div class="accordion-content">...</div>
  </details>
  <details class="article-accordion">
    <summary><span>⚡ 2. 毫秒级全球 CDN 交付</span>...</summary>
    <div class="accordion-content">...</div>
  </details>
</div>
```

---

## 三、特殊的下拉框格式（Dropdown Selectors & Interactive Calc）

### 1. 原生美化下拉选择框（Custom Styled Select）

<div class="article-select-box">
  <label>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    <span>选择运行时架构：</span>
  </label>
  <select class="article-select">
    <option value="static">🚀 纯静态交付 (SSG - 推荐)</option>
    <option value="ssr">⚙️ 混合服务端渲染 (SSR)</option>
    <option value="edge">🌐 边缘计算流式渲染 (Edge)</option>
  </select>
</div>

```html
<div class="article-select-box">
  <label><span>选择运行时架构：</span></label>
  <select class="article-select">
    <option value="static">🚀 纯静态交付 (SSG - 推荐)</option>
    <option value="ssr">⚙️ 混合服务端渲染 (SSR)</option>
    <option value="edge">🌐 边缘计算流式渲染 (Edge)</option>
  </select>
</div>
```

### 2. 交互式下拉规格计算器（Interactive Calc Dropdown）

选择不同选项时，右侧实时计算并显示对应的网络与硬件规格：

<div class="interactive-calc-select">
  <div class="article-select-box">
    <label>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      <span>选择视频输出规格：</span>
    </label>
    <select class="article-select">
      <option value="1080p" data-desc="1920 × 1080 @ 60fps · 码率 6,000 Kbps · 推荐带宽 15 Mbps">1080P 全高清 (1080p60)</option>
      <option value="2k" data-desc="2560 × 1440 @ 60fps · 码率 12,000 Kbps · 推荐带宽 30 Mbps">2K 极清 (1440p60)</option>
      <option value="4k" data-desc="3840 × 2160 @ 60fps · 码率 25,000 Kbps · 推荐带宽 60 Mbps">4K 超高清 (2160p60 HDR)</option>
    </select>
  </div>
  <div class="calc-output-box">
    <span>📊 <strong>推算指标</strong>：</span>
    <span class="calc-output-value">1920 × 1080 @ 60fps · 码率 6,000 Kbps · 推荐带宽 15 Mbps</span>
  </div>
</div>

```html
<div class="interactive-calc-select">
  <div class="article-select-box">
    <label><span>选择视频输出规格：</span></label>
    <select class="article-select">
      <option value="1080p" data-desc="1920 × 1080 @ 60fps · 码率 6,000 Kbps · 推荐带宽 15 Mbps">1080P 全高清 (1080p60)</option>
      <option value="2k" data-desc="2560 × 1440 @ 60fps · 码率 12,000 Kbps · 推荐带宽 30 Mbps">2K 极清 (1440p60)</option>
      <option value="4k" data-desc="3840 × 2160 @ 60fps · 码率 25,000 Kbps · 推荐带宽 60 Mbps">4K 超高清 (2160p60 HDR)</option>
    </select>
  </div>
  <div class="calc-output-box">
    <span>📊 <strong>推算指标</strong>：</span>
    <span class="calc-output-value">1920 × 1080 @ 60fps · 码率 6,000 Kbps · 推荐带宽 15 Mbps</span>
  </div>
</div>
```
