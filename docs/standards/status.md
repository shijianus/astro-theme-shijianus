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
version: "v3.0.1"
---

<section class="status-lead" id="guide-overview" aria-labelledby="guide-overview-heading">
  <h2 id="guide-overview-heading" class="sr-only">阅读本指南</h2>
  <div class="status-lead__meta">
    <span><strong>文档定位：</strong>运行状态边界与友邻交换规范</span>
    <span><strong>适用读者：</strong>博客访客、计划互链的独立博主</span>
    <span><strong>最近核验：</strong><time datetime="2026-11-16">2026-11-16</time></span>
  </div>
  <p class="status-lead__copy">
    本指南说明 <strong>shijianus</strong> 博客当前经过核验的系统能力、运行时边界、友邻展示与动态聚合机制，以及交换友情链接的条件、表单提交状态和个人信息处理方式。正文严格区分<strong>静态规则</strong>（长期有效的互链约定与隐私边界）与<strong>最近核验的运行快照</strong>（在特定时间点通过源码或生产访问证实的能力）。
  </p>
  <div class="status-lead__actions">
    <a href="#site-status" class="status-btn status-btn--primary">了解站点状态</a>
    <a href="#official-friend-info" class="status-btn status-btn--secondary">交换友情链接</a>
  </div>
</section>

<h2 id="about-shijianus">认识 shijianus</h2>

**shijianus** 是由独立开发者 **shijianus** 维护的个人技术博客与数字花园，长期记录 Web 工程、系统设计、阅读体验与前端可维护性实践。无论读者通过哪个官方域名访问，博客品牌、内容版权与运维责任主体始终为 **shijianus**。

- **与关联项目的关系**：页脚或 [友人帐](/friends/) 中出现的 **EpoCanvas**、**EpoMail**、**Sonic** 是作者参与或维护的独立生态项目，以关联友邻身份收录，**并非本博客的发布主体**。
- **技术架构概览**：静态页面由 `Astro 7.4.7`、`React 19.2.4` 与 `Tailwind CSS 4.2.2`（`package.json`）编译导出；动态接口运行于 Cloudflare Pages Functions（`functions/api/*`），数据表位于 Cloudflare D1（`wrangler.jsonc`、`migrations/0001`–`0008`）；安全响应头（`CSP`、`HSTS`、`X-Content-Type-Options`、`X-Frame-Options`）由 `functions/_middleware.ts` 与 `public/_headers` 注入。

### 访问域名与索引一致性

| 域名入口 | 当前角色与配置来源 | 状态与索引说明 |
| :--- | :--- | :--- |
| `https://blog.epocanvas.com` | 线上主访问入口（`friendsConfig.siteInfo.url`） | <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span> 2026-11-16 实测 HTTP/2 200，承载 `/status/` 与 `/shijianus-moments.json` |
| `https://shijianus.com` | 独立品牌访问入口 | <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span> 2026-11-16 实测 HTTP/2 200，页面内容与主入口一致 |
| `https://shijian.us` | 代码默认 `siteOrigin`（`src/config/site.ts`） | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span> / <span class="ev-badge ev-badge--unknown">UNKNOWN</span> 用作默认 `canonical` 基准；探测环境访问超时，线上可达性待确认 |

<aside class="status-callout" role="note" aria-label="多域名重复索引提示">
  <p class="status-callout__title">多域名重复索引风险说明</p>
  <p>由于 <code>blog.epocanvas.com</code> 与 <code>shijianus.com</code> 当前均返回 HTTP 200 而未配置边缘 301 跳转，本次重构已先在布局层补齐统一的 <code>&lt;link rel="canonical"&gt;</code> 与 OpenGraph URL（遵循构建环境 <code>SITE_URL</code> 或 <code>siteConfig.site.url</code>），后续建议在 Cloudflare 边缘收敛至单一主域名。</p>
</aside>

<h2 id="site-status">站点状态和运行边界</h2>

<aside class="status-callout status-callout--warn" role="note" aria-label="非实时监控声明">
  <p class="status-callout__title">本页提供的是最近核验的运行信息，并非实时监控面板</p>
  <p>下表状态仅代表特定核验时间点的源码或生产观测事实，不构成可用性承诺（SLA），也不等同于您当前请求瞬间的实时健康度。</p>
</aside>

本站使用四类明确标记区分核验依据：
<span class="ev-badge ev-badge--live">LIVE-VERIFIED</span> 生产实测响应 ·
<span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span> 源码实作确认 ·
<span class="ev-badge ev-badge--proposed">PROPOSED</span> 规划中未部署 ·
<span class="ev-badge ev-badge--unknown">UNKNOWN</span> 证据不足待确认。

