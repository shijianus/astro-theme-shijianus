# Agent 核心开发与交付规范 (Agent Core Development & Delivery Protocols)

> 本规范为本仓库所有 AI Agent（包括 Antigravity、Subagents 及后续协作代理）的**最高强制执行准则**。每次对话与任务执行必须严格遵守，无一例外。

---

## 核心执行准则 (Mandatory Execution Rules)

### 1. 强制单步 Commit 与 Hash 输出准则 (Strict Commit & Hash Logging)
- **及时提交**：每完成一个独立的修改、功能实现、问题修复或重构子任务，**必须立即执行 `git commit`**，严禁积攒大量改动不提交。
- **强制打印 Hash**：每次执行 `git commit` 成功后，**必须在终端或对话回复中明确打印并展示 Commit Hash**（例如通过 `git rev-parse --short HEAD` 或 `git log -1 --oneline` 输出，如 `Commit Hash: [a1b2c3d]`）。
- **任务清单更新**：在每次提交后，将对应的任务状态勾选为完成，并附带对应的 Commit Hash 记录在 `AGENTS.md` 或交付报告中。

### 2. 全量多远端同步准则 (Multi-Remote Push Standard)
- 本仓库配置了多个远端（如 `origin` -> `astro-theme-shijianus.git`，`cf` -> `shijianus.github.io.git` 用于 Cloudflare Pages 自动部署）。
- 在完成阶段性开发并通过本地测试后，必须执行多端推送：
  ```bash
  git push --all origin
  git push --all cf
  # 或全局推送
  git push --all
  ```
- 确保所有分支（尤其是 `main` 分支）在各个 remote 间保持 100% 同步。

### 3. 生产端 (Cloudflare Pages) 真实链路验证准则 (Live E2E Verification)
- 代码推送到 `cf` 远端后，涉及线上功能的更新必须在真实线上环境（`https://blog.epocanvas.com`）生效后进行验证。
- **强制 Playwright / MCP 浏览器端到端测试**：
  - 调用自动化脚本或 MCP 工具访问 `https://blog.epocanvas.com`。
  - 对核心功能（如文章目录 TOC、Stripe 国际收银台、Google Pay / Apple Pay / Link 快捷支付、微信/支付宝/PayPal 赞赏码、多币种自适应等）进行**真实点击、模态框弹出、交互逻辑与视觉呈现全链路审计**。
  - 确认无控制台致命 JS 报错、无样式错位、网络 API 请求正常，经完整链路测试通过后方可正式交付给用户。

---

## 历史任务与 Commit Hash 追踪记录 (Task History & Tracking)

### Task 1: 文章目录 (TOC) 重构与视觉审计
- [x] 备份与初始化 (`6616960d0bf61a7364a1eafe61cdf5f3006cbb54`)
- [x] 参考 `hexo-theme-anzhiyu` 源码，学习其文章目录（TOC）的UI状态、粘性卡片（Sticky Card）和标题目录的实现规则。
- [x] 结合 `.agent/skills/ui-ux-pro-max` 的UI/UX规范，规划Astro中的前端UI实现。
- [x] 创建与更新 TOC 粘性组件，支持平滑滚动与单项唯一高亮聚焦。
- [x] Playwright 视觉与自动化审计通过 (`8dedf41`, `8c9d1c6`)。

### Task 2: 国际打赏与 Stripe 收银台 (Google Pay / Apple Pay) 链路改造
- [x] 赞赏栏布局重构：保留微信/支付宝赞赏码并分离独立居中 Stripe 模态框 (`3d8b013`)
- [x] 集成 D1 数据库赞赏记录与 Telegram Bot 通知体系 (`fb468e2`)
- [x] Stripe Elements & Express Checkout 完整重构 (`3b86ee2`)
- [x] Stripe Checkout Sessions 内嵌式集成与多币种自适应 (`59f2265`, `f06956f`)
- [x] 国际收银台按钮视觉打磨、咖啡档位阶梯定义与安全合规背书 (`7c37cba`)
- [x] 线上真实环境 E2E Playwright 自动化验证脚本配置 (`ca261cd`)
- [x] 全量配置加固与 Google Pay / Apple Pay 双重链路保障 (`55f3bed`)

### Task 3: 自动化工作流与全量远端同步
- [x] 规范化 `AGENTS.md`，固化强制 Commit、Hash 打印、多端推送与线上 E2E 验收准则 (`a560d09`)。
- [x] 推送所有分支与代码至 remote (`origin` 与 `cf`)：`git push --all origin && git push cf main` 同步完成。
- [x] 针对 `https://blog.epocanvas.com` 进行线上全链路 Playwright 交互测试（Google Pay / Apple Pay 国际收银台、多币种本地化定价、Stripe 内嵌安全结账、TOC 等完整测试通过）。
- [x] 提交并打印全流程 Commit Hash，完成交付。
