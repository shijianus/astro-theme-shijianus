---
title: "EpoCanvas 友邻生态公约与系统状态指南"
description: "详尽说明 EpoCanvas 站点定位与运行状态、去中心化友邻朋友圈机制、本站互链标准配置信息（YAML/JSON/HTML/MD）与交换公约，并内嵌 Google 手册风格的交互式申请表单。"
pubDate: 2026-10-18
updatedDate: 2026-11-11
author: "EpoCanvas 架构团队"
category: "生态规范"
group: "EpoCanvas Standards"
tags: ["EpoCanvas", "友邻公约", "互链配置", "系统状态", "去中心化联盟", "交互表单"]
toc: true
math: false
mermaid: false
mindmap: false
draft: false
lang: "zh-Hant"
i18nKey: "ees-status-topology"
version: "v2.0.1"
---

# EpoCanvas 友邻生态公约与系统状态指南

<div class="article-aside">
  <p><span class="badge badge-primary">EES-005</span> <span class="badge badge-success">友邻生态</span> <span class="badge badge-warning">去中心化联盟</span></p>
  <p>本指南是 EpoCanvas 友邻（友人帐）的完整官方说明文件。涵括本站架构与运行边界、去中心化朋友圈雷达运行逻辑、本站互链元信息标准配置代码，以及符合 Google 手册规范的嵌入式交互申请表单。</p>
</div>

> [!IMPORTANT]
> **海内存知己，天涯若比邻**。在算法壁垒、信息茧房和封闭社交平台日益严重的当下，我们致力于建立属于独立博客的去中心化连接。这里收录持续写作、用心构建的同行者，欢迎每一位保持真诚表达的数字漫游者。

---

## 1. 本站点定位与运行状态

### 1.1 站点定位与架构体系
**EpoCanvas（時代画布）** 是一个面向现代独立构建者的数字创作工坊、深度技术思考与无干扰阅读空间。我们在高信息密度与纯净排版之间寻求最佳平衡，将研究、系统重构和生活折叠成可读的记录。

- **前端架构**：基于 Astro 7 最新编译管线驱动，兼顾极速静态预渲染（SSG）与按需边缘渲染；
- **边缘算力**：依托 Cloudflare Pages 与 Anycast 全球边缘节点，实现近零冷启动与毫秒级首屏加载；
- **持久化数据**：采用 Cloudflare D1 Serverless SQLite 边缘分布式数据库，承载真实的读者互动、评论树与表单回报；
- **安全与隐私**：全站强制 HTTPS 与 DNSSEC，零第三方商业跟踪 Cookie，捍卫现代网络读者的隐私尊严。

### 1.2 服务边界与运行状态一览

| 核心组件 | 运行环境 / 承载形态 | 可验证能力 | 状态标记 |
| :--- | :--- | :--- | :--- |
| **静态博客管线** | Cloudflare Pages CDN | 全球 Anycast 分发，毫秒级响应，PWA 本地离线缓存支持 | `LIVE-VERIFIED` |
| **边缘 API 服务** | Cloudflare Workers / Functions | 原生评论流、赞赏收银台、会话鉴权、表单处理引擎 | `SOURCE-VERIFIED` |
| **数据持久化 (D1)** | Cloudflare D1 SQLite | 边缘分布式持久化，评论树、动态说说、表单提交记录库 | `SOURCE-VERIFIED` |
| **实时通知中枢** | Telegram Bot API | 异步 Webhook，新评论、赞赏到账、互链申请实时秒级直达站长手机 | `LIVE-VERIFIED` |
| **动态雷达** | RSS / Atom & JSON Feed | 去中心化朋友圈自动巡检，聚合博友最新灵感与动态 | `SOURCE-VERIFIED` |

---

## 2. 友邻系统是如何运行的

EpoCanvas 的友邻系统不仅仅是一份静态的超链接清单，而是一个鲜活、联动的**去中心化博友网络**：

### 2.1 去中心化朋友圈雷达 (Moments Radar)
在传统的友链页面中，链接往往沉睡在列表底部；而在 EpoCanvas，友邻通过 [朋友圈 (动态雷达)](/moments/) 真正联动起来：
- **自动同步**：系统定期抓取已收录友邻的 RSS / Atom 订阅源或主题原生 JSON 端点；
- **统一呈现**：博友发布的最新技术探索、设计感悟或生活随想，会自动聚合于朋友圈瀑布流中；
- **去算法化**：严格按照时间流自然展开，没有信息流推荐算法的干预，保持最纯粹的阅读秩序。

