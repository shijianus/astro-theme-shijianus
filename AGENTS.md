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

### Task 4: Apple Pay 域名签名验证与 Stripe 支付链路全景排查
- [x] 注入官方 Apple Pay Domain Association 验证文件 `public/.well-known/apple-developer-merchantid-domain-association` (`59f770b`)。
- [x] 多端全量同步至 `origin` 与 `cf` (`shijianus.github.io`) 仓库。
- [x] 梳理 Apple Pay 在 Stripe Web 端展示的完整必要条件（Stripe 域名验证、Apple 硬件/Safari 沙盒、Apple Wallet 绑卡状态）并输出标准操作手册。

### Task 6: Telegram 赞赏通知触发时机严格控制与自定义模板规则完善 (`1de1926`)
- [x] 严格限制 TG 发送时机：严禁在支付完成阶段（出现 `class="flex-1 overflow-y-auto"` 成功阶段）之前发送任何内容；全面清理 PaymentIntent/CheckoutSession 创建时的过早通知。
- [x] 全面覆盖 `class="flex-1 overflow-y-auto"` 关闭的各类触发场景：
  1. 支持者未填写称呼/祝福（`class="space-y-2.5"` 为空）时关闭模态框（`modal_closed`）；
  2. 支持者填写称呼/祝福后提交或关闭（`form_submitted`）；
  3. 非自然关闭场景（页面刷新、标签页关闭、断网等 `beforeunload`/`pagehide` 触发 `page_unload`）；
  4. 30分钟兜底超时自动判定与发送机制（`idle_timeout_30m`）。
- [x] 新增 Telegram 配置体系（`src/config/telegram.ts` 与 `functions/_lib/telegram-config.ts`），支持通过设置文件全量自定义通知内容，默认包含"赞赏金额"、"赞赏者"、"祝福"、"IP地址"、"支付通道"、"订单标识"、"完成时间(以太平洋时间为准并标注PST)"、"触发机制"等必备字段。
- [x] 编写并执行自动化测试套件（`scratch/verify-tg-timing.cjs`），全量验证各场景触发机制、太平洋时间（PST）格式与幂等性保障。

### Task 7: 敏感凭证全面清理与环境变量隔离加固 (`255f385`)
- [x] 全面排查并彻底清除代码中所有硬编码 Telegram Bot Token (`8690822896:...`)、Chat ID (`7963161588`) 与 Stripe Secret Key 默认兜底。
- [x] 严格限制所有敏感配置仅由环境变量 (`.env`, `.dev.vars`, Cloudflare Pages Environment Variables) 注入，若未配置则静默降级或报错提示，严禁在源码中写入任何真实/测试密钥。
- [x] 新增 `.env.example` 规范模板，并在 `.gitignore` 中完善环境变量白名单与保护规则。
- [x] 执行全局构建与编译验证，确保本地开发与生产端无任何敏感凭证泄漏。

### Task 8: 生产端 (Cloudflare Pages) 新凭证部署与线上全链路验证 (`c6ce400`)
- [x] 通过 Wrangler Secrets 批量同步加密上传新 `TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID` 与 `STRIPE_SECRET_KEY` 至 `shijianus-blog` 及 `shijianus-github-io` 生产环境变量池。
- [x] 构建最新 Functions 运行时并全量部署至 Cloudflare Pages 生产边缘节点。
- [x] 针对生产域名 `https://blog.epocanvas.com` 进行真实端到端 API 与浏览器交互审计，成功捕获生产端 `200 OK` 响应并触发 Telegram 机器人实时送达。

