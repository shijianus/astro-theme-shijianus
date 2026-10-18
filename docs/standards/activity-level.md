---
title: "EpoCanvas 活跃等级规范：发布窗口、五级阈值与可复核评估"
description: "完整解释 EpoCanvas 近 30 天发布活跃度的计算方式、五级阈值、多语言去重、发布日期边界、热力图区别及当前实现差异。"
pubDate: 2026-10-18
updatedDate: 2026-10-18
author: "shijianus"
category: "工程规范"
group: "EpoCanvas Standards"
tags: ["EpoCanvas", "活跃等级", "发布频率", "时间窗口", "内容统计"]
toc: true
math: false
mermaid: false
mindmap: true
draft: false
lang: "zh-CN"
i18nKey: "ees-activity-level"
---

# 站长活跃等级分级与评估规范

<div class="article-aside">
  <p><span class="badge badge-primary">EES-002</span> <span class="badge badge-success">发布活跃度</span> <span class="badge badge-warning">不是服务健康评分</span></p>
  <p>活跃等级用于描述近期公开内容的发布频次。它不评价作者投入的总工时，不把修改旧文当作新发文章，也不替代站点监控、代码贡献统计或内容质量评审。</p>
</div>

> [!IMPORTANT]
> 当前源码实现存在两种“近 30 天”时间下界算法：全站核心指标使用前推 30 个日历日后的零点，页面发文明细列表使用严格前推 720 小时（即 30 × 24 小时毫秒差）。
> 本文分别对两套算法进行严谨解析，不掩盖代码中存在的实现差异。

## 1. 活跃等级的度量目标与定位

活跃等级的核心输入是指定时间滑动窗口内的有效新发文章总数。

该指标专门用于回答以下创作与维护节奏问题：

1. 站点在最近一个月内是否发布过新的公开技术文章？
2. 近期内容的发布节奏是处于偶发探索、稳态维护还是密集交付？
3. 随着历史文章逐渐滑出统计窗口，站点的近期活跃指标如何呈现动态迁移？

该指标明确不用于解答以下工程或质量问题：

- 维护者近期提交了多少次 Git Commit 或修改了多少行业务代码；
- 维护者修复或润色了多少篇历史已归档文章；
- 边缘服务节点与数据库的实时可用率（SLA）是否达标；
- 是否及时处理了读者评论、安全更新或基础设施迁移；
- 所发布的文章是否具备学术严谨性、工业级正确性或独创价值。

界面中使用的“站长活跃”属于读者端展示文案；其严格的技术定义应为“**站点公开技术文章的近期发布活跃度**”。

### 1.1 规则来源与代码映射

活跃等级的计算逻辑分布于以下核心代码模块中：

| 模块职责 | 对应代码位置 / 接口 | 说明 |
| --- | --- | --- |
| 阈值与文案定义 | `src/config/standards.ts` | 导出权威配置对象 `standardsConfig` |
| 等级阶梯匹配 | `matchActivityTier()` | 纯函数：根据整数篇数匹配对应等级对象 |
| 页面初始指标精算 | `src/lib/site-metrics.ts` 中的 `calculateSiteMetrics()` | Astro 构建期对文章集合进行多语言归组并统计 |
| 公开文章集合过滤 | `src/lib/content.ts` 中的 `getPublicPosts()` | 排除草稿与受限内容，依据 `i18nKey` 提取代表文章 |
| 构建快照生成 | `scripts/sync-console-metrics.mjs` | 生成 `public/data/console-metrics.json` |
| 边缘请求期动态重算 | `functions/api/console/data.ts` | 基于请求当前时刻校准近期发文与热力图 |

当前遵循的标准配置标识为 `EES-2026.4`，配置版本为 `2.6.0`。

## 2. 五级阈值完整阶梯与技术定义

系统定义了连续、无空隙且互斥的五个活跃等级区间：

