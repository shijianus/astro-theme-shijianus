---
title: "EpoCanvas 版本协议与架构规范：语义化控制、边缘分层与授权边界"
description: "系统阐述 EpoCanvas 的语义化版本控制（SemVer 2.0.0）、不可变 Git SHA 部署追溯、Astro 边缘混合架构分层、依赖链路契约与专有独占授权边界。"
pubDate: 2026-10-18
updatedDate: 2026-10-18
author: "shijianus"
category: "工程规范"
group: "EpoCanvas Standards"
tags: ["EpoCanvas", "语义化版本", "边缘计算", "架构分层", "专有协议", "依赖规范"]
toc: true
math: true
mermaid: false
mindmap: true
draft: false
lang: "zh-CN"
i18nKey: "ees-version-protocol"
---

# EpoCanvas 版本协议与系统架构规范

<div class="article-aside">
  <p><span class="badge badge-primary">EES-004</span> <span class="badge badge-success">版本与架构</span> <span class="badge badge-warning">生产环境强制执行</span></p>
  <p>本规范定义 EpoCanvas 及 shijianus-blog 核心引擎的语义化版本控制机制、Git SHA 不可变部署溯源、四层系统架构划分以及专有知识产权授权边界。</p>
</div>

> [!IMPORTANT]
> 任何向生产环境分发的部署物，均必须严格绑定唯一的 Git Commit SHA，且版本号必须符合语义化版本规范。未经过完整测试、未执行版本标注或未同步全量远端的改动，严禁进入生产边缘网络。

## 1. 规范元信息与设计哲学

EpoCanvas 遵循“契约先于实现、架构决定上限、可追溯性保障稳定性”的设计哲学。作为高密度、高交互的现代化博客技术底座，系统既要保障纯静态内容的高性能极速交付，又要支撑多币种动态收银台、D1 原生留言树、Telegram 异步事件流及跨语系实时渲染等边缘动态能力。

为了确保长达数年的持续演进过程中架构不退化、接口不破损、协议可复核，特制定本规范作为全站版本控制与架构演进的唯一法定依据。

| 规范元属性 | 取值与标准声明 |
| :--- | :--- |
| **标准代号** | `EES-004 (EpoCanvas Engineering Standard 004)` |
| **当前核心版本** | `v2.6.0-shijianus` |
| **生效状态** | **生产环境持续生效 (Active In Production)** |
| **适用范围** | `shijianus-blog` 代码仓库、Functions 边缘服务、静态资产构建流水线 |
| **归属工程族** | EpoCanvas Standards Ecosystem |

---

## 2. 语义化版本控制体系 (SemVer 2.0.0 Formalization)

