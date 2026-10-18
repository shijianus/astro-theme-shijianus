# AGENTS.md

> EpoCanvas 规范文档、指标架构与交付核验协议。
>
> 本文件面向在本仓库内工作的 AI Agent、开发者与文档维护者。
> 本文件定义执行约束，不代表其中列出的测试已经执行。
> 任何“通过”“已部署”“已修复”结论，都必须附有当前任务的直接证据。

## 1. 适用范围与维护原则

本协议重点覆盖以下规范页面及其关联链路：

| 文档 | 页面地址 | 内容文件建议位置 |
| --- | --- | --- |
| EES-001 工程标准总纲 | `/standards/` | `docs/standards/index.md` |
| EES-002 活跃等级规范 | `/standards/activity-level/` | `docs/standards/activity-level.md` |
| EES-003 内容密度规范 | `/standards/content-density/` | `docs/standards/content-density.md` |

关联代码包括：

- `src/config/standards.ts`
- `src/lib/content.ts`
- `src/lib/site-metrics.ts`
- `scripts/sync-console-metrics.mjs`
- `functions/api/console/data.ts`
- `src/content.config.ts`
- `src/pages/standards/`
- `src/pages/posts/[slug].astro`
- `src/layouts/BlogLayout.astro`
- `src/components/ContentFeatureEnhancer.astro`
- `src/components/MindmapEnhancer.astro`
- `src/styles/markdown-enhancements.css`

执行原则：

1. 先读源码，再写说明。
2. 将现有行为、发现的问题、拟议改进分开记录。
3. 不为让文档显得先进而虚构算法、数据库链路或性能结果。
4. 不通过添加大量无关媒体组件牺牲规范的可读性。
5. 不在文档任务中顺便修改支付、认证、评论等无关业务。
6. 不把仓库内历史报告中的成功记录当作当前任务的测试结果。

### 1.1 原有 AGENTS.md 的处理

若仓库已有 AGENTS.md：

1. 在修改前读取完整文件及适用目录下的补充规范。
2. 将原有历史任务、Commit Hash 与部署记录归档到项目认可的位置。
3. 不丢弃历史记录，不伪造其执行状态。
4. 对与本文件冲突的发布要求，先说明冲突，再取得维护者确认。
5. 外部平台的权限要求与用户授权边界始终优先遵守。

本文件不授权自动推送、生产部署、数据库写入或真实支付测试。

## 2. 证据基线与可信度分类

文档初始整理基于以下源码检查基线：

- 仓库：`shijianus/astro-theme-shijianus`
- 起始提交：`85d391a1580bdd271b2325cb7a495497de8ab00e`
- 检查日期：2026-10-18
- 检查方式：远程源码阅读
- 未执行项目：本地构建、自动化浏览器测试、生产数据库核验、生产部署

后续执行者必须重新记录当前 HEAD，不得假设仓库未变化。

所有交付结论使用以下分类：

| 标识 | 含义 | 可接受证据 |
| --- | --- | --- |
| SOURCE-VERIFIED | 已从源码确认 | 文件、函数、分支条件、提交版本 |
| TEST-VERIFIED | 已实际运行测试 | 命令、退出码、断言结果、日志 |
| LIVE-VERIFIED | 已验证部署环境 | 域名、部署版本、时间、请求或交互记录 |
| KNOWN-GAP | 已发现但未解决的差异 | 两侧实现与可复现场景 |
| PROPOSED | 建议方案，尚未落地 | 设计说明、预期结果、迁移条件 |
| BLOCKED | 因权限或环境未完成 | 阻塞原因与受影响范围 |

禁止将 SOURCE-VERIFIED 写成 LIVE-VERIFIED。

## 3. 当前指标架构

### 3.1 架构不是“每次请求查询 D1”

当前规范指标主要来自 Markdown/MDX 文件及构建生成的 JSON 快照。

链路分为三条：

```text
页面构建链路
Astro Content Collection
  → getPublicPosts()
  → calculateSiteMetrics()
  → standards 页面初始 HTML

快照构建链路
src/content/posts 下的文件
  → scripts/sync-console-metrics.mjs
  → public/data/console-metrics.json

边缘 API 链路
GET /api/console/data
  → ASSETS 读取 JSON，或回退打包快照
  → 根据请求时刻重算部分时间相关指标
  → 返回 JSON
```

