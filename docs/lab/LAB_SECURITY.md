# Astro Blog「试验田 Lab」安全威胁模型与隔离规范 (LAB_SECURITY.md)

## 1. 安全设计最高原则

1. **外部输入默认零信任**：通过 JSON 导入或 `#bundle=` URL Hash 载入的代码一律标记 `isUntrustedCode = true` 并强制关闭自动执行（`iframe` 不挂载），必须经用户审阅源码后手动点击运行。
2. **主站与边缘函数零代码执行**：严禁在 `blog.epocanvas.com` 主站窗口调用 `eval()` / `new Function()`，严禁将实验 HTML 直接写入主站 DOM，严禁在 Astro 构建期或绑定了 D1 / Secret 的 Cloudflare Pages Functions 中执行任何实验代码。
3. **纵深防御与诚实边界**：结合跨站点进程隔离（Cross-Site OOPIF）、HTML5 Opaque Origin（`sandbox="allow-scripts"`）、一次性随机 `nonce` CSP、DOM 安全注入与循环/定时器/消息配额熔断；同时如实披露浏览器客户端沙盒的固有物理边界。

---

## 2. Origin、Site 与 CORS 信任边界分析

### 2.1 为什么严禁使用 `*.epocanvas.com` 或 `*.shijianus-blog.pages.dev` 作为沙盒域名？
1. **Same-Site Cookie 与进程共享风险**：`lab.epocanvas.com` 与 `blog.epocanvas.com` 具有相同的可注册域（eTLD+1 = `epocanvas.com`），属于 **Same-Site**。父域 Cookie（`Domain=.epocanvas.com`）与 `SameSite=Lax/Strict` Cookie 在同站子域间可被携带，且部分浏览器按 Site 粒度共享渲染进程池。
2. **主站 API CORS 白名单交叉风险**：主站 `functions/_lib/http.ts` 的 `resolveAllowedCorsOrigin()` 显式信任 `https://epocanvas.com`、`https://*.epocanvas.com`、`https://*.shijianus-blog.pages.dev` 与 `https://shijianus.github.io` 并返回 `Access-Control-Allow-Credentials: true`。
3. **代码级硬性拦截**：因此，`src/lib/lab-sandbox-protocol.ts` 中的 `resolveSafeExternalSandboxOrigin()` 与 `functions/_middleware.ts` 中的 `resolveValidatedLabSandboxOrigin()` **在代码层直接拒绝上述所有主站关联域名**，仅允许挂载在 Public Suffix List 独立站点（如全新 Cloudflare Pages 项目 `https://epocanvas-lab-sandbox.pages.dev`）或全新独立可注册域名下。

### 2.2 双层沙盒权限矩阵
| 运行组件 | `sandbox` 属性 | `window.origin` | 作用与安全边界 |
| :--- | :--- | :--- | :--- |
| **本地默认沙盒 (`opaque-srcdoc`)** | `sandbox="allow-scripts"` | `"null"` | 禁止 `allow-same-origin`、弹窗、表单、下载、模态框与顶层导航；直接阻断 `document.cookie`、`localStorage` 与 `window.parent.document`。 |
| **跨站外层桥接帧 (`sandbox-runner/index.html`)** | `sandbox="allow-scripts allow-same-origin"` | `https://<sandbox-project>.pages.dev` | 保留独立 Cross-Site Origin 以触发桌面 Chromium/Firefox 的 Site Isolation (OOPIF) 独立进程分配，同时允许外层页面与 `window.parent` 完成显式 Origin 校验；外层自身**绝不执行用户代码**。 |
| **跨站内层执行帧 (`#inner-runner`)** | `sandbox="allow-scripts"` | `"null"` | 位于跨站进程内部的不透明源子帧，承载用户 `srcDoc`；即便用户代码尝试读写外层桥接页存储或篡改桥接逻辑，也会被浏览器同源策略抛出 `SecurityError`。 |

