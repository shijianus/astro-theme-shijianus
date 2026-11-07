# Agent 核心开发与交付规范 (Agent Core Development & Delivery Protocols)

> 本规范为本仓库所有 AI Agent（包括 Antigravity、Subagents 及后续协作代理）的**最高强制执行准则**。每次对话与任务执行必须严格遵守，无一例外。

---

## 核心执行准则 (Mandatory Execution Rules)

### 1. 强制单步 Commit 与 Hash 输出准则 (Strict Commit & Hash Logging)
- **及时提交**：每完成一个独立的修改、功能实现、问题修复或重构子任务，**必须立即执行 `git commit`**，严禁积攒大量改动不提交。
- **强制打印 Hash**：每次执行 `git commit` 成功后，**必须在终端或对话回复中明确打印并展示 Commit Hash**（例如通过 `git rev-parse --short HEAD` 或 `git log -1 --oneline` 输出，如 `Commit Hash: [a1b2c3d]`）。
- **任务清单更新**：在每次提交后，将对应的任务状态勾选为完成，并附带对应的 Commit Hash 记录在报告或归档中。

### 2. 四级权限架构与逐项授权矩阵 (Tiered Permissions & Explicit Authorization Matrix)
本仓库实行严格的四级权限架构。未经用户在当前对话中对**具体目标（具体 Remote、具体 Branch、具体 Cloudflare 项目/环境）**明确逐项授权，严禁越权执行任何外部写入或生产操作。任何先前的单次授权均在消费后立即失效，绝对严禁继承或复用。

| 权限等级 | 行为范围 | 授权策略 | 严禁行为 |
| :--- | :--- | :--- | :--- |
| **Level 1: 只读 (Read-Only)** | 读取仓库文件、只读 Git 查询 (`status`, `log`, `diff`, `branch`)、只读 `fetch`（禁止 `--prune`）、静态扫描、测试日志审查。 | **默认允许**，无需重复授权。 | 严禁携带 `--prune` 或任何带有写入意图的参数。 |
| **Level 2: 本地写入 (Local-Write)** | 创建/切换本地审查分支、本地代码修改、原子化 `git commit`、本地测试与门禁执行（`build`, `brand test`, `release gate`）、本地生成报告文档。 | **默认允许**（限本地开发与审计）。 | 严禁合并 `main` 分支；严禁覆盖或重写已有 Git 历史。 |
| **Level 3: 远端写入 (Remote-Write)** | 向指定单一 Remote 推送指定单一 Branch 或 Tag、创建/更新云端 Preview 预览部署。 | **严禁默认 · 必须逐项获得明确授权**（必须指明 Remote 与 Branch）。 | **绝对禁止 `git push --all`**、禁止 `--mirror`、禁止 `--force` / `--force-with-lease`、禁止同时向多个远端批量推送。 |
| **Level 4: 生产与云端资源 (Production & Cloudflare Infra)** | 合并到生产 `main`、生产环境部署（Cloudflare Pages / Workers）、修改生产绑定（D1/R2/KV）、修改 Secrets / 环境变量、修改 DNS。 | **绝对红线 · 必须重新独立逐项授权**。必须事先出示完整命令、影响范围及回滚方案。 | 严禁默认执行任何生产部署；严禁未经授权修改任何基础设施资源。 |

### 3. 严禁未提交即交付准则 (Strict Prohibition of Uncommitted Delivery)
- **提交前置**：每项独立功能、修复或治理任务完成后，必须通过原子化 `git commit` 固化成果，严禁积攒大量未提交改动。
- **强制打印 Hash**：每次提交后必须在终端和交付说明中明确展示短 SHA 与完整 SHA。
- **本地与线上严格解耦**：本地开发与审计完成**不代表**可以自动触发线上推送或部署，两者权限边界不可逾越。已删除历史版本中默认多端推送及强制线上生产 E2E 的要求。

### 4. 真实性与可复现证据链准则 (Evidence-First Verifiable Delivery Standard)
- **禁止口头宣称**：禁止在缺乏即时运行证据的情况下声称“测试 100% 通过”、“零安全风险”或“可直接发布”。
- **状态真实性**：审计结论（GO / CONDITIONAL GO / NO-GO）必须与报告正文及客观证据 100% 保持一致，严禁在任务总结中篡改、修饰或下调安全阻断等级。
- **可复现日志**：所有构建、测试与安全检查必须附带实际执行的命令、真实退出码（Exit Code）以及对应日志路径。

---

## 历史任务归档与索引 (Task History Archive)

本仓库历史开发与审计任务记录已全部迁移至 `docs/agent-history/` 独立归档：
- [Tasks 1 - 121 完整历史记录](docs/agent-history/TASKS_1_TO_121.md)
- [归档总索引说明](docs/agent-history/README.md)

---

## 当前治理状态 (Governance Status)

- **基线分支**：`main` (`2e92967072febadd70e03d13bfd1cc6e2207bc55`)
- **治理引导**：已将四级权限矩阵与单项授权准则确立为全仓最高准则；
- **废除条款**：彻底废除默认 `git push --all`、默认双远端同步、默认生产部署及默认生产端 E2E 验证要求；
- **执行原则**：一切外部写入（Remote Push / Cloudflare Pages / Workers / D1 / Secrets）均须在当前对话中获得明确单项授权。
