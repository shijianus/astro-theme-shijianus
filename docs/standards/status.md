---
title: "shijianus 站点状态与友邻指南"
description: "了解本站的运行边界、朋友链接与订阅机制，以及互链申请、审核和信息处理规范。"
pubDate: 2026-10-18
updatedDate: 2026-11-18
author: "shijianus"
category: "站点规范"
group: "shijianus Standards"
tags: ["shijianus", "站点状态", "友邻指南", "互链配置", "运行边界", "隐私说明"]
toc: true
math: false
mermaid: false
mindmap: false
draft: false
lang: "zh-CN"
i18nKey: "ees-status-topology"
version: "v3.1.0"
---

<section class="google-lead-section" id="guide-overview" aria-labelledby="guide-overview-heading">
  <div data-status-slot="lead-hero"></div>
  <p class="google-lead-eyebrow">SHIJIANUS · 站点运行边界与友邻交换规范</p>
  <h2 id="guide-overview-heading" class="google-lead-title">了解本站的运行方式、友邻机制与信息边界</h2>
  <p class="google-lead-copy">
    当您阅读 <strong>shijianus</strong> 博客、订阅动态或申请交换友情链接时，您可以通过本指南了解当前已核验的系统边界与处理规范。文档严格区分<mark class="mark-blue">长期适用的静态规则</mark>与<mark class="mark-yellow">特定时间点的核验快照</mark>（最近核验：<time datetime="2026-11-16">2026-11-16</time>）。
  </p>
</section>

<div data-status-slot="overview-grid"></div>

<div data-status-slot="divider-about"></div>

<h2 id="about-shijianus">认识 shijianus</h2>

**shijianus** 是由独立开发者 **shijianus** 维护的个人技术博客与数字花园，专注于 Web 工程、系统设计、阅读体验与长期可维护的前端实践。无论读者通过哪个官方入口访问，博客品牌、写作内容与运维责任主体始终为 **shijianus**。

- **与关联生态的关系**：站内或 [友人帐](/friends/) 中收录的 **EpoCanvas**、**EpoMail**、**Sonic** 属于关联生态项目友邻，==并非本博客的发布主体==。
- **可验证技术基座**：由 `Astro 7.4.7`、`React 19.2.4` 与 `Tailwind CSS 4.2.2` 构建静态页面，动态接口依托 Cloudflare Pages Functions（`functions/api/*`）与 Cloudflare D1（`wrangler.jsonc`、`migrations/0001`–`0008`），安全响应头（`CSP` / `HSTS`）由 `functions/_middleware.ts` 与 `public/_headers` 注入。

### 多域名访问入口与索引说明

| 域名入口 | 当前角色与配置来源 | 状态与索引提示 |
| :--- | :--- | :--- |
| `https://blog.epocanvas.com` | 线上主访问域名（`friendsConfig.siteInfo.url`） | <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span> 2026-11-16 实测 HTTP/2 200，承载 `/status/` 与 `/shijianus-moments.json` |
| `https://shijianus.com` | 独立品牌访问入口 | <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span> 2026-11-16 实测 HTTP/2 200，内容与主访问入口一致 |
| `https://shijian.us` | 代码库默认 `siteOrigin`（`src/config/site.ts`） | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span> / <span class="ev-badge ev-badge--unknown">UNKNOWN</span> 默认 `canonical` 基准；探测环境请求超时，公网可达性待确认 |

<aside class="status-callout" role="note" aria-label="多域名规范提示">
  <p class="status-callout__title">关于多域名重复索引的风险提示</p>
  <p>由于 <code>blog.epocanvas.com</code> 与 <code>shijianus.com</code> 目前均直接返回 HTTP 200 而未统一跳转，布局层已补充 <code>&lt;link rel="canonical"&gt;</code> 与 OpenGraph URL（遵循构建变量 <code>SITE_URL</code> 或 <code>siteConfig.site.url</code>），后续建议在 Cloudflare 边缘配置唯一主域名跳转。</p>
</aside>

<div data-status-slot="divider-status"></div>

<h2 id="site-status">站点状态和运行边界</h2>

<aside class="status-callout status-callout--warn" role="note" aria-label="非实时监控声明">
  <p class="status-callout__title">本页提供的是最近核验的运行信息，并非实时监控面板</p>
  <p>下表状态仅反映核验时的源码逻辑或生产访问结果，==不构成持续可用性承诺（SLA），也不代表当前瞬间的实时健康度==。</p>
</aside>

