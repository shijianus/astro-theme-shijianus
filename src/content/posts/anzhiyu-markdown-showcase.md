---
title: "安知鱼式 Markdown 能力总检：目录、格式、隐藏内容、媒体与内容块"
pubDate: 2026-04-25
updatedDate: 2026-04-25
description: "一篇专门用于压测文章扫描、目录层级、GFM、隐藏内容、特殊格式、媒体展示与常见内容块的长示例文章。"
author: "shijianus"
category: "前端工程"
group: "Markdown 示例"
cover: "/media/shijianus/workbench.jpg"
coverAlt: "markdown showcase desk"
featured: true
sticky: 4
tags: ["Astro", "Markdown", "主题重构", "UI", "Study"]
---

# 这是一篇专门用来验收主题能力的长文章

这篇文章不是普通随笔，而是用来集中验证当前文章页是否已经真正接近安知鱼主题阅读体验的一次总检。它会同时覆盖 **文章头图扫描**、**分类与标签识别**、**目录层级映射**、**代码块增强**、**GFM 表格与任务列表**、**隐藏内容**、**特殊字体与格式**、**媒体展示**、**内容块组合** 与 **长段落滚动表现**。

如果这些能力能够在同一篇文章里稳定出现，而且目录、分享、评论、侧栏、打赏与整体阅读路径都没有散架，那么这套主题才算真的进入可交付阶段。

## 基础格式扫描

先用一段基础文本确认最常见的 Markdown 语义已经稳定可读：

