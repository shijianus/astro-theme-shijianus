# Astro Blog「试验田 Lab」Phase 2.5 测试与安全审计报告 (LAB_TEST_REPORT.md)

> **文档状态**：已基于本地真实静态产物 (`dist/`)、多 Origin 本地模拟服务器与 Playwright Chromium Headless (Node `v22.18.0`) 实测验证  
> **自动化验收脚本**：[`scripts/verify-lab-platform.mjs`](../../scripts/verify-lab-platform.mjs)

---

## 一、实际执行的构建与测试命令

```bash
# 1. 全站静态导出构建（含 TypeScript 编译、Astro 6 路由预渲染、MDX/KaTeX 与加密文章后处理）
BLOG_BUILD_TARGET=static PUBLIC_STATIC_EXPORT=1 npm run build

# 2. 品牌纯净度与全局规范检查
npm run test:brand

# 3. Phase 2.5 全链路功能回归、对抗性沙盒安全渗透与跨 Origin 桥接降级测试套件
node scripts/verify-lab-platform.mjs
```

- **静态构建结果**：`326 page(s) built in 1m 10s`（退出码 `0`，涵盖 `/lab/index.html`、`/lab/playground/index.html`、6 个 `/lab/[slug]/index.html` 与 6 个 `/lab/preview/[slug]/index.html`）。
- **页面未捕获异常统计**：`uncaughtPageErrors = 0`（含 React 19 水合一致性校验通过）。

---

## 二、功能回归测试矩阵 (Functional Verification)

| 编号 | 测试项 | 真实选择器与验证动作 | 结果 |
| :--- | :--- | :--- | :--- |
| **FUNC-01** | 原有 4 实验 + 新增 2 实验广场回归 | 访问 `/lab/`，验证 6 张卡片与 `#lab-star-canvas`、`#plane-3d`、6 个 `.sound-pad`、`#fx-input-val`（输入 `100` 实时输出 `#fx-cny-out = ¥ 725.00`）；验证分类筛选、标签筛选与关键词检索 | **PASS** |
| **FUNC-02** | 广场源码弹窗无障碍体验 | 点击 `[data-target-slug="star-trails-simulator"]` 打开 `#lab-source-modal`，按 `Escape` 键关闭并校验 `document.activeElement` 焦点归还至触发按钮 | **PASS** |
| **FUNC-03** | 全部 6 个详情页零报错运行（含 TypeScript 实验） | 逐一访问 `/lab/star-trails-simulator/` 至 `/lab/verlet-rope-physics/`，校验 `#lab-playground-workspace[data-exec-status="completed"]`（验证 `canvas.getContext('2d')!` 与 `{ length: NODE_COUNT }` 正确编译执行） | **PASS** |
| **FUNC-04** | 算法逐步执行可视化器 | 访问 `/lab/algorithm-execution-tracer/`，测试冒泡排序前进/后退、`.code-line-row[data-active="true"]` 唯一高亮、切换二分查找与递归快速排序多层 `.stack-frame` | **PASS** |
| **FUNC-05** | 工坊路由历史同步与刷新保持 | 在 `/lab/playground/` 切换预设至 `verlet-rope-physics`，验证 URL `?slug=` 同步、F5 `reload()` 保持选中、浏览器 `goBack()` (`popstate`) 准确退回上一实验 | **PASS** |
| **FUNC-06** | TypeScript 子集边界显式报错拦截 | 在 `script.ts` 分别输入 `enum BadMode { Fast, Slow }` 与 JSX `<div className="x">`，校验 `runtime-error-list` 输出明确中文诊断而非静默执行错误语义代码 | **PASS** |
| **FUNC-07** | JSON 导出下载、文件导入与 `#bundle=` 门禁 | 触发 `btn-export-json` 下载并校验 `lab-bundle-v1`；通过 `input-import-file` 导入修改后的 JSON 及访问 `#bundle=...` 链接，校验 `untrusted-code-banner` 展示且未点击运行前 `iframe` 数量为 `0` | **PASS** |
| **FUNC-08** | 主题实时同步、全屏 `Escape` 与简繁切换保护 | 切换 `data-theme="dark"` 验证沙盒联动；全屏预览按 `Escape` 退出；调用 `window.__shijianus_applyLocaleVariant('zh-Hant')` 验证按钮变为「執行程式碼」且 `script.ts` 源码 100% 零改动 | **PASS** |
| **FUNC-09** | 移动端 `390x844` 全路由零溢出与博客无回归 | 在 `390x844` 视口巡检 `/lab/`、`/lab/playground/`、`/lab/algorithm-execution-tracer/`、`/lab/preview/star-trails-simulator/`（均满足 `scrollWidth <= innerWidth + 2`）；校验 `/`、`/about/` 返回 `200` 且满足 `CONSTITUTION.md`（圆角 `<= 8px`，无禁用词） | **PASS** |

---

## 三、安全渗透与跨站桥接测试矩阵 (Security & Multi-Origin Matrix)

