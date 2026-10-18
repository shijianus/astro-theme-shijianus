---
title: "EpoCanvas 工程标准总纲：指标定义、数据链路与核验边界"
description: "完整说明 EpoCanvas 的活跃等级、内容密度、文章统计、热力图与指标 API，区分构建快照、请求期校准和需要独立验证的工程质量。"
pubDate: 2026-10-18
updatedDate: 2026-10-18
author: "shijianus"
category: "工程规范"
group: "EpoCanvas Standards"
tags: ["EpoCanvas", "工程标准", "指标体系", "Astro", "可复核性"]
toc: true
math: false
mermaid: false
mindmap: true
draft: false
lang: "zh-CN"
i18nKey: "ees-standards-overview"
---

# EpoCanvas 工程标准总纲

<div class="article-aside">
  <p><span class="badge badge-primary">EES-001</span> <span class="badge badge-success">规则说明</span> <span class="badge badge-warning">非实时审计报告</span></p>
  <p>本规范说明站点指标如何定义、数据从哪里来、哪些结论能够直接计算，以及哪些结论仍需测试。指标应帮助读者理解站点，而不是用漂亮的数字替代证据。</p>
</div>

> [!IMPORTANT]
> 本文是规则文档，不是一份实时监控报告。
> 文中阈值依据当前源码配置；当前篇数、字数和等级应查看对应部署的指标接口，并同时检查数据生成时间。

## 1. 标准的目标与适用范围

EpoCanvas Engineering Standards（简称 EES）是本站对内容指标、数据链路及其对外解释方式的项目级工程约定。

它主要回答三个核心问题：

1. 站点近期是否在持续稳定地发布或维护公开技术内容？
2. 已公开文章的平均物理篇幅处于什么区间，呈现怎样的体量分布？
3. 所有对外展示的统计数值与等级，能否根据明确的输入、算法与时间条件被完整独立复算？

EES 拒绝把多维度的复杂工程质量压缩为一个单一的分数。发文数量、文章篇幅、页面性能、服务可用性和认证安全分别属于完全不同的工程领域，必须由不同类型的真实证据进行独立支撑。

例如：
- 近 30 天内没有发布新文章，只代表发布窗口计数为零，绝不代表全站评论系统、边缘函数或部署链路发生故障；
- 全站平均篇幅较长，只代表文本规模达到特定字符区间，绝不自动证明每篇文章都具备高质量、原创性、逻辑严密性或易读性；
- 服务端响应正常，只能证明 API 路由处理逻辑可执行，不能反向证明历史快照中的统计规则已经消除所有边界差异。

### 1.1 文档体系结构

EES 规范体系由一个总纲与两个专项子规范构成，各文档分工如下：

| 规范编号 | 规范名称 | 核心职责与回答的问题 | 对应页面路径 | 内容文件位置 |
| --- | --- | --- | --- | --- |
| EES-001 | 工程标准总纲 | 指标体系组织、数据链路流向、核验边界与一致性原则 | `/standards/` | `docs/standards/index.md` |
| EES-002 | 活跃等级规范 | 近 30 天滑动窗口发布频次计算、五级阈值与时间边界 | `/standards/activity-level/` | `docs/standards/activity-level.md` |
| EES-003 | 内容密度规范 | 正文字数估算算法、全站平均篇幅、四级阈值与阅读耗时 | `/standards/content-density/` | `docs/standards/content-density.md` |

当前配置文件标识与基线版本：

| 配置项目 | 源码映射 / 当前取值 | 说明与约束 |
| --- | --- | --- |
| 标准标识 | `EES-2026.4` | 当前执行的标准代号 |
| 配置版本 | `2.6.0` | 配置文件中声明的版本标识 |
| 核心配置文件 | `src/config/standards.ts` | 阈值、状态码、文案与颜色权威源 |
| 站点运行起点 | `2024-01-01` | 用于计算累计运行天数的固定基准点 |

配置版本不等于部署版本。复核系统状态时，必须同时记录当前 Git 提交的 Commit Hash 以及 Cloudflare Pages 实际部署版本。

### 1.2 规范用语约定

本文档遵循严格的技术规范表达约定：

- **必须 (MUST)**：表示在生成数据、输出指标或发布内容前必须严格满足的硬性约束；
- **应当 (SHOULD)**：表示工程上的推荐最佳实践，偏离此做法时必须给出明确的技术解释与上下文；
- **可以 (MAY)**：表示可选功能或未来扩展能力；
- **当前实现 (SOURCE-VERIFIED)**：表示已从当前提交版本的源码中确认的实际行为；
- **已知差异 (KNOWN-GAP)**：表示已经确认存在但尚未在代码中彻底统合的双轨逻辑差异；
- **建议方向 (PROPOSED)**：表示处于设计或迁移规划中、尚未实际落地的改进方案。

