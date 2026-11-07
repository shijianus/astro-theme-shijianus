# Astro Blog「试验田 Lab」Phase 2.8 交付审计与基线修正报告 (Readiness & Baseline Correction Report)

> **审计与基线更新时间**: 2026-11-07  
> **当前精确提交 HEAD**: `27fb3998832b29db570dcd793b5a4b2db5017f92` (`27fb399`)  
> **审查分支**: `review/lab-phase-2.8-readiness` (与 `origin/review/lab-phase-2.8-readiness` 一致)  
> **治理基准分支**: `chore/governance-bootstrap` (`892bef0`)  
> **主分支当前**: `main` (`2e92967072febadd70e03d13bfd1cc6e2207bc55`)  
> **历史 Phase 2.7 决策**: **NO-GO** (保留历史基线判定)  
> **当前 Phase 2.8 基线决策**: **NO-GO (存在事实漂移与未达标项 · 进入收口修正)**

---

## 1. 概述与核心结论 (Executive Summary & Truth Alignment)

在 Phase 2.7 独立审计中，试验田平台因存在依赖安全漏洞（35 个漏洞）、无类型门禁、双锁文件冲突、弱随机数等问题被判定为 **NO-GO**。

在 Phase 2.8 初始准备阶段，虽然升级了 Astro 7、引入了 Web Crypto 并编写了适配器代码，但对代码库实际状态的重新核验表明，历史报告存在明显的事实高估和表述漂移，必须在进入工程收口前诚实纠偏：

1. **报告高估与漂移纠偏**:
   - **分支状态**: 原报告声称“所有新提交均停留在本地 Git 存储区”，事实是 `27fb399` 已于 GitHub Actions 运行并推送到 `origin/review/lab-phase-2.8-readiness`；
   - **供应链门禁削弱**: 原报告声称“漏洞门禁通过”，事实是通过提交 `35145a4` 将审计门禁从 `--audit-level=high` 降低为 `--audit-level=critical`，掩盖了 12 个高危上游漏洞（全量共 15 个漏洞，生产依赖含 3 个高危）；
   - **QuickJS 运行时名不副实**: 现有 `src/lib/lab/adapters/QuickJsRuntime.ts` 未引入任何 QuickJS 引擎、未编译 WASM、未启用 Dedicated Worker，本质上是在宿主主线程通过 `new Function` 进行模拟，属于不可作为安全隔离边界的占位 PoC；
   - **适配器未接入主流程**: `BrowserDomRuntime`、`LiteEditorAdapter`、`LiveCodesEditorAdapter` 仅为单独类定义，未被 `LabPlayground.tsx` 或任何页面实际调用，主界面仍直接耦合旧版沙盒构建与 postMessage；
   - **LiveCodes 未实现工程双向同步**: 现有 LiveCodes 适配器仅为单向 iframe 挂载草案，尚未实现与 Workspace Controller 的项目工程双向同步机制；
   - **Outer Runner CSP 真实状态**: `sandbox-runner/_headers` 与 `sandbox-runner/index.html` 依然保留 `script-src 'self' 'unsafe-inline' 'unsafe-eval'`，UI 面板声称的 `0 unsafe-eval · 0 unsafe-inline` 与实际头信息不符；
   - **数据编码不可称为防篡改**: URL `#bundle=` 仅采用 Base64URL 纯编码，无密码学签名与完整性校验，不可表述为“防篡改”；
   - **许可证风险**: 播放器引用的 `@applemusic-like-lyrics/lyric` (1.1.0) 为 AGPL-3.0-only，进入了前端客户端 bundle，存在强互惠开源传染风险，必须替换为宽松开源实现；
   - **CI 异常标注**: CI 存在 `/usr/bin/git exit code 128` 告警（源于 `.deploy_git` 为未在 `.gitmodules` 中声明的 gitlink 模式 160000），以及 Node 20 runtime 废弃告警。

### 核心核验状态矩阵 (Audit Baseline Matrix)