### Task 9: 文章末尾下一篇推荐 (Pagination Post) 交互时机与视觉优化 (`1e3b30f`)
- [x] 首次出现时机严格控制：仅当 `#post-comment` 评论区顶部滚动至与 `#nav` 主导航平齐时激活显示（`.is-visible`），往上回滚即时隐藏，下滑再次达到时重新展现。
- [x] 视觉与超链接交互重构：移除 `.next-post-arrow` 箭头图标；右下角固定定位；悬浮高亮 `.pagination-info` 标题文字呈现超链接质感，点击整卡或文字直接平滑跳转下一篇文章。
- [x] 终止位置与出屏判定：当 `#post-comment` 划出可视区域时自动隐藏 `.pagination-post`。
- [x] 关闭状态生命周期控制：点击 `.pagination-close` (×) 按钮后立即收起并标记已关闭，在该次页面浏览过程中不再展示，直到用户刷新界面（F5/Reload）后才重置。
- [x] 编写并执行自动化端到端测试套件（`scripts/verify-pagination-post.mjs`），全量验证出现位置、出屏隐藏、关闭后不重复展示及刷新后恢复逻辑。

### Task 10: 文章末尾下一篇推荐 (Pagination Post) 自动消失时机精准优化 (`019021f`)
- [x] 优化消失时机判定：进入评论区后持续保持显示，仅当用户向上滚动导致 `#post-comment` 完全向下移出屏幕底部（`commentRect.top >= viewportHeight`）时才自动隐藏。
- [x] 优化二次激活机制：当 `#post-comment` 从底部移出消失后，若用户再次向下滚动并使 `#post-comment` 顶部与 `#nav` 平齐时重新激活。
- [x] 自动化测试套件（`scripts/verify-pagination-post.mjs`）全量更新与端到端验证通过。

### Task 11: Telegram 推广翻转卡片 (flip-content) 3D 渲染与 QR-Code 回归修复 (`f19554c`)
- [x] 修复 3D 坐标空间扁平化缺陷：清除 `#flip-wrapper`、`#flip-content`、`.promo-widget` 及相关外部 CSS 中的 `overflow: hidden`，恢复标准 `transform-style: preserve-3d` 与 `perspective: 1000px`。
- [x] 修复背面 QR-Code 渲染与翻转失效：为 `.front-face` 与 `.back-face` 精准配置 `-webkit-backface-visibility: hidden` 与 `transform: rotateY(...)`，确保正面与背面在旋转 180° 时精准交替，杜绝文字镜像反转或空白。
- [x] 完善配置链路：在 `PromoWidgetCard.astro` 中打通 `siteConfig.aside.telegramWidget` 的全部字段（`subtitle`、`backLabel`、`summary`、`qrCrop`），确保二维码图片 (`@chronoral.tg.jpg`)、说明文本及加入按钮完整展示。
- [x] 编写并执行全流程自动化端到端测试（`scripts/verify-flip-content.mjs`），覆盖首页与文章页下的翻转交互、背面 QR 尺寸与可见性验证。

