# Astro Blog「试验田 Lab」分阶段演进与开发计划 (LAB_DEVELOPMENT_PLAN.md)

## 1. 分阶段实施总览

本项目遵循「**安全隔离优先、最小可行闭环、可验证可回滚**」原则推进：

| 阶段 | 核心目标 | 当前状态 |
| :--- | :--- | :--- |
| **Phase 0：仓库审计与安全基线设计** | 梳理 Astro 6 / Cloudflare Pages / CSP 现状，核实候选开源项目许可证，制定 Opaque-Origin 通信协议 | **已完成 (Completed)** |
| **Phase 1：安全代码实验平台 MVP** | 保留原有 4 个实验并升级为 6 个完整实验，交付 `/lab/`、`/lab/[slug]/`、`/lab/playground/`、`/lab/preview/[slug]/` | **已完成 (Completed)** |
| **Phase 2：程序运行逻辑逐步可视化** | 交付零 `eval` 确定性执行追踪引擎 (`lab-tracer.ts`) 与交互可视化器 (`ExecutionVisualizer.tsx`) | **已完成 (Completed)** |
| **Phase 2.5：发布前安全加固与预发布验收** | 完成词法级 TS 子集擦除器、Nonce CSP 防闭合逃逸、死循环与计时器熔断、跨站沙盒端到端打通与降级、无障碍与多语言加固 | **已完成本地全链路验收（线上部署待授权）** |
| **Phase 3：社区投稿与审核 MVP** | 引入 Cloudflare Turnstile + D1 `lab_submissions` 审核表 + 站长 Opaque Sandbox 安全审核台 | **已规划 (Planned · 本轮不开发)** |
| **Phase 4：高级多文件与图结构组件** | 按需接入自托管 LiveCodes / Sandpack 与 `@xyflow/react` 图结构可视化 | **已规划 (Planned · 本轮不开发)** |
| **Phase 5：可选服务端隔离容器执行** | 仅在确需 Python / Node.js / Linux 环境时，在独立账号下接入 `@cloudflare/sandbox` | **远期可选 (Optional · 本轮不开发)** |

---

## 2. Phase 2.5 发布前工程复核与安全加固完成清单

1. **修复 TypeScript 子集擦除器并增加显式语法边界 (`src/lib/lab-schema.ts`)**：
   - 用零依赖词法扫描器 `tokenizeTsOrJs()` 替换原先易误伤对象字面量 `{ length: NODE_COUNT }` 和三元表达式的正则替换；补齐后缀非空断言 `!` 擦除，修复官方实验 `verlet-rope-physics` 的编译与运行故障；对不支持的 `enum`、`namespace`、参数属性、`@decorator`、JSX/TSX、外部 `import` 给出明确中文报错。
2. **加固沙盒 HTML/CSS/JS 注入与 Nonce CSP (`src/lib/lab-sandbox-protocol.ts`)**：
   - 为每次运行生成随机 CSP `nonce`，收紧 `script-src 'nonce-...' 'unsafe-eval'` 并增加 `worker-src 'none'`、`child-src 'none'`；使用 Unicode 转义 JSON 与 DOM API 挂载用户 HTML/CSS，彻底阻断 `</script>`、`</style>`、`<textarea>` 闭合逃逸与 `<img onerror>` 内联脚本绕过；启动首行移除引导 `<script>` 节点以隐藏 `SESSION_ID`。
3. **打通真实跨站点沙盒桥接与 3 秒自动降级 (`sandbox-runner/`、`LabPlayground.tsx`、`functions/_middleware.ts`)**：
   - 修正 `sandbox-runner/_headers` 与 `sandbox-runner/index.html` 的 CSP 继承冲突，实现完整 `PING -> SANDBOX_BRIDGE_READY -> EXECUTE_CODE / TERMINATE_SESSION / SET_THEME` 握手协议；在 `functions/_middleware.ts` 中动态注入经严格白名单校验的 `PUBLIC_LAB_SANDBOX_ORIGIN`（严禁 `*.epocanvas.com` 与通配符）；远端不可达时 `3000ms` 自动平滑降级至本地 `opaque-srcdoc`。
4. **增强客户端防资源耗尽能力**：
   - 新增 Token 级循环时间预算插桩 `__labLoopGuard`（`2200ms` 自动熔断，免疫 `try/catch` 吞异常绕过）、活跃定时器配额上限（`256` 个）、宿主消息洪泛断路器（`350` 条/会话）及修正后的 `5000ms` 挂起销毁看门狗。
5. **修复交互细节、无障碍与多语言体验**：
   - 补齐 `/lab/` 源码弹窗 `Escape` 关闭与焦点归还、简繁转换后的搜索匹配、工坊预设切换 URL `pushState`/`popstate` 同步、全屏预览 `Escape` 退出、运行中深浅色主题实时同步、繁体中文 UI 文案本地化（同时保护代码零转换）以及移动端全路由零横向溢出。

---

## 3. 后续阶段边界声明 (Phase 3 ~ Phase 5)

- 本轮（Phase 2.5）严格不新增任何大型前端依赖，不新增 D1 表或服务端 API，不修改生产 Cloudflare 配置。
- 待正式发布稳定运行后，可按需进入 Phase 3 建设带 Turnstile 防刷与人工审核的社区实验投稿队列。