- 这里有 **加粗文本**，用来确认正文强调不会过亮也不会糊掉。
- 这里有 *斜体文本*，用来确认正文节奏不被打断。
- 这里有 ~~删除线~~，用于检查 GFM 扩展是否已经生效。
- 这里有 `inline code`，用于确认行内代码块边距、圆角和字号。
- 这里有 [外部链接到 Astro](https://astro.build/)，用于确认链接色和 hover 反馈。

这一段还会刻意混入中文、英文、数字与符号，例如 `Astro 6 + React 19 + Tailwind 4`，以便确认字距和换行在真实长文里不会显得拥挤。

### 特殊格式与特殊字体

下面这些项目不是普通博客每天都会写到的内容，但它们非常适合拿来测试文章系统是否具备足够完整的表达能力：

- `<mark>高亮文本</mark>` 用来测试重点标记。
- `<kbd>Ctrl</kbd> + <kbd>K</kbd>` 用来测试快捷键表现。
- `<ruby>目录<rt>mulu</rt></ruby>` 用来测试注音排版。
- `<abbr title="Application Programming Interface">API</abbr>` 用来测试缩略词解释。
- 行内上标示例：E = mc<sup>2</sup>。
- 行内下标示例：H<sub>2</sub>O 与 log<sub>n</sub>。

还可以直接插入一段带有不同字体的原生 HTML：

<p>
  <span style="font-family: 'Times New Roman', serif; font-size: 1.08em; letter-spacing: 0.04em;">This sentence uses a serif rhythm.</span>
  <br />
  <span style="font-family: 'Courier New', monospace; font-size: 0.96em;">const typographyMode = "editorial + geek";</span>
</p>

<div class="article-note-card article-note-card--accent">
  <strong>特殊格式组合压测</strong>
  <p>这一块同时覆盖 <mark>高亮标记</mark>、<kbd>键位</kbd>、`inline code`、不同字重与原生 HTML，目的是确认正文增强不是只在单一内容形态下成立。</p>
</div>

### 隐藏内容与剧透

当前主题已经支持几种前端增强型的内联内容：

- 剧透遮罩：||这是一段会在点击后显示的剧透文本，用来确认按钮化遮罩已经正确扫描。||
- 直接点击显示：%%这里是一段隐藏提示，点击后会展开。%%

这一层现在只保留前端可见性增强，不再提供“前端密码隐藏”这种容易被误认为安全能力的写法。真正需要密码访问时，应使用文章 frontmatter 里的服务端访问控制。

如果这一段的两个交互都正常，说明正文增强脚本已经与 Markdown 渲染保持一致，没有把普通文本节点误伤到 `code`、`pre` 或其他受保护元素。

## 目录层级压测

这一节专门用于验证目录的层级压缩方案是不是已经同时满足了两个目标：

1. 层级关系必须准确，不能把 H4 伪装成 H2。
2. 缩进不能过大，否则目录会因为留白太多而失去实际可点击性。

### 第一层分组：信息结构

当目录真正贴近文章结构时，读者并不需要逐字阅读标题，也能大致判断这一段内容是总论、子论点，还是补充项。目录的任务不是“把所有标题抄一遍”，而是帮助读者建立文章地图。

#### 第二层分组：层级线索

如果目录完全没有缩进，那么所有标题就会挤在同一条水平线上，读者很难一眼分辨哪个标题属于哪个部分。反过来，如果每一层都用过大的缩进，目录又会迅速失去点击效率。

#### 第二层分组：跳转效率

真正可用的方案，通常不是继续扩大缩进，而是在小缩进基础上增加路径高亮、活动分支标记、激活项背景与编号提示，让层级关系和操作效率同时成立。

### 第一层分组：阅读路径

这一段用来测试另一种常见场景：读者先从上往下扫目录，然后停在某个 H3，最后直接点击跳转到正文中部。

#### 第二层分组：当前定位

当前定位区域如果能稳定显示活动标题、当前层级与总序号，就能显著提升长文阅读时的方向感。

#### 第二层分组：目录滚动

当活动标题切换时，目录列表自身也应该保持跟随，但不能在用户手动滚动目录时强行抢回焦点。

### 第一层分组：极端长文

如果文章足够长，目录仍然需要保持固定可用，而不是因为卡片高度策略错误直接失去 sticky 行为。

#### 第二层分组：H4 密度测试

这一段后面会继续补一批 H4，目的是让目录出现更明显的深层节点，进一步观察压缩缩进是否仍然可读。

##### 第三层补充：H5 路径压缩

这一层用来确认目录在继续深入时，不会因为层级增加就把可点击区域压缩得过窄。也就是说，**层级变深，不代表交互面积可以变小**。

###### 第四层末级：H6 锚点试验

如果你在右侧目录里仍然能看清这一级的位置，而且点击后锚点跳转准确、当前路径高亮稳定，那么更深一级的标题扫描就已经补齐了。

#### 第二层分组：额外节点 A

这里是额外节点 A，用于制造更长的目录列表。

#### 第二层分组：额外节点 B

这里是额外节点 B，用于制造更长的目录列表。

#### 第二层分组：额外节点 C

这里是额外节点 C，用于制造更长的目录列表。

## 列表、任务和表格

下面这组内容主要验证 GFM 扩展是否已经完整接入。

### 无序列表与有序列表

- 首页结构优先。
- 文章页目录优先。
- 评论区应该保持直观。

1. 先看目录是否可靠。
2. 再看分享与打赏是否顺手。
3. 最后看评论区是否真的可发布。

### 任务列表

- [x] 头图与元信息扫描
- [x] 标签与分类聚合
- [x] 目录层级修正
- [x] 打赏与分享结构整改
- [ ] 接入真实远端评论数据
- [ ] 补足更多安知鱼式内容标签

### 表格

| 模块 | 当前目标 | 验收标准 |
| --- | --- | --- |
| 首页分类卡 | 对齐安知鱼动效 | 图标角度、放大策略和 hover 节奏一致 |
| TOC | 层级准确且不失可点性 | H2/H3/H4 可辨识，活动路径明确 |
| 打赏弹层 | 只展示有效信息 | 区域选择 + 二维码，且自动避让视口 |
| 分享工具 | 真正对应不同平台 | 不只是复制链接，而是生成对应分享内容 |
| 评论区 | 可直接发布 | 纵向排布、固定高度、滚动浏览公开评论 |

## 引用、折叠块和长代码

> 一个成熟的博客主题，不应该只在截图里看起来像样，而应该在真实长文里持续稳定地工作。

这段引用主要测试 blockquote 的层级感和正文节奏是否合适。

<details>
  <summary>点击展开折叠块，检查 summary/details 是否已经有可读样式</summary>
  <p>折叠块非常适合放二级说明、补充材料和临时附注。这里故意放成原生 HTML，而不是主题私有标签，目的是保持 Markdown 内容本身的可迁移性。</p>
  <p>如果你以后把文章系统从本地 Markdown 切到 API 或 CMS，这类标准 HTML 结构会比主题私有短代码更稳。</p>
</details>

### TypeScript 代码块

```ts
type TocNode = {
  id: string;
  depth: 2 | 3 | 4;
  title: string;
  children: TocNode[];
};

export function compressTocIndent(nodes: TocNode[], offset = 0): TocNode[] {
  return nodes.map((node) => ({
    ...node,
    children: compressTocIndent(node.children, offset + 1),
  }));
}

const sharePayload = {
  title: "安知鱼式主题对齐",
  summary: "把目录、分享、评论与打赏的真实使用路径一起补齐。",
  platforms: ["wechat", "weibo", "x", "telegram", "email"],
};
```

### Bash 代码块

```bash
npm install
npm run build
npm run preview -- --host 0.0.0.0
```

### CSS 代码块

```css
#card-toc .toc-item {
  padding-left: calc(var(--toc-level, 0) * 12px);
}

#card-toc .toc-item.is-active-branch > .toc-link {
  background: color-mix(in srgb, var(--theme-main) 10%, var(--card-bg));
}

.post-share-grid__surface {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

## 图片、分割线与脚注

下面这张图片主要用来确认正文图片在长文中不会超出文章宽度，并且与上下文保持稳定的留白关系。

![工作台与写作环境](/media/shijianus/workbench.jpg)

---

脚注也是长文很常见的结构，现在用它来测试 GFM 脚注能力是否已经生效。[^toc]

[^toc]: 这里的脚注文本会被放到文章底部，用来验证脚注编号、跳转和正文间距。

## 媒体与嵌入补充

如果要把这篇文章当成主题总检，还需要把正文里的媒体块一起压一遍：

<figure>
  <video src="/media/shijianus/avatar-dynamic.mp4" poster="/media/shijianus/default-cover.jpg" muted loop playsinline controls></video>
  <figcaption>本地视频 + poster，用来确认正文媒体在不同宽度下仍然稳定收束。</figcaption>
</figure>

<figure>
  <img src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80" alt="远程图床示例" />
  <figcaption>远程图床图片，用来确认跨域资源与正文留白不会互相打架。</figcaption>
</figure>

如果远程资源失效，正文增强脚本会把它们回退到默认占位图，而不是留下破损空框。

## 常见内容块等价演示

这一节不再只测基础 Markdown，而是补齐一些日常博客主题里最常见、也最容易在迁移时丢失的内容块。这里使用原生 HTML 和当前主题样式做等价演示，重点验证排版、间距和响应式，而不是绑定某个旧主题的私有语法。

<div class="article-demo-stack">
  <div class="article-demo-tabs">
    <div class="article-demo-tabs__nav">
      <span>标签面板</span>
      <span>步骤说明</span>
      <span>适配结论</span>
    </div>
    <div class="article-demo-tabs__panel">
      这一组模拟常见的 tabs / btns 内容区，验证按钮化信息块在正文里是否仍有足够层次，同时不会把正文节奏打断。
    </div>
  </div>

  <div class="article-demo-timeline">
    <div class="article-demo-timeline__item">
      <strong>阶段一：结构对齐</strong>
      <span>先把文章页、首页、目录与固定侧栏的骨架拉齐，确保读者不会在评论区或页脚前失去导航。</span>
    </div>
    <div class="article-demo-timeline__item">
      <strong>阶段二：交互收口</strong>
      <span>清理重复按钮，把分享、语言、账号和设置分别放到更明确的位置，避免互相抢空间。</span>
    </div>
    <div class="article-demo-timeline__item">
      <strong>阶段三：内容回填</strong>
      <span>补媒体、隐藏内容、二维码、站点卡片与长文压测，保证真正写长文时不会散架。</span>
    </div>
  </div>

  <div class="article-demo-gallery">
    <img src="/media/shijianus/workbench.jpg" alt="工作台画面" />
    <img src="/media/shijianus/hero.jpg" alt="首页头图区块" />
    <img src="/media/shijianus/tg-group.jpg" alt="二维码与长图测试" />
  </div>

  <div class="article-demo-links">
    <div class="article-demo-link-card">
      <strong>站点卡片</strong>
      <span>等价于常见的 site-card / link-card，验证卡片化链接在正文里是否仍能保持足够点击面积。</span>
    </div>
    <div class="article-demo-link-card">
      <strong>媒体卡片</strong>
      <span>配合图床、二维码和视频封面测试，确认不同尺寸内容不会把正文宽度和留白节奏打乱。</span>
    </div>
  </div>
</div>

## 长段落滚动压测

真正的问题通常不会出现在一篇很短的演示文里，而会出现在一篇足够长、包含多种模块、又带目录与悬浮工具的文章里。因此这里故意补两段更长的正文，来测试滚动时文章头图后的内容衔接、正文呼吸感、侧栏 sticky、目录活动项、打赏区与评论区之间的阅读落差是否仍然稳定。

一个稳定的文章页，不应该要求用户理解组件结构、技术栈或交互动机。用户真正感受到的只有三件事：第一，我能不能快速找到我想看的段落；第二，当我准备分享、打赏或评论时，这些入口是不是在我需要的时候刚好出现，而不是大面积打断正文；第三，当文章已经很长、目录节点很多、评论也在继续增长时，这个页面还能不能维持秩序。只要这三件事成立，主题就已经从“看起来像一个主题”变成“真正可以长期使用的内容系统”。

最后再补一段更偏作者视角的总结：对齐安知鱼主题并不意味着把每一行模板照搬过来，而是把它那些已经被长期使用验证过的设计判断重新理解一遍，然后在 Astro 体系里用更适合当前工程结构的方式复现出来。真正值得复刻的不是旧技术栈，而是它对信息优先级、交互反馈、阅读路径和模块秩序的判断力。如果这些判断已经在这篇文章里被完整验证，那么这次对齐工作才算真正进入了可以交付的阶段。