在已检查的 `functions/api/console/data.ts` 内，没有发现为这些文章指标查询 D1 的逻辑。

因此禁止以下表述：

- 所有指标每次请求都由 D1 实时计算。
- 边缘节点每次都扫描仓库内全部 Markdown 正文。
- servedAt 代表所有文章内容已在该时刻重新扫描。
- API 返回成功即可证明快照过滤规则正确。

D1 是否承载其他业务，应针对对应接口另行核验，不可从本指标接口推导。

### 3.2 构建期与请求期职责

| 字段或对象 | 构建期生成 | 请求期处理 |
| --- | --- | --- |
| 文章清单 | 是 | 使用已有快照 |
| 总篇数 | 是 | 没有重新扫描正文 |
| 总字数 | 是 | 没有重新统计正文 |
| 平均篇幅 | 是 | 没有重新统计正文 |
| 预计总阅读分钟 | 是 | 没有重新统计正文 |
| 近 30 天发文数 | 是 | 根据快照日期重新计算 |
| 活跃等级 | 是 | 根据重新计算的篇数匹配 |
| 运行天数 | 是 | 根据当前时间重新计算 |
| 热力图 | 是 | 根据快照记录重建日历 |
| generatedAt | 快照生成时刻 | 保留快照信息 |
| servedAt | 不适用 | API 处理时刻 |

### 3.3 缓存说明

当前 API 响应设置：

```http
Cache-Control: public, max-age=60, s-maxage=300
```

这些数值表示响应声明的缓存策略，不等于实测缓存命中率，也不保证所有客户端都严格按同一方式处理。

文档应使用“请求时重新计算部分字段，响应可能被缓存”，而不是“毫秒级绝对实时”。

## 4. 内容筛选规则核验

### 4.1 页面侧公共文章集合

检查 `getPublicPosts()`：

1. 先排除 `draft: true`。
2. 排除带有 `access` 配置的文章。
3. 默认执行多语言去重。
4. 优先使用显式 `i18nKey` 作为分组键。
5. 未提供 `i18nKey` 时，使用移除已识别语言后缀的文章标识。
6. 同组候选中，优先保留无语言后缀的文件。
7. 未发现按发布日期排除未来文章的通用过滤。

注意：

- `access: {}` 也属于存在 access 配置。
- `preferredLocale` 虽出现在参数类型中，但不能据此声称已实现语言偏好选择。
- 同组日期一致并不是 `getPublicPosts()` 自动强制的约束。
- 语言去重不等于内容相似度去重。

### 4.2 快照脚本差异

检查 `scripts/sync-console-metrics.mjs` 时必须单独验证：

- 当前读取的是文章目录顶层的 `.md` 和 `.mdx` 文件。
- 当前使用自定义 YAML Frontmatter 提取逻辑。
- 当前排除草稿，但没有与页面侧等价的 access 排除步骤。
- 当前按文件名归一化后的 canonical 分组，没有使用显式 i18nKey。
- 当前未实现语义重复内容检测。
- 当前没有通用的未来文章总量过滤。

上述差异必须记录为 KNOWN-GAP。

尤其需要检查：受限文章的标题、地址、分类或日期，是否进入公开 JSON 快照。不得以“没有暴露正文”为由忽略元数据泄漏。

### 4.3 推荐统一方向

以下属于 PROPOSED，不得写成已实现：

1. 提取共享的内容筛选与分组模块。
2. 页面计算与快照生成使用同一份输入数据。
3. 明确未来文章是否可以进入全站总量。
4. 对解析失败采取可见的错误报告，而非静默跳过。
5. 保留完整 ISO 时间戳，展示时再格式化为日期。
6. 为同一 i18nKey 的代表版本定义稳定选择规则。

## 5. 活跃等级核验

### 5.1 当前阈值

| 等级 | 篇数 |
| --- | --- |
| Lv.0 | 0 |
| Lv.1 | 1–2 |
| Lv.2 | 3–4 |
| Lv.3 | 5–8 |
| Lv.4 | 至少 9 |

真实配置字段：

- `activityLevels`
- `minPosts`
- `maxPosts`
- `status`
- `level`
- `badge`
- `title`
- `description`
- `paceGuide`
- `badgeColor`