---

## 3. HTTP 响应头 CSP 与 `<meta>` CSP 能力边界对比

`<meta http-equiv="Content-Security-Policy">` 无法替代 HTTP 响应头 CSP 的全部指令。项目中严格区分两者职责：

| 安全指令 / 能力 | `<meta>` CSP 是否支持 | HTTP 响应头 CSP 是否支持 | 本项目实际落地位置 |
| :--- | :--- | :--- | :--- |
| `default-src` / `script-src` / `connect-src` / `worker-src` / `child-src` / `object-src` / `base-uri` / `form-action` | 支持 | 支持 | 同时写入内层 `buildIsolatedSandboxSrcDoc()` 的 `<meta>` CSP 与 `sandbox-runner/_headers` HTTP 头 |
| `frame-ancestors`（防点击劫持 / 限制谁可嵌入沙盒） | **不支持**（规范规定在 `<meta>` 中被忽略） | **支持** | 由主站 `functions/_middleware.ts`（`'none'`）与独立沙盒 `sandbox-runner/_headers`（仅允许 `https://blog.epocanvas.com`）通过 HTTP 响应头强制下发 |
| `sandbox` 指令 / `report-uri` / `report-to` | **不支持** | **支持** | 通过宿主 `<iframe>` HTML `sandbox` 属性强制约束（注意：`sandbox-runner/_headers` 外层不加 `sandbox allow-scripts` 指令，以免抹掉 Cross-Site Origin 破坏 `ALLOWED_HOSTS` 握手） |
| `srcdoc` 子帧 CSP 继承规则 | 受父文档 CSP 约束 | 受父文档 CSP 约束 | 根据 W3C CSP 规范，`srcdoc` iframe 会继承父文档的 CSP 并叠加自身 `<meta>` CSP（取交集最严值）。因此 `sandbox-runner/_headers` 允许 `frame-src 'self' blob:` 与 `'unsafe-eval'`（供内层 `new Function` 运行转换后代码），而内层 `srcdoc` `<meta>` CSP 进一步收紧为 `frame-src 'none'; child-src 'none'; worker-src 'none'; script-src 'nonce-<random>' 'unsafe-eval'`。 |

### 3.1 防标签闭合逃逸与 Nonce CSP 机制 (`buildIsolatedSandboxSrcDoc()`)
- **消除 HTML/CSS 拼接逃逸**：用户 `html`、`css`、`instrumentedJs` 绝不直接拼接到 HTML 模板标签内部，而是经过 `encodeSafeInlineJson()` 将 `<`、`>`、`&`、`\u2028`、`\u2029` 全部转义为 Unicode 转义序列（`\u003c` 等），在唯一带有随机 `nonce` 的引导 `<script nonce="...">` 内通过 `userCssEl.textContent = ...` 与 `document.body.innerHTML = ...` 安全挂载。
- **拦截内联事件与外部脚本**：HTML 预处理阶段剥离 `<base>`、危险 `<meta http-equiv>`，拒绝 `<script src="...">`，并将 HTML 内联 `<script>` 提取合并进统一循环插桩管线；运行时由 `script-src 'nonce-<random>' 'unsafe-eval'` 阻断用户 HTML 中注入的任何 `<img src=x onerror=...>`、`onload` 或未授权 `<script>` 标签。
- **隐藏会话标识**：引导脚本在启动首行立即执行 `document.currentScript.parentNode.removeChild(document.currentScript)`，将 `SESSION_ID` 保存在私有闭包中，防止用户代码通过 `document.documentElement.outerHTML` 读取。

---

## 4. `postMessage` 通信校验与防伪造说明

