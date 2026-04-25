---
title: "Markdown 扫描与展示能力全量示例"
pubDate: 2026-04-25
description: "用一篇长文把 shijianus 当前的 Markdown 扫描、目录层级、隐藏内容、GFM 表格、脚注、代码块和特殊格式一次性跑全。"
author: "shijianus"
category: "系统设计"
group: "Markdown Showcase"
cover: "/media/shijianus/system.jpg"
coverAlt: "markdown showcase board"
tags: ["Markdown", "Astro", "Config", "UI", "主题重构"]
featured: true
sticky: 4
---

这篇文章专门用来验证主题中的内容扫描、目录同步、样式增强与可读性策略。它不是一篇“概念说明”，而是一篇 **真正可以拿来烟测前端主题** 的内容样本。

在当前版本里，我希望用一篇文章同时覆盖：

- **标题层级扫描**
- **代码块与行内代码**
- **表格、任务列表与脚注**
- **特殊格式，如 <mark>标记</mark>、<kbd>Ctrl</kbd> + <kbd>K</kbd>、<ruby>安知鱼<rt>AnZhiYu</rt></ruby>**
- **隐藏内容与轻量交互**
- **引用、列表、分隔区、详情折叠和提示卡**

> 如果一个主题只在“普通段落 + 普通标题”里看起来正常，它就还不能算真正完成。

## 扫描目标

主题对一篇文章的扫描，不应该只停在 `title` 和 `description`。至少还要同时关心：

1. 文章的 **实际层级结构**，因为这会直接影响右侧目录。
2. 正文中的 **强调与节奏**，因为一整屏纯文本无法高效浏览。
3. 代码、列表、表格和引用的 **语义化展示**，因为技术博客不只会输出段落。
4. 文章是否包含 **隐藏、提示、补充说明** 等特殊内容块，因为它们会影响阅读路径。

### 为什么 TOC 不能只做“缩进”

一个常见错误，是把目录层级只理解成 `padding-left`。这样看起来像有层次，但一旦层级变深：

- 留白会急剧变大
- 可点击区域被压缩
- 激活项不容易判断
- 用户滚动时不知道自己处在哪一层

所以这一版 TOC 处理的目标是：**层级要真实，缩进要克制，激活路径要明显**。

#### 两全其美的方案

现在的方案不是把三级、四级标题全部大幅右移，而是同时使用：

- 小步进缩进
- 当前项高亮
- 父路径弱高亮
- 纵向引导线
- 当前标题元信息

这样能兼顾“知道自己在第几层”和“目录依然可点、可扫、可滚动”。

## 行内格式

正文里最常见的一层增强，是**行内信息**的可视化。比如：

- 变量名可以写成 `themeContract`
- 配置项可以写成 `siteConfig.post.comments`
- 状态词可以写成 <mark>in progress</mark>
- 快捷键可以写成 <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
- 缩写可以写成 <abbr title="Table of Contents">TOC</abbr> 与 <abbr title="Application Programming Interface">API</abbr>
- 特定词可以写成 <span class="article-inline-serif">serif emphasis</span> 或 <span class="article-inline-mono">mono emphasis</span>

有些内容甚至不应该一开始完全展开，例如：

- 这是一个 `普通提示`
- 这是一个 `带强调的词`
- 这是一个 `行内代码`
- 这是一个 `参数名`
- 这是一个 ||需要点击后才显示的 spoiler||
- 这是一个 %%password:shijianus|需要输入密码后才显示的隐藏内容%%

### 强调与节奏

当一段话里同时出现 **重点句**、`配置名`、<mark>状态词</mark> 与 <kbd>快捷键</kbd> 时，读者就能更快地把段落拆开理解，而不需要逐字阅读。

#### 特殊字符与上下标

例如：

- E = mc<sup>2</sup>
- H<sub>2</sub>O
- <ruby>前端<rt>frontend</rt></ruby>
- <ruby>重构<rt>rebuild</rt></ruby>

## 提示卡与折叠块

下面是一个自定义提示卡，它不依赖额外插件，只使用 Markdown 中允许的 HTML：

<div class="article-note-card">
  <strong>设计判断</strong>
  <p>如果一项样式或动效没有改善信息定位效率，它就不应该只因为“看起来炫”而被保留。</p>
</div>

再往下是一个折叠块：

<details class="article-detail-card">
  <summary>点击展开：这次 Markdown 样本到底在测什么</summary>
  <p>它在测标题扫描、右侧 TOC、GFM 表格、任务列表、脚注、隐藏内容、行内样式、代码块与区块型排版是否一起成立。</p>
  <p>如果其中任何一项渲染失真，说明主题的文章层还没有真正稳定。</p>
</details>

### 引用块