## 2. 证据基线与技术声明分类协议

为杜绝技术文档中常见的过度宣称与虚假修饰，EES 体系建立严格的声明分类协议。所有面向读者的技术结论必须能够归入以下可验证类别之一：

| 标识代码 | 分类名称 | 定义与含义 | 可接受的证据支撑 |
| --- | --- | --- | --- |
| `SOURCE-VERIFIED` | 源码已核验 | 行为已从仓库现有源码中得到确认 | 具体文件路径、函数名、分支条件代码与 Git 提交 Hash |
| `TEST-VERIFIED` | 测试已核验 | 逻辑已通过实际执行自动化测试验证 | 明确的执行命令、进程退出码 0、具体断言项与测试日志 |
| `LIVE-VERIFIED` | 线上已核验 | 功能已在生产线上环境完成端到端验证 | 生产域名、实测时刻、网络请求抓包或真实浏览器渲染证据 |
| `KNOWN-GAP` | 已知差异项 | 双侧或历史遗留实现之间存在已记录的分歧 | 两侧代码实现差异对比、影响范围与可复现用例 |
| `PROPOSED` | 建议演进项 | 经过架构设计的拟定方案，尚未正式合并 | 详细接口设计说明、预期收益、风险评估与迁移前置条件 |
| `BLOCKED` | 外部阻塞项 | 因外部环境、凭证或权限不足而无法完成 | 具体阻塞原因、依赖的外部团队或鉴权边界说明 |

禁止将仅在源码中存在的逻辑描述为已在线上环境验证（严禁将 `SOURCE-VERIFIED` 混淆为 `LIVE-VERIFIED`）。

## 3. 从整体理解指标体系

```mindmap
# EpoCanvas 指标体系
## 内容输入层
- Markdown 与 MDX 文件
- Frontmatter 元数据
- 草稿与访问控制属性
- 多语言映射键 i18nKey
## 发布活跃度 (EES-002)
- 近 30 天滑动窗口发文数
- 五级阶梯 Lv.0 至 Lv.4
- 仅计首发不计旧文修订
## 内容篇幅 (EES-003)
- 正文字符与分词估算
- 全站算术平均篇幅
- 四级阶梯 Lv.1 至 Lv.4
- 篇幅不等于质量评分
## 数据链路层
- Astro 静态集合构建
- 快照生成脚本 sync-metrics
- 边缘 API 请求期动态校准
- 边缘 HTTP 缓存策略
## 独立工程核验
- 真实浏览器端到端测试
- 服务可用性探针监控
- 访问控制与数据安全审计
- 移动端与无障碍适配
```

思维导图呈现系统概念结构。具体判定必须以下文详述的规则与实际执行代码为准，不能从导图节点直接推导额外的未实现特性。

## 4. 核心指标字典

EES 规范所涉及的核心指标字段、数据类型、计量单位与工程含义定义如下：

| 指标名称 | 数据模型字段 | 单位 | 核心工程定义与计算口径 |
| --- | --- | --- | --- |
| 公开文章总量 | `stats.posts` | 篇 | 当前数据源中经过去重与过滤后纳入统计的代表性公开文章数量 |
| 全站估算总字数 | `stats.totalWords` | 字 | 纳入统计的全部公开文章通过字数估算算法得到的分值之和 |
| 全站平均篇幅 | `stats.avgWordsPerPost` | 字/篇 | 全站总字数除以公开文章总量后四舍五入（`Math.round`）所得的算术平均值 |
| 预计总阅读时间 | `stats.readingMinutes` | 分钟 | 逐篇文章按估算字数除以阅读速率并向上/取整后的阅读分钟数直接累加值 |
| 近 30 天发文量 | `stats.recentPostCount30d` | 篇 | 发布日期（`pubDate`）落入计算时刻往前滑动 30 天窗口内的文章总数 |
| 活跃等级 | `stats.activeLevel` | 等级 | 由近 30 天发文量匹配 `activityLevels` 阶梯表所得的评级对象 |
| 内容密度等级 | `stats.densityLevel` | 等级 | 由全站平均篇幅匹配 `contentDensityLevels` 阶梯表所得的评级对象 |
| 累计运行天数 | `stats.uptimeDays` | 天 | 从固定起始锚点 `2024-01-01T00:00:00Z` 到计算时刻之间经过的完整日历日数 |
| 52 周动态热力图 | `activity` | 格子数组 | 包含 364 个日历格子的矩阵，记录首次发布与有效更新事件的日期分布 |
| 快照生成时刻 | `generatedAt` | ISO-8601 | 构建脚本扫描文章正文生成 JSON 数据资产的具体时间戳 |
| 接口处理时刻 | `servedAt` | ISO-8601 | 边缘函数接收到 HTTP 请求并完成部分字段重算的时间戳 |

