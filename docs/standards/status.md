---
title: "shijianus 站点状态与友邻指南"
description: "了解本站的运行边界、朋友链接与订阅机制，以及互链申请、审核和信息处理规范。"
pubDate: 2026-10-18
updatedDate: 2026-11-16
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
version: "v3.0.0"
---

<div class="status-intro-panel" id="guide-overview">
  <div class="status-intro-panel__meta">
    <span><strong>文档定位：</strong>运行状态边界 + 友邻交换与申请规范</span>
    <span><strong>适用读者：</strong>访问本站的读者、计划互链的独立博主</span>
    <span><strong>最近核验时间：</strong>2026-11-16</span>
  </div>
  <p style="margin:0;">
    本指南说明 <strong>shijianus</strong> 博客当前经过核验的系统能力、运行时边界、友邻展示与动态聚合机制，以及交换友情链接的条件、表单提交状态和个人信息处理方式。本页区分<strong>静态规则</strong>（长期有效的互链约定与隐私边界）与<strong>最近核验的运行快照</strong>（在特定时间点通过源码或生产访问证实的能力）。
  </p>
  <div class="status-intro-panel__actions">
    <a href="#site-status" class="status-btn status-btn--primary">了解站点状态</a>
    <a href="#official-friend-info" class="status-btn status-btn--secondary">交换友情链接</a>
  </div>
</div>

<h2 id="about-shijianus">认识 shijianus</h2>

**shijianus** 是一个由独立开发者 **shijianus** 维护的个人技术博客与数字花园，专注于 Web 工程、系统设计、阅读体验与长期可维护的前端实践。在主题配置与页面呈现中，站点主品牌始终为 **shijianus**。

### 博客与关联项目的关系

您可能在页脚或友邻目录中看到 **EpoCanvas**、**EpoMail** 或 **Sonic**。它们是与作者相关的独立生态或设计/工程项目，作为关联生态成员收录于友邻网络，**并非本博客的发布主体**。本博客的写作内容、评论系统、友邻审核与运维责任均由 **shijianus** 独立承担。

### 访问域名与索引一致性说明

本站目前在代码配置与线上部署中存在以下三个域名入口，其实际角色与核验情况如下：

| 域名入口 | 当前角色与配置来源 | 核验状态 | 说明与索引提示 |
| :--- | :--- | :--- | :--- |
| `https://blog.epocanvas.com` | 线上主访问域名（`friendsConfig.siteInfo.url` 与 Functions 默认源） | <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span> | 2026-11-16 实测返回 HTTP/2 200，承载 `/status/` 与 `/shijianus-moments.json` |
| `https://shijianus.com` | 独立品牌访问入口 | <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span> | 2026-11-16 实测返回 HTTP/2 200，内容与主访问入口一致 |
| `https://shijian.us` | 代码库默认 `siteOrigin`（`src/config/site.ts` 与 `astro.config.mjs`） | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span> / <span class="ev-badge ev-badge--unknown">UNKNOWN</span> | 源码以此生成默认 `canonical` 与部分绝对链接；2026-11-16 探测环境请求超时，线上可达性待进一步确认 |

> [!NOTE]
> **多域名重复索引风险提示**：由于 `blog.epocanvas.com` 与 `shijianus.com` 目前均直接返回 HTTP 200 而未统一跳转，且非文章页此前缺少统一的 `<link rel="canonical">` 声明，搜索引擎存在同时索引多域名的风险。本次重构已为布局补齐统一的 `canonical` 与 OpenGraph 元信息（默认遵循构建环境 `SITE_URL` 或 `siteConfig.site.url`），后续建议在 Cloudflare 边缘配置唯一主域名的 301 重定向并统一 `SITE_URL`。

### 可验证的技术架构概要

- **构建与渲染**：基于 `Astro 7.4.7`、`React 19.2.4` 与 `Tailwind CSS 4.2.2`（见仓库 `package.json`），当前构建脚本 `build:static` 以静态 HTML 导出为主，配合交互式前端组件。
- **边缘服务与存储**：部署于 Cloudflare Pages，动态接口位于 `functions/api/`（Cloudflare Pages Functions），数据库绑定为 Cloudflare D1（SQLite，见 `wrangler.jsonc` 与 `migrations/0001`–`0008`）。
- **安全响应头**：由 `functions/_middleware.ts` 与 `public/_headers` 统一注入 `CSP`、`HSTS`、`X-Content-Type-Options: nosniff`、`X-Frame-Options: SAMEORIGIN` 与 `Referrer-Policy`。

