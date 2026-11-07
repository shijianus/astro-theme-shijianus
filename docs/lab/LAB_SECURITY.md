# Astro Blog「试验田 Lab」安全威胁模型与隔离规范 (LAB_SECURITY.md)

## 1. 安全设计最高原则

1. **外部输入默认零信任与强制失败关闭 (Fail-Closed)**：
   - 通过 JSON 文件导入（`imported`）、社区作者来源（`community`）或 `#bundle=` URL Hash（`bundle`）载入的非官方代码，一律强制关闭自动执行（初始挂载时 `iframe` 数量为 `0`），必须经用户审阅源码后手动点击运行。
   - **分级降级与失败关闭策略 (Phase 2.6)**：
     - **`official`（内置受审阅官方实验）**：当独立跨站沙盒未配置或握手超时（`4500ms`）时，允许在向用户展示明确的降级提示横幅（`data-testid="official-fallback-banner"` / `"preview-fallback-banner"`）后，回退至本地无 `allow-same-origin` 的 `opaque-srcdoc` 强隔离沙盒运行。
     - **`imported` / `community` / `bundle`（所有外部与非官方代码）**：**严禁回退至本地 `srcdoc`**。一旦独立跨站沙盒未配置、校验失败或网络不可达，系统立即触发 **失败关闭 (`Fail-Closed`, `data-fail-closed="true"`)**，销毁/拒绝挂载任何 `iframe`，并展示阻断告警横幅。本地草稿存取（`localStorage`）持久保留 `draftOriginKind` / `sourceKind`，防止非官方代码通过「存草稿 -> 读草稿」洗白为 `official`。
2. **主站与边缘函数零代码执行**：严禁在 `blog.epocanvas.com` 主站窗口调用 `eval()` / `new Function()`，严禁将实验 HTML 直接写入主站 DOM，严禁在 Astro 构建期或绑定了 D1 / Secret 的 Cloudflare Pages Functions 中执行任何实验代码。
3. **纵深防御与诚实边界**：结合跨站点进程隔离（Cross-Site OOPIF / Fission）、HTML5 Opaque Origin（`sandbox="allow-scripts"`）、边缘 `_headers` + 一次性随机 `nonce` CSP、防篡改死循环/定时器/消息配额熔断；同时如实披露浏览器客户端沙盒的固有物理边界。

---

## 2. Origin、Site 与 CORS 信任边界分析

### 2.1 为什么严禁使用 `*.epocanvas.com` 或 `*.shijianus-blog.pages.dev` 作为沙盒域名？
1. **Same-Site Cookie 与进程共享风险**：`lab.epocanvas.com` 与 `blog.epocanvas.com` 具有相同的可注册域（eTLD+1 = `epocanvas.com`），属于 **Same-Site**。父域 Cookie（`Domain=.epocanvas.com`）与 `SameSite=Lax/Strict` Cookie 在同站子域间可被携带，且部分浏览器按 Site 粒度共享渲染进程池。
2. **主站 API CORS 白名单交叉风险**：主站 `functions/_lib/http.ts` 的 `resolveAllowedCorsOrigin()` 显式信任 `https://epocanvas.com`、`https://*.epocanvas.com`、`https://*.shijianus-blog.pages.dev` 与 `https://shijianus.github.io` 并返回 `Access-Control-Allow-Credentials: true`。
3. **代码级硬性拦截**：`src/lib/lab-sandbox-protocol.ts` 中的 `resolveSafeExternalSandboxOrigin()` 与 `functions/_middleware.ts` 中的 `resolveValidatedLabSandboxOrigin()` **在代码层直接拒绝上述所有主站关联域名**，仅允许挂载在 Public Suffix List 独立站点（如独立 Cloudflare Pages 项目 `https://epocanvas-lab-sandbox-staging.pages.dev` / `https://epocanvas-lab-sandbox.pages.dev`）或全新独立可注册域名下。

### 2.2 双层沙盒与来源策略矩阵
| 运行组件 / 代码等级 | `sandbox` 属性 | `window.origin` | 跨站沙盒不可达时行为 | 作用与安全边界 |
| :--- | :--- | :--- | :--- | :--- |
| **本地回退沙盒 (`opaque-srcdoc`，仅限 `official`)** | `sandbox="allow-scripts"` | `"null"` | 显示显式降级提示横幅后启用 | 禁止 `allow-same-origin`、弹窗、表单、下载、模态框与顶层导航；阻断 `document.cookie`、`localStorage` 与 `window.parent.document`。 |
| **跨站外层桥接帧 (`sandbox-runner/index.html`)** | `sandbox="allow-scripts allow-same-origin"` | `https://<sandbox-project>.pages.dev` | — | 保留独立 Cross-Site Origin 以触发桌面 Chromium/Firefox 的 Site Isolation (OOPIF / Fission) 独立进程分配，校验 `window.parent` 与 `isAllowedHostOrigin(event.origin)`；**外层自身绝不执行用户代码**。 |
| **跨站内层执行帧 (`#inner-runner`)** | `sandbox="allow-scripts"` | `"null"` | — | 位于跨站进程内部的不透明源子帧，承载用户 `srcDoc`；即便用户代码尝试读写外层桥接页存储或篡改桥接逻辑，也会被同源策略抛出 `SecurityError`。 |
| **非官方代码 (`imported` / `community` / `bundle`)** | 仅允许在跨站双层沙盒内手动触发 | `"null"`（位于跨站桥接帧内部） | **强制 `Fail-Closed`（`0` iframe 挂载）** | 禁止自动执行；无跨站沙盒或握手超时时严禁回退本地 `srcdoc`，确保不可信代码绝不进入主站同进程线程。 |