> “不是把主题做得花，而是把信息做得清楚。”
>
> 对技术博客来说，真正重要的是结构、秩序和反馈，而不是漂浮的装饰。

#### 二级引用与说明

> 目录之所以重要，不是因为它像文档，而是因为它能让长文变得可导航。

## 代码块

一篇技术文章至少要能同时容纳不同语言的代码块。

### TypeScript

```ts
type TocNode = {
  id: string;
  depth: 2 | 3 | 4;
  title: string;
  children: TocNode[];
};

function buildCompactToc(nodes: TocNode[]) {
  return nodes.map((node) => ({
    ...node,
    offset: Math.max(0, node.depth - 2) * 12,
    activePath: false,
  }));
}
```

### Bash

```bash
npm install
npm run build
npm run preview:host
```

### CSS

```css
#card-toc .toc-item.is-active > .toc-link {
  background: var(--theme-main);
  color: var(--white);
  box-shadow: inset 3px 0 0 rgba(255, 255, 255, 0.34);
}
```

#### 行内代码的使用原则

不要把整句都写成 `inline code`，只应该把真正的配置名、函数名或关键字收成代码态，例如 `navigator.share()`、`remark-gfm`、`scrollIntoView()`。

## GFM 表格

下面的表格用来验证表头、对齐、边框和移动端滚动：

| 模块 | 目标 | 当前策略 | 备注 |
| --- | --- | --- | --- |
| 首页分类卡 | 对齐安知鱼 hover | 用真实图标 + 压缩扩展动画 | 特别验证 `lime` |
| 目录 | 层级真实但不浪费空间 | 树形结构 + 轻缩进 + 激活路径 | 兼顾点击效率 |
| 评论区 | 可直接发布 | 只保留留言框与公开评论流 | 不暴露测试入口 |
| 分享区 | 对应真实社媒 | 每个平台单独构造分享参数 | 不只复制链接 |

### 任务列表

- [x] 覆盖普通段落与多级标题
- [x] 覆盖行内代码与代码块
- [x] 覆盖 spoiler 与 password hidden
- [x] 覆盖表格与任务列表
- [x] 覆盖折叠块、提示卡与引用
- [ ] 继续补齐更多安知鱼特有的内容块语法[^future]

#### 有序列表与无序列表混合

1. 先确定文章结构。
2. 再确定右侧目录的映射。
3. 然后决定每种内容块的视觉层次。

- 重点不是功能数量
- 而是展示是否有秩序
- 以及不同模块是否真的能共同工作

## 脚注

脚注本身也是内容扫描的一部分，因为它会影响文章尾部的排版与锚点行为。这里放两个例子：一个解释性脚注[^scan-note]，一个偏工程判断的脚注[^engineering-note]。

### 跨段补充

当正文里出现“顺带一提，但不想打断主线”的内容时，脚注通常比把整段都塞进括号里更有效。

#### 什么时候不该用脚注

如果那段信息对主线理解是必要的，就不应该藏到脚注里。脚注适合补充，不适合承载核心论点。

## 内容块的组合

下面这段内容故意把多种能力混在一起，确保主题不会“单项能渲染，组合就失真”。

<div class="article-note-card article-note-card--accent">
  <strong>组合测试</strong>
  <p>当前段落同时包含 <mark>高亮</mark>、<kbd>键位</kbd>、<ruby>术语<rt>term</rt></ruby>、`inline code` 与脚注引用[^combo]。</p>
</div>

如果一篇文章里既有：

- 说明性段落
- 分级标题
- 代码块
- 表格
- 引用
- 行内强调
- 隐藏内容
- 折叠补充

而主题仍然能维持阅读秩序，那么这一层内容系统才算真的稳定下来。

### 作为烟测文章怎么用

你可以直接拿这篇文章验证以下事项：

1. 右侧目录是否正确识别到 H2 / H3 / H4。
2. 当前激活项、父路径和滚动定位是否自然。
3. 代码块、表格与任务列表是否有统一视觉。
4. 隐藏内容是否可交互。
5. 分享、评论、侧栏和正文之间的垂直节奏是否协调。

#### 最后的结论

一个可发布的博客主题，不应该只在最简单的文章里看起来正常。它应该能经得住这种“故意把内容复杂度一次性拉满”的样本。

---

[^scan-note]: 这里的“扫描”既包括 frontmatter 字段扫描，也包括标题、摘要、正文层级与交互内容的渲染扫描。
[^engineering-note]: 如果目录只靠视觉缩进模拟层级，它迟早会在长文中暴露出定位和可点击区域的问题。
[^future]: 比如更完整的安知鱼标签语法、可复用提示块别名，以及更接近原主题的内容组件集。
[^combo]: 组合测试的目的，是防止主题只在单一内容类型下表现正常。
