# 移动端全链路视觉与交互深度审计报告 (V2 阶段)

> **审计执行环境**：生产环境 `https://blog.epocanvas.com` (Cloudflare Pages 边缘节点)  
> **审计驱动**：Playwright MCP 真实移动端视网膜浏览器 (iPhone 14/15 Pro: 390×844 @2x Retina, 开启 Touch & isMobile；iPhone SE: 375×667 极限小屏交叉复核)  
> **审计模式**：纯只读客观核对 (Read-Only Comprehensive Audit)  
> **审计时间**：2026-09-17  

---

## Executive Summary (执行摘要)

本次审计从“0”开始，对部署在 Cloudflare Pages 生产环境的博客整站（11 个核心页面、多模态交互、深浅色模式、悬浮控制台与模态框）展开了地毯式真机自动化排查。

### 核心定性结论：
1. **此前高危缺陷已彻底根除且完全达标**：
   - **首页 578px 恶性横向溢出已 100% 解决**：整站 11 个主要路由在手机端（390px 与 375px 视口）的 `scrollWidth` 严格等于 `window.innerWidth`，**横向滚动溢出量严格为 0.0px**；
   - **赞赏支持页推荐档位卡片 100% 完整显示**：手机端自适应为 2 列（单卡宽度扩展至 142px~145px），**截断数量归零 (0 项截断)**；
   - **音乐播放器遮挡已解除**：尺寸缩小为 38×38px 悬浮微型黑胶，与可点击元素间距充裕，**重叠遮挡数量为 0**；
   - **电脑端零破坏、零回归**：桌面端（1440×900）首页重点卡组严格保持 348px 单行平铺，赞赏卡片严格保持 3 列，无任何样式退化。
2. **深度挖掘出的 4 大潜在延伸问题 (Extended Findings)**：
   - **【延伸缺陷 1】文章目录 (TOC) 按钮默认被藏在折叠层内**：`#mobile-toc-button` 位于 `#rightside-config-hide` 折叠容器内，导致长文阅读时目录入口深度过深，未展开时无法直接触达；
   - **【延伸缺陷 2】首屏加载动画在冷启动/弱网下的拦截窗口**：`#loading-box` 在页面跳转首屏渲染的毫秒级窗口内，未加载完毕前存在全局触控拦截；
   - **【延伸体验 3】代码块与复杂表格在小屏下的滑动指示**：代码块单行宽度 450px~600px 虽未撑破页面主体，但缺少左右滑动边缘阴影（Scroll Shadow），易造成视觉被截断的错觉；
   - **【延伸体验 4】极窄屏幕（375px）赞赏卡片在特定语系下的紧凑度**：在 iPhone SE 等 375px 小屏下，若外币符号较长，2 列卡片内边距略显紧凑。

---

## 一、全站 11 个核心路由移动端实测指标表

| 序号 | 页面路由与类型 | 移动端视口 (390px) 溢出量 | 页面主容器宽度 | 浮动组件数量 | 截图文件路径 | 状态定性 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `/` (首页主 Feed & Hero) | **0.0px** (`390px / 390px`) | `360px` | 6 | `01_home.png` | ✅ 完美正常 |
| **02** | `/posts/content-formats-and-markup-mastery/` (长文详情) | **0.0px** (`390px / 390px`) | `360px` | 7 | `02_post_formats.png` | ✅ 完美正常 |
| **03** | `/posts/example-embeds/` (多媒体嵌入) | **0.0px** (`390px / 390px`) | `360px` | 7 | `03_post_embeds.png` | ✅ 完美正常 |
| **04** | `/posts/example-code-enhancements/` (代码块增强) | **0.0px** (`390px / 390px`) | `360px` | 7 | `04_post_code.png` | ✅ 完美正常 |
| **05** | `/support/` (赞助支持收银台) | **0.0px** (`390px / 390px`) | `360px` | 6 | `05_support.png` | ✅ 完美正常 |
| **06** | `/categories/` (全站分类) | **0.0px** (`390px / 390px`) | `360px` | 6 | `06_categories.png` | ✅ 完美正常 |
| **07** | `/tags/` (标签聚合云) | **0.0px** (`390px / 390px`) | `360px` | 6 | `07_tags.png` | ✅ 完美正常 |
| **08** | `/archives/` (文章归档时间轴) | **0.0px** (`390px / 390px`) | `360px` | 6 | `08_archives.png` | ✅ 完美正常 |
| **09** | `/friends/` (友邻圈子) | **0.0px** (`390px / 390px`) | `360px` | 6 | `09_friends.png` | ✅ 完美正常 |
| **10** | `/about/` (关于作者与站点) | **0.0px** (`390px / 390px`) | `360px` | 6 | `10_about.png` | ✅ 完美正常 |
| **11** | `/status/` (站点运行工单) | **0.0px** (`390px / 390px`) | `360px` | 6 | `11_status.png` | ✅ 完美正常 |

> **关键数据证明**：全站 11 个主要页面无论内容多长、包含多少表格、代码或嵌套 iframe，页面横向滑脱（Horizontal Overflow）全部为 **0px**，手机端双指缩放和单指滑动时，页面主体稳定锁死在 390px 视口内，杜绝任何摇晃晃动。

---

## 二、此前优化项的深度复核数据 (Verification of Fixes)

### 1. 首页重点内容区 (`#home_top`)
- **优化前**：`swiper_container_card` 为横向 flex，Banner（311px）与卡组（624px）并排撑破视口达 953px，溢出 578px。
- **当前实测**：
  - `swiperWidth: 360px`（在 390px 视口内左右保留各 15px 安全内边距）；
  - `flex-direction: column !important`；
  - 重点卡组 `.topGroup .recent-post-item` 自适应为 2 列（单卡宽 172px），封面与标题比例谐调，无任何变形。