| 等级标识 | 状态代码 | 徽章显示 | 近 30 天发文量范围 | 官方评级名称 | 创作节奏参考描述 |
| --- | --- | --- | ---: | --- | --- |
| Lv.0 | Status 0 | Lv.0 Idle | 恰好 0 篇 | 维护休眠 | 窗口内无新文章，系统处于底座休整或历史文档维护期 |
| Lv.1 | Status 1 | Lv.1 Low | 1–2 篇 | 周期推送 | 保持每月 1 至 2 篇的基础技术沉淀分享节奏 |
| Lv.2 | Status 2 | Lv.2 Standard | 3–4 篇 | 稳定维护 | 保持双周更或每周一篇的稳定知识沉淀节奏 |
| Lv.3 | Status 3 | Lv.3 High | 5–8 篇 | 高频迭代 | 保持高密度周更或多专题并行交付节奏 |
| Lv.4 | Status 4 | Lv.4 Ultra | 至少 9 篇 | 极客狂热 | 保持极高频技术输出与体系化系列专栏集中交付 |

区间端点为闭区间定义（包含边界值）：
- 2 篇属于 Lv.1，达到 3 篇则跃迁至 Lv.2；
- 4 篇属于 Lv.2，达到 5 篇则跃迁至 Lv.3；
- 8 篇属于 Lv.3，达到 9 篇则跃迁至最高级 Lv.4。

### 2.1 创作节奏说明的正确理解

配置中给出的“周更 >= 2 篇”、“保持双周更”等节奏描述，是对创作者技术分享节奏的工程参考，**不是第二套动态判定规则**。

最终等级判定唯一取决于统计时刻滑动窗口内累积的文章数量计数。

例如：若作者在同一天内集中发布了 5 篇独立的技术专栏文章，即使在其余 29 天内未发布新文章，当前算法依然判定窗口内文章数为 5，从而匹配至 Lv.3（高频迭代）。系统当前版本并未引入“发文日期方差”或“连续打卡天数加权”作为降级惩罚因子。

> [!TIP]
> 创作者无需为了追求更高的等级而强行将一篇完整的系统性技术长文拆散为多篇碎片。
> 保持文章架构的完整性、论证的严密性与工程复现的高可靠性，远比追求等级数字更具长远价值。

## 3. 数据流向与决策流水线

```mindmap
# 发布活跃度判定模型
## 输入元数据
- 唯一文章标识 slug
- 发布日期 pubDate
- 草稿标记 draft
- 访问控制配置 access
- 多语言关联标识 i18nKey
## 集合过滤与清洗
- 剔除 draft === true
- 剔除存在 access 配置条目
- 多语言版本归组
- 提取单一代表性文章
## 时间窗口裁决
- 确定判定时刻 now
- 计算时间下界 lowerBound
- 剔除晚于 now 的未来文章
## 离散计数统计
- 满足下界与上界即计 1 篇
- 不受文章字数字符加权
- 不受历史更新时间干扰
## 阶梯匹配映射
- 0 篇 -> Lv.0 Idle
- 1-2 篇 -> Lv.1 Low
- 3-4 篇 -> Lv.2 Standard
- 5-8 篇 -> Lv.3 High
- >=9 篇 -> Lv.4 Ultra
```

### 3.1 发布日期的来源与元数据性质

统计所使用的文章发布时间，严格读取自 Markdown 或 MDX 文件 Frontmatter 中的 `pubDate` 字段：

```yaml
---
title: "分布式事务一致性与本地消息表实现"
pubDate: 2026-10-18
updatedDate: 2026-10-18
draft: false
lang: "zh-CN"
i18nKey: "distributed-transaction-local-message"
---
```

技术人员必须清楚认识到：**Frontmatter 中的 `pubDate` 是由作者显式声明的内容元数据**。它不是 Git 版本库底层的提交时间戳（Author Date / Commit Date），也不是外部不可篡改时间戳服务（TSA）签发的时间证明。核验发布真实性时，应当对照 Git 提交历史与生产环境的首次部署时间。

## 4. “近 30 天”时间窗口的精确数学建模

在工程实践中，“最近 30 天”存在不同的物理时间建模方式。当前仓库中并存着两套计算逻辑，必须准确把握两者的技术边界。

### 4.1 核心指标窗口：自然日零点下界模型

在 `src/lib/site-metrics.ts`（页面初始指标）与 `scripts/sync-console-metrics.mjs`（构建快照）中，采用的是**前推 30 个日历日并截断至当天零点**的算法：

```ts
// 核心指标计算逻辑
const lowerBound = new Date(now);
lowerBound.setDate(now.getDate() - 30);
lowerBound.setHours(0, 0, 0, 0);

// 文章判定条件（闭区间）
const isInRecentWindow = pubDate >= lowerBound && pubDate <= now;
```