| 编号 | 攻击面 / 测试向量 | 防御机制 | 实测证据 | 结果 |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Opaque Origin 与 `sandbox` 最小权限 | `<iframe sandbox="allow-scripts" referrerpolicy="no-referrer">` | `window.origin === "null"`，无 `allow-same-origin` / `allow-popups` / `allow-top-navigation` | **PASS** |
| **SEC-02** | 沙盒 DOM 泄露 `SESSION_ID` 探测 | 引导 `<script nonce="...">` 首行执行 `document.currentScript.remove()` | `document.documentElement.outerHTML.includes('lab-sess-') === false` | **PASS** |
| **SEC-03** | `</script>` / `</style>` / `<textarea>` 闭合与 `<img onerror>` 注入 | Unicode 转义内联 JSON + DOM API 挂载 + 随机 `nonce` CSP | `window.__inline_csp_bypass` 与 `window.__css_escape_bypass` 均为 `undefined` (`INLINE_BYPASS:false`) | **PASS** |
| **SEC-04** | 窃取主站 `document.cookie` / `localStorage` / 父窗口 DOM | Opaque Origin + 同源策略隔离 | 三项探测全部抛出 `SecurityError` | **PASS** |
| **SEC-05** | 后台 `Blob Worker` 逃逸与外发 `fetch`（含主站 API） | `Worker`/`SharedWorker` 构造器封禁 + CSP `worker-src 'none'; connect-src 'none'` | `WORKER_BLOCKED:SecurityError`，外部与主站 API `fetch` 全部 `rejected` | **PASS** |
| **SEC-06** | Console 二阶 XSS 与伪造 `postMessage` 注入 | React 纯文本渲染 + `verifySandboxMessage()` 校验 `source`、`origin`、`sessionId` | `window.__host_xss_pwned === false`，伪造消息被丢弃 | **PASS** |
| **SEC-07** | `for(;;){ try { while(true){} } catch(e){} }` 死循环抗绕过熔断 | Token 级 `__labLoopGuard()` 单宏任务 `2200ms` 预算 + `turnAborted` 锁存 | 实测 `2582ms` 自动熔断并输出 `[Sandbox Timeout]`，主页面全程可交互 | **PASS** |
| **SEC-08** | `setInterval` 定时器炸弹与 500 条日志洪泛 | `MAX_ACTIVE_TIMERS = 256` 配额拦截 + `MAX_CONSOLE_ENTRIES = 200` 截断 | 第 257 个计时器起被阻断报错；日志行数稳定截断在 `<= 201` 行 | **PASS** |
| **SEC-09** | 跨 Origin 沙盒桥接与远端故障 3s 自动降级 | `127.0.0.1:4357` 主站 <-> `localhost:4356` 桥接器握手；关闭桥接器模拟故障 | 握手成功执行 TS 代码并回传日志；关闭桥接服务后 `3s` 内自动切换至 `opaque-srcdoc` 并完成执行 | **PASS** |

---

## 四、构建产物体积与性能指标

- **非 Lab 页面零体积污染**：校验 `dist/index.html` 对 `LabPlayground` 与 `lab-platform.css` 的引用均为 `false`（**0 KB 额外首屏负担**）。
- **按需加载包体积（未压缩原始构建尺寸）**：
  - `dist/_astro/LabPlayground.*.js`：`73.98 KB`（仅在 `/lab/playground/` 与 `/lab/[slug]/` 加载）
  - `dist/_astro/ExecutionVisualizer.*.js`：`54.48 KB`（仅在启用过程追踪的页面加载）
  - `dist/_astro/lab-platform.*.css`：`15.65 KB`
- **`/lab/` 实验广场加载耗时**：本地 Headless Chromium 实测 `load` 耗时 `694 ms`。

---

## 五、SKIP 与待验证项说明（诚实披露）

1. **Firefox 与 WebKit 本地二进制实测（`SKIP`）**：当前本地 Linux 容器仅安装了 Playwright Chromium Headless 二进制，未安装 Firefox / WebKit 浏览器内核，已在测试输出中显式标注 `SKIP`。
2. **本地不同端口 vs 真实跨站点进程隔离差异说明**：本地 `127.0.0.1:4357` 与 `localhost:4356` 属于跨 Origin（验证了 CSP `frame-src`、`frame-ancestors`、`postMessage` Origin 白名单与 3s 降级协议），但不等同于公网 `blog.epocanvas.com` 与 `epocanvas-lab-sandbox.pages.dev` 的真实 eTLD+1 跨站线上边缘环境。
3. **Cloudflare Pages 独立沙盒项目创建与线上联调（`待验证 · 等待授权`）**：因严格遵守「未经明确授权不创建云资源、不执行 `git commit` / `git push` / `wrangler pages deploy`」指令，真实 `*.pages.dev` 跨站预发布联调与生产环境切换留待站长授权后按 [`LAB_DEPLOYMENT.md`](./LAB_DEPLOYMENT.md) 顺序执行。