### 4.1 “累计运行天数”的技术边界澄清

在当前实现中，`stats.uptimeDays` 由以下代码计算：

```ts
const START_DATE = '2024-01-01T00:00:00Z';
const uptimeDays = Math.floor(
  (now.getTime() - new Date(START_DATE).getTime()) / (1000 * 60 * 60 * 24)
);
```

这是一个以固定日期为起点的**站点存在时间计数器（Site Age Indicator）**，绝不是基于高可用集群探针、心跳监测或 SLA 统计的“零故障无中断运行时长”。

因此，在对外展示与工程文档中：
- 不能将运行天数解释为站点期间从未发生过任何宕机、崩溃或网络中断；
- 不能将该数值替代真实的 HTTP 存活探针或云厂商 SLA 监控报表；
- 界面展示建议采用“建站天数”或“累计运行天数”，避免产生误导。

## 5. 数据实际如何流动：三条并行链路

本站指标并不存在“每次客户端请求都实时查询 Cloudflare D1 数据库并全文扫描 Markdown”的逻辑。全站数据通过三条职责明确的链路流转：

```text
【链路一：静态页面构建链路 (SSG Build Pipeline)】
src/content/posts/*.{md,mdx}
  │
  ▼ getCollection('posts')
Astro 内容集合框架
  │
  ▼ getPublicPosts()
排除草稿、排除 access 限制、依据 i18nKey 进行多语言归组
  │
  ▼ calculateSiteMetrics()
内存计算全站总字数、平均字数、近期发文与等级阶梯
  │
  ▼ standards/ 页面静态渲染
注入页面初始 HTML（构建时刻的确定性静态镜像）

【链路二：构建期快照同步链路 (Snapshot Pipeline)】
src/content/posts/*.{md,mdx}
  │
  ▼ scripts/sync-console-metrics.mjs
提取 Frontmatter、正则预清理正文、计算字数与 52 周热力图
  │
  ▼ 生成静态资产
public/data/console-metrics.json（随静态资产部署至全球 CDN）

【链路三：边缘 API 请求期动态校准链路 (Edge Runtime Pipeline)】
客户端发起 GET /api/console/data
  │
  ▼ Cloudflare Pages Functions
优先从 ASSETS 缓存读取 console-metrics.json 快照
  │
  ▼ 基于当前请求时刻 (now) 重新校准：
  - 累计运行天数 uptimeDays
  - 近 30 天滑动窗口发文数 recentPostCount30d
  - 动态重评 activeLevel 等级与进度条
  - 基于当前日期重新投影 52 周（364 天）热力图格子
  │
  ▼ 输出 HTTP JSON 响应
附带响应头 Cache-Control: public, max-age=60, s-maxage=300
```

> [!NOTE]
> “在边缘函数中执行”描述的是代码运行的物理网络节点，不代表“每一次网络请求都会在边缘节点上重新将几百篇 Markdown 正文重算一遍”。
> 当前架构的标准技术定性是：**构建期静态快照驱动，叠加边缘请求期时间相关字段动态校准**。

## 6. 两个核心等级维度的正交性

<div class="article-tabs">
  <div class="article-tabs__nav">
    <button class="article-tabs__button is-active" type="button">发布活跃度维度 (EES-002)</button>
    <button class="article-tabs__button" type="button">内容密度维度 (EES-003)</button>
  </div>
  <div class="article-tabs__panels">
    <div class="article-tabs__panel is-active">
      <p><strong>活跃等级</strong>衡量的是“发布的时间频度”。它只以滚动时间窗口内的公开发表文章数量为依据，反映的是作者近期的创作节奏。它不衡量单篇文章的篇幅厚度，不衡量历史修改频度，更不代表服务架构的可用性健康度。</p>
      <p>详见独立子规范：<a href="/standards/activity-level/">EES-002 站长活跃等级分级与评估规范</a>。</p>
    </div>
    <div class="article-tabs__panel">
      <p><strong>内容密度</strong>衡量的是“文章的平均篇幅规模”。它以全站全部入选公开文章的算术平均字符数与词数估算为依据，反映的是全站技术沉淀的篇幅结构。它不代表单篇文章的语义含金量，也不是技术正确性或学术价值的自动认证。</p>
      <p>详见独立子规范：<a href="/standards/content-density/">EES-003 全站内容密度分级与度量规范</a>。</p>
    </div>
  </div>
