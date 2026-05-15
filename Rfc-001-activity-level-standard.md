# RFC-001 · 博客生态活跃度等级量化标准

**文档标识符**：`SHIJIANUS-RFC-001`  
**版本**：`v1.0.0`  
**状态**：`ACTIVE`  
**生效日期**：见 Git Tag  
**所有者**：Shijianus Infrastructure Working Group  
**依赖文档**：`SHIJIANUS-RFC-003`（版本治理协议）  
**被依赖文档**：`SHIJIANUS-RFC-002`（内容密度评价标准）

---

## 目录

1. [概述与动机](#1-概述与动机)
2. [术语定义](#2-术语定义)
3. [数据源规范](#3-数据源规范)
4. [核心数学模型](#4-核心数学模型)
5. [防异常机制](#5-防异常机制)
6. [等级分级体系](#6-等级分级体系)
7. [计算实现规范](#7-计算实现规范)
8. [前端集成协议](#8-前端集成协议)
9. [校准与维护](#9-校准与维护)
10. [附录](#10-附录)

---

## 1. 概述与动机

### 1.1 问题陈述

博客平台的"活跃度"在传统实践中依赖人工感知或简单的"最近发布时间"标注。这类方案存在以下系统性缺陷：

- **主观性偏差**：不同风格的创作者（日志型 vs. 深度研究型）在相同的人工标注标准下得到不公平的评价。一个每季度发布一篇深度白皮书的工程师，与一个每周发布三篇短笔记的作者，客观上具有不同但同样真实的"活跃度"，二者不可简单比较。
- **状态腐化**：手动标注无法随时间自动衰减，导致已停更的站点长期保持"活跃"标签。
- **可操控性**：人工标注可被主观干预，失去其作为客观指标的意义。

本 RFC 的目标是建立一套**完全自动化、数学上可再现、抵抗人为操控**的活跃度评价体系，该体系的所有输入均来自机器可读的客观数据源。

### 1.2 设计哲学

> 活跃度评分衡量的是一个博客作为**知识生态系统**的生命力，而非创作者的勤奋程度。一个持续演进的知识库比一个高频低质的内容流更具生态价值。

本标准的三个核心设计原则：

1. **时间衰减优先**：所有历史内容的活跃度贡献随时间平滑衰减，没有例外。
2. **质量加权**：高密度内容（见 RFC-002）在活跃度计算中获得更高权重。
3. **防刷设计**：突发性、低质量的批量更新不得造成活跃度的线性增益。

---

## 2. 术语定义

| 术语 | 符号 | 定义 |
|------|------|------|
| 有效活动时间戳 | $t_{\text{eff}}$ | 某篇文章最后一次"实质性"变更的时间，计算方式见 §3.2 |
| 时间差 | $\Delta t$ | $t_{\text{now}} - t_{\text{eff}}$，单位：天（day） |
| 衰减因子 | $D$ | 基于 $\Delta t$ 计算的 $[0, 1]$ 区间内的实数，反映时效性损耗 |
| 内容密度权重 | $w$ | 由 RFC-002 计算并输出的单篇文章质量系数，范围 $[0.1, 2.0]$ |
| 基线活跃度 | $A_{\text{base}}$ | 存量内容的加权平均衰减得分 |
| 增量活跃度 | $A_{\text{delta}}$ | 滚动窗口内新增内容的贡献得分 |
| 综合活跃度 | $A$ | 最终输出的站点活跃度得分，范围 $[0, 1]$ |
| Trivial Commit | — | 不计入活跃度的微小变更，判定标准见 §3.3 |
| 爆发批次惩罚 | $B_k$ | 同一自然日内第 $k$ 篇文章（0-indexed）所受的对数级折扣 |
| 半衰期 | $T_{1/2}$ | 内容活跃度衰减至初始值 50% 所需的天数 |

---

## 3. 数据源规范

### 3.1 受信任的数据源

本系统**仅接受**以下两个数据源作为活跃度计算的输入：

#### 3.1.1 Frontmatter 元数据

Astro 内容集合的 Frontmatter 中必须包含以下字段：

```yaml
---
title: "文章标题"
pubDate: 2024-03-15T09:00:00+08:00   # 首次发布时间，ISO 8601，含时区
updatedDate: 2024-06-20T14:30:00+08:00  # 最后实质性内容更新时间（可选）
draft: false                            # 草稿状态
---
```

**字段约束**：
- `pubDate` 为必填字段，缺失时该文章不参与活跃度计算，并触发构建警告。
- `updatedDate` 为可选字段。若存在，其值必须 **≥** `pubDate`，否则触发构建错误。
- `updatedDate` 与对应文件的 Git 最后 commit 时间之差若超过 **7 天**，触发 lint 警告（可能存在脱离 Git 流程的直接编辑）。

#### 3.1.2 Git Commit 历史

通过以下命令提取单篇文章的完整 commit 历史：

```bash
git log --follow --format="%H %ai %s" -- "src/content/blog/<slug>.md"
```

输出格式：`<hash> <ISO-timestamp> <subject>`

**关键约定**：
- 仅读取 `main` 分支上的 commit 历史。
- 遵循 RFC-003 的不可变账本原则：系统假设 Git 历史未被篡改。若检测到历史异常（如 commit timestamp 乱序），该文章的 Git 时间线被标记为 `UNTRUSTED`，降级为仅使用 Frontmatter 数据。

### 3.2 有效活动时间戳的确定

对于文章 $i$，其有效活动时间戳 $t_{\text{eff},i}$ 按如下优先级确定：

$$
t_{\text{eff},i} = \max\left( t_{\text{updatedDate},i},\; t_{\text{last\_nontrivial\_commit},i} \right)
$$

其中 $t_{\text{updatedDate},i}$ 在字段不存在时取 $t_{\text{pubDate},i}$。

若两个时间源均不可用（极端情况），该文章以 `t_eff = t_pubDate` 作为保底值。

### 3.3 Trivial Commit 的过滤规则

以下条件满足**任意一个**，该 commit 被标记为 Trivial，不更新 $t_{\text{eff}}$：

| 规则编号 | 判定条件 | 说明 |
|---------|---------|------|
| TC-01 | 变更净行数 `added + deleted ≤ 3` | 拼写修正、标点调整 |
| TC-02 | Commit subject 匹配正则 `^(fix typo\|chore\|style\|fmt\|format\|whitespace\|wip\|temp)` | 语义明确的非内容性提交 |
| TC-03 | 仅修改 Frontmatter 中的 `tags`、`draft` 字段 | 元数据整理，不构成内容更新 |
| TC-04 | Commit subject 包含标签 `[trivial]`、`[meta]`、`[typo]` | 作者主动声明 |

过滤逻辑实现参考见 §7.1。

---

## 4. 核心数学模型

### 4.1 时间衰减函数

单篇文章的时间衰减因子 $D_i$ 定义为：

$$
D_i(\Delta t_i) = e^{-\lambda \cdot \Delta t_i}
$$

其中衰减速率常数 $\lambda$ 由半衰期 $T_{1/2}$ 决定：

$$
\lambda = \frac{\ln 2}{T_{1/2}}
$$

**默认半衰期参数**：$T_{1/2} = 180$ 天。

该选值的工程依据：
- 一个技术栈的主流内容保鲜期约为 6–18 个月；180 天取其下界，确保系统对内容老化保持足够的敏感性。
- $\Delta t = 0$（刚发布）时，$D = 1.0$；$\Delta t = 180$ 时，$D = 0.5$；$\Delta t = 360$ 时，$D = 0.25$；$\Delta t = 720$ 时，$D \approx 0.063$。

不同半衰期设置下的衰减曲线对比：

| $\Delta t$（天） | $T_{1/2}=90$ | $T_{1/2}=180$（默认） | $T_{1/2}=365$ |
|----------------|-------------|----------------------|--------------|
| 0 | 1.000 | 1.000 | 1.000 |
| 30 | 0.794 | 0.891 | 0.943 |
| 90 | 0.500 | 0.707 | 0.833 |
| 180 | 0.250 | 0.500 | 0.707 |
| 365 | 0.063 | 0.250 | 0.500 |
| 720 | 0.004 | 0.063 | 0.250 |

**半衰期的可配置性**：$T_{1/2}$ 应作为项目级常量存储于 `activity.config.ts`，不同定位的博客（技术型 vs. 生活随笔型）可根据实际内容老化速度调整此参数。

### 4.2 基线活跃度 $A_{\text{base}}$

站点基线活跃度反映**存量内容的整体健康度**，定义为所有文章衰减因子的内容密度加权平均：

$$
A_{\text{base}} = \frac{\displaystyle\sum_{i=1}^{N} w_i \cdot D_i(\Delta t_i)}{\displaystyle\sum_{i=1}^{N} w_i}
$$

其中：
- $N$ 为站点内已发布（`draft: false`）的文章总数
- $w_i \in [0.1,\, 2.0]$ 为文章 $i$ 的内容密度权重（由 RFC-002 计算）
- 草稿文章（`draft: true`）不参与计算

**边缘情况处理**：
- 若 $N = 0$，则 $A_{\text{base}} = 0$。
- 若所有文章的 $w_i$ 均为默认值 1.0（RFC-002 未运行），公式退化为等权均值，系统仍可正常工作。

### 4.3 增量活跃度 $A_{\text{delta}}$

增量活跃度衡量**近期内容产出的动能**，基于滚动时间窗口 $T_{\text{window}} = 30$ 天内的新增或实质性更新文章：

#### 4.3.1 批次内爆发惩罚

设 $\mathcal{R}$ 为 $T_{\text{window}}$ 内的文章集合。将 $\mathcal{R}$ 按 `pubDate` 的自然日分组，得到批次集合 $\{G_d\}$。对于批次 $G_d$ 内按时间排列的第 $k$ 篇文章（$k$ 从 0 起算），其经爆发惩罚后的有效权重为：

$$
\tilde{w}_{d,k} = \frac{w_{d,k}}{\ln(k + e)}
$$

其中 $e \approx 2.718$ 为自然常数，确保 $k=0$ 时分母为 1（无惩罚），$k=1$ 时折扣约 37%，$k=4$ 时折扣约 41%，趋近于一个稳定下界而不会无限接近零。

#### 4.3.2 增量得分归一化

$$
A_{\text{delta}} = \min\!\left(1.0,\;\; \frac{1}{W_{\text{norm}}} \sum_{d} \sum_{k} \tilde{w}_{d,k} \cdot \phi\!\left(\Delta t_{d,k}\right)\right)
$$

其中 $\phi(\Delta t)$ 为近期文章的短程衰减因子（使用 $T_{1/2}^{\text{short}} = 30$ 天）：

$$
\phi(\Delta t) = e^{-\frac{\ln 2}{30} \cdot \Delta t}
$$

$W_{\text{norm}}$ 为归一化系数，定义为：在满足当前站点平均密度权重的条件下，每日发布 1 篇文章、持续 30 天所产生的理论最大增量得分：

$$
W_{\text{norm}} = \bar{w} \cdot \sum_{j=0}^{29} e^{-\frac{\ln 2}{30} \cdot j}
$$

### 4.4 综合活跃度 $A$

$$
\boxed{
A = \alpha \cdot A_{\text{base}} + (1 - \alpha) \cdot A_{\text{delta}}
}
$$

**默认混合系数**：$\alpha = 0.65$。

该系数的含义：综合得分中 65% 来自存量内容的长期健康度，35% 来自近期动态。调参建议：

| 博客定位 | 推荐 $\alpha$ 值 | 理由 |
|---------|---------------|------|
| 深度技术知识库 | 0.75–0.80 | 存量内容价值高，更新频率低属正常 |
| 综合技术博客（默认） | 0.65 | 平衡存量与增量 |
| 新闻/动态类博客 | 0.40–0.50 | 时效性权重更大 |
| 学习日记/随笔 | 0.55 | 略偏增量 |

---

## 5. 防异常机制

### 5.1 爆发式更新检测（Burst Detection）

当在连续 $T_{\text{burst}} = 7$ 天内，站点新增文章数 $\Delta N \geq 5$，且这些文章的平均内容密度权重 $\bar{w}_{\text{burst}} < 0.6 \times \bar{w}_{\text{site}}$（低于站点均值的 60%），触发**爆发惩罚模式**：

在爆发惩罚模式下，$A_{\text{delta}}$ 额外乘以惩罚系数：

$$
P_{\text{burst}} = \frac{\bar{w}_{\text{burst}}}{\bar{w}_{\text{site}}} \cdot \frac{1}{\ln(\Delta N)}
$$

这个设计的意图是：低密度内容的批量发布不应等效于高质量内容的持续积累。

### 5.2 迁移性提交豁免

当 commit message 包含以下标签时，该 commit 不触发增量活跃度更新，但**允许重置**受影响文章的 $t_{\text{eff}}$（内容本身仍被认为"存活"）：

```
[migration]   # 内容平台迁移（如 Hexo → Astro）
[restructure] # 目录结构重组
[reformat]    # 全量格式化（Markdown 格式统一）
[init]        # 初始导入
```

### 5.3 时间戳异常检测

在执行计算前，脚本对所有文章的时间戳进行以下合法性检查：

| 检查项 | 异常条件 | 处理方式 |
|-------|---------|---------|
| 未来时间 | `pubDate > t_now + 24h` | 排除计算，触发警告（合理的预发布调度除外） |
| 倒序更新 | `updatedDate < pubDate` | 触发构建错误，阻断计算 |
| Git 历史倒序 | commit A 时间戳早于 commit B，但 A 在 B 之后 | 标记该文件为 `UNTRUSTED`，仅用 Frontmatter |
| 极端过去值 | `pubDate < 2000-01-01` | 警告并强制设为 `pubDate = 2000-01-01` |

---

## 6. 等级分级体系

### 6.1 等级定义

基于综合活跃度得分 $A \in [0, 1]$，定义以下五个等级：

---

### ⬛ 等级 S：持续演进（Actively Evolving）

**阈值**：$A \geq 0.82$

**生态状态描述**：

该站点处于知识生态系统的最健康状态。不仅有持续的新内容产出，且存量内容保持着较高的时效性。作者对博客本身有清晰的主题战略，文章之间形成可见的知识脉络。达到 S 级的站点通常满足：近 90 天内有实质性更新、内容密度权重均值 $\bar{w} \geq 1.0$、站点内容树具有内在的结构一致性。

**前端表现**：首页醒目位置展示"持续更新中"徽章；RSS Feed 标注高活跃级别；在任何站点目录或聚合系统中享有最高展示权重。

---

### 🟦 等级 A：稳定活跃（Regularly Active）

**阈值**：$0.62 \leq A < 0.82$

**生态状态描述**：

站点保持定期更新，内容质量在线，但存在以下一种或多种情况：更新节奏不均匀（季节性爆发与沉默交替）、部分存量内容开始显现衰减、主题覆盖范围较宽导致密度权重均值偏低。这是大多数认真维护的技术博客的正常区间。对读者而言，这里的内容仍然可信赖，时效性基本满足需求。

**前端表现**：展示"活跃更新"状态；正常推荐权重。

---

### 🟨 等级 B：间歇维护（Intermittently Maintained）

**阈值**：$0.38 \leq A < 0.62$

**生态状态描述**：

更新进入间歇模式，存量内容的衰减已无法被近期新增所弥补。站点仍有价值，特别是对于搜索特定历史技术内容的读者，但时效性风险开始显著。可能的成因：作者转换了主要创作平台、工作重心转移、或站点进入"被动维护"阶段。

**前端表现**：展示"偶尔更新"状态；推荐权重降低；在内容聚合页面降低优先级。

---

### 🟧 等级 C：低活跃（Low Activity）

**阈值**：$0.15 \leq A < 0.38$

**生态状态描述**：

站点活跃度严重不足。最近一次实质性更新可能已超过 12 个月。内容价值以"历史档案"而非"当前参考"的形式存在。读者应对站内内容的时效性保持谨慎。

**前端表现**：展示"历史内容"警告标注；在推荐系统中显著降权；若聚合到外部目录，附加最后活跃时间标注。

---

### ⬜ 等级 D：存档状态（Archived / Inactive）

**阈值**：$A < 0.15$

**生态状态描述**：

站点已进入事实上的只读存档状态。所有内容的衰减因子均已极低，近期无任何有效更新记录。站点可能仍有技术或历史参考价值，但作为活跃知识源的功能已基本丧失。

**前端表现**：展示显眼的"归档站点"标签；禁用常规推荐流；若对外公开，在搜索结果中降低权重并在摘要中明示最后更新时间。

---

### 6.2 等级迁移规则

等级变化采用**滞后判定机制**，防止因单篇文章的发布或衰减导致等级频繁震荡：

- **升级条件**：新计算的 $A$ 值连续 **3次**（每次计算间隔不少于 **24小时**）超过升级阈值，才触发升级。
- **降级条件**：新计算的 $A$ 值连续 **2次** 低于降级阈值，触发降级。
- **降级宽限期**：从 S 降至 A、从 A 降至 B 时，给予 **14天**的宽限期，期间等级保持不变，仅在前端标注"活跃度关注中"。

---

## 7. 计算实现规范

### 7.1 核心脚本接口

```typescript
// scripts/activity-score.ts

export interface ArticleActivityInput {
  slug: string;
  pubDate: Date;
  updatedDate?: Date;
  isDraft: boolean;
  contentDensityWeight: number;  // 来自 RFC-002，默认值 1.0
  gitCommits: GitCommit[];
}

export interface GitCommit {
  hash: string;
  timestamp: Date;
  subject: string;
  linesAdded: number;
  linesDeleted: number;
  isTrivial?: boolean;          // 由 classifyCommit() 预处理
}

export interface SiteActivityResult {
  score: number;                 // A ∈ [0, 1]
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  baseScore: number;             // A_base
  deltaScore: number;            // A_delta
  articlesAnalyzed: number;
  burstDetected: boolean;
  computedAt: Date;
  warnings: string[];
}

/**
 * 判定单个 commit 是否为 Trivial
 */
export function classifyCommit(commit: GitCommit): boolean {
  const { subject, linesAdded, linesDeleted } = commit;
  
  // TC-01: 净变更行数 <= 3
  if (linesAdded + linesDeleted <= 3) return true;
  
  // TC-02: 语义化 subject 模式匹配
  const trivialPattern = /^(fix typo|chore|style|fmt|format|whitespace|wip|temp)/i;
  if (trivialPattern.test(subject)) return true;
  
  // TC-04: 显式标签
  const trivialTagPattern = /\[(trivial|meta|typo|migration|restructure|reformat|init)\]/i;
  if (trivialTagPattern.test(subject)) return true;
  
  return false;
}

/**
 * 计算单篇文章的有效活动时间戳
 */
export function computeEffectiveTimestamp(article: ArticleActivityInput): Date {
  const nonTrivialCommits = article.gitCommits
    .filter(c => !c.isTrivial)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  const lastCommitTime = nonTrivialCommits[0]?.timestamp ?? article.pubDate;
  const declaredUpdateTime = article.updatedDate ?? article.pubDate;
  
  return new Date(Math.max(lastCommitTime.getTime(), declaredUpdateTime.getTime()));
}

/**
 * 主计算函数
 */
export function computeSiteActivityScore(
  articles: ArticleActivityInput[],
  config: ActivityConfig = DEFAULT_CONFIG
): SiteActivityResult {
  const now = new Date();
  const warnings: string[] = [];
  
  const publishedArticles = articles.filter(a => !a.isDraft);
  if (publishedArticles.length === 0) {
    return { score: 0, grade: 'D', baseScore: 0, deltaScore: 0,
             articlesAnalyzed: 0, burstDetected: false, computedAt: now, warnings };
  }
  
  const lambda = Math.LN2 / config.halfLifeDays;
  
  // === 计算 A_base ===
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const article of publishedArticles) {
    const tEff = computeEffectiveTimestamp(article);
    const deltaDays = (now.getTime() - tEff.getTime()) / 86_400_000;
    const decay = Math.exp(-lambda * deltaDays);
    
    weightedSum += article.contentDensityWeight * decay;
    totalWeight += article.contentDensityWeight;
  }
  
  const A_base = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  // === 计算 A_delta ===
  const windowStart = new Date(now.getTime() - config.deltaWindowDays * 86_400_000);
  const recentArticles = publishedArticles.filter(a => a.pubDate >= windowStart);
  
  // 按自然日分组
  const byDay = new Map<string, ArticleActivityInput[]>();
  for (const article of recentArticles) {
    const dayKey = article.pubDate.toISOString().split('T')[0];
    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey)!.push(article);
  }
  
  // 对每个批次内按发布时间排序，应用爆发惩罚
  const shortLambda = Math.LN2 / 30;
  let rawDelta = 0;
  
  for (const [, dayArticles] of byDay) {
    dayArticles.sort((a, b) => a.pubDate.getTime() - b.pubDate.getTime());
    for (let k = 0; k < dayArticles.length; k++) {
      const article = dayArticles[k];
      const deltaDays = (now.getTime() - article.pubDate.getTime()) / 86_400_000;
      const phi = Math.exp(-shortLambda * deltaDays);
      const penalizedWeight = article.contentDensityWeight / Math.log(k + Math.E);
      rawDelta += penalizedWeight * phi;
    }
  }
  
  // 归一化
  const wBar = totalWeight / publishedArticles.length;
  let W_norm = 0;
  for (let j = 0; j < config.deltaWindowDays; j++) {
    W_norm += wBar * Math.exp(-shortLambda * j);
  }
  
  const A_delta = Math.min(1.0, W_norm > 0 ? rawDelta / W_norm : 0);
  
  // === 爆发检测 ===
  const burstDetected = detectBurst(recentArticles, publishedArticles, config);
  
  let A = config.alpha * A_base + (1 - config.alpha) * A_delta;
  if (burstDetected) {
    const burstPenalty = computeBurstPenalty(recentArticles, publishedArticles);
    A = A * burstPenalty;
    warnings.push(`Burst pattern detected. Score penalized by factor ${burstPenalty.toFixed(3)}.`);
  }
  
  A = Math.max(0, Math.min(1, A));
  
  return {
    score: A,
    grade: scoreToGrade(A),
    baseScore: A_base,
    deltaScore: A_delta,
    articlesAnalyzed: publishedArticles.length,
    burstDetected,
    computedAt: now,
    warnings,
  };
}

function scoreToGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 0.82) return 'S';
  if (score >= 0.62) return 'A';
  if (score >= 0.38) return 'B';
  if (score >= 0.15) return 'C';
  return 'D';
}
```

### 7.2 配置文件规范

```typescript
// activity.config.ts（项目根目录）

export interface ActivityConfig {
  halfLifeDays: number;       // T_1/2，默认 180
  alpha: number;              // 混合系数，默认 0.65
  deltaWindowDays: number;    // 增量窗口，默认 30
  burstThresholdCount: number;  // 爆发检测阈值，默认 5
  burstThresholdDays: number;   // 爆发检测窗口，默认 7
  burstDensityRatio: number;  // 爆发密度比阈值，默认 0.6
  hysteresisUpCount: number;  // 升级所需连续次数，默认 3
  hysteresisDownCount: number;  // 降级所需连续次数，默认 2
  gradeCooldownDays: number;  // 降级宽限期天数，默认 14
}

export const DEFAULT_CONFIG: ActivityConfig = {
  halfLifeDays: 180,
  alpha: 0.65,
  deltaWindowDays: 30,
  burstThresholdCount: 5,
  burstThresholdDays: 7,
  burstDensityRatio: 0.6,
  hysteresisUpCount: 3,
  hysteresisDownCount: 2,
  gradeCooldownDays: 14,
};
```

### 7.3 计算触发时机

| 触发场景 | 计算范围 | 缓存策略 |
|---------|---------|---------|
| 构建时（`astro build`） | 全量计算所有文章 | 结果写入 `public/activity-cache.json` |
| 新文章发布后 | 增量计算，更新受影响文章 | 更新缓存中的对应条目 |
| 定时任务（每日凌晨 2:00） | 全量重算（衰减因子变化） | 覆盖写入缓存 |
| 开发模式（`astro dev`） | 跳过 Git 历史读取，仅用 Frontmatter | 不写入缓存 |

---

## 8. 前端集成协议

### 8.1 数据暴露格式

活跃度计算结果通过 Astro 的内容集合工具函数暴露，格式如下：

```typescript
// src/utils/activity.ts
export interface ActivitySummary {
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  score: number;
  lastComputedAt: string;  // ISO 8601
  articleCount: number;
  burstDetected: boolean;
}
```

### 8.2 等级徽章渲染规范

| 等级 | 徽章文案 | 颜色 Token | 是否展示分值 |
|------|---------|-----------|------------|
| S | 持续演进 | `--color-grade-s` | 否（防止过度解读）|
| A | 稳定活跃 | `--color-grade-a` | 否 |
| B | 间歇维护 | `--color-grade-b` | 否 |
| C | 历史内容 | `--color-grade-c` | 展示最后活跃时间 |
| D | 归档站点 | `--color-grade-d` | 展示最后活跃时间 |

---

## 9. 校准与维护

### 9.1 参数校准周期

建议每 **6个月** 进行一次参数回顾，检查以下指标：

- 当前等级分布是否合理（S 级不应超过总站点数的 15%，D 级不应超过 40%）
- 爆发检测的误报率（回顾被标记的 burst 事件是否为真实异常）
- 半衰期参数与实际内容老化速度的吻合程度

### 9.2 模型版本化

当 $\lambda$、$\alpha$ 等核心参数发生变化时，必须：
1. 在 `CHANGELOG.md` 中记录参数变更及原因
2. 对历史数据重新全量计算，对比前后等级分布差异
3. 若等级分布变化超过 20%，视为重大参数变更，触发 RFC-001 的 MINOR 版本自增

---

## 10. 附录

### A. 快速参考：关键公式汇总

$$
\lambda = \frac{\ln 2}{T_{1/2}}, \quad D_i = e^{-\lambda \cdot \Delta t_i}
$$

$$
A_{\text{base}} = \frac{\sum_{i} w_i D_i}{\sum_{i} w_i}, \quad \tilde{w}_{d,k} = \frac{w_{d,k}}{\ln(k+e)}, \quad A = \alpha A_{\text{base}} + (1-\alpha) A_{\text{delta}}
$$

### B. 默认参数速查表

| 参数 | 符号 | 默认值 | 可调范围 |
|------|------|--------|---------|
| 半衰期 | $T_{1/2}$ | 180 天 | 60–365 天 |
| 混合系数 | $\alpha$ | 0.65 | 0.40–0.80 |
| 增量窗口 | $T_{\text{window}}$ | 30 天 | 14–60 天 |
| 内容密度权重范围 | $w$ | [0.1, 2.0] | 由 RFC-002 定义 |

### C. 变更历史

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v1.0.0 | 见 Git Tag | 初始发布 |

---

*本文档受 RFC-003 版本治理协议约束。任何对核心公式或等级阈值的修改须经由正式 RFC 修订流程，并记录于变更历史。*