---

<h2 id="site-status">站点状态和运行边界</h2>

> [!IMPORTANT]
> **本页提供的是最近核验的运行信息，并非实时监控面板。**
> 下表中的状态标签仅代表特定核验时间点的源码或生产环境观测结果，不构成持续可用性承诺（SLA），也不代表您当前访问瞬间的实时健康度。

为避免把「代码里写了逻辑」误当成「线上必然可用」，本站采用五级证据分类标记：

- <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span>：已在特定时间对生产域名发起真实访问并取得响应证据；
- <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span>：已在仓库源码中确认实现路径与数据结构，但本轮未在生产环境执行写入探测；
- <span class="ev-badge ev-badge--proposed">PROPOSED</span>：属于规划中或文档曾提及但尚未部署的能力；
- <span class="ev-badge ev-badge--unknown">UNKNOWN</span>：当前环境缺乏足够观测证据，不作肯定结论。

| 服务与能力 | 已知能力与源码位置 | 证据等级 | 核验时间 | 已知限制与故障预期行为 |
| :--- | :--- | :--- | :--- | :--- |
| **静态网页与 CDN 分发** | 由 Astro 生成静态页面，经 Cloudflare Pages 分发（`public/_headers` 设置 HTML `must-revalidate`） | <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span> | 2026-11-16 | 依赖 Cloudflare 节点与 DNS；若某一边缘域名不可达，可尝试切换官方备用入口 |
| **边缘动态 API** | 承载评论、赞赏、身份与表单接口（`functions/api/*`） | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span> | 2026-11-16 | 若未部署 Functions 或绑定缺失，接口返回 404/503；静态纯阅读内容仍可正常浏览 |
| **文章评论与互动** | `functions/api/comments.ts` + `migrations/0003`–`0007`，支持分层回复、点赞与会话所有权校验 | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span> | 2026-11-16 | 依赖 D1 `DB` 绑定；数据库不可用时评论发布与拉取将降级或报错 |
| **D1 数据持久化** | Cloudflare D1 SQLite（`wrangler.jsonc` 绑定 `DB`，`migrations/0008_forms.sql` 存储 `form_submissions`） | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span> | 2026-11-16 | 本地静态预览不挂载远程 D1；当 D1 与备用通知通道均不可用时，表单接口明确返回 `503` |
| **主题联盟动态清单** | 构建期由 `scripts/sync-friends-moments.mjs` 生成 `/shijianus-moments.json`（`shijianus-moments-v1`） | <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span> | 2026-11-16 | 2026-11-16 实测 HTTP/2 200；内容随构建同步刷新，并非秒级实时流 |
| **传统 RSS 订阅 (`/rss.xml`)** | 部分旧配置曾链接 `/rss.xml`，但仓库尚无 `src/pages/rss.xml.ts` | <span class="ev-badge ev-badge--proposed">PROPOSED</span> | 2026-11-16 | **2026-11-16 实测 `https://blog.epocanvas.com/rss.xml` 返回 HTTP 404**；请暂勿将 `/rss.xml` 作为有效订阅源 |
| **友链自动巡检任务** | 暂无后台定时巡检 Worker 或自动探活数据库 | <span class="ev-badge ev-badge--proposed">PROPOSED</span> | 2026-11-16 | `/friends/` 中的在线状态圆点目前由配置文件静态维护，不代表实时可用性探测 |
| **互链申请与即时通知** | `POST /api/friends/apply` 写入 `form_submissions` 并调用 <a href="#glossary-webhook" class="doc-term" data-term="webhook">Telegram Bot</a> 通知站长 | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span> | 2026-11-16 | 接口严格拆分校验、D1 写入与通知送达状态；任一环节失败均会如实回报 |

