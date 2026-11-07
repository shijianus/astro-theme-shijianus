# Astro Blog「试验田 Lab」Phase 2.6 跨浏览器与真实 Cloudflare Preview 预发布验收报告 (LAB_TEST_REPORT.md)

> **文档状态**：已完成 **Chromium (`156.0.8078.4`) + Firefox (`157.0`) + WebKit (`27.2`)** 本地多 Origin 与 **真实 Cloudflare Pages Preview 跨站环境**全链路实测验证（**0 SKIP · 0 未捕获 JS 异常**）  
> **本地三核验收脚本**：[`scripts/verify-lab-platform.mjs`](../../scripts/verify-lab-platform.mjs)  
> **真实 Cloudflare Preview 跨站验收脚本**：[`scripts/verify-lab-cloudflare-preview.mjs`](../../scripts/verify-lab-cloudflare-preview.mjs)

---

## 一、实际测试环境与预发布部署信息

| 项目 | 实际值 |
| :--- | :--- |
| **审查分支** | `review/lab-phase-2.5`（生产 `main` 保持在 `2e92967072febadd70e03d13bfd1cc6e2207bc55` 未改动） |
| **Node.js / Playwright 内核** | Node `v22.18.0` · Chromium `156.0.8078.4` · Firefox `157.0` · WebKit `27.2` |
| **独立纯静态预发布沙盒 URL** | `https://epocanvas-lab-sandbox-staging.pages.dev`（部署实例：`https://6f74e870.epocanvas-lab-sandbox-staging.pages.dev`） |
| **主站 Cloudflare Preview URL** | 分支别名：`https://review-lab-phase-2-5.shijianus-blog.pages.dev`<br>最新部署哈希：`https://6dcc30ac.shijianus-blog.pages.dev` |
| **现网生产基线（未触碰）** | `shijianus-blog` Production (`main`, Deployment ID `15603502-14f1-4340-b4b1-4f126ee24068`, Source `2e92967`) |

### 执行的完整构建与测试命令
```bash
# 1. 本地无跨站源构建与三核全链路回归（测试默认回退与非官方代码无沙盒 Fail-Closed）
PUBLIC_LAB_SANDBOX_ORIGIN="" npm run build
npm run test:brand
node scripts/verify-lab-platform.mjs

# 2. 独立预发布纯静态沙盒隔离部署（0 Functions / 0 绑定强制校验）
node scripts/deploy-lab-sandbox.mjs --project-name epocanvas-lab-sandbox-staging --branch main

# 3. 绑定精确预发布沙盒 Origin 构建并部署主站 Preview 分支
PUBLIC_LAB_SANDBOX_ORIGIN="https://epocanvas-lab-sandbox-staging.pages.dev" npm run build
npx wrangler pages deploy dist --project-name shijianus-blog --branch review-lab-phase-2-5 --commit-dirty=true

# 4. 真实 Cloudflare Pages Preview 跨站 CSP / iframe / postMessage / 网络隔离 / 三核回归验收
PREVIEW_BASE_URL="https://review-lab-phase-2-5.shijianus-blog.pages.dev" \
SANDBOX_ORIGIN_URL="https://epocanvas-lab-sandbox-staging.pages.dev" \
node scripts/verify-lab-cloudflare-preview.mjs
```

---

## 二、真实 Cloudflare 边缘 HTTP 响应头核验结果

### 2.1 独立预发布沙盒边缘头 (`https://epocanvas-lab-sandbox-staging.pages.dev/`)
- **HTTP 状态码**：`200`（且探测 `/api/comments` 返回 `404`，确认 **0 Functions、0 API 暴露**）
- **`access-control-allow-origin`**：**`null`（已完全剥离 Cloudflare Pages 默认 `*` 通配头）**
- **`content-security-policy`**：
  ```text
  default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; frame-src 'self' blob:; child-src 'self' blob:; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors https://blog.epocanvas.com https://shijianus-blog.pages.dev https://*.shijianus-blog.pages.dev;
  ```
- **`permissions-policy`**：禁用 `accelerometer`、`autoplay`、`camera`、`clipboard-read`、`clipboard-write`、`display-capture`、`document-domain`、`fullscreen`、`geolocation`、`hid`/`usb`、`microphone`、`payment`、`publickey-credentials-get`、`sync-xhr` 等 26 项敏感能力（不含会冻结离屏帧握手的实验性 `execution-while-out-of-viewport`）。
- **其他安全头**：`cross-origin-resource-policy: cross-origin`、`referrer-policy: no-referrer`、`x-content-type-options: nosniff`、`cache-control: public, max-age=0, must-revalidate`。