本系统严格采纳 [Semantic Versioning 2.0.0](https://semver.org/) 规范，版本标识符结构定义如下：

$$
\text{Version} = \text{MAJOR}.\text{MINOR}.\text{PATCH}[-\text{PRERELEASE}][+\text{BUILD}]
$$

例如当前生产版本：`v2.6.0-shijianus`。

### 2.1 主版本号 (MAJOR)：破坏性架构跃迁

主版本号仅在发生系统级、破坏性（Breaking Change）重构或底层存储契约变更时递增：

1. **运行时范式转换**：从纯客户端 CSR / SSG 向边缘混合计算（Edge Hybrid Computing）的全面跃迁；
2. **数据模式不兼容变更**：Cloudflare D1 关系型数据库或核心 SQLite 表结构的破坏性重写，无法通过平滑自动化迁移脚本向前兼容；
3. **前端样式与交互规范重写**：核心 UI 体系发生根本性范式转换，导致历史组件无法正常挂载；
4. **外部接口协议废弃**：支付回调、留言鉴权或多语言路由的底层签名算法发生非兼容升级。

### 2.2 次版本号 (MINOR)：向后兼容的特性交付

次版本号在引入向后兼容的新功能、新规范模块或非破坏性组件扩展时递增：

1. **新工程规范纳入**：新增独立子规范（如活跃等级规范 EES-002、内容密度规范 EES-003、版本协议规范 EES-004）；
2. **动态功能模块交付**：引入全新内嵌式 Stripe 收银台、YouTube 风格可折叠评论树或动态中控台概览面板；
3. **依赖核心版本升级**：在保持现有页面与 API 行为完全不变的前提下，升级 Astro、React 或 Tailwind 核心驱动；
4. **国际化支持扩充**：新增德语、法语、西班牙语等多语言词条字典与本地化定价策略。

### 2.3 修订号 (PATCH)：缺陷修复与微观优化

修订号用于日常日常缺陷修复、样式细微收敛及非功能性调整：

1. **UI/UX 细节打磨**：圆角统一从粗大胶囊收敛至精致 8px 方圆角、修复 3D 翻转卡片背面闪烁；
2. **CSS/JS 兼容性补丁**：解决特定移动端视口溢出、右侧悬浮工具条垂直避让冲突、暗黑模式对比度校准；
3. **文档与注释完善**：修正公式排版错误、丰富工程原理阐述、优化代码注释完整性；
4. **构建流水线微调**：优化 Vite 打包分块、压缩静态图片与字体资源。

### 2.4 预发布与元数据标签

- **PRERELEASE**：采用 `-alpha`（内部验证阶段）、`-beta`（集成测试阶段）、`-rc.N`（发布候选阶段）或 `-shijianus`（专有分支发布标识）；
- **BUILD**：附带 Git 短提交哈希或构建时间戳（如 `+build.3093134`），用于生产环境精确定位物理镜像版本。

---

## 3. 不可变 Git SHA 部署追溯机制

在 EpoCanvas 交付流水线中，“代码即状态，提交即证明”。为杜绝任何“本地能跑但生产环境报错”或“生产环境运行着未受版本管理的代码”的情况，系统强制实施不可变追溯标准：

### 3.1 零脏树发布原则 (Zero-Dirty-Tree Invariant)

任何进入 Cloudflare Pages 编译节点的发布包，工作区必须处于完全干净（Clean Tree）状态：

- 严禁任何未提交的本地临时修改直接打包部署；
- 严禁通过人工修改生产边缘 Functions 代码跳过版本流水线；
- 严禁在部署产物中残留任何未受版本控制的临时调试文件。

### 3.2 40 位 SHA 全链路指纹绑定

每一次合法的生产部署物，均必须关联一个唯一的 40 位 Git Commit SHA。该哈希值通过构建期环境变量注入系统全局上下文：

```typescript
export interface BuildMetadata {
  /** 完整的 40 位 Git SHA */
  readonly commitSha: string;
  /** 规范化短哈希 (7 位) */
  readonly shortSha: string;
  /** 构建触发的物理时间戳 (ISO 8601) */
  readonly builtAt: string;
  /** 当前环境标识 */
  readonly environment: 'production' | 'preview' | 'development';
}
```

### 3.3 多远端镜像全量同步 (Multi-Remote Invariant)

本仓库配置有多个上游远端分支：
1. `origin`：GitHub 权威开源代码镜像主仓库；
2. `cf`：Cloudflare Pages 自动化构建与边缘分发专用仓库。

阶段性发布必须确保执行 `git push --all origin && git push cf main`，使两大远端的 HEAD 指针时刻保持 100% 同步，杜绝代码割裂。

---

## 4. 边缘混合计算架构分层规范 (Architectural Layering)

EpoCanvas 采用清晰的四层分层架构，每一层拥有严格的职责边界与契约约束：

```
+---------------------------------------------------------------+
|  Layer 4: 表现层与原子化样式 (Tailwind v4 / Anzhiyu Tokens)    |
+---------------------------------------------------------------+
|  Layer 3: 业务编排与数据状态机 (React 19 Islands / D1 / TG)     |
+---------------------------------------------------------------+
|  Layer 2: 核心渲染与混合流水线 (Astro 6.x / Vite 7 / Remark)   |
+---------------------------------------------------------------+
|  Layer 1: 全球 Anycast 边缘基础设施 (Cloudflare Pages Runtime) |
+---------------------------------------------------------------+
```

### 4.1 Layer 1: 全球 Anycast 边缘基础设施 (Edge Infrastructure)

- **运行时环境**：Cloudflare Pages Edge Runtime（基于 Google V8 Isolates 无冷启动沙盒）；
- **网络拓扑**：全球 300+ 城市 Anycast 边缘节点，首屏 TTFB（Time To First Byte）严格控制在 50ms 以内；
- **资源缓存策略**：静态 HTML/JS/CSS/WebP 资源实施全球边缘强缓存（`Cache-Control: public, max-age=31536000, immutable`），动态 API 路由采用私有无缓存策略。

### 4.2 Layer 2: 核心渲染与混合流水线 (Hybrid Core Engine)

- **静态第一原则**：默认所有文章页、归档页、规范说明页均采用零 JavaScript 纯静态编译，输出原生高语义 HTML 结构；
- **孤岛架构 (Islands Architecture)**：仅在需要动态交互的局部区域（如中控台、收银台模态框、留言互动区）按需挂载轻量 React 孤岛；
- **MDX/MDAST 管道**：基于 `remark-gfm`、`remark-math`、`rehype-katex` 与自定义 AST 转换器，在构建期完成公式预编译、代码块语法高亮与目录索引树生成。

### 4.3 Layer 3: 业务编排与数据状态机 (State Machine & Persistence)

- **持久化存储**：使用 Cloudflare D1（Serverless SQLite），保障留言点赞、支持者祝福、用户身份的分布式高一致性写入；
- **支付网关**：集成 Stripe Embedded Checkout 与 PaymentIntents，支持 Google Pay、Apple Pay、Link 及全球信用卡支付通道；
- **事件通知总线**：构建异步 Telegram Bot 消息推送流水线，全流程监控支付落地、用户寄语与敏感异常。

### 4.4 Layer 4: 表现层与原子化样式体系 (Presentation & Styling)

- **样式底层**：采用 Tailwind CSS v4 原子级样式引擎与 PostCSS 流水线，CSS 文件体积极致精简；
- **视觉语言**：汲取安知鱼（Anzhiyu）标志性设计精髓（`#425aef` 主题蓝、高通透 Frosted Glass 玻璃拟态、双层响应式流式布局）；
- **微交互与质感**：提供 60fps 平滑视差水波纹、3D 空间变换翻转卡片、自适应暗黑模式与键盘快捷键响应。

---

## 5. 核心驱动依赖协议矩阵 (Dependency Stack Invariants)

系统技术栈选型严格遵循“现代、高内聚、轻运行时、高可审计性”的原则。全站核心依赖矩阵如下表所示：

| 驱动包名称 | 语义化约束范围 | 核心功能定位 | 破坏性升级审计要求 |
| :--- | :--- | :--- | :--- |
| **`astro`** | `^6.1.3` | 静态生成、混合 SSR 路由分发与内容集合引擎 | 需审计内容集合 Schema 校验与适配器中间件变更 |
| **`react`** / **`react-dom`** | `^19.2.4` | 复杂动态孤岛（收银台、留言区、控制台） | 严格验证 Client Directive（`client:idle`/`client:load`）行为 |
| **`@tailwindcss/vite`** | `^4.2.2` | 极速原子化样式编译与主题变量注入 | 需审计 CSS 变量作用域与自定义 utilities 兼容性 |
| **`lucide-react`** | `^0.460.0` | 统一的矢量视觉图标协议与无障碍图形标识 | 验证图标树摇（Tree-Shaking）与打包体积增量 |
| **`remark-math`** / **`rehype-katex`** | `^6.0.0` / `^7.0.0` | 科学与工程 LaTeX 数学公式编译管道 | 确保构建期预渲染为纯 HTML/MathML，前端 0 JS 负担 |
| **`opencc-js`** | `^1.0.5` | 简繁双向高保真语义转换与跨语系渲染引擎 | 需验证字典加载性能与词汇匹配精准度 |
| **`qrcode`** | `^1.5.4` | 动态客户端/边缘端赞赏与分享二维码生成 | 确保 Canvas/SVG 矢量输出在高分屏下清晰无毛刺 |

---

## 6. 专有授权边界与知识产权准则 (Proprietary Licensing)

shijianus-blog 代码仓库与其核心定制主题 **EpoCanvas** 声明如下知识产权与授权约束：

```
+--------------------------------------------------------------------------+
|                 EPOCANVAS PROPRIETARY LICENSE AGREEMENT                  |
|                                                                          |
|  Copyright (c) 2024-2026 shijianus. All Rights Reserved.                |
|                                                                          |
|  1. 本工程包含作者高度原创的 UI/UX 视觉体系、微交互逻辑与架构设计。       |
|  2. 未经原作者书面正式授权，任何组织或个人不得：                          |
|     - 将本项目整体或核心组件打包为商业付费模板销售；                     |
|     - 抹除原作者版权署名或伪造原创声明；                                |
|     - 搭建公开提供镜像服务的同构站点。                                   |
|  3. 允许出于学术研究、技术交流及个人非商业学习目的之代码阅读与技术借鉴。   |
+--------------------------------------------------------------------------+
```

### 6.1 授权等级分类

1. **公开技术规范与博文内容**：遵循开放阅览协议，允许注明出处后的合规引用与技术探讨，禁止批量无授权抓取或洗稿；
2. **主题设计与定制代码**：属于私人专有独占资产（Proprietary Rights），受法律保护；
3. **第三方开源依赖**：严格遵守 Astro (MIT)、React (MIT)、Tailwind CSS (MIT) 等上游组件的原生开源许可证。

---

## 7. 容灾、零漂移保障与回滚状态机 (Rollback Protocol)

生产环境的绝对稳定性高于一切特性迭代。系统在架构层面预置了完善的零漂移（Zero-Drift）与回滚机制：

### 7.1 边缘瞬时回滚机制 (Instant Edge Rollback)

Cloudflare Pages 对每一次部署保留永久且不可篡改的 Deployment 镜像快照：

- 一旦线上生产监控探针捕获到严重异常（如 5xx 错误率骤增、支付链路中断），运维脚本可通过 Cloudflare API 执行瞬时切换；
- 回滚过程仅涉及全球 Anycast 边缘路由指针的重新指向，耗时小于 **1.5 秒**，且完全无需经历重新打包与编译流程。

### 7.2 数据版本向前兼容状态机

在涉及 Cloudflare D1 数据库模式调整时，必须严格执行三阶段演进策略（Expand -> Migrate -> Contract）：

1. **扩充阶段 (Expand)**：先在数据库中新增字段或表，新旧两套代码均能读取；
2. **迁移阶段 (Migrate)**：将历史数据按幂等脚本平滑转移；
3. **收敛阶段 (Contract)**：待生产环境全量更新稳定运行至少 7 个日历日后，方可执行废弃字段的物理清理。

---

## 8. 规范复核与审计检查清单 (Audit Checklist)

在进行版本发布或重大架构评审时，必须逐项核验以下检查点：

- [ ] **语义化判定**：版本号升级幅度是否与实际改动级别（Major/Minor/Patch）完全对齐？
- [ ] **Git 纯净度**：本地分支是否存在未提交代码？Commit Hash 是否已明确打印记录？
- [ ] **远端一致性**：`origin` 与 `cf` 远端的 HEAD SHA 是否 100% 相同？
- [ ] **公式与渲染**：规范页内部的所有 LaTeX 数学公式、数据表格在浅色/暗黑模式下是否均渲染正常且无错位？
- [ ] **UI 规范隔离**：该页面是否已剥离博文特有的右侧栏阅读模式按钮、评论框与末尾推荐？
- [ ] **授权声明完整**：核心版权归属与专有协议标识是否准确无误？
