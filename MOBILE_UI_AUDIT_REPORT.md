# 生产端 (Cloudflare Pages) 移动端 UI/UX 全链路视觉与布局审计报告
> **审计环境**：`https://blog.epocanvas.com` (Cloudflare Pages 生产部署版本)  
> **审计工具**：Playwright 自动化视觉核验套件 (WebKit/Chromium Mobile Emulation)  
> **模拟视口**：
> - 标准移动端旗舰视口：`390 x 844` (iPhone 14/15 Pro, Device Scale Factor: 2, Touch Emulation)
> - 极端窄屏与小屏视口：`375 x 667` (iPhone SE / 小型移动设备)  
> **审计日期**：2026-09-16  
> **阶段说明**：当前阶段为**只读视觉验证阶段**，未修改任何生产业务逻辑代码，全量问题附带确凿数据与截图证据链。

---

## 目录 (Table of Contents)
1. [审计执行概述与测试矩阵](#1-审计执行概述与测试矩阵)
2. [严重问题清单与确凿证据链 (Critical & Major Issues)](#2-严重问题清单与确凿证据链)
   - [Bug 1: 全站首屏加载层全屏拦截 Pointer Events 导致假死](#bug-1-全站首屏加载层全屏拦截-pointer-events-导致假死)
   - [Bug 2: 右下角悬浮控制台 (#rightside) 严重垂直挤压坍塌与点击事件被拦截](#bug-2-右下角悬浮控制台-rightside-严重垂直挤压坍塌与点击事件被拦截)
   - [Bug 3: 中控台模态框 (#console) 移动端严重纵向超出屏幕且缺少实体关闭途径](#bug-3-中控台模态框-console-移动端严重纵向超出屏幕且缺少实体关闭途径)
   - [Bug 4: 顶部导航栏 (#nav) 图标极度拥挤、贴边溢出与宽度挤扁至 0px](#bug-4-顶部导航栏-nav-图标极度拥挤贴边溢出与宽度挤扁至-0px)
   - [Bug 5: 文章页移动端文章目录 (TOC) 呼出受阻与侧边栏渲染错位](#bug-5-文章页移动端文章目录-toc-呼出受阻与侧边栏渲染错位)
   - [Bug 6: 文章尾部下一篇推荐 (#pagination.pagination-post) 移动端屏占比过大与双重遮挡](#bug-6-文章尾部下一篇推荐-paginationpagination-post-移动端屏占比过大与双重遮挡)
   - [Bug 7: 移动端汉堡导航菜单 (.site-mobile-panel) 缺少遮罩与点击穿透风险](#bug-7-移动端汉堡导航菜单-site-mobile-panel-缺少遮罩与点击穿透风险)
   - [Bug 8: 赞助支持页面 (/support/) 移动端网格紧绷与通道切换热区过小](#bug-8-赞助支持页面-support-移动端网格紧绷与通道切换热区过小)
3. [良性指标验证结果 (Verified Passed Items)](#3-良性指标验证结果)
4. [修复建议与优先级路线图 (Remediation Roadmap)](#4-修复建议与优先级路线图)

---

## 1. 审计执行概述与测试矩阵

本次审计使用 Playwright 真实驱动移动端无头浏览器，注入触控事件，覆盖首页、文章详情页（图文/代码/表格排版）、赞助页（咖啡支持/多币种）、关于我、分类与归档等核心页面，共截取了 **29 张高分辨率 Retina 截图** 并进行了全量 DOM/CSS 几何测量。

### 核心测试视口矩阵
| 设备模型 | 分辨率 | 设备像素比 (DPR) | 触控支持 | 测试侧重点 |
| :--- | :--- | :--- | :--- | :--- |
| **iPhone 14/15 Pro** | `390 x 844` | 2.0 | 是 | 全站常规移动端视觉体验、各浮层与模态框、核心交互 |
| **iPhone SE / 标准窄屏** | `375 x 667` | 2.0 | 是 | 极端窄屏水平溢出、首屏可见高度、键盘/浮层压缩率 |

---

## 2. 严重问题清单与确凿证据链

---

### Bug 1: 全站首屏加载层全屏拦截 Pointer Events 导致假死
- **严重级别**：🔴 **致命级 (Critical) — 交互阻塞**
- **所在页面**：全站通用（首页、文章页、关于页等）
- **现象描述**：
  新访客打开页面或在站内导航跳转时，Playwright 尝试触发移动端任何交互（例如点击汉堡菜单、赞赏按钮、目录按钮等），均遭到长达数秒的事件拦截并抛出超时重试：
  ```text
  waiting for locator('#mobile-toc-button')
  attempting click action
  waiting for element to be visible, enabled and stable
  <div aria-hidden="true" class="loading-stars">…</div> from <div id="loading-box" aria-hidden="true" class="is-first-visit">…</div> subtree intercepts pointer events
  retrying click action (retried > 10 times)
  ```
- **根本原因 (Root Cause)**：
  `#loading-box` 全屏加载动画容器虽然在动画后期可能视觉上降低了透明度，但在其退出动画完成前甚至淡出后，**未设置 `pointer-events: none`**。在移动蜂窝网络下，页面即使已渲染出文字，用户手指触碰屏幕的任何区域都会被该全屏隐形层强行拦截，造成严重的“点击无反应/页面卡死”假象。
- **证据链文件**：
  - Playwright 拦截日志：`task-87.log` (L70-L95)
  - 关联截图：`scripts/audit_screenshots/mobile_audit/01_home_hero.png`

---

### Bug 2: 右下角悬浮控制台 (#rightside) 严重垂直挤压坍塌与点击事件被拦截
- **严重级别**：🔴 **致命级 (Critical) — 样式崩溃 & 点击失效**
- **所在页面**：文章详情页 (`/posts/...`) 及其他内页
- **现象描述**：
  1. **按钮尺寸极度畸变与坍塌**：
     通过 DOM 测量 API 实测 `#rightside` 内部按钮在移动端的渲染尺寸：
     - `#go-up` (返回顶部按钮)：高度仅有 **2px** (`offsetHeight: 2`, `computedHeight: "2px"`, `rect: { width: 35, height: 2 }`)！
     - `#translate` (语言切换)：高度仅有 **16px** (`height: 16`)！
     - `#mobile-toc-button` (目录按钮)：高度仅有 **18px** (`height: 18`)！
     - `#to_comment` (直达评论)：高度仅有 **18px** (`height: 18`)！
     - `#readmode` (阅读模式)：高度仅有 **18px** (`height: 18`)！
  2. **违反触控规范**：
     移动端触控规范要求最小交互热区应达到 44x44px 或 48x48px。2px 的返回顶部按钮在手机触控屏上**物理上几乎不可能被手指点击中**！
  3. **点击事件被完全遮盖拦截**：
     Playwright 执行 `page.locator('#mobile-toc-button').click()` 时直接超时失败：
     ```text
     locator.click: Timeout 30000ms exceeded.
     <svg ... class="rightside-icon" ...> from <div id="rightside-config-show">…</div> subtree intercepts pointer events
     ```
     `#rightside-config-show` 与折叠中的 `#rightside-config-hide` 发生物理交错，下层按钮被上层按钮图标彻底覆盖，导致**文章目录按钮在手机端完全无法点击**！
- **根本原因 (Root Cause)**：
  在 `src/styles/global.css` 与 `src/styles/final-pass.css` 中：
  1. `#rightside` 设为 `flex-direction: column`，但子按钮未声明 `flex-shrink: 0` 与明确的 `min-height: 35px`；
  2. 折叠状态的 `#rightside-config-hide` 仅使用了 `max-height: 0; overflow: hidden; transform: translateY(12px)`，由于 `transform` 作用，其内部元素发生位移重叠，未在折叠时应用 `display: none` 或 `pointer-events: none`，导致内部处于半压缩状态的按钮与外部容器发生恶性重叠。
- **证据链文件**：
  - 测量数据：`audit_findings.json` (L150-L189)
  - 截获日志：`task-87.log` (L1-L68)
  - 放大截图：`scripts/audit_screenshots/mobile_audit/deep_01_rightside_collapsed.png`

---

### Bug 3: 中控台模态框 (#console) 移动端严重纵向超出屏幕且缺少实体关闭途径
- **严重级别**：🟠 **严重级 (Major) — 布局溢出 & 困闭用户**
- **所在页面**：全站中控台弹窗 (`#console`)
- **现象描述**：
  1. **无任何可见的移动端关闭按钮**：
     实测控制台打开状态下的 DOM：
     `closeBtnRect: null`, `isCloseBtnVisible: false`！
     在桌面端用户依赖键盘 `ESC` 键关闭中控台；但在手机移动端没有键盘，控制台内部没有提供明显的 "×" 关闭按钮或右上角浮动关闭触发器。一旦移动端用户点击进入中控台，无法得知如何退回到页面，用户被“困”在中控台内。
  2. **卡片垂直大面积溢出视口**：
     移动端视口高度为 844px：
     - 卡片组自身高度达到 `659.59px`；
     - 底部快捷操作条 `btnGroupRect.bottom: 832px`，紧贴屏幕底边缘；
     - **Activity 活跃热力图卡片被挤推到视口之外极深位置**：`activityRect.top: 1259px`，`bottom: 1632.86px`！在手机上需要大幅向下滚动 800px 才能看到热力图，缺乏移动端专属的紧凑折叠设计。
- **根本原因 (Root Cause)**：
  `#console` 组件原本针对宽屏桌面设计，移动端媒体查询（≤768px）下未提供吸顶或浮动的独立关闭 Header，且 `.console-card-group` 依然保持桌面端各卡片的堆叠方式，未对移动端屏幕高度做最大视口约束。
- **证据链文件**：
  - 实测数据：`task-81` Console metrics
  - 现场截图：`scripts/audit_screenshots/mobile_audit/evidence_02_console_modal.png`

---

### Bug 4: 顶部导航栏 (#nav) 图标极度拥挤、贴边溢出与宽度挤扁至 0px
- **严重级别**：🟠 **严重级 (Major) — 响应式挤压**
- **所在页面**：全站顶部导航栏 (`#nav` / `#nav-right`)
- **现象描述**：
  在仅有 390px（甚至 375px）宽度的移动屏幕上，顶部导航右侧同时塞入了多达 7 个独立图标/按钮：
  - 账号中心 (`#nav-account`)
  - 站内搜索 (`#search-button`)
  - 深色模式切换粒子按钮 (`#nav-theme-toggle`)
  - 随机文章骰子 (`#randomPost_button`)
  - 中控台 3 线矩阵图标 (`#center-console-button-astro`)
  - 汉堡菜单按钮 (`#toggle-menu`)
  - 顶部滚动进度胶囊 (`#nav-totop` / `.totopbtn`)
  **实测数据发现**：
  - 顶部滚动百分比胶囊 `#nav-totop` 宽度直接被压缩至 **0px** (`rect.width: 0`)！
  - 最右侧元素坐标达到 `right: 382px`，距离屏幕右边界 390px 仅剩 8px，完全贴边！
  - 按钮间距在移动端极度狭窄（部分仅 2px~4px 间隙），用户在移动端使用大拇指触碰汉堡菜单时，极高概率误触中控台按钮或骰子按钮。
- **根本原因 (Root Cause)**：
  `SiteHeader.tsx` 在移动端（≤768px）仅隐藏了主文字链接 `#menus`，但 `#nav-right` 中的所有功能性快捷按钮全部未作降级或收纳处理，导致 7 个按钮在 390px 的屏幕中并排平铺。
- **证据链文件**：
  - 测量数据：`audit_findings.json` (L15-L35)
  - 现场截图：`scripts/audit_screenshots/mobile_audit/01_home_hero.png`、`fast_01_post_hero.png`、`26_iphone_se_article_hero.png`

---

### Bug 5: 文章页移动端文章目录 (TOC) 呼出受阻与侧边栏渲染错位
- **严重级别**：🟠 **严重级 (Major) — 功能缺失**
- **所在页面**：文章详情页
- **现象描述**：
  1. 移动端下用户无法正常查看与跳转文章目录：右下角的 `#mobile-toc-button` 因 Bug 2 提到的层叠覆盖导致点击被拦截；
  2. 探测数据表明：移动端下 `#aside-content` 的计算显示属性依然为 `asideDisplay: "flex"`，`#card-toc` 的显示属性为 `cardTocDisplay: "flex"`！
  3. 桌面端的侧边栏目录卡片在手机端依然保留了渲染结构，但它排布在正文极其遥远的底部（正文与相关推荐下方），并未像主流移动博客那样以抽屉（Drawer）形式浮动展现，移动端长文阅读几乎丧失大纲索引能力。
- **证据链文件**：
  - 测量数据：`audit_findings.json` (L191-L208)
  - 现场截图：`scripts/audit_screenshots/mobile_audit/15_post_nav_and_related.png`

---

### Bug 6: 文章尾部下一篇推荐 (#pagination.pagination-post) 移动端屏占比过大与双重遮挡
- **严重级别**：🟡 **体验缺陷 (Warning) — 空间挤压**
- **所在页面**：文章详情页底部评论区
- **现象描述**：
  - 当页面滚动到底部评论区（`#post-comment`）时，`#pagination.pagination-post` 浮现。
  - 实测其物理尺寸：宽度 **347.26px**，高度 **91.18px**，定位在 `bottom: 16px`。
  - 在高度仅 844px 的移动屏幕上，**单个浮动卡片独占了屏幕超过 11% 的有效视口面积**！
  - 结合位于 `bottom: 140px` 的 `#rightside` 悬浮工具栏，屏幕底部被大量悬浮 UI 占满，正文与评论输入区域的可视空间被严重吞噬，视觉压迫感明显。
- **证据链文件**：
  - 测量数据：`audit_findings.json` (L150-L165)
  - 现场截图：`scripts/audit_screenshots/mobile_audit/17_post_pagination_and_rightside.png`

---

### Bug 7: 移动端汉堡导航菜单 (.site-mobile-panel) 缺少遮罩与点击穿透风险
- **严重级别**：🟡 **体验缺陷 (Warning) — 交互不规范**
- **所在页面**：全站汉堡菜单展开状态
- **现象描述**：
  - 点击汉堡菜单后，展开的 `.site-mobile-panel` 是一个浮动在导航下方的卡片面板（`top: 66px; left: 16px; right: 16px;`）。
  - **缺少背景遮罩层 (Backdrop Overlay)**：面板下方页面内容完全透出，且用户点击面板外部的空白区域时**不会自动收起菜单**，也没有提供显式的关闭按钮，用户必须再次精准点击右上角的汉堡小图标才能关闭面板。
  - 在移动端容易引起背景链接的误触穿透。
- **证据链文件**：
  - 现场截图：`scripts/audit_screenshots/mobile_audit/evidence_01_hamburger_panel.png`、`04_sidebar_opened.png`

---

### Bug 8: 赞助支持页面 (/support/) 移动端网格紧绷与通道切换热区过小
- **严重级别**：🟡 **体验缺陷 (Warning) — 间距局促**
- **所在页面**：赞助支持页 (`/support/`)
- **现象描述**：
  1. 咖啡支持预设按钮在 390px 视口下保持 3 列网格，按钮宽度仅 **91px**，高度 50px，包含价格与特调名称，文字略显密集；
  2. 支付通道选择器：`🇨🇳 国内扫码`、`🇭🇰 港澳渠道`、`PayPal`、`USDT` 四个按钮单行排开，每个宽度仅 **71px**，国旗与文字紧贴边框，边缘易误触；
  3. 底部 FAQ 区域：多达 14 个卡片单调纵向铺开，各占 72px 高度，移动端整体滚动长度超过 3500px，缺乏精简或分页收纳。
- **证据链文件**：
  - 现场截图：`scripts/audit_screenshots/mobile_audit/evidence_support_page_top.png`、`evidence_support_presets.png`、`evidence_support_payment.png`

---

## 3. 良性指标验证结果 (Verified Passed Items)

除上述针对性问题外，本次全量审计也确认了以下优秀的移动端实现：
1. ✅ **零全局水平溢出 (Zero Horizontal Overflow)**：
   全站所有测试页面（首页、文章页、关于页、归档、分类、赞助页）在 `390px` 与 `375px` 视口下的 `scrollWidth` 均严格等于 `innerWidth`（差值 0px），**没有任何页面出现横向抖动或页面穿帮溢出**。
2. ✅ **正文 Markdown 表格与代码块自适应良好**：
   文章正文中的代码块 (`<pre><code>`) 与大型 Markdown 表格 (`<table>`) 均正确配置了容器内局部横向平滑滚动（`overflow-x: auto`），表格宽度为 316px，未撑爆屏幕容器。
3. ✅ **打赏赞赏模态框 (Reward Modal) 移动端全屏居中良好**：
   在文章详情页唤出赞赏弹窗后，模态框自适应全屏展开（宽度 390px，居中对齐），微信/支付宝二维码能够正常缩放展示。
4. ✅ **关于我页面 (/about/) 与归档页面 (/archives/) 自适应流畅**：
   个人技能徽章、统计数据卡片与时间轴在 390px 移动端均能顺畅折行并垂直堆叠，视觉层次清晰。

---

## 4. 修复建议与优先级路线图 (Remediation Roadmap)

针对上述确凿的视觉与交互缺陷，建议在后续优化阶段按以下优先级进行针对性修复：

| 优先级 | 修复目标 | 建议技术改造方案 |
| :--- | :--- | :--- |
| **P0 (阻塞)** | **Bug 1: 加载遮罩阻塞修复** | 在 `#loading-box` 上强制配置 `pointer-events: none !important`，并确保动画完成后彻底 `display: none`，消除假死拦截。 |
| **P0 (阻塞)** | **Bug 2: #rightside 按钮解压与重叠修复** | 1. 为 `#rightside` 所有子按钮补充 `flex-shrink: 0 !important; min-height: 35px !important; height: 35px !important;` 彻底消除 2px 坍塌；<br>2. 对折叠状态的 `#rightside-config-hide` 强制应用 `display: none !important; pointer-events: none !important;`，展开时才显示，解除对 `#mobile-toc-button` 的事件遮盖。 |
| **P1 (严重)** | **Bug 3: 控制台 (#console) 移动端适配** | 1. 为中控台添加显眼的移动端悬浮/吸顶关闭按钮（"×" / 关闭）；<br>2. 在移动端将 `.console-card-group` 的高度约束为自适应视口，并将 Activity 热力图改为紧凑视图或折叠抽屉。 |
| **P1 (严重)** | **Bug 4: 顶部导航栏 (#nav-right) 精简** | 在 `max-width: 768px` 移动端下：<br>1. 隐藏非高频按钮（如随机文章骰子、顶部百分比胶囊、中控台快捷键等）；<br>2. 仅保留最核心的【搜索】、【深色模式】与【汉堡菜单】3个大热区按钮，其余一律收纳进汉堡抽屉中。 |
| **P2 (体验)** | **Bug 5: 移动端专属 TOC 抽屉** | 修复 `#mobile-toc-button` 使得点击后呼出标准侧滑目录抽屉（TOC Drawer），并将桌面端底层静态 `#card-toc` 在移动端彻底 `display: none`。 |
| **P2 (体验)** | **Bug 6: 下一篇卡片与汉堡菜单优化** | 1. 移动端将 `.pagination-post` 压缩至精致小胶囊（高度 ≤64px，左右边距更紧凑）；<br>2. 为汉堡面板增加全屏渐变遮罩层（Backdrop），支持点击外部即时收起。 |
| **P3 (打磨)** | **Bug 8: 赞助页面移动端微调** | 1. 支付通道切换按钮（国内/港澳/PayPal/USDT）改为 2x2 网格，提升触控热区；<br>2. FAQ 列表支持分页或单项折叠收敛。 |

---
*报告生成路径：`MOBILE_UI_AUDIT_REPORT.md`*  
*核验证据链截图目录：`scripts/audit_screenshots/mobile_audit/`*