禁止将不存在的 `activityLevelTiers`、`min`、`max` 写成当前配置接口。

### 5.2 当前时间窗口

`calculateSiteMetrics()` 与快照脚本采用：

```ts
const lowerBound = new Date(now);
lowerBound.setDate(now.getDate() - 30);
lowerBound.setHours(0, 0, 0, 0);
```

随后比较：

```ts
pubDate >= lowerBound && pubDate <= now
```

这不是严格的“前推 720 小时”。

`activity-level.astro` 中的明细列表则使用：

```ts
new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
```

两者存在边界差异，必须说明，不可宣称完全同源一致。

还须测试：

- 运行环境时区。
- 夏令时切换。
- 下界当天零点与当前时刻的差异。
- 快照日期截断后，文章在同一天内的时刻信息丢失。

### 5.3 发布与更新分离

活跃等级统计 `pubDate`，不使用 `updatedDate` 增加发文篇数。

热力图可记录：

- 首次发布事件。
- 与发布日期不同的更新日期事件。

当前文章模型只有一个 updatedDate，不能还原完整编辑历史。

禁止写成“每次修改都会形成独立持久化事件”。

## 6. 内容密度核验

### 6.1 当前阈值

| 等级 | 四舍五入后的平均字数 |
| --- | --- |
| Lv.1 | 0–800 |
| Lv.2 | 801–1500 |
| Lv.3 | 1501–3000 |
| Lv.4 | 至少 3001 |

真实配置字段：

- `contentDensityLevels`
- `minAvgWords`
- `maxAvgWords`
- `readingExpectation`

禁止将不存在的 `contentDensityTiers` 写成真实配置字段。

### 6.2 当前字数算法

当前 `estimateWordCount()` 的行为：

```ts
const plain = entry.body
  .replace(/[`#>*_[\]\(\)!-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

if (!plain) return 0;

const compact = plain.replace(/\s+/g, '');
const latinTokens = plain.split(/\s+/).filter(Boolean).length;

return Math.max(compact.length, latinTokens);
```

文档必须准确描述为：

> 对正文做部分符号清理与空白归一化后，使用紧凑字符串长度和空白分段数的较大值作为估算。

不得描述为已经实现：

- Markdown AST 纯文本提取。
- CJK 字符加英文单词的混合分词。
- 图片 URL 与 Base64 严格剔除。
- 代码词法分析。
- 公式等效字数加权。
- UTF-8 字节计数。
- Unicode 字素簇计数。

JavaScript 字符串 length 使用 UTF-16 码元长度。部分 emoji 或扩展字符可能不等于一个计数单位。

### 6.3 聚合顺序

当前算法：

```text
逐篇计算字数
  → 求和得到 totalWords
  → 除以去重后的 totalPosts
  → Math.round()
  → 匹配密度等级