### Task 12: 参考安知鱼 UI 优化 Post Hero 封面、横向排版扩展、动态水波纹与卡片图片保障 (`35e69f3`)
- [x] 修复 `post-hero__cover` 与 `post-hero` 大小失控与无限扩张问题：固定高度 clamp(`380px`, `32vw`, `440px`)，将封面限制于绝对定位容器内，右侧艺术化倾斜角度展示，杜绝纵向无休止拉伸。
- [x] 解除 `post-hero__inner`、`post-hero__title-block` 和 `post-hero__lede` 的狭窄字符限制（移除 `58ch`/`70ch` 约束），扩展到容器最大宽 1400px，赋予标题与副标题向右横向自适应扩展排版能力。
- [x] 激活底部水波纹动态 Parallax 动效（`post-hero-wave` 4层视差滚动动画），清除之前 `final-pass.css` 中的 `animation: none !important` 抑制，完美适配浅色与深色模式背景。
- [x] 支持用户无封面图（纯色/渐变）优雅呈现：若文章未配置图片则不渲染 `<img>` 标签，平滑降级至高质感径向渐变背景；同时确保首页卡片（`PostCard.astro`）必须有图片且默认回退到 default 图片。
- [x] 编写并执行 Playwright 自动化测试套件（`scripts/verify-post-hero-anzhiyu.mjs`），桌面与移动端 E2E 验证全量通过。
### Task 13: 参考安知鱼 UI 深化 Post Hero 水波纹加速、纯色蓝色打底、方形徽标、#Tag 与流式 Meta 信息 (`f8276fa`)
- [x] 水波纹流动速度加速：优化 `post-hero-wave` 4 层波浪动画周期至 3s/5s/7s/10s，增强视觉流动感与灵动性。
- [x] 纯色/无背景蓝色打底：将 `/posts/content-formats-and-markup-mastery/` 设置为空背景，无封面图时自适应呈现安知鱼标志性径向与线性混合蓝底（`#425aef` 渐变系）。
- [x] 原创/转载徽标方形圆角化：将 `.post-hero__badge.is-primary` 调整为 Anzhiyu 风格的方形小圆角（`border-radius: 4px`），白底蓝字高对比展现。
- [x] 标签 `#tag` 格式紧随其后：将后续分类/标签重构为内联 `#tag` 超链接形态（`.post-hero__tag` 与 `.post-hero__tag-hash`），提供自然的 hover 交互态。
- [x] Meta 信息非方框式流式排布：重构 `.post-hero__meta-grid`，移除方框卡片容器与边框，采用点号（`•`）分隔的轻量透明流式文字流，还原安知鱼原生 post-info 精致质感。
- [x] 自动化测试套件（`scripts/verify-post-hero-anzhiyu.mjs`）更新与 E2E 验证全量通过。

### Task 14: 文章下一篇推荐 (Pagination Post) 层级修正与顶层中控台/账号中心绝对优先级保障 (`6244cb8`)
- [x] 重构 Z-Index 全局层级阶梯：将 `#console` 中控台中心、`.theme-account-overlay`/`.theme-account-drawer` 账号中心、`.theme-search` 站内搜索、`RewardModal` 等顶层模态框统一固化至最高层级（`z-index: 9998 ~ 10005`）。
- [x] 降级 `.pagination-post` 页面级浮动层级：将 `#pagination.pagination-post` 基础层级由 `z-index: 80` 调降至 `z-index: 50 !important`，确保严格位于所有导航、工具及遮罩层下方。
- [x] 引入双重全自动状态感知与即时隐藏机制：
  1. CSS 强力抑制：当页面激活 `body.theme-overlay-open`、`#console.show`、`.theme-account-overlay.show`、`body.reward-modal-open` 等任何顶层状态时，强制 `.pagination-post` 立即应用 `opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; z-index: -1 !important;`；
  2. JS 运行时监听：在 `PostEndRecommendation.astro` 中注入 `MutationObserver` 与各全景事件监听器（`shijianus:open-console`、`shijianus:open-notifications`、`shijianus:open-search` 等），实现即开即隐、关闭后顺畅恢复。
- [x] 自动化测试套件（`scripts/verify-pagination-post.mjs`）全量更新并通过：严格验证了中控台与账号中心开启时下一篇推荐的不可见性、不可点击性及关闭后的交互恢复。

### Task 15: 中控台快捷按钮组 (.button-group) 下移与 Activity 卡片重叠冲突消除 (`691fdb0`)
- [x] 下移 `.button-group` 浮动位置：将固定定位底距从 `bottom: 24px` / `42px` 调整为贴合边缘的 `bottom: 12px !important`，使快捷操作按钮自然锚定于视口底端。
- [x] 重构 `.console-card-group` 垂直定位与最大高度：将激活展开时的位移由 `calc(-50% - 20px)` 优化为 `calc(-50% - 36px)`，并将最大高度从 `90vh` 严格约束为 `calc(100vh - 90px)`，彻底消除在笔记本/标准屏（1440x900、1366x768、1280x800 等）下 `.console-card.activity` 与 `.button-group` 的位置重合交错。
- [x] 微调热力图容器与标签内边距：将 `.activity-grid-container` 的 `margin-top` 紧凑优化为 `14px`，确保所有主流分辨率下卡片与按钮保持至少 21px ~ 112px 的自然呼吸间距。
- [x] 编写并执行自动化测试套件（`scripts/verify-console-buttons.mjs`）：覆盖 1080p、1440x900、1366x768、1280x800、平板与移动端各视口，全部验证通过（Overlap = false，Gap >= 21px）。