</div>

### 6.1 活跃等级对照速查

| 等级标识 | 状态代码 | 徽章显示 | 近 30 天发文量 | 官方命名 | 创作节奏参考描述 |
| --- | --- | --- | ---: | --- | --- |
| Lv.0 | Status 0 | Lv.0 Idle | 0 篇 | 维护休眠 | 窗口内无新文章，处于常规归档或底层休整期 |
| Lv.1 | Status 1 | Lv.1 Low | 1–2 篇 | 周期推送 | 保持每月 1 至 2 篇的基础技术分享节奏 |
| Lv.2 | Status 2 | Lv.2 Standard | 3–4 篇 | 稳定维护 | 保持双周更或每周一篇的稳定知识沉淀节奏 |
| Lv.3 | Status 3 | Lv.3 High | 5–8 篇 | 高频迭代 | 保持高密度周更或多专题并行推进 |
| Lv.4 | Status 4 | Lv.4 Ultra | 至少 9 篇 | 极客狂热 | 保持极高频技术输出与系列专栏集中交付 |

“维护休眠”是针对发布时间窗口的状态标记，绝不等于站点已废弃或维护团队停止工作。

### 6.2 内容密度等级对照速查

| 等级标识 | 状态代码 | 徽章显示 | 四舍五入后平均篇幅 | 官方命名 | 篇幅结构技术特征 |
| --- | --- | --- | ---: | --- | --- |
| Lv.1 | Level 1 (Low) | Lv.1 Low | 0–800 字 | 微动态速记 | 简明备忘、单点故障修复记录、短小快速片段 |
| Lv.2 | Level 2 (Standard) | Lv.2 Standard | 801–1500 字 | 标准技术博客 | 完整叙事的单点专题、标准架构组件解析 |
| Lv.3 | Level 3 (High) | Lv.3 High | 1501–3000 字 | 详实系统专栏 | 包含多模块联动、配置演练与代码实现的深度文章 |
| Lv.4 | Level 4 (Ultra) | Lv.4 Ultra | 至少 3001 字 | 硬核深度长文 | 体系化全景长文、全链路源码剖析或重构复盘 |

所有等级命名均属于本站内部的篇幅结构分类，不构成外部机构的技术认证。

## 7. 统计准入与多语言去重准则

在页面侧计算与公共数据流中，文章是否能参与统计遵循严格的过滤流水线：

```text
全部文章集合 (All Posts)
  │
  ├── 1. 过滤 draft === true 的草稿 ────────────► 排除草稿
  │
  ├── 2. 过滤包含 access 属性的加密/受限文章 ───► 排除受限内容
  │
  └── 3. 多语言版本归组与去重 (Canonical Grouping)
        │
        ├── 提取分组键：优先使用 frontmatter.i18nKey
        │   未配置时回退为：移除已识别语言后缀后的 slug 标识
        │
        └── 同一组别存在多个版本时：
            优先选择无语言后缀的根版本作为唯一的代表性文章；
            无根版本时，选择按字母序排列的第一个可用版本。
```

### 7.1 去重机制不是语义防刷模型

当前的去重与防刷逻辑依赖于显式的 Frontmatter 元数据与文件名规范。以下行为无法通过当前算法自动识别：

- 正文高度相似但使用完全不同文件名与不同 `i18nKey` 的文章；
- 将一个完整技术主题人为拆解为十篇几百字的碎片文章以刷取发文篇数；
- 故意篡改 `pubDate` 为近期日期；
- 将纯外链引用包装为长文。

因此，当前系统提供的是**多语言发布副本与草稿的工程级归一化**，不能声称具备自然语言语义分析级的全自动防刷能力。

### 7.2 已识别的代码与架构差异详录 (Identified Consistency Gaps)

在对当前仓库源码的完整审计中，确认存在以下双轨实现差异。在未完成代码级统合前，公开文档应如实解释其技术边界：