<details class="status-details">
  <summary>
    <span>展开查看 2026-11-16 实测核验记录与边界说明</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <ul>
      <li><code>https://blog.epocanvas.com/status/</code>：2026-11-16 实测 HTTP/2 200（Cloudflare 响应头 <code>cf-cache-status: DYNAMIC</code>，<code>HSTS</code> 与 <code>CSP</code> 已启用）。</li>
      <li><code>https://shijianus.com/status/</code>：2026-11-16 实测 HTTP/2 200。</li>
      <li><code>https://blog.epocanvas.com/shijianus-moments.json</code>：2026-11-16 实测 HTTP/2 200（<code>content-type: application/json</code>）。</li>
      <li><code>https://blog.epocanvas.com/rss.xml</code>：2026-11-16 实测 HTTP/2 404（当前未生成 RSS XML 端点）。</li>
      <li><code>https://blog.epocanvas.com/media/shijianus/avatar.jpg</code> 与 <code>geek-cover.jpg</code>：2026-11-16 实测均为 HTTP/2 200。</li>
      <li>本次重写已移除过去文档中未经测量证实的「近零冷启动」「毫秒级首屏」「1 秒内送达」「Office 实时协同」等宣传性表述。</li>
    </ul>
  </div>
</details>

---

<h2 id="friends-system">友邻系统如何工作</h2>

对独立博客而言，友情链接不仅是页脚或独立页面上的一组网址，更是一种脱离中心化推荐算法的阅读连接。在本站，友邻体系主要由以下三部分配合完成：

1. **[友人帐](/friends/)（友邻名录）**：展示已审核收录的独立博客与关联项目卡片。数据来源于仓库中的静态配置文件，确保页面在无外部依赖时依然稳定可读。
2. **[朋友圈](/moments/)（动态聚合页）**：将站长发布的短动态（Markdown 集合）与已配置订阅源的友邻近期更新集中呈现，方便读者在一个页面内了解同行博友的新动态。
3. **跨站标准清单与通用订阅源**：通过 <a href="#glossary-rss" class="doc-term" data-term="rss">RSS</a>、<a href="#glossary-atom" class="doc-term" data-term="atom">Atom</a>、<a href="#glossary-jsonfeed" class="doc-term" data-term="jsonfeed">JSON Feed</a> 或主题原生协议 <a href="#glossary-moments-proto" class="doc-term" data-term="moments-proto">shijianus-moments-v1</a> 读取友邻内容。

### 友邻文章如何被获取、排序与更新

- **构建期抓取（Build-time Sync）**：在执行站点构建（`prebuild`）时，`scripts/sync-friends-moments.mjs` 会优先尝试读取同主题站点的 `/shijianus-moments.json`，若未启用该协议则回退到通用 Feed 解析器（`src/lib/feed-parser.ts`）抓取 RSS/Atom/JSON 订阅源（单源超时熔断 4–5 秒）。抓取结果会写入静态快照 `public/data/friends-moments.json`。
- **请求期读取与限流**：`/moments/` 页面构建时直接加载本地快照；若前端触发 `/api/moments-sync`（<a href="#glossary-edge-fn" class="doc-term" data-term="edge-fn">边缘函数</a>），该接口在 IP 限流保护下读取已生成的快照数据并缓存返回。
- **排序逻辑**：`src/lib/moments-loader.ts` 中的 `filterMomentsBySettings` 按「置顶优先，其次按发布时间倒序」排列，**不存在任何热度加权或商业推广排序**。

### 关于友链健康检查与失联处理

目前仓库**尚未部署**自动定期巡检友链可用性的后台定时任务。`src/config/friends.ts` 中的站点状态字段由站长在审核与维护时手动更新。

如果某位友邻的站点因服务器维护、证书续期或域名迁徙而暂时无法访问，站长会在人工核实确认情况后保留观察期，**不会因短时网络波动而直接删链**；若确认域名已彻底过期、停办或被恶意劫持，才会下线或标注说明。

---

<h2 id="exchange-rules">友邻交换与收录规则</h2>

为保证友邻列表的长期质量与阅读安全，申请加入 [友人帐](/friends/) 需满足以下具体且可执行的基本条件：

### 1. 收录资格与内容要求

- **独立内容载体**：欢迎个人博客、技术笔记站、设计/人文独立站点，或持续产出原创内容的开源/工具主页。
- **原创与可读性**：站点应包含作者独立撰写或整理思考的原创文章，页面具备基本排版可读性。
- **安全与访问条件**：必须通过公开可访问的 `https://` 或 `http://`（推荐 HTTPS）提供服务，且不能包含恶意重定向、诱导下载或大面积遮挡正文的弹窗广告。

### 2. 不予收录或撤除的情形