### Task 16: 相关文章推荐 (.relatedPosts-item) 紧凑化与全局组件圆角收敛优化 (`3638aa0`)
- [x] 相关推荐 (.relatedPosts-item) 紧凑化与小巧重构：将卡片高度从过高的 224px 优化为小巧紧凑的 155px（平板 140px / 移动端 130px）；网格间距由 14px 缩紧至 8px（移动端 6px）；将标题设为精致 2 行截断（`-webkit-line-clamp: 2`）。
- [x] 消除过大 AI 味圆角：将 `.relatedPosts-item` 圆角由 24px 收敛至标准方圆角 8px；将 `.relatedPosts-item__index` 序号标与 `.date` 日期徽章由 999px 胶囊收敛至 4px 精致小方角。
- [x] 全局组件圆角统一收敛：
  1. 侧边栏卡片组（`#aside-content .card-widget`、`aside-sticky-box`、`#card-toc`、`.card-recent-post`、`.card-info`）：统一由 22px/26px/12px 收敛为 8px；
  2. 推广翻转卡片（`#flip-content`、`.promo-widget`、`.face`、`.promo-back-grid`）：由 12px/20px 收敛为 8px，按钮收敛为 6px；
  3. 分类卡片（`.card-categories`、`.card-category-list-link`）：由 8px/12px 收敛为 8px 及 6px；
  4. 上下篇文章推荐（`.postNav`、`.postNav-card`）：由 24px/20px 收敛为 10px 及 8px，高度压缩至 155px；
  5. 导航下拉菜单（`.site-page-submenu`、`.site-page-submenu__item`）：由 50px/30px 胶囊收敛为 8px 及 6px；
  6. 账号中心与控制台面板（`.theme-account-drawer__summary`、`.theme-account-panel`、`.console-shortcuts__item`）：统一收敛为 10px 及 6px。
- [x] 编写并执行自动化测试套件（`scripts/verify-compact-radius.mjs`）：桌面端、平板端及移动端全面通过（Item Height = 155px/140px/130px <= 165px，Radius = 8px <= 8px，Gap = 8px/6px <= 8px）。

### Task 17: 右侧边悬浮控制台 (#rightside / #rightside-config-show) 向上避让与蓝色高对比视觉重构
- [x] 上移 `#rightside` 与 `#rightside-config-show` 浮动底距：将底距由 `bottom: 20px` 上调至 `bottom: 140px !important`（移动端 130px），彻底消除与底部文章下一篇推荐（`.pagination-post`，底距 24px + 高度 92px）在空间上的重叠与交互遮挡，保障超过 40px 的安全呼吸间距。
- [x] 重构按钮高对比蓝色主题质感：将 `#rightside-config-show` 及 `#rightside` 全量操作按钮的背景明确固化为标志性蓝色（`#425aef`，深浅色模式一致保持高辨识度），搭配纯白高对比图标与文字（`#ffffff`），消除原本卡片白底灰字与下一篇卡片同色混淆的问题，杜绝误触。
- [x] 优化微交互与悬浮动效：为蓝色按钮注入专属光泽阴影（`rgba(66, 90, 239, 0.4)`）、悬浮位移缩放动效（`transform: translateY(-2px) scale(1.05)`）以及激活收放态，提升整体 UI 质感与交互反馈。
- [x] 编写并执行全平台自动化测试套件（`scripts/verify-rightside-dock.mjs`）：桌面大屏、标准屏、平板及移动端全视口验证通过（Overlap = false，Vertical Gap >= 40px，Button Bg = rgb(66, 90, 239)，Icon/Text Color = rgb(255, 255, 255)）。