| 差异编号 | 差异简述 | 影响范围与表现 | 推荐统一方向 (PROPOSED) |
| --- | --- | --- | --- |
| GAP-01 | 页面侧与快照脚本的 access 过滤不一致 | 页面侧完全排除 access 文章；快照脚本未排除，受限文章的标题和日期可能进入公共快照 | 快照脚本引入与 `getPublicPosts()` 严格一致的过滤逻辑 |
| GAP-02 | 多语言分组键实现差异 | 页面侧优先支持显式 `i18nKey`；快照脚本主要依据文件名规则，存在多语言文章在快照中未归组的风险 | 提取通用的 `getCanonicalGroupKey()` 共享纯函数 |
| GAP-03 | 时间窗口下界计算存在 720h 与零点差异 | 核心指标按前推 30 天当日零点计算；活跃文章明细按严格 `30 * 24h` 计算，导致明细行数与指标偶发不一致 | 统一以自然日零点或严格毫秒数为唯一判定标准 |
| GAP-04 | 快照数据丢失具体时分秒精度 | 快照中的发布日期被截断为 `YYYY-MM-DD` 字符串，同一日内的先后顺序与时间戳精度丢失 | 快照保留完整的 ISO-8601 时间戳字符串 |
| GAP-05 | 站点起始日期多处硬编码并存 | `src/config/standards.ts` 定义了起始日期，但部分模块仍存在独立的局部硬编码常量 | 全量引用配置文件中的统一常量导出 |
| GAP-06 | 等级升级阈值硬编码于计算函数中 | 进度条百分比与下一等级提示直接硬编码了数字，修改配置表无法完全自动联动 | 重构进度计算器，直接消费配置数组中的区间范围 |

## 8. 热力图的构造原理与解释限制

全站 52 周动态热力图由 364 个日历格组成，具有固定的排列与着色规则：

```text
52 列 × 7 行 矩阵布局
行：星期日 (Row 0) 至 星期六 (Row 6)
列：从 52 周前对应的周日至当前周
```

### 8.1 事件提取与色阶映射

热力图记录两类有明确元数据支撑的内容事件：

1. **首次发布事件**：基于文章的 `pubDate` 记录；
2. **有效修订事件**：当文章存在 `updatedDate` 且其年月日与 `pubDate` 不相同时，作为独立修订事件记录。

单日事件数量到显示色阶的映射关系：

| 当日事件数 $E$ | 对应色阶 | 界面视觉表现 |
| ---: | ---: | --- |
| $E = 0$ | 0 阶 | 基础底色（灰色/低透明度） |
| $E = 1$ | 1 阶 | 浅度主题色 |
| $2 \le E \le 3$ | 2 阶 | 中度主题色 |
| $4 \le E \le 6$ | 3 阶 | 深度主题色 |
| $E \ge 7$ | 4 阶 | 高饱和高亮主题色 |

### 8.2 关键解释边界

- **修订不增加近期发文量**：更新旧文章可以在热力图中点亮特定日期的格子，但绝不会增加 `recentPostCount30d`；
- **历史修订覆盖性**：文章模型仅保留单一最新的 `updatedDate`，若一篇文章修改过十次，也只能体现最初发布日与最后更新日两个点，无法还原完整的版本控制历史；
- **未来占位格**：当前周尚未到来的剩余天数属于占位格子，不显示任何活动。

## 9. API 阅读与数据新鲜度核验准则

在通过 HTTP 请求读取 `/api/console/data` 时，读者与开发者应遵循严格的数据新鲜度验证流程：

```text
1. 校验 HTTP 状态码为 200，Content-Type 为 application/json；
2. 确认 JSON 顶层 ok 字段为 true；
3. 检查 generatedAt 时间戳（明确静态数据快照的构建时刻）；
4. 检查 servedAt 时间戳（明确当前边缘节点的响应时刻）；
5. 明确哪些字段是请求期重算的（uptimeDays, recentPostCount30d, activeLevel, activity）；
6. 明确哪些字段是快照固化的（totalPosts, totalWords, avgWordsPerPost, densityLevel）。
```

### 9.1 缓存策略与失效机制

当前 API 声明了边缘网络缓存：

```http
Cache-Control: public, max-age=60, s-maxage=300
```

这意味着：
- 浏览器本地可在 60 秒内复用缓存；
- Cloudflare 全球边缘节点可在 300 秒内复用共享缓存；
- 即使发布了新的文章并完成了部署，在边缘缓存窗口（最长 5 分钟）完全失效之前，仍可能获取到上一周期的响应体；
- 遇到网络异常或返回非 JSON 响应时，前端界面应当明确展示“数据暂时不可用”，绝不能将异常静默回退为“0 篇文章”或“Lv.0”，避免向读者传递虚假的归零信息。