- 纯采集站、SEO 垃圾站、AI 批量堆砌站、赌博/灰产或纯商业引流营销页；
- 存在脚本注入风险、恶意跳转或长期被浏览器标记为不安全站点的域名；
- 域名过期被第三方抢注为无关广告页或色情/博彩页面时，将立即撤除链接以保护读者安全。

### 3. 对更新频率与互链对等的态度

- **更新节奏**：不要求高频日更。只要站点内容仍有长期参考价值且可稳定访问，低频更新或阶段性停更的博客依然可以保留。
- **先友后链**：建议您在提交申请前，先将 **shijianus** 添加到贵站的友情链接页面中，并在申请表中注明（或通过联系方式告知）。对于特别优秀的开源文档、工具或公开致谢站点，站长在人工审核时可酌情接受单向链接。

### 4. 站点迁移、撤除与申诉渠道

- **域名迁移或改名**：若您的博客更换域名、修改头像地址或变更简介，请通过邮箱 `shijianus@epocanvas.com` 或 `contact@epocanvas.com` 来信（建议在邮件中附带原网址与新网址），核验后将在配置中同步更新。
- **误撤或拒绝申诉**：若您认为申请被误判或站点恢复访问需要重新上架，可通过上述邮箱或 [举报与申诉说明](/community/reporting-and-appeals/) 联系核对。

---

<h2 id="official-friend-info">shijianus 官方友链信息</h2>

本站所有展示格式（YAML、JSON、HTML、Markdown）与单字段复制按钮均由同一份配置源 `src/config/friends.ts` 生成，避免手动维护多处信息造成名称或头像不一致。

> [!NOTE]
> **关于 RSS 地址的说明**：在 2026-11-16 的实测中，`/rss.xml` 返回 HTTP 404（尚未部署 XML RSS 生成器），而 `/shijianus-moments.json` 已实测正常（HTTP 200）。因此下方配置暂时提供可用的 JSON 清单地址，不虚构尚未上线的 RSS 链接。

<div data-status-slot="official-friend-card"></div>

---

<h2 id="apply-friend-link">互链申请</h2>

### 申请前准备与字段说明

提交前请确认贵站已可公开访问，并准备好以下信息：

1. **站点名称**（必填，最多 80 字符）：贵站展示给读者的名称。
2. **站点主页地址**（必填，最多 500 字符）：仅接受 `https://` 或 `http://` 开头的规范网址。
3. **头像 / 图标 URL**（必填，最多 500 字符）：可稳定加载的图片直链（支持 `https://` 或 `http://`）。
4. **一句话站点简介**（必填，最多 300 字符）：说明博客主题或内容方向。
5. **意向分类与联系方式**（分类默认可选，联系方式选填）：用于站长在审核过程中与您核对域名或通知结果。

### 提交、保存、通知与审核的严格边界

请务必区分以下四个独立阶段——**提交请求成功绝不等于已被正式收录**：

1. **请求受理与格式校验（`accepted`）**：服务端 `POST /api/friends/apply` 校验必填项、字符长度与安全 URL 协议（拒绝 `javascript:`、`data:` 等非 HTTP 协议），并执行 IP 频率限制。
2. **服务端持久化（`persisted`）**：在绑定了 Cloudflare D1 的生产环境中，申请记录会写入数据库表 `form_submissions`（状态字段为 `pending`）。若当前环境未绑定 D1 或写入异常，响应中的 `persisted` 将如实为 `false`。
3. **站长通知（`notified`）**：若环境配置了 Telegram Bot 凭证且推送成功，`notified` 为 `true`；若通知失败或未配置，`notified` 为 `false`。**如果数据库写入与通知发送同时失败，接口将返回 HTTP `503` 错误，绝不向前端返回伪造成功状态。**
4. **人工审核与正式收录（`pending_review` → `approved`）**：只有当站长完成人工核验并将贵站信息合并至 `src/config/friends.ts` 并重新部署后，贵站卡片才会出现在公开的 [友人帐](/friends/) 与本页名录中。

### 更正、撤回或出错处理

- 提交后如发现网址或头像填错，或需要撤回申请，请发邮件至 `shijianus@epocanvas.com` 并提供提交时填写的站点网址或页面返回的受理编号（`submissionId`）。
- 若提交遇到 `429`（请求过于频繁）或 `503`（持久化与通知均不可用），页面会明确提示原因并保留您的填写内容，可稍后重试或改用邮件申请。