### Task 18: 文章评论区 (#post-comment) 安知鱼 UI 结构重构、无缝流式布局与前端交互优化
- [x] 新增 `<hr class="custom-hr" />` 分割线：在文章正文/相关推荐与 `#post-comment` 间插入 2px 虚线分割线，还原安知鱼原生层次结构。
- [x] 消除多层嵌套与过度圆角：移除 `#post-comment` 外层双层卡片和背景黑框（透明底色、直出排版），收敛所有输入框与按钮为精致 8px 方圆角。
- [x] 深度还原 Anzhiyu Twikoo UI 结构：
  1. `.comment-head`：头部包含“评论”大标题、一键“匿名评论”随机昵称生成、隐私政策提示与免删空行温馨提示框（`.comment-tips`）；
  2. `.tk-submit`：三列响应式元信息输入框（昵称、邮箱、网址/QQ号自适应），头像实时预览（支持 QQ 头像与 Gravatar 回退），富文本 Textarea（支持 0/500 实时字数统计），主题蓝（`#425aef`）发送按钮；
  3. `.tk-comments-container`：公开评论流包含专属徽章（博主/访客/置顶）、动态相对时间戳、点赞动效、回复/引用浮动面板与层级嵌套回复。
- [x] 编写并执行全流程自动化端到端测试套件（`scripts/verify-post-comment.mjs`）：桌面端与移动端断言全部通过，包含虚线分割线、布局去卡片化、交互发布与响应式排版验证。

### Task 19: 原生自建留言系统内嵌与 D1 数据库集成、访客会话权限与零虚假数据净化
- [x] 全面禁止与清除虚假数据：彻底删除 `createDemoLocalThread` 与任何静态 mock 评论，保证线上环境严格只展示 D1 真实评论或优雅空状态（`0` 评论提示）。
- [x] 表单与头像重构：移除 `.tk-meta-input` 三列输入框；头像与 Textarea 水平平齐对齐；头像与当前登录用户身份（`readCommentIdentity()` 及 `.theme-account-drawer__summary-avatar`）双向打通，未登录状态回退为默认访客徽章。
- [x] Cloudflare D1 原生留言后端 API (`functions/api/comments.ts` & `migrations/0003_comments.sql`)：
  1. `GET /api/comments?slug=...`：安全拉取真实已发布评论与回复树（隐藏 IP、Token 与邮箱等敏感信息）；
  2. `POST /api/comments`：处理发表、点赞、编辑、删除、管理状态变更；新留言异步推送 Telegram 机器人通知；
  3. 保留站长管理接口（`X-Admin-Token` 与状态变更 API）为后续账号中心开放打好底座。
- [x] 访客临时会话权限机制：访客发表评论后在当前浏览器页面内存中持有临时凭证，可进行就地编辑（Inline Edit）与删除；一旦刷新页面（F5）或切换会话/浏览器环境，编辑/删除资格即刻自动失效。
- [x] 编写并执行全流程自动化端到端测试套件（`scripts/verify-post-comment.mjs`），全量验证虚假数据为零、去元输入框、头像平齐、发布/编辑/会话刷新失效全链路。

### Task 20: YouTube 风格分级评论与折叠展开 (Accordion)、最新/最热排序与严格权限鉴权
- [x] YouTube 风格分级评论与就地回复树：
  1. 支持顶级主评论与二级/多级嵌套回复，点击“💬 回复”在被回复评论下方就地呼出嵌套回复输入框（In-place Nested Reply Box）；
  2. 实现 YouTube 标志性的折叠展开手风琴按钮（`▾ 查看 X 条回复` / `▴ 收起 X 条回复`），默认折叠多级回复，保持评论流清爽；
  3. 支持长评论折叠与“...展开全文 / 收起”；
  4. 支持 YouTube 风格顶栏排序依据切换（`⏱️ 最新` 与 `🔥 最热` 动态双向排序）。