| 服务与能力 | 当前已知能力与源码位置 | 状态 / 核验日期 | 已知限制与故障预期行为 |
| :--- | :--- | :--- | :--- |
| **静态网页与 CDN** | Astro 静态导出经 Cloudflare Pages 分发（`public/_headers`） | <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span><br><small>2026-11-16</small> | 依赖 Cloudflare 节点与 DNS；单域异常时可切换备用入口 |
| **边缘动态 API** | 承载评论、赞赏、身份与表单接口（`functions/api/*`） | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span><br><small>2026-11-16</small> | Functions 未部署或异常时返回 404/503；纯阅读内容不受影响 |
| **评论与互动** | `functions/api/comments.ts` + `migrations/0003`–`0007`，支持分层回复与会话校验 | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span><br><small>2026-11-16</small> | 依赖 D1 `DB` 绑定；数据库不可用时发布与拉取将降级报错 |
| **D1 数据持久化** | Cloudflare D1 SQLite，`form_submissions`（`0008_forms.sql`） | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span><br><small>2026-11-16</small> | 纯静态预览无远程 D1；当 D1 与通知同失败时接口返回 `503` |
| **主题动态清单** | `prebuild` 生成 `/shijianus-moments.json`（`shijianus-moments-v1`） | <span class="ev-badge ev-badge--live">LIVE-VERIFIED</span><br><small>2026-11-16</small> | 实测 HTTP/2 200；随构建期刷新，并非秒级实时推流 |
| **RSS XML 订阅** | 仓库尚无 `src/pages/rss.xml.ts`（部分旧链接曾引用 `/rss.xml`） | <span class="ev-badge ev-badge--proposed">PROPOSED</span><br><small>2026-11-16</small> | **2026-11-16 实测 `/rss.xml` 返回 HTTP 404**，暂请使用 JSON 清单 |
| **友链自动巡检** | 尚无后台定时巡检 Worker 或自动探活表 | <span class="ev-badge ev-badge--proposed">PROPOSED</span><br><small>2026-11-16</small> | `/friends/` 状态圆点为静态配置人工维护，非实时探测结果 |
| **互链申请通知** | `POST /api/friends/apply` 写入 D1 并触发 <a href="#glossary-webhook" class="doc-term" data-term="webhook">Telegram Bot</a> 提醒 | <span class="ev-badge ev-badge--source">SOURCE-VERIFIED</span><br><small>2026-11-16</small> | 严格拆分校验、入库与通知状态；任一环节失败均如实回报 |

<details class="status-details">
  <summary>
    <span>展开查看 2026-11-16 实测探测详情与表述清理说明</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <ul>
      <li><code>https://blog.epocanvas.com/status/</code> 与 <code>https://shijianus.com/status/</code>：均实测返回 HTTP/2 200（Cloudflare 响应头含 <code>HSTS</code> 与 <code>CSP</code>）。</li>
      <li><code>https://blog.epocanvas.com/shijianus-moments.json</code>：实测 HTTP/2 200（<code>application/json</code>）；媒体资源 <code>avatar.jpg</code>、<code>geek-cover.jpg</code> 均为 HTTP/2 200。</li>
      <li><code>https://blog.epocanvas.com/rss.xml</code>：实测 HTTP/2 404，已据实降级为 <code>PROPOSED</code>。</li>
      <li>本版已移除过往版本中未获实证的「近零冷启动」「毫秒级首屏」「1 秒内送达」「Office 实时协同」等宣传性表述。</li>
    </ul>
  </div>
</details>

<h2 id="friends-system">友邻系统如何工作</h2>

本站友邻体系脱离中心化算法推荐，由三部分静态与聚合能力协作：

1. **[友人帐](/friends/)（名录展示）**：展示经人工核验并收录的独立博客与生态卡片，数据直接读取仓库配置文件，无外部依赖亦可稳定访问。
2. **[朋友圈](/moments/)（动态聚合）**：在构建期由 `scripts/sync-friends-moments.mjs` 优先读取同主题站点的 <a href="#glossary-moments-proto" class="doc-term" data-term="moments-proto">shijianus-moments-v1</a> 清单，回退使用通用解析器（`src/lib/feed-parser.ts`）抓取 <a href="#glossary-rss" class="doc-term" data-term="rss">RSS</a>、<a href="#glossary-atom" class="doc-term" data-term="atom">Atom</a> 与 <a href="#glossary-jsonfeed" class="doc-term" data-term="jsonfeed">JSON Feed</a>，生成静态快照 `public/data/friends-moments.json`。
3. **排序与状态维护**：`src/lib/moments-loader.ts` 按「置顶优先，其次发布时间倒序」排列，无热度加权。友邻卡片在线状态目前由站长人工核对维护；若友邻因证书续期或服务器维护短时离线，本站会保留观察期而非立即撤链。