---

## 3. 边缘 HTTP 响应头 (`_headers`) 与内层 `<meta>` CSP 纵深配置

`<meta http-equiv="Content-Security-Policy">` 无法替代 HTTP 响应头 CSP 的全部指令。项目中严格区分两者职责，并在真实 Cloudflare Pages 边缘节点完成实测核验：

| 安全头 / 指令 | `<meta>` CSP 是否支持 | HTTP 头是否支持 | 实际落地位置与边缘核验状态 |
| :--- | :--- | :--- | :--- |
| `! Access-Control-Allow-Origin` | 不适用 | **支持（Cloudflare `_headers` 解绑语法）** | 写入 `sandbox-runner/_headers` 首行，**实测彻底剥离 Cloudflare Pages 默认注入的 `Access-Control-Allow-Origin: *`**，消除任意第三方页面跨域读取沙盒静态资源的宽松头。 |
| `404.html` 静态非 SPA 兜底 | 不适用 | **支持** | 提供纯静态 `sandbox-runner/404.html`，禁用 Cloudflare Pages 默认将未知路径（如 `/api/*`）`200` 回退至 `index.html` 的行为，确保非根路径严格返回 `HTTP 404`。 |
| `default-src` / `script-src` / `connect-src` / `worker-src` / `child-src` / `object-src` / `base-uri` / `form-action` | 支持 | 支持 | 同时写入内层 `buildIsolatedSandboxSrcDoc()` 的 `<meta>` CSP 与 `sandbox-runner/_headers` HTTP 头（`connect-src 'none'; worker-src 'none'` 实测阻断全部 `fetch`、`XHR`、`WebSocket` 与 `Blob Worker`）。 |
| `frame-ancestors`（限制谁可嵌入沙盒） | **不支持** | **支持** | 主站 `functions/_middleware.ts` 设为 `'self'`；预发布沙盒 `sandbox-runner/_headers` 设为 `https://blog.epocanvas.com https://shijianus-blog.pages.dev https://*.shijianus-blog.pages.dev`（禁止任何 `localhost` 残留；生产独立项目可进一步收紧为仅 `https://blog.epocanvas.com`）。 |
| `Permissions-Policy` | 不支持 | **支持** | 显式禁用 `camera`、`microphone`、`geolocation`、`payment`、`usb`、`clipboard-read`、`clipboard-write` 等 26 项敏感权限；故意不包含实验性 `execution-while-out-of-viewport=()`，避免详情页首屏下方的跨站沙盒帧被浏览器冻结导致握手死锁。 |

### 3.1 防标签闭合逃逸、Nonce CSP 与跨内核 Cookie 行为对齐 (`buildIsolatedSandboxSrcDoc()`)
- **消除 HTML/CSS 拼接逃逸**：用户 `html`、`css`、`instrumentedJs` 绝不直接拼接到 HTML 模板标签内部，而是经过 `encodeSafeInlineJson()` 将 `<`、`>`、`&`、`\u2028`、`\u2029` 全部转义为 Unicode 转义序列（`\u003c` 等），在唯一带有随机 `nonce` 的引导 `<script nonce="...">` 内通过 `userCssEl.textContent = ...` 与 `document.body.innerHTML = ...` 安全挂载。
- **拦截内联事件与外部脚本**：HTML 预处理阶段剥离 `<base>`、危险 `<meta http-equiv>`，拒绝 `<script src="...">`；运行时由 `script-src 'nonce-<random>' 'unsafe-eval'` 阻断用户 HTML 中注入的任何 `<img onerror=...>`、`onload` 或未授权 `<script>` 标签。
- **隐藏会话标识**：引导脚本在启动首行立即执行 `document.currentScript.parentNode.removeChild(document.currentScript)`，将 `SESSION_ID` 保存在私有闭包中，防止用户代码通过 `document.documentElement.outerHTML` 读取。
- **WebKit Opaque Origin `document.cookie` 一致性加固**：Chromium 与 Firefox 在 `sandbox="allow-scripts"` 中访问 `document.cookie` 原生抛出 `SecurityError`，而 WebKit 原生返回空字符串 `""` 且不抛异常。引导脚本在用户代码执行前通过不可配置（`configurable: false`）的 `Object.defineProperty(document, 'cookie', ...)` 统一主动抛出 `DOMException(..., 'SecurityError')`，确保三大浏览器内核隔离语义严格一致。

---

## 4. `postMessage` 通信握手机制与防伪造说明