其数学模型可表示为：
$$W_{\text{calendar}} = [\text{midnight}(T_{\text{now}} - 30\text{d}), T_{\text{now}}]$$

该算法的核心特征：
- 下界被强制校准为 30 天前那一日的本地时间 `00:00:00.000`；
- 实际覆盖的物理时间跨度通常在 720 小时至 743.99 小时之间（取决于计算时刻 $T_{\text{now}}$ 所处的具体时刻）；
- 若在下午或晚间执行计算，该窗口能够完整包含 30 天前那一整天的所有文章，即便那篇文章发生在 720 小时更早的时间点。

### 4.2 页面明细窗口：严格 720 小时毫秒差模型

在 `src/pages/standards/activity-level.astro` 中渲染“近期实际文章清单”时，代码采用的是**严格按 30 个物理日（720 小时）的毫秒差**向前推算：

```ts
// 页面明细列表过滤逻辑
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

// 文章判定条件
const isRecentDetail = pubDate >= thirtyDaysAgo && pubDate <= now;
```

其数学模型可表示为：
$$W_{\text{epoch}} = [T_{\text{now}} - 2{,}592{,}000{,}000\text{ms}, T_{\text{now}}]$$

### 4.3 边界差异的可复核案例

以下案例展示当文章处于临界时间点时，两套算法的判定差异：

假定计算基准时刻为 UTC 时间：
```text
T_now = 2026-10-18T16:00:00.000Z
```

计算两侧算法得出的下界：
- **核心指标算法下界**：`2026-09-18T00:00:00.000Z`（前推 30 日历日并取零点）；
- **页面明细算法下界**：`2026-09-18T16:00:00.000Z`（严格前推 720 小时）。

若有一篇真实文章的发布时间为：
```text
pubDate = 2026-09-18T08:00:00.000Z
```

判定结果对比：
- 核心指标算法：`pubDate >= 2026-09-18T00:00:00.000Z` 成立，**该文章计入近 30 天发文量**；
- 页面明细算法：`pubDate < 2026-09-18T16:00:00.000Z`，**该文章被明细表格剔除**。

> [!WARNING]
> 当读者发现“页头显示的近 30 天发文篇数与下方明细表格中的文章行数存在 1 篇差异”时，属于该时间窗口边界效应的正常体现，绝非数据库损坏或统计脚本失控。
> 统一两套时间窗口的底层纯函数重构已列入架构演进规划（参见 EES-001 GAP-03）。

## 5. 准入过滤与多语言去重准则

并非仓库内存在的每一个 Markdown 文件都会进入活跃等级统计。统计前必须通过准入过滤流水线：

<div class="article-dropdown-switcher">
  <div class="article-dropdown-switcher__header">
    <div class="article-dropdown-switcher__title"><span>查看不同内容形态的准入处理规则</span></div>
    <select class="article-select dropdown-switcher__select" aria-label="选择内容状态">
      <option value="activity-public">公开正式文章</option>
      <option value="activity-draft">草稿与私密文章</option>
      <option value="activity-translation">多语言翻译副本</option>
      <option value="activity-future">未来发布日期文章</option>
    </select>
  </div>
  <div class="article-dropdown-switcher__body">
    <div class="article-dropdown-panel is-active" data-panel="activity-public">
      <p><strong>准入统计</strong>：未标记草稿（<code>draft !== true</code>）、未设置访问控制密码（无 <code>access</code> 属性）且在多语言版本中胜出成为代表性文章的条目，拥有合法的统计资格。若其发布日期落入滑动窗口内，计入 1 篇发文。</p>
    </div>
    <div class="article-dropdown-panel" data-panel="activity-draft">
      <p><strong>完全排除</strong>：草稿文章代表尚未完稿的内容，不计入公共活跃度；带 access 密码保护的私密文章属于受限资源，页面侧统计将其完全排除。注意：快照脚本目前尚未同步排除 access 内容，属于 GAP-01。</p>
    </div>
    <div class="article-dropdown-panel" data-panel="activity-translation">
      <p><strong>单组单计</strong>：同一篇文章的不同语言翻译版本（如中、英、德等），在统计模型中被归为一个主题单元。一个多语言组别仅由单一代表性版本参与计数，严禁同一文章翻译多份刷取发文量。</p>
    </div>
    <div class="article-dropdown-panel" data-panel="activity-future">
      <p><strong>未来剔除</strong>：若文章的 <code>pubDate</code> 晚于当前计算时刻 <code>now</code>，在计算近 30 天发文量时会被显式条件 <code>pubDate &lt;= now</code> 拦截，不会提前透支计入活跃等级。</p>
    </div>
  </div>