```

零篇文章时，平均字数为 0，匹配到 Lv.1。

展示时应补充“暂无样本”，避免将空站描述为已有微动态内容。

### 6.4 阅读时间

默认逐篇估算：

```ts
Math.max(1, Math.round(wordCount / 220))
```

总阅读时间是逐篇分钟数求和。

不得默认将其写成：

```text
round(totalWords / 220)
```

也不得将预计阅读时间写成用户实际停留时长。

## 7. 已发现的一致性问题

执行者应重新核对以下项目，不得默认已修复。

| 编号 | 问题 |
| --- | --- |
| GAP-01 | 页面公共文章筛选与快照脚本的 access 过滤不一致 |
| GAP-02 | 页面按 i18nKey 分组，快照按文件名 canonical 分组 |
| GAP-03 | 主指标窗口与活跃文章明细窗口不一致 |
| GAP-04 | 快照只保存日期，丢失时分秒 |
| GAP-05 | siteStartDate 配置与多个硬编码 START_DATE 并存 |
| GAP-06 | 下一等级提示与进度公式存在硬编码阈值 |
| GAP-07 | 总纲密度展示条件使用的字符串与配置 status 不完全一致 |
| GAP-08 | 密度页面存在无条件宣称达到最高等级的文字 |
| GAP-09 | 代表文章富媒体标签是固定文字，不是实际能力检测 |
| GAP-10 | 原规范页部分架构版本、性能数字与当前代码证据不匹配 |
| GAP-11 | BlogLayout 中部分总量直接遍历 allPosts，需核对与公开去重口径是否一致 |
| GAP-12 | package.json 的 test 主要运行品牌脚本，不能视为指标测试套件 |
| GAP-13 | 快照脚本使用 js-yaml，应检查是否有明确的直接依赖声明 |

问题解决前，公开文章应解释边界，不得宣称“所有数据严格一致”。

## 8. Markdown 与 UI 书写规范

### 8.1 文件格式

- 使用 UTF-8。
- 使用 LF 换行。
- 使用 `.md`，不将其直接重命名为 `.mdx`。
- 使用 YAML Frontmatter。
- 每篇正文只保留一个 H1。
- 正文主结构使用 H2 与 H3。
- 标题不得跳级。
- 不依赖未经确认的自定义 shortcode。
- 不使用 Hexo 的 `{% ... %}` 标签。
- 不将 Starlight 的 `:::tip` 当成本主题已支持语法。
- 不使用 React 的 className 或 JSX 事件表达式。

### 8.2 可使用的增强结构

根据现有示例与组件，允许采用：

- GFM 表格与任务清单。
- `[!NOTE]`、`[!TIP]`、`[!IMPORTANT]`、`[!WARNING]`。
- 原生 details 与 summary。
- `article-tabs` 标签页。
- `article-dropdown-switcher` 下拉面板。
- `article-accordion-group` 折叠组。
- `article-bookmark` 导航卡。
- `badge` 系列标签。
- `mindmap` 围栏代码块。
- 常规语言代码块。

语法高亮支持不代表代码已经执行。

### 8.3 HTML 与 Markdown 混排

HTML 容器内部优先使用完整 HTML 标签：

```html
<div class="article-aside">
  <p>说明文字中使用 <code>字段名</code>，不要假设这里会继续解析 Markdown。</p>
</div>
```

不要这样写：

```html
<div class="article-aside">
  ## 不应依赖这一行被解析为标题
</div>
```

代码围栏放在 HTML 容器外，或使用转义后的 pre/code。

所有交互选项必须满足：

- 标签页按钮数量与面板数量一致。
- 下拉 option 的 value 与面板 data-panel 一致。
- 每组仅有一个初始 is-active。
- button 明确写 `type="button"`。
- HTML 属性使用普通半角引号。
- 同页显式 id 不重复。
- 不在读者端生成假的“审计通过”状态。
- 不使用会误导读者的演示进度条。

### 8.4 视觉约束

- 复用主题现有颜色、边框和圆角。
- 不给全文注入全局 CSS 重置。
- 不为炫技添加自动播放视频或音频。
- 暗色优化不得无关地改变浅色布局。
- 若新增导航卡网格，桌面每行最多两张，移动端一列。
- 表格只允许在自身容器横向滚动，不应造成整页横向溢出。
- 目录层级依靠字号、字重和间距区分，不添加“一级目录”等人工标签。
- 检查 prefers-reduced-motion 的合理降级。
- 不为文档新增高开销背景模糊、滚动监听或持续动画。

## 9. 三个现有路由的接入方式

### 9.1 推荐：内容与路由分离

将三篇文档放入：

```text
docs/
└── standards/
    ├── index.md
    ├── activity-level.md
    └── content-density.md
```

保留：

```text
src/pages/standards/
├── index.astro
├── activity-level.astro
└── content-density.astro
```

这些 Markdown 不进入 posts 集合，因此不会因为发布规范文档本身而抬高博客发文数或改变内容密度。

### 9.2 路由适配参考

下面是 index.astro 的完整基础适配形式。

它负责呈现静态规范正文，不包含实时指标仪表盘。

```astro
***
import { getCollection } from 'astro:content';
import BlogLayout from '../../layouts/BlogLayout.astro';
import ContentFeatureEnhancer from '../../components/ContentFeatureEnhancer.astro';
import { createSidebarData } from '../../lib/theme.ts';
import {
  Content,
  frontmatter,
} from '../../../docs/standards/index.md';

const allPosts = await getCollection('posts');
const sidebarData = createSidebarData(allPosts);
***

<BlogLayout
  title={frontmatter.title}
  description={frontmatter.description}
  showAside={false}
  pageType="standards"
  sidebarData={sidebarData}
  lang="zh-CN"