本站采用四级证据标签标明事实依据：
<span class="ev-badge ev-badge--live">LIVE-VERIFIED</span> 生产实测响应 ·
<span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span> 源码确认 ·
<span class="ev-badge ev-badge--proposed">PROPOSED</span> 规划未上线 ·
<span class="ev-badge ev-badge--unknown">UNKNOWN</span> 证据不足。

| 服务与能力 | 当前已知能力与源码位置 | 状态 / 核验日期 | 已知限制与故障预期行为 |
| :--- | :--- | :--- | :--- |
| **静态网页与 CDN** | Astro 静态导出经 Cloudflare Pages 分发（`public/_headers`） | <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span><br><small>2026-11-16</small> | 依赖 Cloudflare 边缘节点；单域不可达时可切换备用入口 |
| **边缘动态 API** | 承载评论、赞赏、身份与表单接口（`functions/api/*`） | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span><br><small>2026-11-16</small> | 未部署 Functions 时返回 404/503；纯阅读内容仍可访问 |
| **评论与互动** | `functions/api/comments.ts` + D1 迁移，支持嵌套回复 | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span><br><small>2026-11-16</small> | 依赖 D1 `DB` 绑定；数据库不可用时发布与拉取将降级 |
| **D1 数据持久化** | SQLite 绑定 `DB`，表单存入 `form_submissions` | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span><br><small>2026-11-16</small> | 纯静态预览无远程 D1；<mark class="mark-red">D1 与通知均失败时返回 503</mark> |
| **主题动态清单** | `prebuild` 生成 `/shijianus-moments.json`（`shijianus-moments-v1`） | <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span><br><small>2026-11-16</small> | 实测 HTTP/2 200；随构建期刷新，非秒级实时流 |
| **RSS XML 订阅** | 仓库尚无 `src/pages/rss.xml.ts` | <span class="ev-badge ev-badge--proposed">PROPOSED</span><br><small>2026-11-16</small> | <mark class="mark-amber">2026-11-16 实测 /rss.xml 返回 HTTP 404</mark>，暂请使用 JSON 清单 |
| **友链自动巡检** | 尚无后台定时探活 Worker | <span class="ev-badge ev-badge--proposed">PROPOSED</span><br><small>2026-11-16</small> | `/friends/` 状态圆点目前由配置文件人工维护 |
| **互链申请通知** | `POST /api/friends/apply` 写入 D1 并调用 <a href="#glossary-webhook" class="doc-term" data-term="webhook">Telegram Bot</a> | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span><br><small>2026-11-16</small> | 严格拆分校验、入库与通知；失败绝不伪造成功 |

<details class="status-details">
  <summary>
    <span>展开查看 2026-11-16 实测核验明细与清退声明</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <ul>
      <li><code>https://blog.epocanvas.com/status/</code> 与 <code>https://shijianus.com/status/</code> 均实测 HTTP/2 200（含 <code>HSTS</code> 与 <code>CSP</code> 头）。</li>
      <li><code>https://blog.epocanvas.com/shijianus-moments.json</code> 与头像/封面图片均实测 HTTP/2 200；<code>/rss.xml</code> 实测 HTTP/2 404。</li>
      <li>已清理旧版文档中未实证的「近零冷启动」「毫秒级首屏」「1 秒内送达」「Office 实时协同」等宣传语。</li>
    </ul>
  </div>
</details>

<div data-status-slot="divider-friends"></div>

<h2 id="friends-system">友邻系统如何工作</h2>

本站友邻体系脱离中心化算法推荐，通过三段式静态配置与构建聚合链路运作：

<div data-status-slot="friends-pipeline"></div>

- **支持的订阅协议**：构建脚本 `scripts/sync-friends-moments.mjs` 优先读取同主题站点的 <a href="#glossary-moments-proto" class="doc-term" data-term="moments-proto">shijianus-moments-v1</a> 清单，未启用时通过 `src/lib/feed-parser.ts` 解析 <a href="#glossary-rss" class="doc-term" data-term="rss">RSS</a>、<a href="#glossary-atom" class="doc-term" data-term="atom">Atom</a> 或 <a href="#glossary-jsonfeed" class="doc-term" data-term="jsonfeed">JSON Feed</a>（单源 4–5 秒熔断），写入 `public/data/friends-moments.json`。
- **失联与观察期**：友邻因维护或证书续期短时离线时，站长核实后会保留观察期，==不会因短暂网络波动立即撤链==。

<div data-status-slot="divider-rules"></div>

<h2 id="exchange-rules">友邻交换与收录规则</h2>

<div data-status-slot="rules-matrix"></div>