<h2 id="exchange-rules">友邻交换与收录规则</h2>

- **欢迎收录**：长期维护原创内容、具备基本阅读排版且通过公开 `https://` 或 `http://` 访问的个人博客、技术笔记站及开源文档主页。
- **不予收录或撤除**：纯采集/SEO 垃圾站、AI 批量堆砌站、含恶意跳转/弹窗广告或被浏览器标记为不安全的站点；域名过期被抢注为无关广告或灰产页时将立即下线。
- **更新节奏与对等原则**：不要求高频更新；推荐先将 **shijianus** 添加至贵站友链页再提交申请，优质开源文档或致谢站点可酌情接受单向链接。
- **迁移与申诉**：若博客更换域名、修改名称或头像，或需对审核结果申诉，请来信 `shijianus@epocanvas.com` / `contact@epocanvas.com`（附原网址与新信息），亦可参阅 [举报与申诉说明](/community/reporting-and-appeals/)。

<h2 id="official-friend-info">shijianus 官方友链信息</h2>

下方名片与 `YAML / JSON / HTML / Markdown` 代码均由同一份配置源 `src/config/friends.ts` 构建生成。由于实测 `/rss.xml` 尚未上线（404），下方清单暂提供已实测可用的 JSON 动态地址 `/shijianus-moments.json`，不虚构未部署的 RSS 链接。

<div data-status-slot="official-friend-card"></div>

<h2 id="apply-friend-link">互链申请</h2>

提交互链请求仅代表「申请已受理」，**绝不等于已被正式收录**。完整流程分四个明确阶段：

1. **格式与协议校验（`accepted`）**：`POST /api/friends/apply` 校验站点名称（≤80 字）、公开 `https://` 或 `http://` 主页与头像链接（≤500 字，拒绝 `javascript:` / `data:`）、简介（≤300 字）及 IP 频控。
2. **数据库持久化（`persisted`）**：绑定 Cloudflare D1 时写入 `form_submissions`（初始状态 `pending`）；未绑定或写入异常时如实返回 `persisted: false`。
3. **站长通知（`notified`）**：配置凭证时经 Telegram Bot 推送提醒；若数据库写入与通知同时失败，接口返回 `HTTP 503`，不向前端伪造成功。
4. **人工审核收录（`pending_review` → `approved`）**：站长核验并合入 `src/config/friends.ts` 重新部署后，贵站卡片才会出现在 [友人帐](/friends/)。如需更正或撤回，请携带受理编号（`submissionId`）联系 `shijianus@epocanvas.com`。

<div data-status-slot="friend-apply-section"></div>

<h2 id="privacy-and-data">隐私与数据处理</h2>

依据 `functions/api/friends/apply.ts`、`functions/_lib/rate-limit.ts` 与 `functions/_lib/form-notify.ts` 源码，互链申请的数据处理边界如下（全站通用账号与评论规则请参阅 [隐私与资料使用说明](/community/privacy-and-data/)）：

- **采集内容与请求元数据**：保存您提交的站点名称、网址、头像、简介、分类、选填联系方式及来源标识；防滥用限流器对请求 IP（`cf-connecting-ip` / `x-forwarded-for`）作加盐 SHA-256 摘要并记入 `rate_limits`，原始 IP 与地区头（`cf-ipcountry`）随申请记录存入 `form_submissions.ip` 并发送至站长通知。
- **可见性与存储**：未通过审核的待处理记录及私人联系方式**不会**对外公开。
- **保留与删除**：源码当前**未实现**自动化定时清理历史表单记录的后台任务，不虚构「N 天自动销毁」承诺；如需查询、更正或删除已提交记录，请致信 `contact@epocanvas.com` 或 `shijianus@epocanvas.com`（注明「友邻数据请求」）。

<h2 id="faq">常见问题</h2>

<details class="status-details">
  <summary>
    <span>1. 我的博客还没有 RSS 或 Atom 订阅源，可以申请友链吗？</span>
    <span class="status-details__chevron" aria-hidden="true">▸</span>
  </summary>
  <div class="status-details__body">
    <p>可以。<a href="/friends/">友人帐</a> 仅要求稳定可访问的原创网页，不强制 RSS；但缺少订阅源时，您的新文章暂无法聚合至 <a href="/moments/">朋友圈</a>。</p>
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