### 2.2 友链巡检哨兵 (Status Sentinel)
为了保障访客的浏览体验，系统内置了友链可用性巡检机制：
- `🟢 全绿在线`：站点响应正常，SSL 证书有效，网络可达；
- `🟡 检测巡检`：探测到短暂网络抖动或正在进行周期性心跳探测；
- **容灾与包容原则**：若博友站点遇到暂时维护或服务器迁移，系统会标记状态并持续观测，绝不会轻易下架或删除博友卡片。

---

## 3. 本站互链配置信息与标准规范

若您希望与本站建立友邻互链，请先将本站信息添加至贵站的友情链接中。本站的标准元信息如下：

### 3.1 核心元信息
- **博客名称**：`EpoCanvas (shijianus)`
- **博客网址**：`https://blog.epocanvas.com`
- **头像图标**：`https://blog.epocanvas.com/media/shijianus/avatar.jpg`
- **博客简介**：`把研究、开发和生活折叠成可读的记录。在高信息密度里保留阅读秩序。`
- **展示封面**：`https://blog.epocanvas.com/media/shijianus/geek-cover.jpg`
- **RSS 订阅**：`https://blog.epocanvas.com/rss.xml`
- **意向分类**：`核心友邻 · 技术先锋` 或 `品牌矩阵 · 原生生态`

### 3.2 多格式配置代码（支持一键复制）

#### YAML 格式 (适用于 Hexo / Hugo / Jekyll 等友链配置)
```yaml
- name: EpoCanvas (shijianus)
  link: https://blog.epocanvas.com
  avatar: https://blog.epocanvas.com/media/shijianus/avatar.jpg
  descr: 把研究、开发和生活折叠成可读的记录。在高信息密度里保留阅读秩序。
  siteshot: https://blog.epocanvas.com/media/shijianus/geek-cover.jpg
```

#### JSON 格式 (适用于现代前端主题或 API 导入)
```json
{
  "name": "EpoCanvas (shijianus)",
  "url": "https://blog.epocanvas.com",
  "avatar": "https://blog.epocanvas.com/media/shijianus/avatar.jpg",
  "desc": "把研究、开发和生活折叠成可读的记录。在高信息密度里保留阅读秩序。",
  "cover": "https://blog.epocanvas.com/media/shijianus/geek-cover.jpg",
  "feed": "https://blog.epocanvas.com/rss.xml"
}
```

#### HTML 格式
```html
<a href="https://blog.epocanvas.com" target="_blank" rel="noopener" title="EpoCanvas (shijianus) - 把研究、开发和生活折叠成可读的记录。">
  <img src="https://blog.epocanvas.com/media/shijianus/avatar.jpg" alt="EpoCanvas" width="48" height="48" style="border-radius:50%;" />
  <span>EpoCanvas (shijianus)</span>
</a>
```

#### Markdown 格式
```markdown
[EpoCanvas (shijianus)](https://blog.epocanvas.com) - 把研究、开发和生活折叠成可读的记录。在高信息密度里保留阅读秩序。
```

### 3.3 互链交换公约 (Guild Rules)
为了营造健康、有养分且持久的博友圈子，我们设定了以下基本公约：

1. **原创优先**：博客拥有独立思考与持续产出的原创内容，杜绝纯 SEO 采集站、AI 批量垃圾农场或营销号；
2. **稳定可达**：全站支持安全 HTTPS 访问，且近 3 个月内有正常的访问与更新记录；
3. **体验良善**：页面排版整洁有序，具备基本可读性，杜绝大面积浮动遮挡式广告或流氓弹窗；
4. **先友后链**：申请互链前请先将本站添加到您的博客中，提交申请后系统将自动化通知站长完成双向对等添加。

---

## 4. 嵌入式协同收集表：友邻互链登记与申报 (Office 收集表 · 支持 ()[] 外联)