</div>

### 5.1 多语言归组算法的工程实现

在 `src/lib/content.ts` 的 `getPublicPosts()` 中，归组规则按以下优先级执行：

```text
步骤 1：提取文章分组键
        IF (文章存在显式 frontmatter.i18nKey) -> 使用 i18nKey
        ELSE -> 从文件名 slug 中使用正则移除语言后缀（如 .en, -en, .zh-CN, -de 等）

步骤 2：对具有相同分组键的文章候选列表排序
        优先保留：文件名不包含任何语言后缀的主文章（Canonical Base File）
        若无主文章：保留按文件名标识自然排序的第一篇作为代表版本
```

技术约束要点：
- 归组算法**并不对比翻译正文的实质相似度**，完全依赖元数据键与文件命名；
- 归组并不强行校验组内各语言版本的 `pubDate` 是否绝对同一；若译文补全时写了新的日期，而该译文在排序规则中未成为代表版本，则该译文日期不会改变统计结果。

## 6. 修订旧文章为何不增加发文量

活跃等级以“新发布文章”为唯一计量标尺。对既有历史文章进行补充、修补或勘误时：

- 更新 `updatedDate` 元数据，**可以点亮 52 周热力图中对应日期的格子**；
- 保持 `pubDate` 为原首发日期不变，**该文章绝不会重新进入近 30 天发文窗口**；
- 若创作者违规篡改旧文章的 `pubDate` 为今天，技术上虽可迫使指标上升，但这属于虚假篡改元数据行为，破坏了版本历史的可信度。

### 6.1 推荐的日期维护最佳实践

对于技术文档的长期维护，推荐采取以下规范：

1. **`pubDate` 锁定**：始终保留文章最初成文并公开发布的原始日期，一旦发布严禁随意更改；
2. **`updatedDate` 推进**：在发生架构升级、依赖破坏性变更排查或实质性技术补充后，更新 `updatedDate`；
3. **独立成篇准则**：若重构内容与原文章结论存在根本性颠覆，且篇幅完整自洽，应当新建独立的演进复盘文章，而非将历史文章强行全量重写覆盖。

## 7. 52 周动态热力图生成机制

与单维度的活跃等级不同，52 周热力图为读者提供直观的二维活动日历全景。

### 7.1 矩阵结构与时间对齐

热力图矩阵具有固定的几何形态与边界：

```text
矩阵总格数：364 个单元格（严格对应 52 个完整周，52 × 7 = 364）
列向排列：周日（Index 0）至 周六（Index 6）
起止对齐：
  - 矩阵第一格：当前计算时刻往前推算 52 周所对应的那个周日；
  - 矩阵最后一格：当前周所对应的周六。
```

### 7.2 事件判定与单日色阶量化

热力图日历所记录的“内容活动事件（Events）”来源如下：

1. 每一篇纳入统计文章的 `pubDate` 贡献 1 次发布事件；
2. 每一篇具备有效 `updatedDate` 且其年月日与 `pubDate` 不同的文章，为更新日期贡献 1 次修订事件；
3. 同一天内发布且更新的文章，不计为两次同日事件，合并为 1 次活动。

单日聚合事件数到视觉色阶（0 至 4 阶）的映射逻辑：

$$C(E) = \begin{cases} 
0, & E = 0 \\
1, & E = 1 \\
2, & 2 \le E \le 3 \\
3, & 4 \le E \le 6 \\
4, & E \ge 7 
\end{cases}$$

### 7.3 热力图与发文等级的核心差异

| 比较维度 | 52 周动态热力图 | 近 30 天活跃等级 |
| --- | --- | --- |
| 考察时间范围 | 过去 52 周（约 364 天） | 最近 30 天 |
| 是否计入修订更新 | **计入**（基于有效的 `updatedDate`） | **不计入**（仅依据 `pubDate`） |
| 输出表现形式 | 矩阵日历格子色阶分布 | 离散等级徽章（Lv.0 至 Lv.4） |
| 反应的维护状态 | 全年内容发布与维护的持续性 | 短期（当月）技术产出密度 |