1. **周期性 `PING` 握手与明确超时边界**：
   - 外层跨站桥接 `<iframe>` 触发 `load` 后，宿主以 `300ms` 间隔向精确 `externalSandboxOrigin` 发送 `PING`，直至收到来自桥接帧窗口与精确 Origin 的 `SANDBOX_BRIDGE_READY` 确认为止（消除 Firefox Fission 子进程冷启动及初始 `about:blank` 过渡期的单次消息丢失竞态）。
   - 未完成桥接确认前，宿主拒绝向 `iframe` 发送 `SET_THEME` / `TERMINATE_SESSION` 等控制消息，防止目标窗口尚处于 `about:blank` 时产生 `targetOrigin` 不匹配异常。
2. **`sessionId` 的真实安全定位**：`sessionId`（`lab-sess-<UUID>`）属于**会话级防串扰随机数 (Session Nonce)**，用于隔离连续多次点击运行时旧沙盒残留的异步消息，**不等同于密码学消息认证码 (MAC)**。
3. **零特权消息面与 `verifySandboxMessage()` 多重校验**：
   - 沙盒到宿主仅开放 4 类只读遥测事件（`SANDBOX_READY`、`CONSOLE_EVENT`、`RUNTIME_ERROR`、`EXECUTION_COMPLETE`）及桥接握手事件 `SANDBOX_BRIDGE_READY`，无任何文件读写、路由跳转、API 调用或状态修改接口。
   - 强制校验 `event.source === iframeRef.current.contentWindow` 与严格模式 `event.origin`（跨站模式仅接受已验证的 `externalSandboxOrigin`；本地回退模式仅接受 `'null'`）。
   - 在反序列化/处理前先校验载荷字节上限（`<= 256 KB`）与参数个数上限（`<= 12` 项），单次会话超过 `350` 条消息立即触发断路器销毁沙盒，Console 日志全部通过 React 纯文本节点渲染，彻底杜绝二阶 XSS。

---

## 5. 浏览器资源耗尽防御与残余风险披露

### 5.1 已落地的四道资源防线
1. **防篡改同步死循环编译期插桩 (`__labLoopGuard`)**：引导脚本在私有闭包中预先冻结保存原生 `const origPerfNow = performance.now.bind(performance)` 与 `const OrigError = Error`。即便恶意代码执行 `performance.now = () => 0; Error = function(){}; for(;;){ try { while(true){} } catch(e){} }`，仍会在单宏任务预算（`2200ms`）耗尽时置位不可逆 `turnAborted = true` 并强制终止执行。
2. **并发计时器配额 (`MAX_ACTIVE_TIMERS = 256`)**：重写沙盒内 `setTimeout` / `setInterval`，将最小间隔钳制为 `>= 4ms`，活跃计时器达到 `256` 个时立即阻断后续创建并上报错误。
3. **消息洪泛断路器**：沙盒内限制 `200` 条日志，宿主侧超过 `350` 条消息直接销毁沙盒 iframe。
4. **双层超时保护**：外层跨站桥接握手超时 `4500ms`（官方实验显式提示回退、非官方代码强制 `Fail-Closed`）+ 内层同步执行看门狗 `5000ms`（超时销毁实例）。

### 5.2 诚实披露的残余风险与跨内核物理边界
1. **非循环型单表达式原生阻塞与超大内存分配**：若用户手动编写并点击运行不含循环关键字的灾难性正则回溯、超大同步 `Array(1e9).fill(0)` 或 WebGL 着色器死循环，`__labLoopGuard` 无法在单条原生 C++ 调用中途抢占。
2. **Chromium / Firefox / WebKit 进程隔离差异**：
   - **桌面端 Chromium 与 Firefox**：启用独立 `*.pages.dev` 跨站沙盒时，Site Isolation (OOPIF / Fission) 会将跨站点 iframe 调度至独立渲染进程，沙盒进程卡死不会锁死主站外层 UI（用户仍可点击「停止」销毁 iframe）；若官方实验因断网回退至本地 `opaque-srcdoc` 模式，则与父页面共享同一渲染线程。
   - **WebKit (Safari) 与所有 iOS/iPadOS 浏览器**：受限于操作系统与内核架构，WebKit 尚未在所有设备上提供等同于桌面 Chromium 的完整跨站子帧独立进程抢占保证，极端内存分配仍可能导致当前标签页被系统回收。由于所有非官方代码均默认禁止自动运行且无跨站沙盒时强制 `Fail-Closed`，普通访客不会在浏览页面时被动触发此类 DoS。
3. **Preview 通配子域白名单说明**：预发布阶段为支持 `https://<hash>.shijianus-blog.pages.dev` 预览分支联调，预发布沙盒 `epocanvas-lab-sandbox-staging` 允许 `https://*.shijianus-blog.pages.dev` 嵌入；正式生产环境建议使用独立项目 `epocanvas-lab-sandbox` 并将 `frame-ancestors` 与 `isAllowedHostOrigin` 收紧为仅允许 `https://blog.epocanvas.com`。