> [!TIP]
> **Office 收集表 · Google 声明规范**：参考 Google Developer Manuals 与现代云端 Office 365 协同收集表实践，友邻互链登记采用真实的**数据收集表格 (Spreadsheet Table)** 架构呈现，而非传统的纵向卡片弹窗。
>
> 读者可直接在下方表格底部的“填表”录入行中，以 `[站点名称](https://链接)` 的 Markdown 原生外链格式提交申报。提交后数据将**就地追加至表格行中**、**持久化存入 Cloudflare D1 边缘数据库**，并通过 **Telegram Bot 即刻推送至站长手机**！

```sheet
id: friend-link-collection-sheet
type: sheet
title: EpoCanvas 友邻互链协同收集表 (Office 收集表)
badge: 📊 Office 风格协同收集表 · Google 声明规范
description: 遵循 Google 手册声明规范与 Office 协同收集表标准。支持在录入行通过 [站点名称](链接) 语法快速申报，提交后实时插入下方数据表格，并持久化记录至 Cloudflare D1 边缘数据库与 Telegram 审批中枢。
target: /api/friends/apply
initialRows:
  - no: "01"
    name: "[EpoMail](https://mail.epocanvas.com)"
    avatar: "/media/brands/epomail.svg"
    desc: "极简无干扰的端到端加密极客邮箱服务。"
    contact: "@shijianus"
    status: "🟢 官方生态"
  - no: "02"
    name: "[EpoCanvas](https://epocanvas.com)"
    avatar: "/media/brands/epocanvas.svg"
    desc: "時代画布：面向现代独立构建者的数字创作工坊与设计系统。"
    contact: "@shijianus"
    status: "🟢 官方生态"
  - no: "03"
    name: "[Sonic](https://sonic.epocanvas.com)"
    avatar: "/media/brands/sonic.svg"
    desc: "极客音频工作站：双耳节拍与 Lo-Fi 沉浸心流白噪音引擎。"
    contact: "@shijianus"
    status: "🟢 官方生态"
```

---

## 5. 协同收集表与文档嵌入规范：Google 手册风格声明与 Office 收集表扩展指南

传统技术博客与文档系统的痛点在于“单向传递”——读者只能阅读，无法反馈或回报结构化数据。EpoCanvas 正式引入了**原生协同收集表 (Office Collection Sheet) 与自定义表单引擎**。

### 5.1 协同收集表与普通文章/弹窗的区别
1. **真实表格 (Table / Spreadsheet) 呈现**：区别于普通表单仅在纵向堆叠输入框，收集表采用现代 Office 365 / Google Sheets 风格的网格表格渲染，每一条申请即为表格中的一行数据；
2. **深度支持 `()[]` 式 Markdown 外联语法**：表格输入行原生支持 `[博客名称](https://站点链接)` 语法，浏览器端实时编译并解析出名称与超链接，实现一目了然的可视化外链跳转；
3. **边缘数据持久化落盘**：收集表回报通过 `/api/friends/apply` 或 `/api/forms/submit` 写入 Cloudflare D1 边缘数据库表 `form_submissions`，管理员可随时登入数据库后台检视与导出；
4. **即时 Telegram 机器人审批**：即使在无后端数据库环境下，表单与收集表也深度集成了本地 Telegram Bot 机制，当访客提交互链或反馈后，机器人会在 1 秒内将带有格式化 HTML 的富文本通知推送到站长 Telegram，并标注太平洋时间 (PST) 与客户端归属地。

### 5.2 如何在 Markdown 中声明自定义收集表与表单
您只需在任何 `.md` 文章中使用 ````sheet ... ```` 或 ````form ... ```` 代码块即可：

````markdown
```sheet
id: custom-tech-radar-sheet
type: sheet
title: 开源技术雷达收录收集表
badge: 📊 Office 风格收集表 · Google 声明规范
description: 提交您推荐的开源技术专案，支持 [专案名称](Github链接) 外联语法。
target: /api/forms/submit
initialRows:
  - no: "01"
    name: "[Astro](https://astro.build)"
    avatar: "https://astro.build/favicon.svg"
    desc: "专注于内容驱动型网站的新一代前端 Web 框架。"
    contact: "@withastro"
    status: "🟢 核心基座"
```
````

该功能无需重复造轮子，无缝兼容标准 Markdown 语法，纯静态构建时平滑降级，启用 JS 时全量激活现代 Office 级实时协作收集体验。

---

*文档规范版本：v2.0.0 · 最后维护时间：2026-11-11*