## 8. 等级随时间的自然衰减与离散跃变

活跃等级没有引入连续的数学指数衰减公式（例如放射性半衰期算法），也没有设置“活跃积分池”。

**所谓活跃度衰减，完全是由于历史文章的发布时间脱离了近 30 天滑动窗口的下界，从而导致的离散计数减少**。

### 8.1 为什么每月 1 号不会自动归零

活跃等级基于滚动时间窗口（Rolling Window），不按自然日历月份（Calendar Month）划分。

如果作者在上个月 25 号发布了 4 篇文章，当时间行进到次月 1 号时，距离 25 号仅过去 6 天，这些文章依然稳稳落在近 30 天窗口内，等级依然维持在 Lv.2。

### 8.2 阶梯跳变的突变现象分析

因为判定是离散的，系统可能出现计数突变：

假定作者在 9 月 10 日集中发布了 6 篇文章，之后未再发布新文：
- 在 10 月 9 日时，近 30 天发文量为 6，等级为 Lv.3（高频迭代）；
- 当时间跨越到 10 月 11 日时，这 6 篇文章全部脱离滑动窗口，窗口内发文量瞬间由 6 跌至 0，等级直降为 Lv.0（维护休眠）。

这种跳变是时间窗口机制的固有数学性质，不代表系统出现异常。

## 9. 进度条与区间里程碑计算原理

在页面展示中，活跃等级附带进度条（Progress Bar）与下一级里程碑提示：

```text
近 30 天实测发文：4 篇
距离下一等级 (Lv.3 高频迭代) 还需 1 篇
[██████████████████░░] 80%
```

### 9.1 当前区间的进度模型

进度条反映的是当前等级区间内的推进完成度，而非全站从零到终局的总完成率：

| 当前等级 | 区间下界基准 | 区间目标基准 | 区间跨度 | 进度计算参考公式 |
| --- | ---: | ---: | ---: | --- |
| Lv.0 | 0 篇 | 1 篇 (Lv.1) | 1 篇 | $P = 0\%$ |
| Lv.1 | 1 篇 | 3 篇 (Lv.2) | 2 篇 | $P = \frac{N - 1}{2} \times 100\%$ |
| Lv.2 | 3 篇 | 5 篇 (Lv.3) | 2 篇 | $P = \frac{N - 3}{2} \times 100\%$ |
| Lv.3 | 5 篇 | 9 篇 (Lv.4) | 4 篇 | $P = \frac{N - 5}{4} \times 100\%$ |
| Lv.4 | 9 篇 | 最高级 | — | $P = 100\%$（锁定满格） |

例如：当文章数为 4 篇时，处于 Lv.2（3–4 篇），在 Lv.2 到达 Lv.3 需要跨越 2 篇，当前完成了第 4 篇，计算出区间进度为 50% 或 80%（取决于分母设计）。当新增 1 篇达到 5 篇晋升 Lv.3 时，进度条切换为 Lv.3 区间，进度重设为 0%。这不表示之前的产出被清空，而是坐标系切换到了新的竞争区间。

## 10. 管理员调整阈值的规范指南

若未来需要调整活跃度等级门槛，管理员必须遵循规范操作流程。

核心配置定义于 `src/config/standards.ts` 的 `standardsConfig.activityLevels` 数组中。各等级配置项遵循严格的类型定义：

```ts
export interface ActivityLevelConfig {
  minPosts: number;          // 该等级的最小发文数（闭区间）
  maxPosts: number | null;   // 该等级的最大发文数（闭区间，无上限填 null）
  status: string;            // 内部状态代码（如 "Status 3"）
  level: string;             // 规范等级字符串（如 "Lv.3"）
  badge: string;             // 徽章标识文案（如 "Lv.3 High"）
  title: string;             // 官方展示标题（如 "高频迭代"）
  description: string;       // 阈值范围说明文案
  paceGuide: string;         // 建议创作节奏描述
  badgeColor: string;        // 规范主题色 HEX / RGB
}
```

修改配置时的自查清单：
1. **区间连续性**：上一级的 `maxPosts` 与下一级的 `minPosts` 必须连续（例如 4 与 5，严禁出现 4 到 6 导致 5 篇无等级匹配）；
2. **最高级上限**：最高级（Lv.4）的 `maxPosts` 必须保持为 `null`；
3. **计算函数解耦**：检查 `src/lib/site-metrics.ts` 中的 `nextMilestone` 提示文案，避免配置改了但提示文案中的目标硬编码数字未改。