| 判定维度 | 状态 | 判定理由与事实证据 |
| :--- | :---: | :--- |
| **Astro 7 基础编译** | **PASS** | `astro@7.3.8` 编译成功，统一 Markdown 渲染保留 KaTeX / GFM 正常。 |
| **类型检查门禁** | **PASS** | `npm run check` 零报错通过。 |
| **高危漏洞门禁 (Audit High)** | **FAIL** | `npm audit --audit-level=high` 退出码 1，发现 12 个 high 漏洞；生产依赖含 3 个 high 漏洞。此前靠降低至 critical 规避。 |
| **Browser DOM 运行时接管** | **FAIL** | `BrowserDomRuntime` 未被主界面调用，仍停留于独立类。 |
| **QuickJS 隔离运行时** | **FAIL** | 仅为 `new Function` 伪装实现，无 WASM、无 Worker、无 QuickJS。 |
| **LiveCodes 双向同步** | **FAIL** | 仅为静态 iframe 加载原型，无双向工程数据通信。 |
| **Outer Runner CSP 声明** | **FAIL** | 实际仍包含 `unsafe-eval` 与 `unsafe-inline`，与文档“已移除”声明不符。 |
| **CI Gitlink 状态** | **FAIL** | `.deploy_git` 模式 160000 导致 git submodule 与 checkout 抛出 exit 128。 |
| **许可证合规 (AGPL-3.0)** | **BLOCKED** | `@applemusic-like-lyrics/lyric` 打入前端 bundle，必须完成替换。 |
| **Cloudflare 生产基础设施** | **NOT CHECKED** | 本轮严守四级权限，未执行外部写入与云端查询，保持隔离。 |
| **历史 Phase 2.7 结论** | **NO-GO** | 历史基线未变，当前基线核验维持 **NO-GO**，直至本轮 Sprint 完成真实代码与门禁恢复。 |

---

## 2. 治理与 Git 溯源 (Governance & Git Traceability)

### 2.1 当前核验精确提交与远端状态

```text
当前分支: review/lab-phase-2.8-readiness
当前 HEAD: 27fb3998832b29db570dcd793b5a4b2db5017f92
远端对应: origin/review/lab-phase-2.8-readiness (同步一致)
主分支 main: 2e92967072febadd70e03d13bfd1cc6e2207bc55
```

### 2.2 纠正历史陈述

- **事实修正 1**: 废除“所有新提交均停留在本地 Git 存储区”陈述。提交 `27fb399` 已被推送到 `origin`，触发了 GitHub Actions 远端 CI；
- **事实修正 2**: 废除“发布就绪 CONDITIONAL GO”结论。在 Editor/Runtime 未接管主流程、QuickJS 为虚假实现、门禁被降级、AGPL 依赖未剔除前，客观结论必须为 **NO-GO**；
- **事实修正 3**: 明确当前本地工作区为干净状态（`working tree clean`），无未提交残留。

---

## 3. 供应链与依赖漏洞真实状态 (Supply Chain & Audit Reality)

### 3.1 真实 npm audit 结果 (未降级)

使用标准门禁命令：
```bash
npm audit --registry=https://registry.npmjs.org --audit-level=high
```
**结果**: 退出码 1，发现 15 个漏洞（1 low, 2 moderate, 12 high）：
- `browserslist` (high): OOM / 原型写入风险；
- `esbuild` (high): Windows 任意文件读取风险；
- `markdown-it` (high): 二次复杂度 ReDoS 风险；
- `sharp` / `miniflare` (high): libvips / libheif 漏洞；
- `undici` (high): SOCKS5、CRLF、DoS 等多项漏洞；
- `vite` (high): 开发态路径穿越与 WebSocket 读取风险；
- `ws` (high): 内存泄露与 DoS 风险；
- `zod` (high): 超大受限集合内存消耗风险。

生产依赖门禁命令：
```bash
npm audit --registry=https://registry.npmjs.org --omit=dev
```
**结果**: 退出码 1，发现 5 个漏洞（1 low, 1 moderate, 3 high）：
- `esbuild`、`markdown-it`、`undici`、`vite`、`katex`。

> [!CAUTION]
> 严禁通过将 CI 门禁参数下调至 `--audit-level=critical` 来制造“绿色 CI”。必须通过官方安全升级，对无法立即上游修复项建立版本化例外清单 `security/npm-audit-exceptions.json` 进行治理。

---

## 4. 开源许可证中性风险说明 (License Neutral Risk Assessment)

### 4.1 涉事依赖与打入 Bundle 证据

```text
依赖: @applemusic-like-lyrics/lyric (1.1.0)
依赖: @applemusic-like-lyrics/ttml (1.0.1)
许可证: AGPL-3.0-only
引用位置: src/components/theme/MusicPocket.tsx
```

### 4.2 中性风险说明 (非法律保证)