### 2.2 主站 Preview 边缘头 (`https://review-lab-phase-2-5.shijianus-blog.pages.dev/lab/playground/`)
- **HTTP 状态码**：`200`（Preview 分支自动附带 `x-robots-tag: noindex`）
- **`content-security-policy`（节选 `frame-src` 与 `frame-ancestors`）**：
  ```text
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com https://player.bilibili.com https://www.bilibili.com https://www.youtube.com https://www.youtube-nocookie.com https://epocanvas-lab-sandbox-staging.pages.dev; frame-ancestors 'self'; form-action 'self'; object-src 'none'; base-uri 'self'
  ```
  - 精确白名单绑定 `https://epocanvas-lab-sandbox-staging.pages.dev`，**零通配符 `*`**。
- **其他安全头**：`strict-transport-security: max-age=31536000; includeSubDomains; preload`、`x-frame-options: SAMEORIGIN`、`x-content-type-options: nosniff`、`referrer-policy: strict-origin-when-cross-origin`。

---

## 三、Chromium / Firefox / WebKit 三核测试结果总览

### 3.1 本地三核全链路验收 (`scripts/verify-lab-platform.mjs`)
| 验证维度 | Chromium `156.0.8078.4` | Firefox `157.0` | WebKit `27.2` |
| :--- | :--- | :--- | :--- |
| `/lab/` 实验广场、筛选检索、源码弹窗焦点归还、圆角 `<= 8px` | **PASS** (`1037ms`) | **PASS** (`1393ms`) | **PASS** (`3932ms`) |
| 全部 6 个详情页运行、`official` 本地回退提示、算法逐步执行可视化器 | **PASS** | **PASS** | **PASS** |
| Opaque Origin、Cookie/Storage/DOM 阻断、HTML/CSS 逃逸拦截、Worker/Fetch 封锁 | **PASS** | **PASS** | **PASS** |
| 篡改 `performance.now = () => 0` + `try/catch` 死循环强制熔断 | **PASS** (`2533ms`) | **PASS** (`3170ms`) | **PASS** (`2429ms`) |
| 定时器炸弹配额（`256`）、日志洪泛截断（`200`）、伪造 `postMessage` 丢弃 | **PASS** | **PASS** | **PASS** |
| 无跨站沙盒时 `imported` / `community` / `#bundle=` 禁止自动运行 + 点击运行强制 `Fail-Closed` | **PASS** | **PASS** | **PASS** |
| 多 Origin 桥接联调 + 断连时非官方 `Fail-Closed` / 官方显式提示回退 | **PASS** | **PASS** | **PASS** |
| 主题联动、简繁切换源码保护、独立预览页、移动端 `390x844` 零溢出、`/` 与 `/about/` 回归 | **PASS** | **PASS** | **PASS** |
| 未捕获页面 JS 异常数 (`uncaughtPageErrors`) | **`0`** | **`0`** | **`0`** |

### 3.2 真实 Cloudflare Pages Preview 跨站安全与三核回归 (`scripts/verify-lab-cloudflare-preview.mjs`)
| 验证维度（`review-lab-phase-2-5.shijianus-blog.pages.dev` <-> `epocanvas-lab-sandbox-staging.pages.dev`） | Chromium `156.0.8078.4` | Firefox `157.0` | WebKit `27.2` |
| :--- | :--- | :--- | :--- |
| 非授权父源 (`http://127.0.0.1:4398`) 嵌入真实预发布沙盒被 `frame-ancestors` + Origin 白名单双重阻断 | **PASS** | **PASS** | **PASS** |
| 真实公网跨站握手（主站 Preview -> 独立 `*.pages.dev` 桥接帧 -> 内层 `origin === "null"`） | **PASS** | **PASS** | **PASS** |
| 真实跨站 Cookie / `localStorage` / `parent` & `top` DOM / `fetch` / `XHR` / `WebSocket` / `Worker` 全封锁 | **PASS** | **PASS** | **PASS** |
| 防篡改死循环熔断、并发计时器上限、伪造 `postMessage` 拒绝、Console 二阶 XSS 免疫 | **PASS** | **PASS** | **PASS** |
| `imported` / `community` / `#bundle=` 手动门禁 + 模拟跨站沙盒宕机时 100% 强制 `Fail-Closed`（`0` iframe） | **PASS** | **PASS** | **PASS** |
| `official` 官方实验在模拟跨站沙盒宕机时展示明确提示横幅并安全回退本地 `opaque-srcdoc` | **PASS** | **PASS** | **PASS** |
| 离屏详情页跨站握手、独立预览页跨站挂载、`390x844` 移动端零溢出、`/` 与 `/about/` 回归 | **PASS** | **PASS** | **PASS** |
| 未捕获页面 JS 异常数 (`uncaughtPageErrors`) | **`0`** | **`0`** | **`0`** |

---