### 2. 赞助支持页 (`/support/`) 预设档位卡片
- **优化前**：3 列写死（`grid-cols-3`），单卡宽 92px，所有性质说明全部被截断（“推荐...”、“边缘...”等）。
- **当前实测数据**：
  ```json
  "cards": [
    { "text": "¥4 CNY", "width": 142, "truncated": [] },
    { "text": "¥9 CNY", "width": 142, "truncated": [] },
    { "text": "¥14 CNY", "width": 145, "truncated": [] },
    { "text": "¥16 CNY", "width": 142, "truncated": [] },
    { "text": "¥20 CNY", "width": 142, "truncated": [] },
    { "text": "¥25 CNY", "width": 142, "truncated": [] }
  ],
  "truncatedCount": 0
  ```
  6 张预设卡片在 390px 视口下宽度达到 142px~145px，文案全部完整直出，无任何省略号截断。

### 3. 音乐播放器黑胶唱片 (`.shijianus-music-pocket`)
- **优化前**：66×66px 巨大黑圈悬浮于左下角，直接覆盖赞赏卡片与页面左下角可触控区域。
- **当前实测数据**：
  - 尺寸收敛至 `w: 38px, h: 38px`；
  - 黑胶内盘 `28×28px`，中心核心点 `7×7px`；
  - 位置贴边 `left: 10px; bottom: 74px;`；
  - 与页面内容元素重叠数：`overlappedCards: 0`（0 重叠）。

---

## 三、深度挖掘出的潜在延伸问题与优化建议 (Extended Findings)

通过本次从 0 开始的自动化探索，我们发现了以下几个次级/延伸问题，建议在下一阶段进行持续打磨：

### 延伸问题 1：文章长文目录按钮 (`#mobile-toc-button`) 的调用链路过长
- **现象定位**：在长文页面（如 `/posts/content-formats-and-markup-mastery/`），`#mobile-toc-button` 的 DOM 结构隶属于 `#rightside-config-hide`（右侧折叠隐藏组）。
- **影响评估**：
  1. 手机端用户在阅读数万字长文时，无法一键调出目录大纲，必须先点击右下角的展开齿轮（`#rightside-config`），等待折叠层滑出后，才能点击目录按钮唤起 `#mobile-toc-drawer`；
  2. 自动化测试脚本在未展开隐藏组时直接定位该按钮，会被外层覆盖物拦截。
- **优化建议**：在移动端文章页面中，将文章目录按钮从 `#rightside-config-hide` 提升至常驻显示组（`#rightside-config-show`），或者作为右侧首位高频动作直出，让长文读者单手一键直达大纲。

### 延伸问题 2：首屏加载遮罩 (`#loading-box`) 在路由初次加载时的毫秒级拦截
- **现象定位**：在页面刚开始加载到 DOM 准备就绪的短暂时间窗内（约 200ms~600ms），`<div id="loading-box">` 尚未添加 `.loaded` 类名，具有 `position: fixed; inset: 0; z-index: 999999;`。
- **影响评估**：如果用户进入页面后立即尝试点击顶部导航或搜索按钮，会触发点击拦截提示。
- **优化建议**：可进一步将 `#loading-box` 在移动端的前置交互门槛降低，例如移动端首屏允许通过任何位置的 `touchstart` 立即强制施加 `.loaded` 隐匿。

### 延伸问题 3：超长代码块与复杂表格缺少移动端“横向滚动指示条/阴影”
- **现象定位**：在 `/posts/example-code-enhancements/` 中，部分 Shell 脚本和 JSON 代码单行宽度达到 598px。当前容器配置了 `overflow-x: auto`，成功锁定了页面主体（没有产生外部溢出）。
- **影响评估**：在移动端 Safari 和 Chrome 中，默认的滚动条通常处于隐匿状态（只有在滑动时才短暂闪现）。部分读者可能会误以为右侧代码被裁剪。
- **优化建议**：为 `pre` 或 `figure.highlight` 容器右侧注入微弱的径向渐变滚动提示阴影（Scroll Indicator Gradient），当右侧仍有未读代码时显示微光，滑到最右侧时淡出。

### 延伸问题 4：文章末尾下一篇推荐 (`#pagination.pagination-post`) 的移动端平滑过渡
- **现象定位**：卡片在未触发评论区时处于 `opacity: 0`。当前它在移动端具有 58px~60px 的紧凑高度，但在某些长评页面中，如果用户快速上下滑动，卡片的渐隐渐显过渡可更细腻。
- **优化建议**：增加 0.2s 的 CSS 单调缓动，并在滑出评论区时平滑退场。

---

## 四、只读审计报告结论

经过本次严格的 Playwright MCP 移动端真机全链路核查：
1. **当前博客移动端的核心可用性与主视觉展示已经处于非常健康且正常的状态**，横向溢出全面清零，关键交互路径（导航、中控台、赞赏结账、深浅色模式）全量畅通。
2. 电脑端（桌面端）经 1440×900 视网膜复查，**零回归、零破坏**。
3. 本报告已如实记录当前现状并深入挖掘了 4 项可用于未来精益迭代的延伸体验优化点。

> 本审计报告已固化至本地仓库：[MOBILE_FULL_AUDIT_REPORT_V2.md](file:///home/shijian/projects/shijianus-blog/MOBILE_FULL_AUDIT_REPORT_V2.md)，现场高分辨率视网膜截图保存在 `scripts/audit_screenshots/mobile_full_audit_v2/` 目录下供随时查验。