- [x] 后端 API 全功能完善与鉴权强化 (`functions/api/comments.ts`)：
  1. `sort=hot|new` 支持数据库级按热度（点赞数）或按发布时间索引排序；
  2. 严格权限鉴权校验：编辑与删除接口严格比对 `session_token`（或 `ADMIN_TOKEN`），杜绝跨用户篡改；
  3. 访客在当前会话拥有所有权，刷新页面或切换环境后凭证失效（无法确认身份），自然失效编辑/删除权限。
- [x] Playwright 真实浏览器全流程端到端测试套件（`scripts/verify-post-comment.mjs`）验证通过，桌面端与移动端断言全绿。

### Task 21: 原生留言系统错误修复、多模态互动 (Linuxdo模式/Boost/表情/引用) 与防滥用访客IP归属地监管 (`74cf5f7`)
- [x] 彻底排查并根除 `Unexpected token '<', "<!DOCTYPE "... is not valid JSON` 报错：
  1. 在 `src/lib/comment-client.ts` 封装高鲁棒性 `safeFetchJson`，对响应内容类型严格做 `Content-Type: application/json` 前置校验，杜绝接收到 HTML 错误页时的 JSON 反序列化崩溃；
  2. 在 `functions/api/comments.ts` 全量补齐错误响应 JSON 头与格式化输出（状态码 400、403、429、500 等均输出标准 JSON 错误体）。
- [x] 前端冗余元素彻底清理：清理 `.comment-tips`、`.tk-user-identity` 与 `.tk-row-actions-start`，保持输入区极致清爽。
- [x] Linuxdo 风格多模态交互体验：
  1. 引入三态交互切换（`💬 评论`、`⚡ Boost (≤16字)`、`😀 表情互动`）；
  2. `⚡ Boost` 模式：专为快速打气设计，前端硬限制 16 字，专属高光亮黄徽章与动态流展现；
  3. `😀 表情互动` 模式：托盘提供高频 Emoji（👍、❤️、🔥、🚀、💡、🎉、👏、🤯、☕、✨），一键直发；
  4. `🔗 引用回复` 模式：点击任意评论的“🔗 引用”按钮，输入框上方即时展现引文卡片与原作者，公开发布后在评论流内结构化嵌入引用区块。
- [x] 访客防滥用与频率保护机制：
  1. 重复内容拦截：同一访客 IP 在 1 小时内禁止发表完全相同的评论内容；
  2. 频次限流：访客 IP 严格限制 1 小时内普通评论最多 3 次、Boost 最多 5 次，超出即返回友好限流提示（HTTP 429）；
  3. 长度校验：Boost 动态后端严格执行 $\le 16$ 字符校验。
- [x] 真实 IP 记录与访客地理归属地强制公开规则：
  1. 通过 Cloudflare 原生请求头（`cf-connecting-ip`、`cf-ipcountry`）自动捕获客户端真实 IP 与国家代码；
  2. 访客规则：强制公示所属国家与国旗 Emoji（如 `🇨🇳 中国`、`🇺🇸 美国` 等），真实原始 IP 仅供管理员查看，绝不向公开 API 暴露；
  3. 登录用户规则：支持自主选择是否公示归属地；
  4. 管理员特权：站长携带 `ADMIN_TOKEN` 可全景审计所有评论的原始 IP 与 User-Agent。
- [x] 编写并执行全流程自动化端到端测试套件（`scripts/verify-post-comment.mjs`），全场景（冗余移除、三态发布、限流拦截、重复过滤、国旗展示、引用预览与渲染、移动端/桌面端视口）验证全量通过。

### Task 22: 本地开发评论区 404 根除、火箭 Boost 回复交互优化与端到端全链路验证 (`add45dd`, `0020df1`)
- [x] 根除本地开发评论接口 404 (非 JSON 响应) 缺陷 (`add45dd`):
  1. 在 `astro.config.mjs` 中新增 `commentsDevIntegration` Vite 中间件，自动拦截开发环境 `/api/comments` 的全部 GET/POST/PUT/DELETE/OPTIONS 请求；
  2. 修复 `functions/api/comments.ts` 中 `http.ts` 的原生 ESM 扩展名缺失问题，支持 Node 22 规范直引；
  3. 引入开发模式数据本地落盘机制与开发环境免流保护，保障本地测试与重载时评论数据的持久化；
  4. 强化 `src/lib/comment-client.ts` 友好错误提示，杜绝 raw HTML 抛错。