## 四、Phase 2.6 跨浏览器与预发布实测发现并修复的问题清单

1. **Wrangler CLI 根目录 `functions/` 自动上传隐患（高危部署风险 · 已根治）**：
   - *现象*：在主站仓库根目录直接执行 `npx wrangler pages deploy sandbox-runner` 时，Wrangler 4.151.0 会自动发现并打包根目录下的 `./functions/` 上传至沙盒项目。
   - *修复*：立即销毁重建纯净预发布项目，新增 [`scripts/deploy-lab-sandbox.mjs`](../../scripts/deploy-lab-sandbox.mjs)（在 `/tmp` 隔离目录中携带零绑定 `wrangler.json` 部署并强制校验上传日志无 Functions / Worker）与 `sandbox-runner/404.html`（确保 `/api/*` 返回 `404`）。
2. **WebKit Opaque Origin `document.cookie` 行为差异（跨内核安全一致性问题 · 已修复）**：
   - *现象*：WebKit 在 `<iframe sandbox="allow-scripts">` 内读取 `document.cookie` 原生返回 `""` 而不像 Chromium/Firefox 抛出 `SecurityError`。
   - *修复*：在 `src/lib/lab-sandbox-protocol.ts` 引导脚本中通过不可配置的 `Object.defineProperty(document, 'cookie', ...)` 统一抛出 `DOMException(..., 'SecurityError')`。
3. **WebKit / Safari 连续文件导入失效（跨浏览器交互问题 · 已修复）**：
   - *现象*：`LabPlayground.tsx` 原逻辑在 `FileReader.readAsText(file)` 后同步清空 `display: none` 文件输入框的 `value`，导致 WebKit 第二次导入 JSON 时丢失文件变更事件。
   - *修复*：改为异步 `file.text()` 读取并在 `.finally()` 中重置 `inputEl.value = ''`，同时采用无障碍视觉隐藏样式替代 `display: none`。
4. **Firefox 页面跳转中断动态导入导致的未捕获 Promise 拒绝（既有站点跨内核缺陷 · 已修复）**：
   - *现象*：`src/lib/client-locale.ts` 空闲预热 `ensureChineseConverters()` 未加 `.catch()`，在 Firefox 快速导航中断 chunk 加载时触发未捕获异常。
   - *修复*：补充 `.catch(() => {})` 并在加载失败时重置缓存 Promise。
5. **Firefox 公网 Fission 跨站子帧冷启动单次 `PING` 竞态（真实边缘联调发现 · 已修复）**：
   - *现象*：公网冷启动跨站 OOPIF 时单次 `onLoad` `PING` 可能因 `about:blank` 过渡期丢失，且外层桥接就绪未及时解除握手倒计时。
   - *修复*：在 `LabPlayground.tsx` 与 `src/pages/lab/preview/[slug].astro` 中加入 `300ms` 周期 `PING` 重试，并在收到经 Origin 与窗口引用双重校验的 `SANDBOX_BRIDGE_READY` 时立即确认跨站连通性。

---

## 五、残余风险与测试驱动限制诚实说明

1. **客户端沙盒固有 CPU/内存边界**：单条无循环关键字的原生高复杂度操作（如极端正则回溯、超大 `TypedArray` 分配、WebGL 死循环着色器）无法被 JS 层 `__labLoopGuard` 中途抢占；WebKit/iOS 尚未在所有硬件上提供完整的跨站子帧独立进程崩溃隔离。由于非官方代码全面禁止自动运行且无跨站沙盒时强制 `Fail-Closed`，普通访客浏览页面不会被动触发此类消耗。
2. **预发布沙盒 `*.shijianus-blog.pages.dev` 子域白名单说明**：预发布沙盒 `epocanvas-lab-sandbox-staging` 为联调 Preview 部署允许了 `https://*.shijianus-blog.pages.dev`；正式生产发布时，建议创建独立生产沙盒项目 `epocanvas-lab-sandbox` 并将 `frame-ancestors` 与 `isAllowedHostOrigin` 严格收紧为仅 `https://blog.epocanvas.com`。
3. **Playwright 驱动层已知特性记录（非产品缺陷）**：Playwright Firefox 的 Juggler 协议在开启 `context.route` 拦截钩子后会对真实 HTTPS Fission OOPIF 产生 `NS_BINDING_ABORTED`，验收脚本仅在模拟沙盒断网演练子阶段开启拦截并在恢复阶段重建无钩子的原生浏览器上下文；Playwright WebKit 会将被业务 `try/catch` 正常捕获的外链歌词 API CORS 拦截日志投递至 `pageerror`，验收脚本已精准识别并保留对全部真实 JS 异常（`Error` / `TypeError` / `SyntaxError` / `DOMException`）的零容忍断言。