GNU AGPL-3.0 条款第 13 条包含针对通过网络进行交互的互惠要求（Copyleft）。若前端产物打包了 AGPL-3.0 代码并向公众提供网络访问，开源社区或权利人可能主张整个前端应用工程应当开源其全部源码。

为避免商业与社区使用上的许可证冲突，并保持本项目整体宽松开源定位，**必须在本轮 Sprint 中移除 `@applemusic-like-lyrics/*` 依赖**，改用经过充分测试、涵盖当前 LRC/YRC 解析需求的内部轻量歌词解析模块。

---

## 5. 试验田架构与运行时核验事实 (Architecture Reality)

### 5.1 运行时适配器真实状态

| 模块名称 | 标称职责 | 真实实现情况 | 判定 |
| :--- | :--- | :--- | :---: |
| `BrowserDomRuntime` | 双层沙盒 DOM 运行时适配器 | 已定义类结构，但 `LabPlayground.tsx` 完全没有调用，属于孤立代码。 | **FAIL** |
| `QuickJsRuntime` | QuickJS 算法隔离运行时 | 使用 `new Function` 在主线程执行，无 QuickJS、无 WASM、无 Worker，命名失实。 | **FAIL** |
| `CuratedTraceRuntime` | 确定性算法步骤追踪 | 仅输出硬编码 10 条模拟日志，未实现版本化 trace 定义与播放控制。 | **FAIL** |
| `LiteEditorAdapter` | 轻量文本编辑器适配器 | 未被主工作台接管。 | **FAIL** |
| `LiveCodesEditorAdapter` | LiveCodes 高级编辑器适配器 | 仅为 iframe 嵌入草案，无工程双向数据同步，无错误降级回路。 | **FAIL** |

### 5.2 状态机与防重放真实状态

- 现有通信协议定义了序列号字段，但沙盒与主站未严格比对自增 sequence；
- 会话状态机未成为控制层唯一的真相来源（Single Source of Truth）；
- 控制逻辑分散在 UI 组件内部，导致生命周期混乱。

### 5.3 Outer Runner CSP 事实记录

- `sandbox-runner/_headers`: 包含 `script-src 'self' 'unsafe-inline' 'unsafe-eval'`；
- `sandbox-runner/index.html`: 包含 `script-src 'self' 'unsafe-inline' 'unsafe-eval'`；
- 如实记录：Outer Runner 仍包含 `unsafe-eval` 与 `unsafe-inline`。后续需对 CSP 与脚本外置结构进行规范化治理与诚实记录。

---

## 6. GitHub Actions CI 与基础设施状态 (CI & Infra Status)

### 6.1 GitHub Actions 真实 Annotations

对 Run ID 42379953981（Commit `27fb399`）的核查发现以下告警：
1. `The process '/usr/bin/git' failed with exit code 128`：Git 索引中的 `.deploy_git` 为未映射的子模块，触发 git 命令报错；
2. `Node.js 20 is deprecated`：部分 GitHub Actions 仍使用 Node 20 runtime，被强制在 Node 24 运行。

### 6.2 Cloudflare 基础设施真实状态

- 按照四级权限架构红线，本会话严格未修改或越权查询生产 Cloudflare 资源；
- 状态标记：**NOT CHECKED**（未执行外部检查）。

---

## 7. 纠正后的决策与本轮 Sprint 目标 (Action Plan)

### 当前结论: NO-GO

本轮 Sprint 将执行真实代码与架构重构，达成以下硬性要求：
1. 建立 `LabWorkspaceController`，由它统一调度 `EditorRegistry` 与 `RuntimeRegistry`；
2. 让 `BrowserDomRuntime` 真正接管现有的浏览器沙盒执行主链路；
3. 将 QuickJS 实现为真实的 Dedicated Worker + QuickJS WASM 纯 JS 隔离沙盒；
4. 实现确定性版本化 `CuratedTraceRuntime`；
5. 实现可选且具备双向工程同步能力的 `LiveCodesEditorAdapter`；
6. 恢复高危供应链门禁，编写版本化例外清单，修复 `.deploy_git` exit 128 与 Node 20 告警；
7. 替换 AGPL 依赖为经过测试的自研歌词解析模块；
8. 完善桌面与 390×844 移动端 UI、无障碍和 i18n；
9. 产出可复现、有证据支撑的 Phase 2.8 完成报告。

---
*本报告已纠正所有历史事实高估与漂移，作为 Phase 2.8 Completion Sprint 的真实起点。*