- [x] 全面优化 Boost 交互与火箭图标 (`0020df1`):
  1. 将 Boost 图标由闪电（`⚡`）全面升级为科技动感火箭图标（`Rocket` / `🚀`）；
  2. 固化“默认回复不 Boost”的自然逻辑：主评论区仅保留标准评论（上限 500 字）与表情互动，移除根评论顶栏的 Boost Tab；
  3. 深度打通“回复他人时发送 Boost”专属链路：在主评论与嵌套回复的操作条中新增 `🚀 Boost` 专属按钮；点击直接进入 16 字以内的火箭 Boost 回复状态；
  4. 就地回复框引入极简模式切换：默认普通评论回复，支持一键切换为 Boost (≤16字) 模式，并提供高辨识度火箭光泽按钮与徽章。
- [x] 编写并执行全流程自动化端到端测试与本地 Dev API 校验套件（`scripts/verify-dev-comments.mjs` & `scripts/verify-post-comment.mjs`），双重验证全部通过。

### Task 23: Markdown 工具栏与编辑/预览选项卡、长按点赞修改表情与前三排名展示、访客点赞权限彻底封死
- [x] 深度学习 Linuxdo 回复界面，在 `class="tk-input el-textarea"` 正上方注入完整一行 Markdown 编辑工具栏：
  1. 贴文语言下拉选择（English、中文(简体)、正體中文、日本語、한국어、Español 等）；
  2. 加粗 (`**bold**`)、斜体 (`*italic*`)、文字大小/标题 (`H`)、连结 (`[text](url)`)、块引用 (`> quote`)、预初始化文字 (```code``` 与 `code`)、上传/图片 (`![alt](url)`)、清单 (无序/有序列表)、切换文本排版方向 (`⇄` LTR/RTL) 与 Emoji 快捷拾取面板；
  3. 齿轮“选项”高级下拉面板完整集成 15 项扩展功能：引用贴文 (区别于引用评论，特指引用博文内容与摘录)、插入表格、插入目录、插入滚动内容、插入 Mermaid chart、插入 Build Chart、隐藏详细内容 (details)、插入 Graphviz graph、插入日期/时间、插入数学式 (LaTeX)、插入范本、新增脚注、模糊化剧透内容 (spoiler)、建立投票 (poll) 与套用包装格式 (callout)。
- [x] 模式切换栏彻底去卡片化重构：删除原有 `class="tk-mode-tabs"`，替换为“✏️ 编辑”和“👁️ 预览”双选项卡，预览区实时渲染富文本最终呈现效果（包含 GFM 表格、代码高亮、剧透模糊遮罩、手风琴折叠等）。
- [x] 表情互动 (Reaction) 机制重构与前三排名展示：
  1. 纠正表情互动定位：不再是发一条纯表情评论，而是作为对已有评论的点赞/Reaction 交互；
  2. 支持长按（或悬浮）点赞按钮呼出候选 Emoji 气泡（👍, ❤️, 🔥, 🚀, 💡, 🎉, 👏, 🤯, ☕, ✨），用户可随时修改或取消自己表达的 Emoji；
  3. 展示时以 Emoji 总数显示，并根据 Emoji 使用量降序排名展示排名前 3 名的 Emoji 图标与计数。
- [x] 访客点赞权限彻底拦截与防滥用加固：
  1. 前后端双重防御：前端在访客尝试点赞或修改 Emoji 时直接拦截，弹出权限错误 Toast 并引导打开账号中心登录；
  2. 后端 API (`POST /api/comments`) 在 `action: 'like'` 中严格比对用户身份，访客直接返回 HTTP 403 Forbidden；
  3. 杜绝无限点赞漏洞：每个登录用户对同一评论仅持有 1 个有效反应，点击相同取消、点击不同切换，彻底根除无限刷赞；访客仅允许发表普通评论（1小时限3条）与 Boost（1小时限5条）。