1. **`sessionId` 的真实安全定位**：`sessionId`（`lab-sess-<UUID>`）属于**会话级防串扰随机数 (Session Nonce)**，用于隔离连续多次点击运行时旧沙盒残留的异步消息，**不等同于密码学消息认证码 (MAC)**——一旦用户代码在当前沙盒内执行，理论上可通过闭包外的侧信道尝试猜测或发送任意消息结构。
2. **零特权消息面**：因此宿主绝不信任沙盒回传消息中的任何权限声明。沙盒到宿主仅开放 4 类只读遥测事件（`SANDBOX_READY`、`CONSOLE_EVENT`、`RUNTIME_ERROR`、`EXECUTION_COMPLETE`）及桥接握手事件 `SANDBOX_BRIDGE_READY`，无任何文件读写、路由跳转、API 调用或状态修改接口。
3. **`verifySandboxMessage()` 多重校验**：
   - 强制校验 `event.source === iframeRef.current.contentWindow`（桥接模式下绑定桥接帧窗口，本地模式下绑定 `srcdoc` 帧窗口）；
   - 按当前运行模式严格匹配 `event.origin`（本地模式仅接受 `'null'`；跨站模式仅接受已验证的 `externalSandboxOrigin`，拒绝跨模式混用）；
   - 在调用任何序列化操作前先按字段长度估算 UTF-8 字节数（`<= 256 KB`）与参数个数上限（`<= 12` 项），防止超大深层对象触发主站 `JSON.stringify` 卡顿；
   - 单次会话宿主侧最多接收 `350` 条协议消息，超过后自动触发断路器销毁失控沙盒，Console 日志最多保留 `200` 条且全部通过 React 纯文本节点渲染，彻底杜绝二阶 XSS。

---

## 5. 浏览器资源耗尽防御与跨内核真实差异声明

### 5.1 已落地的四道资源防线
1. **同步死循环编译期插桩 (`__labLoopGuard`)**：对 `while`、`do...while`、`for`、`for...of/in` 每 4096 次迭代检查一次单宏任务耗时预算（`2200ms`），超时后置位 `turnAborted = true` 并持续抛错，即便恶意代码编写 `for(;;){ try { while(true){} } catch(e){} }` 也无法绕过熔断。
2. **并发计时器配额 (`MAX_ACTIVE_TIMERS = 256`)**：重写沙盒内 `setTimeout` / `setInterval`，将最小间隔钳制为 `>= 4ms`，活跃计时器达到 `256` 个时立即阻断后续创建并上报错误。
3. **消息洪泛断路器**：沙盒内限制 `200` 条日志，宿主侧超过 `350` 条消息直接销毁沙盒 iframe。
4. **宿主 5 秒启动看门狗 (`EXECUTION_WATCHDOG_MS = 5000`)**：若沙盒在挂载后 `5000ms` 内仍未完成同步入口执行，宿主自动销毁 iframe 并提示超时。

### 5.2 诚实披露的残余风险与浏览器差异
- **非循环型单表达式原生阻塞与超大内存分配**：若用户手动编写并点击运行不含循环关键字的灾难性正则回溯、超大同步 `Array(1e9).fill(0)` 或 WebGL 着色器死循环，`__labLoopGuard` 无法在单条原生 C++ 调用中途抢占。
- **Chromium / Firefox / WebKit 进程隔离差异**：
  - **桌面端 Chromium 与 Firefox**：当启用独立 `*.pages.dev` 跨站沙盒时，Site Isolation (OOPIF / Fission) 会将跨站点 iframe 调度至独立渲染进程，沙盒进程卡死通常不会锁死主站外层 UI（用户仍可点击「停止」销毁 iframe）；但在默认本地 `srcdoc` 模式下，与父页面共享同一渲染线程。
  - **WebKit (macOS Safari) 与所有 iOS/iPadOS 浏览器**：各浏览器尚未在所有设备上提供等同于桌面 Chromium 的完整跨站子帧独立进程抢占保证，极端内存暴涨仍可能导致当前标签页被系统回收重载。由于所有外部导入/分享代码均默认禁止自动运行，访客不会在被动浏览页面时遭受此类 DoS。