- **更新与对等说明**：建议申请前先在贵站友链页加入 **shijianus**；优质开源文档或致谢站可酌情接受单向链接。
- **迁移与申诉渠道**：域名变更、信息更新或审核申诉请致信 `shijianus@epocanvas.com` / `contact@epocanvas.com`（附原网址与新信息），或查阅 [举报与申诉说明](/community/reporting-and-appeals/)。

<div data-status-slot="divider-card"></div>

<h2 id="official-friend-info">shijianus 官方友链信息</h2>

下方名片与多格式代码片段由同一份配置源 `src/config/friends.ts` 生成。鉴于实测 `/rss.xml` 尚未上线（404），配置内提供实测可用的 `/shijianus-moments.json`，不虚构无效 RSS 链接。

<div data-status-slot="official-friend-card"></div>

<div data-status-slot="divider-apply"></div>

<h2 id="apply-friend-link">互链申请（Microsoft Forms 外链问卷）</h2>

请务必明确：==提交互链请求仅代表「申请已受理」，绝不等于已被正式收录==。表单通过站点内置的 Markdown 扫描引擎（````msform````）渲染，采用 **Microsoft Forms** 卡片式问卷体验，并在外链题中原生支持 `[站点名称](https://...)` 安全链接语法实时解析：

```msform
id: friend-link-apply
type: microsoft-forms
title: shijianus 友邻互链申请表
badge: Microsoft Forms · Markdown 扫描问卷
description: 支持使用 [站点名称](https://example.com) Markdown 外链格式快速申报。提交后交由 POST /api/friends/apply 核验，并返回 D1 存档、Telegram 通知与人工审核四阶段真实回执。
target: /api/friends/apply
externalUrl: mailto:shijianus@epocanvas.com?subject=shijianus%20%E5%8F%8B%E9%82%BB%E4%BA%92%E9%93%BE%E7%94%B3%E8%AF%B7
externalLabel: 备用邮件外链通道
submitText: 提交申请
fields:
  - id: siteInput
    label: 站点外链与快速导入（支持 [站点名称](https://链接) 或直接输入 https:// 网址）
    type: external-link
    required: true
    maxLength: 590
    placeholder: "例如：[星海随笔](https://blog.example.org) 或 https://blog.example.org"
    hint: "输入合法的 https:// 或 http:// 外链后，下方将生成可点击的外链校验预览；若使用 [名称](网址) 格式，将自动同步至站点名称。"
  - id: name
    label: 站点展示名称
    type: text
    required: true
    maxLength: 80
    placeholder: "例如：星海随笔"
    hint: "将在友人帐卡片展示的博客标题，最多 80 字符。"
  - id: avatar
    label: 站点头像 / 品牌图标外链（Avatar URL）
    type: avatar
    required: true
    maxLength: 500
    placeholder: "https://blog.example.org/avatar.png"
    hint: "请提供允许跨站加载的 https:// 图片直链；加载失败时友人帐会自动回退至中性品牌图标。"
  - id: desc
    label: 一句话站点简介
    type: textarea
    required: true
    maxLength: 300
    placeholder: "用一两句话概括博客的主题方向、创作记录或长期关注的领域..."
    hint: "最多 300 字符。"
  - id: category
    label: 意向分类
    type: radio
    required: true
    options:
      - 核心友邻 · 独立博客
      - 生态矩阵 · 开源项目
      - 技术社区 · 优质资源
      - 设计美学 · 数字花园
  - id: contact
    label: 站长联系方式（选填）
    type: text
    required: false
    maxLength: 160
    placeholder: "邮箱或 Telegram 用户名，仅用于审核联络与通知"
    hint: "不会向公开友人帐访客暴露。"
```

<div data-status-slot="friend-apply-section"></div>

<div data-status-slot="divider-privacy"></div>

<h2 id="privacy-and-data">隐私与数据处理</h2>

依据 `functions/api/friends/apply.ts`、`functions/_lib/rate-limit.ts` 与 `functions/_lib/form-notify.ts` 源码，数据处理边界如下（全站通用账号与评论隐私参阅 [隐私与资料使用说明](/community/privacy-and-data/)）：

- **采集字段与网络元数据**：记录提交的站点名称、外链网址、头像 URL、简介、分类、选填联系方式及来源标识；限流器对请求 IP（`cf-connecting-ip` / `x-forwarded-for`）作加盐 SHA-256 摘要存入 `rate_limits`，原始 IP 与地区头（`cf-ipcountry`）随记录存入 `form_submissions.ip` 并发送至站长通知。
- **可见性与删除说明**：待审核记录及私人联系方式**绝不会**对外公开。源码当前==尚未实现自动化定时清理历史记录任务==，如需查询、更正或请求删除历史申请，请致信 `contact@epocanvas.com` 或 `shijianus@epocanvas.com`（注明「友邻数据请求」）。