- [x] 新增数据库迁移 `migrations/0004_comment_reactions.sql`，无缝向后兼容历史点赞数据。
- [x] 编写并执行全流程自动化端到端测试套件（`scripts/verify-comment-markdown-reactions.mjs`），工具栏 12 项、选项 15 项、编辑/预览切页渲染、访客点赞拦截、Emoji 前三排名展示与后端 API 鉴权全部 PASS 100% 通过。

### Task 24: 评论系统工具栏矢量 SVG 重做、博文框选右键引用联动、复杂功能 UI 可视化弹窗、删除外链/上传与操作栏纯图标化 (`5df8c5f`)
- [x] 工具栏全量重构与 SVG 矢量图标化：
  1. 引入专业 Lucide 矢量图标体系，彻底清除任何 raw emoji 充当图标的问题；
  2. 工具栏项（贴文语言、加粗、斜体、文字大小/标题、块引用、预格式化代码、清单、排版方向、表情、选项）统一配置专属精致 SVG 图标与平滑 hover 微动效；
  3. 选项下拉面板 15 项功能全部拥有标准 SVG 矢量图标，布局对齐，视觉质感深度提升。
- [x] 博文框选右键引用联动 (`ThemeOverlays.tsx` & `PostComments.tsx`)：
  1. 在文章正文中框选任意文字段落后，右键菜单智能展示“引用至评论区”；
  2. 保持原有右键功能逻辑完全不受影响，点击后派发 `shijianus:quote-post-text` 并触发顶部通知；
  3. 评论区自动平滑滚动聚焦、切至编辑模式、按标准引用语法（`> 引用自《文章标题》：\n> 选中文段`）注入光标位置。
- [x] 复杂编辑功能中心 UI 可视化配置弹窗：
  1. 建立投票 (poll)：弹出中心配置弹窗，直观输入投票主题、单选/多选模式，支持动态新增/删除选项；
  2. 插入表格 (table)：可视化选择行数与列数，支持各列标题输入并预览结构；
  3. 隐藏详细内容 (details)、模糊化剧透 (spoiler)、LaTeX 数学公式 (math)、滚动长文本 (scroll)、包装高光卡片 (callout) 均提供专属毛玻璃参数配置弹窗；
  4. 支持点击遮罩或按下 Escape 键一键退出，无需记忆复杂的底层 Markdown 标记语法。
- [x] 彻底删除超链接与文件上传服务：
  1. 移除工具栏中的连结/超链接按钮；
  2. 移除工具栏中的文件/图片上传按钮；
  3. db 仅存储纯文本与受控内置富文本标记，彻底根除违规外链引流与存储维护安全隐患。
- [x] 评论操作栏 (`tk-actions-group`) 纯 SVG 图标化：
  1. 回复、Boost、引用、编辑、删除、点赞等操作按钮默认只展示独立精致 SVG 矢量图标，彻底移除直接暴露的中文文本；
  2. 将操作说明完整移入 Tooltip（`title` 与 `aria-label`），维持界面的清爽与国际化通用感。
- [x] 全站通知体验深度统一：
  1. 评论区内的所有状态反馈（成功/错误提示）通过 `shijianus:activity` 统一派发至博客主导航顶部的 `#global-activity-bar` 呈现，杜绝割裂浮窗；
  2. 访客点赞拦截、排版切换、弹窗插入等均提供细腻的全局顶部横条反馈。
- [x] 自动化测试套件（`scripts/verify-comment-markdown-reactions.mjs`）更新并通过：
  桌面端与各视口下验证工具栏 SVG 图标、外链/上传彻底清理、15 项下拉选项 SVG 图标、数据表格/投票/剧透弹窗配置插入、右键引用联动、操作栏纯图标化与顶部主导航通知，断言全部 PASS 100% 通过。