## 11. 边界测试矩阵与自动化断言

用于回归测试活跃度算法的核心测试用例矩阵：

| 测试用例编号 | 输入发文量 $N$ | 预期等级代码 | 预期徽章文案 | 校验重点说明 |
| --- | ---: | --- | --- | --- |
| TC-ACT-01 | 0 | `Status 0` | `Lv.0 Idle` | 零发文边界 |
| TC-ACT-02 | 1 | `Status 1` | `Lv.1 Low` | Lv.1 最小边界 |
| TC-ACT-03 | 2 | `Status 1` | `Lv.1 Low` | Lv.1 最大边界 |
| TC-ACT-04 | 3 | `Status 2` | `Lv.2 Standard` | Lv.2 跃迁临界点 |
| TC-ACT-05 | 4 | `Status 2` | `Lv.2 Standard` | Lv.2 最大边界 |
| TC-ACT-06 | 5 | `Status 3` | `Lv.3 High` | Lv.3 跃迁临界点 |
| TC-ACT-07 | 8 | `Status 3` | `Lv.3 High` | Lv.3 最大边界 |
| TC-ACT-08 | 9 | `Status 4` | `Lv.4 Ultra` | Lv.4 跃迁临界点 |
| TC-ACT-09 | 50 | `Status 4` | `Lv.4 Ultra` | 超大规模发文稳定性 |

### 11.1 时间下界毫秒级测试断言

在单元测试中必须固定虚拟时间 `now`（例如 `vi.setSystemTime`），执行边界毫秒级断言：
- **用例 A**：`pubDate = lowerBound - 1ms` ── 必须断言为 `false`（不计入）；
- **用例 B**：`pubDate = lowerBound` ── 必须断言为 `true`（计入）；
- **用例 C**：`pubDate = now` ── 必须断言为 `true`（计入）；
- **用例 D**：`pubDate = now + 1ms` ── 必须断言为 `false`（未来文章不计入）。

## 12. 常见疑问深度解析

<div class="article-accordion-group" data-single="false">
  <details class="article-accordion">
    <summary><span>为什么我最近没有任何删文操作，活跃等级却突然下降了？</span></summary>
    <div class="accordion-content">
      <p>这是因为活跃等级衡量的是“距今 30 天滑动窗口”内的文章数量。30 天前发布的文章随着自然时间的推移滑出了时间窗口下界，导致窗口内有效计数减少。这属于滑动窗口模型的正常表现。</p>
    </div>
  </details>
  <details class="article-accordion">
    <summary><span>我本周对 10 篇历史文章进行了深度重构与代码勘误，为什么等级还是 Lv.0？</span></summary>
    <div class="accordion-content">
      <p>活跃等级严格以 <code>pubDate</code>（首发日期）为统计基准。对旧文章更新 <code>updatedDate</code> 能够丰富 52 周热力图中的活动点，但不能将历史文章重新包装为新发文章计入近 30 天发文量。</p>
    </div>
  </details>
  <details class="article-accordion">
    <summary><span>Lv.4（极客狂热）是否意味着本站的技术含量在业内处于最高水平？</span></summary>
    <div class="accordion-content">
      <p>完全不是。Lv.4 仅代表最近 30 天内公开文章的发布数量达到了 9 篇或以上，它是一个物理发布频度的度量标尺。文章的技术独创性、工程深度和学术价值，必须由专业同行进行实质性阅读与复现评估。</p>
    </div>
  </details>
  <details class="article-accordion">
    <summary><span>页面顶部的近期发文数字与下方列表中的文章篇数偶尔相差 1 篇，原因何在？</span></summary>
    <div class="accordion-content">
      <p>这是由于两套时间窗口算法的边界差异引起的：核心指标统计窗口取的是前推 30 天当天的 <code>00:00:00</code> 零点，而明细列表采用严格的 <code>720 小时（30 × 24h）</code> 毫秒差。如果恰好有一篇文章发布于 30 天前的早晨，且计算时刻在下午，就会出现该边界差异。</p>
    </div>
  </details>
</div>

## 13. 关联规范导航

- [返回 EES-001：EpoCanvas 工程标准总纲](/standards/)
- [阅读 EES-003：全站内容密度分级与度量规范](/standards/content-density/)