<div data-status-slot="divider-faq"></div>

<h2 id="faq">常见问题</h2>

<details class="status-details">
  <summary>
    <span>1. 我的博客还没有 RSS 或 Atom 订阅源，可以申请友链吗？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>可以。<a href="/friends/">友人帐</a> 仅要求稳定可访问的原创网页，不强制 RSS；但缺少订阅源时，新文章暂无法聚合至 <a href="/moments/">朋友圈</a>。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>2. 一段时间没有更新博客会被撤除友链吗？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>不会仅因更新放缓而撤链。只要网站仍可正常访问、内容具有参考价值且未变成广告或劫持页面，本站会长期保留。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>3. 站点因服务器维护或证书续期短时离线怎么办？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>短时维护不会立即删链；若维护周期较长，欢迎来信说明，我们会在观察期间保留您的记录。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>4. 博客更换域名、名称或头像 URL 后如何更新？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>请邮件联系 <code>shijianus@epocanvas.com</code>，注明「原站点网址 + 更新后的名称/新网址/新头像直链」，站长核验后同步更新配置。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>5. 友邻卡片里的头像显示异常或加载失败怎么办？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>前端已内置安全回退图标（<code>/media/brands/default-brand.svg</code>）。若原图因防盗链或签名过期失效，请提供支持跨站访问的 <code>https://</code> 图片直链来信替换。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>6. 提交互链申请后，多久能收到处理结果？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>所有申请均为站长人工审核并手动合入配置，目前无固定 SLA（不承诺「24 小时必回」）。若您留下了可联系邮箱，审核后会直接邮件答复。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>7. 如何修改或撤回已经提交但尚未审核的申请？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>请发邮件至 <code>shijianus@epocanvas.com</code> 并附上站点名称、网址或页面返回的受理编号（<code>submissionId</code>）说明需求。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>8. 是否保证所有符合格式校验的申请都会通过？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>不保证。接口成功仅代表「已受理」，最终收录需经人工审核确认符合<a href="#exchange-rules">友邻交换与收录规则</a>。</p>
  </div>
</details>

<div data-status-slot="divider-glossary"></div>

<h2 id="glossary">术语表、版本与反馈</h2>

以下条目同时驱动正文虚线术语弹窗与无 JavaScript 环境下的页内锚点参考：

<dl class="status-glossary-list">
  <div class="status-glossary-item">
    <dt id="glossary-rss">RSS（Really Simple Syndication）</dt>
    <dd id="glossary-rss-def">基于 XML 的内容摘要分发标准。截至 2026-11-16，本站尚未上线 <code>/rss.xml</code>。</dd>
  </div>
  <div class="status-glossary-item">
    <dt id="glossary-atom">Atom 订阅协议</dt>
    <dd id="glossary-atom-def">标准化 XML 聚合格式（ISO 8601 时间戳），本站 <code>src/lib/feed-parser.ts</code> 兼容 RSS 2.0 与 Atom 1.0。</dd>
  </div>
  <div class="status-glossary-item">
    <dt id="glossary-jsonfeed">JSON Feed</dt>
    <dd id="glossary-jsonfeed-def">使用 JSON 描述站点更新流的现代订阅格式，便于前端与边缘函数直接解析。</dd>
  </div>
  <div class="status-glossary-item">
    <dt id="glossary-moments-proto">shijianus-moments-v1 清单协议</dt>
    <dd id="glossary-moments-proto-def">本主题朋友圈互联 JSON 格式（<code>/shijianus-moments.json</code>），用于同步说说摘要与跨站接口地址。</dd>
  </div>
  <div class="status-glossary-item">
    <dt id="glossary-edge-fn">边缘函数（Edge Functions）</dt>
    <dd id="glossary-edge-fn-def">运行于 CDN 边缘节点的无服务器逻辑（<code>functions/api/</code>），承载评论、限流与表单接口。</dd>
  </div>
  <div class="status-glossary-item">
    <dt id="glossary-d1">D1 持久化（Cloudflare D1）</dt>
    <dd id="glossary-d1-def">Cloudflare 无服务器 SQLite 数据库。本站仅在数据库真实返回写入成功时才报告 <code>persisted: true</code>。</dd>
  </div>
  <div class="status-glossary-item">
    <dt id="glossary-webhook">Webhook / Telegram 通知通道</dt>
    <dd id="glossary-webhook-def">事件触发后由服务器主动向站长 Telegram 推送摘要的通道，仅作提醒，不代表入库或审核结果。</dd>
  </div>
</dl>

<div data-status-slot="version-meta"></div>