<div data-status-slot="friend-apply-section"></div>

---

<h2 id="privacy-and-data">隐私与数据处理</h2>

本节依据 `functions/api/friends/apply.ts`、`functions/_lib/form-notify.ts`、`functions/_lib/rate-limit.ts` 的真实源码逻辑说明互链申请相关的数据处理方式；全站通用的账号、评论与赞赏数据规则请进一步参阅 [隐私与资料使用说明](/community/privacy-and-data/)。

- **收集的字段**：您填写的站点名称、主页网址、头像 URL、站点简介、意向分类、选填联系方式，以及表单来源标识（如 `status_guide_form` 或 `friends_modal`）。
- **服务端自动读取的请求元数据**：为执行频率限制与防滥用审计，服务端会读取请求头中的客户端 IP（`cf-connecting-ip` / `x-forwarded-for`）及 Cloudflare 国家/地区代码（`cf-ipcountry`）。限流器会使用加盐 SHA-256 对 IP 摘要后写入 `rate_limits` 计数桶；原始 IP 会随申请记录写入 `form_submissions.ip` 并包含在发送给站长的通知消息中。
- **存储位置与访问权限**：数据存储在绑定于本站点的 Cloudflare D1 数据库 `form_submissions` 表中，并（在配置凭证时）通过 <a href="#glossary-webhook" class="doc-term" data-term="webhook">Telegram Bot API</a> 异步推送至站长个人终端。**未经审核通过的待处理记录及您的私人联系方式绝不会向其他访客或公开接口暴露。**
- **数据保留与删除机制**：目前源码中**尚未实现**自动化定时清理 `form_submissions` 历史记录的后台任务，因此本站不在此虚构「30 天自动销毁」等未实现的承诺。若您需要查询、更正或请求删除已提交的互链申请记录，请发送邮件至 `contact@epocanvas.com` 或 `shijianus@epocanvas.com`（标题注明「友邻数据请求」），站长核验身份后将手动处理。

---

<h2 id="faq">常见问题</h2>

<details class="status-details">
  <summary>
    <span>1. 我的博客还没有 RSS 或 Atom 订阅源，可以申请友链吗？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>可以。友邻名录（<a href="/friends/">友人帐</a>）只要求贵站拥有稳定可访问的公开网页和原创内容，不强制要求具备 RSS。不过在没有 RSS / Atom / JSON Feed 的情况下，您的新文章将暂时无法自动汇总到本站的 <a href="/moments/">朋友圈</a> 动态流中。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>2. 如果我一段时间没有更新博客，会被撤除友链吗？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>不会仅因为更新放缓就撤链。独立博客往往伴随学业或工作节奏变化，只要网站本身仍可正常访问、内容依然有参考价值且没有变成广告或劫持页面，本站都会继续保留。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>3. 站点因为服务器维护暂时离线怎么办？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>短时间维护或 SSL 证书续期导致的离线不会立即导致撤链。如果维护周期较长，欢迎发邮件给站长说明情况，我们会在观测期间保留您的名片并在恢复后继续展示。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>4. 我的博客更换域名、修改昵称或头像地址了怎么办？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>请通过 <code>shijianus@epocanvas.com</code> 来信告知「原站点网址 + 更新后的名称/新网址/新头像 URL」。站长核验旧域名跳转或原站点声明后，会及时同步更新配置文件。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>5. 友邻卡片里的头像显示异常或加载失败怎么办？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>前端卡片已内置错误回退图标（<code>/media/brands/default-brand.svg</code>），防止出现裂图。常见原因是原头像图床开启了防盗链（Referer 校验）或链接使用了已过期的临时签名。建议提供一个允许跨站展示的 <code>https://</code> 头像直链并邮件通知站长替换。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>6. 提交互链申请后，多久能收到处理结果？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>所有申请均由站长人工审核并手动合入仓库配置，当前没有固定的自动审批时限（不承诺诸如「24 小时必回」的 SLA）。如果您在申请中填写了可联系的邮箱或 Telegram，或主动发送确认邮件，站长在审核后会直接回复结果。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>7. 如何修改或撤回已经提交但尚未审核的申请？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>请直接发邮件至 <code>shijianus@epocanvas.com</code>，附上您提交时的站点名称、网址或页面返回的受理编号（<code>submissionId</code>），说明需要修改的字段或撤回请求即可。若申请尚未通过校验被拒绝，您也可以在表单中直接修改后重新提交。</p>
  </div>