## 10. 内容指标不承担的工程承诺

<div class="article-accordion-group" data-single="false">
  <details class="article-accordion">
    <summary><span>性能指标必须基于真实环境测试证据</span></summary>
    <div class="accordion-content">
      <p>边缘函数的首包时间（TTFB）、页面最大内容绘制（LCP）、首屏 JavaScript 资源体积等性能参数，必须在明确的终端设备、网络带宽、缓存冷热状态与采样批次下由专业工具测定。指标总纲与分级等级不代表任何绝对性能承诺。</p>
    </div>
  </details>
  <details class="article-accordion">
    <summary><span>静态架构不自动等同于绝对安全</span></summary>
    <div class="accordion-content">
      <p>虽然静态页面本身不包含传统的服务端 SQL 注入面，但站点的交互式功能（如评论系统、支付链路、中控台认证接口等）依然需要严格进行输入清洗、鉴权校验与防刷拦截。不能将“静态生成架构”推论为“全站绝对无安全风险”。</p>
    </div>
  </details>
  <details class="article-accordion">
    <summary><span>字数与篇幅不代表文章质量与实用价值</span></summary>
    <div class="accordion-content">
      <p>技术写作的核心价值在于问题定位的精准度、解决方案的可复现性与架构演进的思考深度。一篇简明精准的 300 字 Bug 修复记录，其工程价值完全可能高于一篇堆砌无意义代码段的 5000 字长文。篇幅分级仅作为读者预估阅读耗时的参考。</p>
    </div>
  </details>
</div>

## 11. 标准的配置与演进流程

EES 规范的权威配置定义于代码文件：

```text
src/config/standards.ts
```

当团队需要调整阈值、文案或计算规则时，必须遵循以下维护流程：

1. **区间完整性校验**：确保修改后的数值区间连续闭合，不存在未覆盖的数值空档或重叠冲突；
2. **双端逻辑联动**：检查 `src/lib/site-metrics.ts` 与 `scripts/sync-console-metrics.mjs` 中的硬编码常量是否同步更新；
3. **自动化测试回归**：运行完整的指标算法专项测试矩阵，覆盖边界用例；
4. **快照重建与部署**：重新生成 `console-metrics.json`，确保页面与 API 使用一致的配置；
5. **规范版本递增**：在配置文件中递增版本号（如由 `v2.6.0` 递增），并在本文档的历史记录中予以记录。

## 12. 公开核验清单

用于对本站当前部署状态进行公开复核的标准化清单：

- [ ] 已记录当前核验的 Git 提交 Hash 与生产部署版本标识；
- [ ] 已拉取当前已发布的全部 Markdown/MDX 原文，确认草稿与受限文章已剔除；
- [ ] 已核验多语言文章的分组键及代表性版本的选择结果；
- [ ] 已在固定的时间点基准下复算近 30 天滑动窗口发文数；
- [ ] 已逐篇运行字数估算算法并计算算术平均值与取整等级；
- [ ] 已核查 `/api/console/data` 的 `generatedAt`、`servedAt` 与 HTTP 缓存头；
- [ ] 已核实受限访问文章的元数据没有意外泄露至公共快照产物中；
- [ ] 已确认所有对外展示文案与当前代码实际逻辑严格吻合。

## 13. 关联规范导航

<a class="article-bookmark" href="/standards/activity-level/">
  <div class="article-bookmark__content">
    <div class="article-bookmark__title">EES-002：站长活跃等级分级与评估规范</div>
    <p class="article-bookmark__desc">深入了解近 30 天滑动窗口数学定义、双轨时间下界差异、多语言归组算法与 52 周热力图生成机制。</p>
    <div class="article-bookmark__site"><span class="badge badge-primary">Activity Spec</span><span>近窗口发布频率</span></div>
  </div>
</a>

<a class="article-bookmark" href="/standards/content-density/">
  <div class="article-bookmark__content">
    <div class="article-bookmark__title">EES-003：全站内容密度分级与度量规范</div>
    <p class="article-bookmark__desc">深入了解正文字符串清理算法、UTF-16 长度特征、全站算术均值精算模型与预计阅读时长计算原理。</p>
    <div class="article-bookmark__site"><span class="badge badge-primary">Density Spec</span><span>全站平均篇幅</span></div>
  </div>
</a>