>
  <article
    id="article-container"
    class="article-body post-content"
    data-content-features="true"
    data-lang="zh-CN"
  >
    <Content />
  </article>

  <ContentFeatureEnhancer lang="zh-CN" />
</BlogLayout>
```

其余两个路由分别修改 Markdown 导入路径：

| 路由文件 | 导入路径 |
| --- | --- |
| `activity-level.astro` | `../../../docs/standards/activity-level.md` |
| `content-density.astro` | `../../../docs/standards/content-density.md` |

注意：

1. BlogLayout 已引入全局 Markdown 样式、代码增强与思维导图增强，不应重复挂载相同全局增强器。
2. ContentFeatureEnhancer 需要按页面实际情况挂载，避免重复初始化。
3. Markdown Frontmatter 中的 toc、mindmap 等字段不会因为直接导入就自动实现所有页面功能。
4. 当前标准页面使用 `showAside={false}`；如需独立目录组件，应另行接入。
5. 不得在未检查选择器与初始化时机前，保证所有交互已经可用。
6. 以上适配必须通过实际构建与浏览器测试后才能标记为 TEST-VERIFIED。

### 9.3 如果改为博客文章

也可以将文件放入 `src/content/posts/`，但会产生不同后果：

- 路由通常进入 `/posts/`。
- 三篇文章会参与文章集合统计。
- 发文数与平均篇幅可能变化。
- 不能仅添加一个未经支持的 permalink 字段就声称保留原标准地址。

采用该方案前，必须得到维护者明确选择。

## 10. 自动化核验要求

### 10.1 环境基线

开始前执行并记录：

```bash
git status --short
git rev-parse HEAD
git branch --show-current
git remote -v
node --version
npm --version
```

package.json 声明 Node.js 至少为 22.12.0。

但脚本直接导入 TypeScript，仍需核验实际 Node 版本、类型剥离支持与启动参数。不得仅凭 engines 声明保证脚本可以运行。

### 10.2 基础命令

在隔离工作区执行：

```bash
npm ci
npm run console:sync
npm run build:static
git diff --check
git status --short
```

注意：

- console:sync 会改写生成快照。
- 构建涉及广播、翻译、指标同步等前置脚本。
- 执行前检查脚本是否访问外部服务、产生费用或更改文件。
- 不将生成文件的变化混入文档提交而不解释原因。
- npm test 不能替代指标算法专项测试。
- 不假设仓库已有 lint、typecheck 等脚本。

### 10.3 指标测试矩阵

| 测试组 | 必测用例 |
| --- | --- |
| 活跃阈值 | 0、1、2、3、4、5、8、9 |
| 密度阈值 | 0、800、801、1500、1501、3000、3001 |
| 四舍五入 | 800.49、800.50、1500.49、1500.50、3000.49、3000.50 |
| 草稿过滤 | draft 为 true 与 false |
| 访问控制 | 无 access、空 access、带密码或地区配置的 access |
| 多语言 | 有无 i18nKey、无主文件、不同后缀、显式 key 与文件名不一致 |
| 时间窗口 | 下界前 1ms、恰好下界、下界后 1ms、当前时刻、未来时刻 |
| 时区 | UTC 与至少一个非 UTC 环境 |
| 更新记录 | 同日更新、跨日更新、多次覆盖 updatedDate |
| 字数 | 空正文、中文、英文、emoji、代码、HTML、图片 URL |
| 聚合 | 零篇、单篇、多篇、平均值边界 |
| 快照一致性 | 页面集合与生成脚本的入选文章 ID 对照 |
| 安全 | 受限内容元数据不进入公开产物 |

先固定 now，再比较不同实现。禁止让多个断言分别读取真实当前时间而产生不稳定边界。

### 10.4 API 核验

以下是只读探测示例：

```bash
curl --fail-with-body \
  -D console-headers.txt \
  -o console-response.json \
  [https://blog.epocanvas.com/api/console/data](https://blog.epocanvas.com/api/console/data)
```

检查：

1. HTTP 状态码。
2. Content-Type 是否为 JSON。
3. ok 是否为 true。
4. generatedAt 与 servedAt 的含义是否正确。
5. stats 字段类型。
6. activity 数组是否为 364 个格子。
7. 快照日期与当前日期的处理。
8. 活跃等级与篇数是否匹配。
9. 缓存头。
10. 是否泄漏受限文章元数据。

禁止为了测试 Method Not Allowed 而随意向生产接口发送写入型请求。方法限制可在本地或测试环境核验。

## 11. 浏览器验收

至少覆盖：

- 1440×900 桌面。
- 768×1024 平板。
- 390×844 手机。
- 浅色模式。
- 深色模式。
- 正常网络。
- API 失败。
- JavaScript 不可用或增强脚本未加载的降级场景。

检查内容：

- 页面标题与唯一 H1。
- 三篇文章互相导航正常。
- 提示卡语义与色彩。
- 标签页全部可切换。
- 下拉菜单与目标面板对应。
- details 可通过键盘操作。
- 导图可以展开、缩放、适配和退出全屏。
- 隐藏面板打开后图形尺寸正常。
- 代码复制不截断。
- 页面没有整体横向溢出。
- 控制台无新增致命错误。
- 网络请求无意外外部依赖。
- 关键结论不依赖颜色单独传达。

如果标签页缺少完整键盘导航与 ARIA 状态，不得宣称已经达到完整无障碍标准；应作为单独改进项记录。

## 12. 动态数据显示约束

本次三篇 Markdown 是规范正文，不伪造实时仪表盘。

如后续添加动态指标：

1. 使用独立组件。
2. 读取实际 API 或共享计算结果。
3. 显示数据时间。
4. 区分构建快照与请求校准。
5. API 失败时显示“暂不可用”或保留有时间标记的快照。
6. 不将失败回退为 0 后解释为真实零值。
7. 同一组件的数值、等级、颜色、进度与提示必须一起更新。
8. 不允许只更新页头等级而保留互相矛盾的正文结论。
9. 用户端勾选清单不能代替服务端测试或部署批准。

## 13. 性能与安全表述

没有当前测试证据时，禁止发布以下结论：

- API 延迟低于固定毫秒数。
- LCP 已达到固定数值。
- 首屏 JavaScript 只有固定体积。
- 所有组件零重渲染。
- 绝对免疫 SQL 注入或服务端攻击。
- 运行天数证明没有停机。
- 字数等级证明内容质量。
- 发文等级证明后端服务健康。

性能报告至少包含：

- 提交版本。
- 部署版本。
- 页面与测试区域。
- 设备与网络条件。
- 样本数量。
- 冷热缓存条件。
- 统计分位数或汇总方式。
- 原始结果位置。
- 测试时间。

不得公开密钥、Cookie、会话令牌、用户原始 IP、私人邮箱或数据库凭证。

## 14. 提交、同步与部署

### 14.1 提交

每个独立、已验证的子任务形成可审阅提交，并记录：

```bash
git rev-parse HEAD
git show --stat --oneline HEAD
```

禁止：

- 提交无关文件。
- 提交真实环境密钥。
- 对用户已有改动执行破坏性重置。
- 未经要求重写历史。
- 编造 Commit Hash。

### 14.2 多远端同步

先读取 `git remote -v`，确认实际远端与目标分支。

不要假设：

- 所有环境都存在 cf 远端。
- `git push --all` 会自动推送所有远端。
- 所有本地分支都应发布到所有远端。

若项目确实要求 origin 与 cf 同步，应明确列出对应分支与目标，获得授权后分别执行，并记录结果。

### 14.3 生产部署

生产部署需要单独授权，并先确认：

- 当前仓库。
- Cloudflare 项目名称。
- 分支与提交。
- 环境变量目标。
- 回滚方案。
- 是否影响真实业务。

仓库存在 `npm run cf:deploy`，但不得仅因脚本存在就自动运行。

文档草案交付可以不部署，但必须明确称为“文档交付”或“待集成版本”；不得称为“生产发布完成”。

## 15. 最终交付报告

每次任务必须报告：

```text
任务类型：
检查基线：
实际修改文件：
算法是否变化：
统计口径是否变化：
已执行命令：
测试结果：
浏览器验收：
线上验收：
已知问题：
未执行项目及原因：
Commit Hash：
部署版本：
回滚方式：
```

未执行的字段写“未执行”，不能留空制造已完成印象。

完成标准是：文档准确、语法可构建、界面可使用、结果可复核、权限边界清楚。