</details>

<details class="status-details">
  <summary>
    <span>8. 是否保证所有符合格式校验的申请都会通过？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>不保证。格式校验与服务端入库仅代表「已受理」，最终是否收录取决于贵站内容原创度、可访问性、安全状况及是否符合<a href="#exchange-rules">友邻交换与收录规则</a>。</p>
  </div>
</details>

---

<h2 id="glossary">术语表、版本与反馈</h2>

以下术语条目既为本文正文中加点虚线标注的上下文解释提供数据来源，也可在禁用 JavaScript 时直接作为页内锚点参考：

<dl class="status-glossary-list" style="display:grid;gap:0.85rem;margin:1rem 0 1.75rem;">
  <div>
    <dt id="glossary-rss" style="font-weight:800;">RSS（Really Simple Syndication）</dt>
    <dd id="glossary-rss-def" style="margin:0.25rem 0 0;color:var(--status-text-muted);">一种基于 XML 的网站内容摘要分发标准。独立博客通常生成 <code>rss.xml</code>，供阅读器或友邻系统在不访问网页广告和外壳的情况下抓取最新文章标题与摘要。注：截至 2026-11-16，本站尚未上线 <code>/rss.xml</code>。</dd>
  </div>
  <div>
    <dt id="glossary-atom" style="font-weight:800;">Atom 订阅协议</dt>
    <dd id="glossary-atom-def" style="margin:0.25rem 0 0;color:var(--status-text-muted);">与 RSS 类似的另一种标准化 XML 内容聚合格式，强调更严格的时间戳（ISO 8601）与唯一条目 ID 规范。本站的 <code>src/lib/feed-parser.ts</code> 同时兼容 RSS 2.0 与 Atom 1.0。</dd>
  </div>
  <div>
    <dt id="glossary-jsonfeed" style="font-weight:800;">JSON Feed</dt>
    <dd id="glossary-jsonfeed-def" style="margin:0.25rem 0 0;color:var(--status-text-muted);">使用 JSON 而非 XML 描述网站更新流的现代订阅标准，更容易被前端脚本与边缘函数直接解析。</dd>
  </div>
  <div>
    <dt id="glossary-moments-proto" style="font-weight:800;">shijianus-moments-v1 清单协议</dt>
    <dd id="glossary-moments-proto-def" style="margin:0.25rem 0 0;color:var(--status-text-muted);">本主题定义的朋友圈互联 JSON 清单格式（导出路径为 <code>/shijianus-moments.json</code>），用于在同主题站点间同步说说摘要、标签、时间戳与跨站接口地址。</dd>
  </div>
  <div>
    <dt id="glossary-edge-fn" style="font-weight:800;">边缘函数（Edge Functions）</dt>
    <dd id="glossary-edge-fn-def" style="margin:0.25rem 0 0;color:var(--status-text-muted);">运行在 CDN 边缘节点上的无服务器函数（本站使用 Cloudflare Pages Functions，代码位于 <code>functions/api/</code>），负责处理评论、表单校验、限流和支付会话等不能在纯静态 HTML 中安全执行的逻辑。</dd>
  </div>
  <div>
    <dt id="glossary-d1" style="font-weight:800;">D1 持久化（Cloudflare D1）</dt>
    <dd id="glossary-d1-def" style="margin:0.25rem 0 0;color:var(--status-text-muted);">Cloudflare 提供的无服务器 SQLite 关系型数据库。本站仅在数据库实际返回写入成功时才向客户端报告 <code>persisted: true</code>。</dd>
  </div>
  <div>
    <dt id="glossary-webhook" style="font-weight:800;">Webhook / Telegram 通知通道</dt>
    <dd id="glossary-webhook-def" style="margin:0.25rem 0 0;color:var(--status-text-muted);">由服务器在特定事件发生后主动向外部 HTTP 端点推送消息的机制。本站通过 Telegram Bot API 向站长推送新申请摘要，它只是一条提醒通道，不代表数据库已写入或申请已获批。</dd>
  </div>
</dl>

<div data-status-slot="version-meta"></div>
