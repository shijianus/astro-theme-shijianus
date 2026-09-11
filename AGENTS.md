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

### Task 25: 评论区无用提示与齿轮清理、工具栏与下拉注释解释纯图标化、React Portal 居中弹窗与全量插入 UI 发布规则 (`0b95601`)
- [x] 彻底清理评论区无用提示与杂乱元素：
  1. 移除模式栏右侧冗余的无用提示内容 `class="tk-mode-bar-right"`；
  2. 清理访客身份标签中生硬多余的 `⚙️` 图标，视觉回归纯净极简。
- [x] 工具栏与下拉菜单视觉交互重构（纯图标 + 注释文本）：
  1. 贴文语言选择按钮与高级选项按钮去除生硬的“语言”与“选项”汉字文本，改为现代化的纯 SVG 矢量图标配微型 chevron 下拉指示角标；
  2. 下拉菜单面板采用标准双列布局：左列矢量 SVG 图标，右列主标题加清晰易懂的注释文本解释（`.tk-dropdown-desc`），彻底消除仅有晦涩标题的问题。
- [x] 物理居中弹窗与背景滚动彻底锁定（基于 React createPortal）：
  1. 解决原弹窗因父级容器包含块偏移导致的“虚化文章但看不到弹窗、需手动滚动页面寻找”缺陷，所有 14 类插入模态框统一使用 `createPortal` 挂载到 `document.body`；
  2. 弹窗样式配置 `position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 100005 !important;`，确保永远绝对对齐在当前屏幕视口的正中心；
  3. 弹窗呼出时自动执行 `document.body.style.overflow = 'hidden'`，关闭时自动恢复，彻底杜绝背景滑动。
- [x] 全量补齐此前缺失的插入 UI 弹窗与语法发布规则展示：
  1. 表格 (Table)：修复结构与预览，支持动态列数/行数、对齐方式并提供实时 GFM 管道表格字符结构预览；
  2. 目录 (TOC)：弹出独立中心弹窗，展示 `[TOC]` 规则说明横幅与自适应预览；
  3. Mermaid：提供包含 Flowchart、Sequence、Gantt、Class、State、Pie、Mindmap 等 7 大常用图表类型的快速切换选择卡与说明；
  4. Build Chart：提供折线图、柱状图、饼图与雷达图模板配置 UI；
  5. Graphviz：提供有向图 (Digraph) 与无向图 (Graph) 配置与语法规则提示；
  6. 日期/时间 (Datetime)：提供原生 datetime-local 控件，一键插入当前时间或指定时间；
  7. 论述范本 (Template)：提供“论点/论据/结论”、“技术方案评测对比”与“RFC 建议草案”结构化模板；
  8. 脚注 (Footnote)：支持自定义脚注标识与解释内容，自动生成正文引用标号与底部脚注定义；
  9. 投票 (Poll)、剧透 (Spoiler)、隐藏折叠 (Details)、数学公式 (Math)、长文本滚动 (Scroll) 与包装卡片 (Callout) 均全面统一为最新居中弹窗规范。
- [x] 自动化测试套件（`scripts/verify-comment-markdown-reactions.mjs`）更新并通过：
  全流程覆盖清理验证、纯图标工具栏、下拉注释解释、TOC 弹窗与规则说明、甘特图插入、Portal 物理居中与滚动锁定，所有断言 100% PASS 通过。

### Task 26: 评论区持久化存储状态审计与 D1 数据库直连实证、DDL 单例优化 (`5e26691`)
- [x] 数据库真实接入审计与生产环境实证：
  1. 确认 Cloudflare D1 边缘数据库 `shijianus-blog-db` (`a18b4c38-5da0-415e-a7de-ee3aee0b856f`) 已完整应用 4 项数据库迁移脚本（包含 `comments` 表与 4 组复合索引）；
  2. 在终端直连云端 D1 执行真实 SQL 探针（`INSERT` -> `SELECT` -> `DELETE`），证实数据毫秒级落盘至全球分布式持久化存储，绝无任何 Mock 假数据；
  3. 梳理完整的端到端持久化闭环：前端组件（`PostComments.tsx`）-> 边缘接口（`functions/api/comments.ts`）-> 物理 D1 数据库 + 异步 Telegram Bot 通知。
- [x] 后端性能与资源开销优化：
  1. 为 `functions/api/comments.ts` 引入模块级 `tableEnsured` 单例缓存，避免每个 Worker 实例在处理高频 GET/POST 请求时重复执行 5 次 DDL 检查，大幅降低 D1 请求开销与响应延迟；
  2. 保持纯本地 Node 开发环境下的 `.comments-dev.json` 文件持久化回退，确保本地热重载与离线调试数据不丢失。
- [x] 执行本地 Dev API 自动化校验套件（`scripts/verify-dev-comments.mjs`）全绿通过，代码全量推送到 `origin` 与 `cf` 远端。
### Task 27: 账号中心 (theme-account-drawer) 极简重构、Epomail OAuth 2.0 原生登录与单/双/托管 DB 架构落地 (`8eb62fa`)
- [x] 基于 Epomail (`../epocanvas-mail`) 搭建原生第三方统一身份认证与授权机制：
  1. 支持 OAuth 2.0 标准授权码流程（Redirect Code Grant）与回调页面（`/auth/callback`），通过 `window.postMessage` 跨窗口无感握手；
  2. 实现“管理员 APP 外接方案授权”折叠交互面板：支持在抽屉内直接输入 Epomail 账号、密码及 TOTP 双因子凭证，就地完成应用授权握手与 Token 交换，并清晰公示授权权限清单（openid、profile、email、comments）；
  3. 支持免注册本地读者身份创建，与博客原有留言系统无缝打通。
- [x] 单库 (Single DB) / 双库 (Dual DB) / 托管 (Outsourced Epomail) 三模数据库架构适配：
  1. 托管模式 (Outsourced Mode，博主当前生产架构)：用户身份与鉴权全权交由 Epomail（`epocanvas-mail` / `USER_DB`）托管，博客专享评论库（`DB`），本地按需同步轻量用户与会话；
  2. 单库模式 (Single DB，通用开源部署推荐)：`migrations/0005_users.sql` 定义 `users` 与 `user_sessions` 表，单 D1 库同时承载评论与用户表；
  3. 双库模式 (Dual DB)：评论库 (`DB`) 与用户库 (`USER_DB`) 独立配置、解耦部署。
- [x] 账号中心 (`class="theme-account-drawer"`) UI/UX 极致降噪与现代化重构：
  1. 引入顶部 Hero 状态卡片：动态展示头像、实时在线光圈、昵称、邮箱与专属身份胶囊（`⚡ Epomail 认证` / `本地读者` / `访客模式`）；
  2. 采用极简三大 Tab 导航布局（`👤 登录 / 授权`、`🔔 站内提醒`、`⚙️ 偏好与架构`），彻底消除原有堆叠割裂的杂乱面板；
  3. 登录成功后动态激活 OAuth App 检查器卡片，清晰展示 App Client ID、权限 Scope 与联通状态；
  4. 偏好与架构 Tab 深度集成交互式数据流向图，直观展现 Cloudflare D1 (DB) 与 Epomail (USER_DB) 的解耦协同。
- [x] 生产端 (Cloudflare Pages) 全量部署与 Playwright 线上真实全链路实证：
  1. 远端 D1 数据库执行应用迁移 `0005_users.sql`，表与索引（`users`, `user_sessions`）毫秒级就绪；
  2. 执行 `npm run cf:deploy`，全站 92 条页面及 Cloudflare Functions bundle 成功发布至生产边缘节点（`https://92860519.shijianus-blog.pages.dev` 及绑定域名 `https://blog.epocanvas.com`）；
  3. 编写并执行生产环境 Playwright 端到端深度审计套件（`scripts/verify-live-cf-account-drawer.mjs`）：
     - 真实在线网络探测 `GET https://blog.epocanvas.com/api/auth/config` 返回 200 OK，包含 Epomail Client ID 与 Auth Mode；
     - 启动无头 Chromium 访问真实域名 `https://blog.epocanvas.com`，全真点击呼出抽屉；
     - 深度审计三大导航 Tab（登录/授权、站内提醒、偏好与架构），断言 Epomail 品牌卡、一键 OAuth 按钮、外接方案折叠展开与 3 项授权权限清单；
     - 本地读者快速登记联动与就地注销，Hero 卡片胶囊动态即时切换；
     - 移动端视口（375x812）断言无横向溢出，自适应响应式全绿；
     - 生产环境真实端到端测试 100% PASS 通过。
### Task 28: Epomail 默认 OAuth 验证 App 注入、生产 D1 数据落盘与授权弹窗真实实证 (`f54ebee`)
- [x] Epomail 远端与代码库默认 OAuth App 注入 (`epocanvas-mail`):
  1. 在 `epocanvas-mail` 生产 D1 数据库 (`epomail` / `542cbca1-fce5-41c5-93f2-c1d04fa919e8`) 的 `oauth_app` 表中插入官方默认客户端 `epo_live_shijianus_blog`；
  2. 在 `mail-worker/src/service/oauth-app-service.js` 与 `mail-worker/src/init/init.js` 固化 `DEFAULT_OAUTH_APPS` 常量与自动种子 (Auto-seeding) 逻辑，确保即使库表重置或多环境迁移，默认应用永远自动装载；
  3. 配置全量合法回调清单（含生产 `https://blog.epocanvas.com/auth/callback`、Pages 预览域、多别名域名及本地端口），构建并重新部署 `epomail` 生产 Worker 至 Cloudflare (`099db5ec-02fa-4d34-8bc0-880cde3cc310`)；
  4. 同步将改动提交并推送到 `git@github.com:shijianus/epomail.git` (`67a1e78`)。
- [x] Playwright 真实生产环境授权弹窗全链路审计 (`scripts/verify-live-epomail-oauth-dialog.mjs`):
  1. 直连 `https://mail.epocanvas.com/oauth/authorize?client_id=epo_live_shijianus_blog...`，验证彻底根除 `未找到对应的 OAuth 应用 (Invalid client_id)` 报错；
  2. 验证 Epomail 官方授权页正确识别应用名称 `shijianus-blog` 并加载授权确认界面；
  3. 从博客生产端 `https://blog.epocanvas.com` 点击呼出账号抽屉，点击“使用 Epomail 一键授权登录”，Playwright 捕获弹窗并验证重定向至合法 Epomail OAuth 授权地址；
  4. 全流程端到端测试 100% PASS 通过。

### Task 29: Epomail OAuth 授权完成握手修复、跨窗口 postMessage 兼容与 D1 唯一约束修复 (`6289e97`)
- [x] 跨窗口授权完成握手与消息类型兼容：
  1. 彻底解决 Epomail 授权点击“同意授权”后博客端未登录的根因：Epomail 授权页（`authorize.vue`）成功时向 `window.opener` 发送 `{ type: 'EPOMAIL_OAUTH_SUCCESS', code, state }` 并立即关闭弹窗，而博客端原本仅监听预先交换好的 `EPOMAIL_AUTH_SUCCESS`；
  2. 在 `ThemeOverlays.tsx` 中新增对 `EPOMAIL_OAUTH_SUCCESS` 的双向消息监听，接收到 `code` 后自动通过 `exchangeEpomailCode` 向 `/api/auth/epomail/token` 发起异步交换；
  3. 交换成功后调用 `writeCommentIdentity` 全局写入 `localStorage`（含 `shijianus-comment-account`、`shijianus-comment-identity` 与 `shijianus-auth-token`），触发 `shijianus:comment-account-change` 广播，同步更新顶部头像、账号抽屉与评论区发布身份。
- [x] Cloudflare D1 用户唯一约束冲突 (`UNIQUE constraint failed: users.email`) 彻底根治：
  1. 将原有 `epo_u_${randomHex}` 随机生成机制升级为基于 `sub` 或邮箱的稳定确定性 ID（`epo_u_${sub}` / `epo_u_${sanitized_email}`）；
  2. 在 `createSessionForUser` 执行数据库操作前，优先检索已有 `email` 的记录，复用既有主键 ID，并将 SQL 冲突策略明确固化为 `ON CONFLICT(email) DO UPDATE SET ...`，彻底根除后续重复登录时的 SQLite 约束崩溃；
  3. 在 `exchangeEpomailAuthorizationCode` 中引入 `decodeJwtPayload`，首选解析 OIDC 标准 `id_token` 获取可信声明，并清理 `redirect_uri` 末尾反斜杠。
- [x] 自动化测试与全链路端到端审计：
  1. 在 `scripts/verify-account-drawer-epomail.mjs` 中新增针对 `EPOMAIL_OAUTH_SUCCESS` 跨窗口 postMessage 握手测试，测试 100% PASS 通过；
  2. 执行 `scripts/verify-live-epomail-oauth-dialog.mjs`，线上授权页面识别与博客端弹窗捕获全链路通过。

### Task 30: Epomail 多实例防冒领安全加固、权威域名鉴权绑定与评论区会话管理鉴权 (`2834bf4`)
- [x] 权威 Epomail 服务器 (`mail.epocanvas.com`) 唯一合法性绑定与防伪造防顶替：
  1. 固化官方权威域名 `AUTHORITATIVE_EPOMAIL_DOMAIN = 'mail.epocanvas.com'`，实现 `isAuthoritativeEpomailServer` 严格域名校验；
  2. 彻底封死开源 Epomail 自建实例冒领站长漏洞：第三方搭建的任何 Epomail OAuth 实例（哪怕伪造 `is_admin: true` 或管理员邮箱），一律强制降级为普通读者（`reader`），绝对杜绝赋予 `admin` 权限；
  3. 兼容未来域名平滑迁移：当现有 `epomail.bond` 过期后，只需在 `mail.epocanvas.com` 官方 Worker 中配置新管理域名，博客端通过权威实例签发的 `id_token`（或 `/oauth/userinfo`）核验服务器端权威证明（`is_admin: true`），即可无感延续管理员身份，无需反复改动博客核心代码。
- [x] 深度纵深防御 (Defense-in-Depth) 与身份降级保护：
  1. 本地免密读者登录 (`POST /api/auth/local`) 无论传入何种昵称或邮箱，后端硬编码限制角色为 `reader`；
  2. 会话创建 (`createSessionForUser`) 与反序列化 (`getUserBySessionToken`) 均施加兜底防护：非 `epomail` 认证渠道永远无法持有 `admin` 角色。
- [x] 评论区 (`functions/api/comments.ts`) 安全加固与会话管理鉴权：
  1. 评论发表 (`create`) 彻底切断匿名伪造 `authorRole: 'admin'` 漏洞，必须由 `getUserBySessionToken` 校验真实会话是否具备 `admin` 角色；
  2. 评论编辑 (`edit`) 与删除 (`delete`) 全量接入管理员会话令牌识别，合法站长登录状态下可直接就地管理/删除任何评论，同时保留 `ADMIN_TOKEN` 兜底；
  3. 普通读者与访客尝试删除他人评论时，服务端严格返回 HTTP 403 Forbidden。
- [x] 自动化安全与端到端测试套件全绿通过：
  1. 编写并执行专用安全单元测试套件 `scripts/verify-admin-spoofing-defense.mjs`，覆盖 4 大测试组（权威白名单、第三方防冒领、官方平滑迁移、纵深降级防御），断言 100% 全部通过；
  2. 更新 `scripts/verify-account-drawer-epomail.mjs`，全量验证本地读者防冒领、未授权评论管理员身份降级拦截、非管理员删除 403 拒绝与站长会话删除通过，Playwright 桌面端与移动端 E2E 断言全部 PASS 通过。

### Task 31: 接入内部 Telegram 图床 API (img.epocanvas.com)、公开评论区图片上传/剪贴板粘贴/拖拽插入与账户中心头像自定义/恢复 Epomail 默认头像 (`b2792d5`)
- [x] 后端图床代理中继 (`functions/api/upload-image.ts` 与 `astro.config.mjs`)：
  1. 创建 `POST /api/upload-image` 边缘中继代理，支持 `multipart/form-data` 文件上传；
  2. 严格校验文件 MIME 类型（JPG, PNG, GIF, WebP, SVG, AVIF）与文件大小上限（10MB）；
  3. 服务端安全中继转发至官方 Telegram 图床 (`https://img.epocanvas.com/upload`)，凭证严格由环境变量 `IMAGE_HOST_TOKEN` 注入，杜绝向客户端暴露密钥；
  4. 返回 `{ ok: true, code: 200, url, id, name, size, type }`；并在 `astro.config.mjs` 配置本地 Vite 中间件，实现平滑本地开发体验。
- [x] 个人资料与头像持久化 API (`functions/api/auth.ts` & `functions/_lib/auth-service.ts`)：
  1. 新增 `POST /api/auth/profile` 路由，基于会话令牌安全更新用户头像、昵称、网站与个人简介；
  2. 在 `users` 表与内存缓存中安全更新 `avatar` 等字段并更新时间戳；
  3. `src/lib/comment-client.ts` 新增 `uploadCommentImage()`、`updateAuthProfile()`，并在 `CommentIdentity` 中保留 `epomailAvatar` 以便一键恢复。
- [x] 公开评论区图片全模态插入与上传指南 (`src/components/theme/PostComments.tsx`)：
  1. 工具栏新增专属“插入图片”纯 SVG 图标按钮（`.tk-tb-image`），点击呼出居中配置弹窗；
  2. 弹窗提供三大 Tab 面板：
     - Tab 1: 本地上传（支持拖拽上传、点击选择图片文件、文件体积提示、上传中转动效果、成功即时预览卡片与清除按钮）；
     - Tab 2: 剪贴板粘贴与拖拽指南（图文展示 `Ctrl + V` / `Cmd + V` 快捷键徽章与拖拽入框操作方法）；
     - Tab 3: 外部图片链接（支持粘贴已有图片直链并实时提供预览）；
  3. 评论输入框支持直接剪贴板粘贴（`onPaste` 监听自动识别图片并上传至 Telegram 插入 Markdown 语法）；
  4. 评论输入框支持直接拖拽图片入框（`onDrop` 与 `onDragOver` 高亮边框动效，释放自动上传）；
  5. 在二级嵌套回复框与就地编辑框全量打通图片粘贴与拖拽能力。
- [x] 账户中心头像个性化设置与恢复 Epomail 官方头像 (`src/components/ThemeOverlays.tsx`)：
  1. 重构账号抽屉中的头像管理模块（`.account-avatar-card-block`），圆形大头像预览与来源状态徽章（`⚡ Epomail 官方头像` vs `🎨 自定义专属头像` vs `默认头像`）；
  2. 提供“上传新头像”按钮（点击唤起文件选择，直接上传至 Telegram 图床并即时应用保存）；
  3. 针对 Epomail 授权用户，当头像被修改后动态展示“↺ 恢复 Epomail 默认头像”按钮，点击一键恢复最初从开放平台同步的官方头像；
  4. 保留直链输入框以便用户手动粘贴图片链接；
  5. 保存后通过事件总线实时广播，站内主导航头像、抽屉头像与评论区头像毫秒级同步。
- [x] 样式打磨与 Markdown 评论图片响应式呈现 (`src/styles/rebuild.css`)：
  1. 为 `.tk-md-img` 配置 8px 圆角、微阴影、最大高度约束与 zoom-in 手势放大微动效；
  2. 输入框拖拽激活高亮态 `.is-drag-over`、弹窗 Tab 导航、Dropzone 上传区与键盘徽章精致样式全量补齐。
- [x] 自动化端到端测试套件（`scripts/verify-image-upload-and-avatar.mjs`）全量执行通过：
  覆盖真实 Telegram 图床上传中继、评论区工具栏按钮与弹窗、3 标签页切换与插入、剪贴板粘贴/拖拽响应、Markdown 图片样式、账户中心头像上传/自定义与 Epomail 恢复，24/24 项断言 100% PASS 通过。
- [x] 生产端 (Cloudflare Pages `shijianus-blog`) 全量构建、边缘部署与真实生产链路验证 (`scripts/verify-prod-image-and-avatar.mjs`)：
  1. 通过 `npm run cf:deploy` 成功编译 Astro 静态资源与 Pages Functions 运行时，全量推送部署至 Cloudflare Pages 生产边缘节点；
  2. 真实生产环境 API 审计：`POST https://blog.epocanvas.com/api/upload-image` 真实上传图片成功持久化至 Telegram 图床 (`https://img.epocanvas.com/file/...`)，HTTP 200 响应；
  3. 真实生产环境浏览器端到端审计：Playwright 访问 `https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/`，验证控制台 0 报错、评论区 `#post-comment` 视口滚动唤醒水合、工具栏图标点击弹出居中模态框、三标签页切换（本地上传/剪贴板与拖拽指南/外部链接）、Markdown 图片自动插入输入框；
  4. 账户中心抽屉与头像真实交互审计：验证 `.account-avatar-card-block` 头像卡片呈现、`⚡ Epomail 官方头像` 初始状态徽章、上传按钮、自定义直链输入、`🎨 自定义专属头像` 实时响应、`↺ 恢复 Epomail 默认头像` 动态出现与一键复原；
  5. 自动化测试 24/24 项生产断言 100% PASS 通过，已生成视觉审计截图存档。

### Task 32: 评论区发言头像同步、点赞长按 Emoji 选框体验优化、地理旗帜与 i18n 规范、已编辑字符重叠修复与博主特权 IP 审计
- [x] 发言头像与实际头像实时同步联动 (`src/components/theme/PostComments.tsx`)：
  1. 访客发言框与回复框默认展示优雅的访客图标；
  2. 用户在账户中心（ThemeOverlays）更新自定义头像后，发言输入框与评论流即时同步最新头像；
  3. 博主 (admin) 身份未设置自定义头像时，自动优雅回退并使用博主官方真实头像（`/media/shijianus/avatar.jpg`）。
- [x] 点赞留下 Emoji 长按切换选框交互优化 (`class="tk-reaction-interactive-wrapper"`)：
  1. 修复长按松手时原生 click 导致选框闪退的根因：引入 `isLongPressTriggeredRef`，长按 260ms 呼出后松手阻止默认点击并保持选框稳定展开；
  2. 点选选框内的目标 Emoji 后即刻完成更换并自动结束关闭选框；
  3. 支持点击外部任意区域或按下 Escape 键自然关闭选框。
- [x] 地理标识 `class="tk-geo-badge"` 国旗 Emoji 与 i18n 规范 (`src/lib/geo-names.ts` & `functions/api/comments.ts`)：
  1. 全面采用标准格式：`[国旗 Emoji] [ISO 代码] [规范注释名称]`；
  2. 严格遵循国际标准与用户定制规范：台湾使用青天白日满地红旗（🇹🇼）、代码 `TW`、支持多语言注释（如 `台湾` / `台灣` / `Taiwan`）；香港使用本地区旗（🇭🇰）、代码 `HK`、注释 `香港`（严禁添加 China，严禁改成 PRC 旗帜）；
  3. 支持全球常见国家和地区 ISO 代码自动计算与 Emoji 旗帜解析。
- [x] “已编辑”字符重叠视觉修复 (`class="tk-edited-mark"` & `src/styles/rebuild.css`)：
  1. 修复“辑”字向右倾斜与右半角括号“)”发生视觉重合的问题；
  2. 将结构解构为独立的 `.tk-edited-bracket`（设置 `font-style: normal`，消除倾斜导致的碰撞）与 `.tk-edited-text`（增加微字间距与右外边距），消除视觉挤压与重叠。
- [x] 用户隐私开关与博主专属 IP 审计 (`src/components/ThemeOverlays.tsx` & `functions/api/comments.ts`)：
  1. 账户中心无论是本地读者、注册用户还是在通用设置中，均提供“展示我的国家/地区旗帜与位置”Toggle 开关；
  2. 普通读者与公众视角下真实原始 IP 数量严格为 0（绝对保密），且针对关闭位置展示的用户彻底隐藏地理旗帜；
  3. 博主（携带管理员会话凭证）在国家旗帜旁边可查阅发言者的真实 IP（如 `[172.16.20.1]`），并对隐藏地理位置的用户保留全景审计特权。
- [x] 编写并执行全流程自动化端到端测试套件（`scripts/verify-comment-geo-avatar-reactions.mjs`），所有 5 项核心问题端到端自动化测试全部 100% 验证通过。

### Task 33: 账号中心与通知中心 (.theme-account-drawer) UI/UX 全维度深度美化与规范化重构 (`94bea2c`, `116f50c`)
- [x] 抽屉容器与遮罩层质感全面升级 (`src/styles/final-pass.css`)：
  1. 遮罩层 `.theme-account-overlay__mask` 注入高饱和度磨砂玻璃模糊（`backdrop-filter: blur(12px) saturate(180%)`）与暗调柔和晕影，深浅色自适应；
  2. 抽屉本体 `.theme-account-drawer` 引入超清玻璃拟态（`backdrop-filter: blur(28px) saturate(190%)` 与 `color-mix(in srgb, var(--card-bg) 94%, transparent)`），边框微光投影与平滑弹簧曲线进入动效；
  3. 细化自定义超薄圆角滚动条（5px），杜绝侵入式粗滚动条破坏视觉整体感。
- [x] 抽屉头部与关闭交互重构 (`src/components/ThemeOverlays.tsx`)：
  1. 新增带呼吸动画的状态指示小圆点（`.status-indicator-dot`），已登录展示活泼翡翠绿（Emerald）、访客展示科技蓝（Blue）；
  2. 优化品牌标识与副标题层次（`EPOCANVAS IDENTITY · 账号与通知`）；
  3. 头部关闭按钮重构为 36px 独立圆形磨砂按钮，注入 90° 旋转与微缩放悬浮反馈，支持标准可访问性。
- [x] 个人资料卡片 (Hero Profile Card) 质感重塑：
  1. 引入 62px 优雅双环发光头像预览容器与专属悬浮电光蓝认证角标（⚡）；
  2. 身份徽章胶囊化重构（`.account-pill--epomail` 渐变蓝光认证标、`.account-pill--admin` 翡翠绿管理标、`.account-pill--local` 读者标与 `.account-pill--guest` 访客标）；
  3. 退出登录按钮注入防误触微交互与警示红柔和反馈。
- [x] 导航标签页 (Segmented Nav Tabs) 深度改造：
  1. 还原 Apple / Linear 原生分段控制器（Segmented Control）设计，微浮雕磨砂底槽与纯色高光激活药丸滑块；
  2. 站内提醒 Tab 注入高质感红蓝渐变微徽章（`.account-tab-badge`），数字显示更加夺目精致。
- [x] 登录与授权模块 (Tab 1: Auth & Profile) 全景重塑：
  1. Epomail 官方集成专区注入微光流转顶部三色边框（`linear-gradient`）与 44px 品牌图标容器；
  2. 新增 3 项核心优势微胶囊（`一键跨站 SSO 授权`、`头像凭证云同步`、`评论回复即刻送达`）；
  3. Epomail 主登录按钮升级为深海蓝渐变按钮，注入上浮位移与高光投影；
  4. 管理员 APP 外接折叠表单与权限范围（Scopes）清单美化；
  5. 头像管理 Studio（`.account-avatar-card-block`）支持 64px 预览、直链与图床上传直观排布。
- [x] 站内提醒中心 (Tab 2: Notifications) 与系统架构 (Tab 3: Settings) 全量打磨：
  1. 提醒列表卡片注入悬浮轻微向右位移（`translateX(4px)`）与主题色高亮边框；
  2. 空状态设计升级，配备双层扩散光环的 Bell 专属插图；
  3. 语言切换与架构流程图（D1 评论域 vs Epomail 用户域）连线与卡片全面优化。
- [x] 抽屉内部 Flex 伸缩与高度自适应加固 (`src/styles/final-pass.css`)：
  1. 为 `.account-hero-card` 显式声明 `flex-shrink: 0; min-height: fit-content;`，根除在 flex-column 下因 `overflow: hidden` 默认 `min-height: 0` 导致的个人资料卡片被意外纵向挤压至 34px 的渲染缺陷；
  2. 同步为 `.theme-account-drawer__head`、`.account-nav-tabs`、`.account-toast-notice` 及 `.account-tab-content` 配置 `flex-shrink: 0;`，确保内容完整舒展并由抽屉外层统一执行流畅滚动。
- [x] 自动化端到端测试套件全量通过：
  1. `scripts/verify-account-drawer-epomail.mjs`：全量通过后端与桌面/移动端 UI 审计；
  2. `scripts/verify-image-upload-and-avatar.mjs`：24/24 项头像与图床测试 100% 通过；
  3. `scripts/verify-comment-geo-avatar-reactions.mjs`：5/5 项核心问题测试 100% 通过；
  4. `scripts/verify-prod-account-drawer.mjs`：生产端到端自动化验收通过，包含 hero 卡片高度 $\ge 80px$ 约束断言。
- [x] 部署至 Cloudflare Pages 生产边缘节点并多端同步。

### Task 34: 账号抽屉 (.theme-account-drawer) 基于产品经理与用户体验视角的深度重构与精简降噪 (`acfe250`)
- [x] 严格遵循最小修改原则：确保全站其他组件与业务逻辑零变动，仅对 `class="theme-account-drawer"` 及其抽屉内部样式进行针对性优化。
- [x] 彻底根除技术内幕与开发者细节外露 (Eliminate Developer Jargon Exposure)：
  1. 彻底删除 Tab 3 中面向开发者的部署迁移指引（如 `migrations/0005_users.sql`、双 DB/单 DB 配置手册等），将其重塑为对普通读者极具安全感与信任感的“数据隔离与隐私安全保障 (Security Guarantee)”声明；
  2. Tab 3 标签由生硬的“偏好与架构”重命名为契合用户直觉的“偏好设置”，专注语言版本切换与评论隐私展示控制；
  3. 将 Tab 1 中突兀的“开放平台授权状态 (OAuth App Inspector)”收敛重塑为高规格安全凭据卡片（Security Pass），保留标准授权验证字段同时抹除调试杂音；
  4. 将管理员直接授权表单收敛至底部的隐式折叠通道（“站长或开发者直接授权通道”），默认不干扰普通访客的浏览动线。
- [x] 重塑感官体验与双模态评论身份接入 (Streamline Consumer UX & Dual-Mode Identity)：
  1. 顶栏标识由内部代号 `EPOCANVAS IDENTITY` 调整为贴合读者的 `READER HUB · 读者中心`；
  2. 优化顶部个人资料卡（Hero Card）：访客模式下展示温馨问候与读者头像（或已保存的本地昵称与头像），杜绝冰冷刺眼的“尚未登录”与占位空字符；
  3. Tab 1 重构为清晰的“云端一键授权 (Epomail SSO)”与“免登录本地评论身份设定”双模态，辅以精致虚线分割器（`.account-divider`）；
  4. 清理冗余重复开关：将散落多处的国家/地区旗帜开关统一规整为具有明确说明的高质感卡片组件（`.account-toggle-field` 与 `.theme-switch-slider`）。
- [x] 自动化端到端测试全量通过：
  1. `scripts/verify-account-drawer-epomail.mjs`：全套后端接口鉴权、OAuth 握手、Playwright 桌面端与移动端断言 100% 通过；
  2. `scripts/verify-prod-account-drawer.mjs`：生产环境真实链路验证通过。

### Task 35: 读者中心 (.theme-account-drawer) 真正站在用户视角的用户资料、交互常识与隐私声明深度修正 (`3b0b5a9`)
- [x] 纠正虚假误导性 IP 说明，提供透明合规的管理目的声明：
  1. 彻底删除“关闭后完全隐藏（绝不记录原始 IP）”等不实描述；
  2. 真实透明地向读者说明：前台隐匿仅针对公开展出隐藏属地徽章（如国家/地区旗帜），出于社区反垃圾、网络安全与评论风控管理合规需要，系统后台仍会如实记录发件连接 IP 供站长及管理员核查，绝不对公众开放。
- [x] 彻底根除用户完全不需要查看的底层技术卡片：
  1. 彻底删除 `class="account-card account-card--inspector"`（安全授权凭证 / Security Pass / OAuth App Inspector）；
  2. 彻底删除 `class="account-card account-card--arch"`（数据隔离与安全架构 / Security Guarantee / 数据库流程图）；
  3. 清理全量无用 CSS 样式（`.app-inspector-grid`、`.arch-flow-diagram`、`.arch-notes` 等 500 余行代码）。
- [x] 解决隐私与偏好设置重复问题（严格去重，仅保留单处）：
  1. 彻底删除 Tab 1（身份设置 / 个人资料）中的隐私开关；
  2. 将隐私与偏好统一收敛至 Tab 3（偏好设置），打造唯一清晰的“评论区隐私与显示偏好”专区。
- [x] 头像修改交互重构为现代化原生常识 UX：
  1. 彻底移除笨重冗余的 `class="account-avatar-card-block"` 独立面板；
  2. 将头像更新能力直接集成到顶部 Hero 卡片的头像本身（`class="account-hero-card__avatar is-clickable"`）；
  3. 悬浮时自动呼出“更换头像”磨砂质感半透明蒙版，右下角常驻精致相机徽标（`.account-hero-card__avatar-badge`），点击直接原生唤起图片文件选择器或触发图床上传；
  4. 个人资料表单中保留极简直链输入框与一键“恢复 Epomail 官方头像”小按钮。
- [x] 丰富读者在评论互动过程中的真实诉求功能：
  1. 在 Tab 2 中新增“我的评论足迹”板块，实时读取并呈现用户发表的历史评论与所属文章，点击一键直达对应博文评论锚点。
- [x] 自动化测试套件全量更新与通过：
  1. `scripts/verify-account-drawer-epomail.mjs`：100% PASS（验证技术卡片消除、Tab 1 无重复开关、头像点击与相机标存在、Tab 3 合规 IP 说明、移动端与桌面端自适应）；
### Task 36: 读者中心与通知抽屉 (.theme-account-drawer) 基于 Swiss 2.0 与大厂极简风格的 UI 美化与视觉重构 (`072f586`)
- [x] 严格遵循最小修改原则：严禁修改任何外部组件与后端业务，仅在 `src/styles/final-pass.css` 中对 `.theme-account-drawer` 及其子元素进行深度视觉质感与排版重构。
- [x] 深度视觉审计与大厂设计规范落地 (Visual Audit & Big-Tech Standards)：
  1. 通过 Playwright MCP 针对浅色/深色模式、已登录/未登录状态、3 个选项卡及移动端（390px）全量捕获 11 张高分辨率视网膜截图；
  2. 输出系统级诊断报告 (`account_drawer_redesign_proposal.md`)，精准指出多重卡片边框套娃、层级辨识疲劳、移动端垂直拉伸等 6 大核心痛点。
- [x] 抽屉容器与层级体验全面升维 (Drawer Elevation & Glassmorphism)：
  1. 容器应用 `backdrop-filter: blur(32px) saturate(190%)` 超质感毛玻璃与柔和向左投影（`-24px 0 60px -10px rgba(...)`）；
  2. 顶栏重构：单行脉冲呼吸灯（`.status-indicator-dot`）+ 紧凑单声道眉标（`.eyebrow`）+ 旋转动效圆形关闭按钮（`.theme-account-drawer__close`）；
  3. Hero 个人资料卡：压缩为 52px 精致头像与自然光泽背景，消除笨拙双层边框，状态徽标（`.account-pill--epomail`, `.account-pill--guest` 等）收敛为方圆药丸胶囊。
- [x] 选项卡与内容卡片极简重塑 (Swiss Segmented Control & Content Cards)：
  1. 选项卡轨道（`.account-nav-tabs`）升级为内嵌凹槽分段控制器，活跃项以浮动微投影卡片形态凸显；
  2. Tab 1（身份与资料）：单行自适应 3 列福利徽章（`.epomail-benefits-row`），避免移动端换行拉伸；高对比品牌蓝一键授权按钮；隐式开发者折叠通道与精致表单控件；
  3. Tab 2（站内提醒）：通知卡片微交互位移（`translateX(3px)`）与柔和阴影，空状态居中呼吸排版；
  4. Tab 3（偏好设置）：三列分段语言选择器与 iOS 质感平滑滑动开关（`.theme-switch-slider`）。
- [x] 响应式移动端深度适配与全平台测试通过：
  1. 移动端（$\le 768\text{px}$）自动切换为单列紧凑排版，文字优雅省略，杜绝横向滚动与越界；
  2. 全套自动化测试套件（`scripts/verify-account-drawer-epomail.mjs`、`scripts/verify-rightside-dock.mjs`）验证全绿通过。

### Task 37: 生产端 (Cloudflare Pages) 全量构建部署与真实博文页 Playwright 视觉与交互全链路验收 (`2734c0b`)
- [x] Cloudflare Pages 生产边缘节点全量部署：
  1. 执行 `npm run pages:build` 完成 92 个路由的静态生成与 Functions 运行时打包；
  2. 通过 `wrangler pages deploy dist --project-name shijianus-blog --branch main` 上传最新 277 个静态资产与 Functions bundle 到生产节点（部署标识：`889c1686.shijianus-blog.pages.dev`），实时绑定至线上主域名 `https://blog.epocanvas.com`。
- [x] 生产博文真实路径 (`https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/`) Playwright 端到端全景测试与视觉审计 (`scripts/verify-live-post-account-drawer.mjs`)：
  1. HTTP 状态码 200，无控制台致命 JS 报错，文章标题与 Post Hero 正确呈现；
  2. 桌面端（1440x900）账号中心抽屉呼出交互审计：顶部毛玻璃遮罩、脉冲呼吸灯、3 列分段控制器切换、Epomail 授权卡片与开发者折叠通道展开、通知流与设置页滑动开关完全正常；
  3. 深色模式（Dark Mode）线上实时切换验证：曜石黑质感抽屉背景与高对比文本无缝匹配；
  4. 移动端（iPhone 14 / 390x844）真实视口审计：抽屉宽度严格锁定 390px，单列响应式排版自然贴合，无任何横向溢出；
  5. 整体画风一致性审计：抽屉蓝系主色（`#425aef` / `#3b82f6`）、圆角规格（8px-12px）与博文页 Post Hero 水波纹渐变及卡片体系高度一致，质感协调自然。

### Task 38: 读者与账号中心 (.theme-account-drawer) 通知双分区重构、全站广播免库直出、真实互动与足迹 D1 连结、独立个人资料与偏好扩展 (`04c0a72`)
- [x] 严格遵循最小修改原则：全面保持全站其他外部页面与评论业务逻辑不受干扰，仅针对 `.theme-account-drawer` 抽屉核心组件、支持接口与配套样式进行深度优化。
- [x] 通知中心双分区系统重构 (Dual-Partition Notification System)：
  1. 彻底解决原通知与评论足迹在卡片内粗暴堆叠混淆的缺陷，引入清晰的分段子导航 `[ 📢 全站广播通告 ]` 与 `[ 🔔 个人互动与足迹 ]`；
  2. 全站广播通告（免 DB 编译直出）：由 Astro 构建期从 `posts` 静态数据自动装载最新文章与博主公告至通知顶部，杜绝数据库查询开销，实现每次构建自动化发布与置顶；
  3. 个人互动与足迹（真实连结 Cloudflare D1 边缘数据库）：新增 `/api/comments?feed=user` 接口，按用户会话/标识动态聚合拉取真实回复（Reply）、点赞（Like/Reaction）、火箭（Boost）与引用（Quote）站内提醒，配备“🔄 刷新”按钮与独立的评论足迹列表。
- [x] 独立个人资料设置界面与头像直更体验 (Profile Settings & Hero Card)：
  1. 顶部 Hero 卡片（`.account-hero-card`）呈现个人头像、认证徽章、一句话个人简介（Bio）、所在位置与时区微胶囊（Location & Timezone Chips），并提供右上角“编辑资料”快捷入口；
  2. 头像交互原生化：点击 Hero 卡片头像直接调起本地图片选择器并中继上传至官方图床，彻底移除资料表单内突兀的冗余头像输入框；
  3. Tab 1 重构为专属账户资料设置面板：提供公开昵称（Username）、个人主页（Website）、个人简介（Bio）、所在时区（Timezone，支持“检测”按钮一键探测本机时区）及所在位置（Location）输入控件；留空均优雅降级为默认无内容。
- [x] 偏好设置模块扩展 (Preferences Expansion)：
  1. 新增评论区默认排序方式切换（`⏱️ 最新` vs `🔥 最热`），无缝写入本地持久化存储并广播事件；
  2. 扩充通知接收开关（全站广播通告、个人互动提醒）；
  3. 整合前台国家/地区属地徽章开关、嵌套回复自动折叠、音效开关与动画减弱等完整配置体系。
- [x] 自动化测试套件全量编写与验证通过 (`scripts/verify-account-notifications-and-profile.mjs`)：
  覆盖后端 `/api/comments?feed=user` API 探测、桌面端抽屉呼出、Hero 卡片直更头像、Tab 1 资料表单填写与时区探测保存、Tab 2 双分区切换（全站广播 9 项直出、个人足迹与刷新）、Tab 3 偏好设置持久化、移动端 390px 视口响应式排版，所有断言 100% PASS 通过。
- [x] 生产环境 (Cloudflare Pages) 全量部署与生产端到端 Playwright 验证通过 (`scripts/verify-live-account-notifications.mjs`)：
  1. 通过 Wrangler Pages Deploy 全量打包上传 92 个静态路由与 Functions bundle 至生产节点（部署标识：`57030b2f.shijianus-blog.pages.dev`），实时绑定生产主域 `https://blog.epocanvas.com`；
  2. 真实生产环境 Playwright E2E 自动化审计：`GET /api/comments?feed=user` 返回 200 OK、桌面端抽屉呼出、Hero 卡片头像与编辑按钮、Tab 1 个人资料表单、Tab 2 双分区（全站广播通告 9 项直出、个人互动足迹与刷新按钮）、Tab 3 六项全站偏好开关及移动端（390px）自适应，线上全链路测试 100% PASS 通过。

### Task 39: 账号中心抽屉 (.theme-account-drawer) 极简重构、偏好滑块大幅精简、默认展示站内通知与个人足迹、时区下拉与自动获取、排除自身交互通知并清除冗余元素 (`8747822`)
- [x] 严格遵循最小修改原则：全面保障全站其他组件与全局逻辑稳定，代码修改仅严格限定在 `.theme-account-drawer` 及配套接口与样式。
- [x] 偏好设置滑块大幅精简降噪 (Tab 3 Streamlined Preferences)：
  1. 彻底根除原本过多冗余滑块（删除了广播通告、个人提醒、嵌套折叠、声音反馈、动效减弱等 5 个杂乱开关）；
  2. 仅保留 1 项核心必要的“前台展示国家/地区属地徽章”iOS 质感滑动开关；
  3. 保留语言切换三按钮控制器与评论区默认排序方式（`⏱️ 最新` vs `🔥 最热`）双按钮控制器；
  4. 保留合规透明的后台 IP 审计与前台隐匿特别说明（`.account-privacy-note`）。
- [x] 默认打开状态优化为站内通知与个人足迹：
  1. 抽屉开启默认展示“站内提醒”选项卡（`accountTab === 'notifications'`），并设置事件细节自适应路由；
  2. 站内通知默认激活“个人互动与足迹”子分区（`notifPartition === 'personal'`），满足用户对自身互动的核心关注诉求。
- [x] 时区与位置自动获取及下拉选单优化 (Timezone & Location UX)：
  1. 所在时区输入框占位符精简为“自动获取或选择”，彻底解决超长文案无法展示的问题；
  2. 页面加载与抽屉打开时自动通过 `Intl.DateTimeFormat().resolvedOptions().timeZone` 智能推导本机时区，并结合城市映射预填所在位置；
  3. 新增原生 `<datalist id="account-common-timezones">`，提供北京/上海、香港、台北、东京、纽约、洛杉矶、伦敦、UTC 等 8 个常用时区下拉候选，用户仍可自由手动修改或留空删除；
  4. 所在位置自动请求 `/api/geo-profile` 获取边缘地理位置，提供“定位”快捷探测按钮。
- [x] 彻底排查并清除冗余 UI 元素：
  1. 彻底清除所有 `class="account-card__subtitle"` 说明副标题，保持卡片极致简洁；
  2. 彻底清除所有 `class="account-tag-chip"` 冗余标签角标；
  3. 彻底清除 `class="account-btn-icon account-edit-profile-btn"` 冗余按钮，用户在资料表单中可就地直接修改并保存；
  4. 彻底清除广播通告中的 `class="account-privacy-note"`；
  5. 彻底清除表单底部的 `class="account-btn-danger"` 退出按钮，全界面保持单一且醒目的顶部退出登录入口，杜绝重复。
- [x] 排除用户自身交互触发的通知 (Exclude Self-Interactions)：
  1. 在 Cloudflare D1 SQL 查询与开发内存回退中，严格比对 `author_name`、`author_id`、`author_email` 及 `session_token`；
  2. 过滤掉用户自己对自身评论的回复、Boost 发送以及点赞操作，确保只有来自其他读者的真实互动才会触发站内通知。
- [x] 自动化测试套件更新与全量验证通过 (`scripts/verify-account-notifications-and-profile.mjs`)：
  1. 自动化验证默认选中“站内提醒”与“个人互动与足迹”；
  2. 自动化断言 `.account-card__subtitle`、`.account-tag-chip`、`.account-btn-danger`、`.account-edit-profile-btn` 数量严格为 0；
  3. 自动化验证时区 8 项下拉候选、自动推导值与表单持久化；
  4. 自动化验证 Tab 3 滑块数量精确为 1（仅保留属地徽章）；
  5. 桌面端（1440x900）与移动端（390x844）Playwright E2E 测试全量 PASS 通过。

### Task 40: 隐藏抽屉内部滚动条、支持免源码直接编撰全站广播、规范港澳台无中国前缀与真实精准定位、评论区国旗真实图像载入与单次展示保障 (`e54fa07`)
- [x] 隐藏多层嵌套内部滚动条 (Hide Nested Scrollbars)：
  1. 通过 `scrollbar-width: none !important; -ms-overflow-style: none !important;` 以及 `::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }`，彻底隐藏 `.theme-account-drawer`、`.account-card`、`.account-broadcast-list`、`.account-notification-list` 等内部组件的滚动条滑块；
  2. 完整保留鼠标滚轮、触摸板和手势的平滑上下滚动功能，右侧仅保留浏览器原生单一主滚动条，消除原本右侧 3 个滚动滑块的视觉杂乱。
- [x] 免改源码的全站广播通告在线编撰体系 (In-place Broadcast Editor)：
  1. 在全站广播通告卡片头部增加“编撰通告 / 收起编撰”切换按钮（`.account-card-action-btn`）；
  2. 提供即时内联编撰表单（`.account-broadcast-editor`），支持博主/站长就地编辑通告徽标（Badge）、主标题（Title）、详细内容（Content）及跳转链接（Href）；
  3. 采用本地与事件广播持久化，点击“保存通告”即刻在全站广播列表中顶置展示，点击“恢复默认”可一键重置，无需重新编译或打包源码即可随心更新站点动态。
- [x] 所在位置真实精准定位与 i18n 规范化（港澳台直达，严禁加“中国”）：
  1. 重构 `/api/geo-profile` 后端服务：支持 `zh-CN`、`zh-Hant`、`en` 完整多语言支持；
  2. 针对台湾、香港、澳门严格执行直达地区命名规范，彻底剔除 Cloudflare 默认附带的“中国”或“Province of China / SAR China”前缀/后缀：
     - `TW` 严格输出 `台湾`（简）/ `台灣`（繁）/ `Taiwan`（英）；
     - `HK` 严格输出 `香港`（简繁）/ `Hong Kong`（英）；
     - `MO` 严格输出 `澳门`（简）/ `澳門`（繁）/ `Macau`（英）；
  3. 所在时区与所在位置自动推导逻辑同步严格适配该国际规范，彻底锁定真实地区。
- [x] 评论区 IP 定位国旗真实图载入与单次展示保障 (Comment Geo Flag Loading & Singularity)：
  1. 解决国旗图标加载失败问题：引入 FlagCDN 高清位图（`https://flagcdn.com/24x18/${geo.code.toLowerCase()}.png` 并配 2x 高清 srcset），在 Windows/Chromium/Linux 等非 Apple 原生缺少 Emoji 旗帜字体的系统环境下 100% 稳定可靠展示真实国旗，并在异常时优雅降级为文字；
  2. 保证国旗只显示 1 次：在 `PostComments.tsx` 中清洗评论数据，彻底剔除评论者名称或 `ipLocation` 中可能附带的 Emoji 旗帜与字母前缀，杜绝原本“旗帜图 + Emoji 旗帜”双重显示的重复 Bug。
- [x] 自动化测试套件全量编写与验证通过：
  1. `scripts/verify-account-notifications-and-profile.mjs`：全量验证内部滚动条隐藏、在线通告编撰即时生效、时区与资料表单持久化；
  2. `scripts/verify-geo-and-flags.mjs`：自动化覆盖 `resolveGeoInfo` 字典映射、`/api/geo-profile` 接口实测（TW/HK/MO 规范）、浏览器端国旗真实位图类名与单次展示断言；
  3. `scripts/verify-live-account-notifications.mjs`：生产环境（`https://blog.epocanvas.com`）全链路自动化测试 100% PASS 通过；
  4. 真实生产环境 curl 验证 `https://blog.epocanvas.com/api/geo-profile?country=TW` 返回 `台湾`，HK/MO 均验证通过。

### Task 28: 评论区常驻无感自动刷新杜绝闪烁、本地化国旗资源保障100%渲染、全量恢复偏好设置原貌 (`7740d2c`)
- [x] 偏好设置（Tab 3）全量完整恢复原貌：
  1. 完整恢复三大模块：
     - **站内通知接收偏好**：全站广播与新博文发布通告（`broadcastNotify` 开关）、个人评论回复与点赞提醒（`personalNotify` 开关）；
     - **评论区互动与显示偏好**：默认评论排序（最新/最热）、评论区展示我的地理位置（`showLocation` 开关）、默认折叠嵌套回复（`collapseReplies` 开关）；
     - **交互反馈与无障碍**：交互声音反馈（`soundEffects` 开关）、平滑动效与视差（`reducedMotion` 开关）；
  2. 保留合规与管理目的说明，界面开关与持久化逻辑 100% 完整。
- [x] 评论区常驻（Permanent Residency）与无感自动刷新（Silent Auto-refresh）杜绝闪烁：
  1. 彻底根治“随便点击/窗口聚焦就闪烁刷新”：移除了原本在 `window` 的 `focus` 事件上无条件触发 `setLoading(true)` 抹除整个评论 DOM 的致命逻辑；
  2. 评论区持久常驻：引入 `commentsRef`，仅在初次进入且本地无任何评论缓存时展示初始加载态，一旦评论载入，DOM `<div className="tk-comments-list">` 永久常驻，严禁在后续点击、切换焦点或刷新时卸载或闪烁；
  3. 无感后台自动轮询：引入 25 秒后台静默轮询机制（仅当页面处于活跃标签时静默轮询），若数据无变化则 0 重绘，有新评论则无感平滑合并；用户发表评论、回复、行内修改与删除操作均执行静默更新。
- [x] 国旗资源第一方本地化（100% 稳定渲染与单次展示）：
  1. 将 40 个主流国家/地区 48x36 高清 Retina PNG 旗帜图标（包含 `my.png`、`tw.png`、`hk.png`、`mo.png`、`cn.png`、`us.png` 等）下载至第一方静态资源库（`public/media/flags/*.png`）；
  2. 评论区定位徽标直接优先引用同源资源 `/media/flags/${code}.png`，彻底摆脱第三方 FlagCDN 阻断与网络异常风险，并彻底解决 Windows/Chromium 缺失 Emoji 旗帜字体导致的方框乱码问题；
  3. 严格清洗数据保障国旗只显示 1 次，移除冗余的国家缩写文本（如 `MY`），仅呈现精致高清国旗图与本地化中文地名（如 `马来西亚`）。
- [x] 自动化端到端测试套件（`scripts/verify-full-e2e.mjs`）全量编写与执行通过：
  1. 旗帜静态资源 HTTP 200 与图片尺寸断言通过；
  2. 账号中心偏好设置 Tab 3 三大模块全部存在且可交互；
  3. 评论区评论列表常驻、旗帜图像与本地化地名完整呈现；
  4. 模拟连续 15 次全屏随机点击与窗口焦点切换，MutationObserver 确认 0 闪烁 0 重新加载！



### Task 29: 构建时全站广播通告机制 (三层架构)、AI 辅助对比变更、零 DB 损耗与免在线编辑重构 (`a9f799c`)
- [x] 明确通告机制本质定位与架构纠偏：
  1. 彻底纠偏“在线动态编辑”设计：全站广播是博主向读者发布站点更新或新文章的官方渠道，不属于访客或前台动态在线编辑范畴；
  2. 彻底清理抽屉中的 `.account-card-action-btn`（编辑通告按钮）与 `.account-broadcast-editor`（在线编辑表单），保持账号抽屉清爽自然，杜绝客户端无意义的状态混乱。
- [x] 三层体系全景落地 (Three-Tier Architecture)：
  1. **层级 1 (用户自主编写 - Manual Authoring)**：
     - 在 `src/content/broadcast.md` 中以 Markdown + YAML Frontmatter 格式自主撰写；
     - 规范定义 `badge`（徽标）、`title`（标题）、`date`（日期）、`author`（作者）、`href`（详情链接）、`summary`（导语）及若干条列表亮点；
     - 构建期直接扫描静态渲染，0 数据库查询与 0 存储损耗。
  2. **层级 2 (AI 辅助对比 - AI Assistance)**：
     - 开关默认保持关闭 (`ENABLE_AI_BROADCAST=false`)，仅在博主于环境变量配置了 API Key (`AI_BROADCAST_API_KEY`) 时显式激活；
     - 内置专属系统提示词 (`src/config/broadcast-prompt.md`)，严格遵守**防幻觉准则**（事实归因、读者视角、对比连续性、兜底维护）与**四步链式核验流程**（Step 1 数据提取、Step 2 博文甄别、Step 3 亮点提炼、Step 4 准确性核验）；
     - `scripts/sync-broadcast.mjs` 自动抓取 Git 提交日志 (`git log`)、文件改动统计 (`git diff --stat`)、最新博文列表与历史通告进行对比，生成真实客观的通告；
     - API 异常或未配置时平滑优雅回退至本地已有 `broadcast.md`，绝不中断构建流程。
  3. **层级 3 (构建时渲染与 UI 展现 - Build-time Rendering & Presentation)**：
     - `src/lib/broadcast.ts` (`loadBroadcastData()`) 在 Astro 构建期加载通告数据；
     - `BlogLayout.astro` 与 `ThemeOverlays.tsx` 响应式展示精美的主通告卡片（`.account-broadcast-item--featured`），包含专属高亮徽标（`.account-broadcast-badge--featured`）、加粗高光亮点清单（`.account-broadcast-bullets`）与直达文章详情链接（`.account-broadcast-link`）；
     - `package.json` 构建命令（`prebuild`、`build`、`build:static`）全量无缝集成 `npm run broadcast:sync`。
- [x] 自动化端到端测试套件全量验证 (`scripts/verify-broadcast-build.mjs`)：
  1. 验证抽屉内 `.account-card-action-btn` 数量严格为 0；
  2. 验证抽屉内 `.account-broadcast-editor` 数量严格为 0；
  3. 验证 `.account-broadcast-item--featured` 包含正确的徽标、标题、简介、4 项加粗亮点列表及详情链接；
  4. 生成视觉审计截图 `scratch/broadcast-drawer.png`，断言全部通过。

### Task 30: Epomail OAuth 授权界面重构、直接使用博客现成标签页图片、按钮0偏差对齐与生产端端到端验证 (`0665a0d` / `66ae262`)
- [x] 直接扫描并展示博客现成标签页图片 (Favicon)，拒绝虚假新建或手绘假 SVG：
  1. 授权界面 `brand-chip app-chip` 彻底清除临时手绘 SVG，改由标准 `<img>` 标签直接展示应用现成标签页展示图片（即 `https://blog.epocanvas.com/favicon.png`，粉发少女动漫头像），自然尺寸 256x256；
  2. 针对离线网络环境提供 `/shijianus-favicon.png` 本地高保真回退，对第三方应用提供通用的 `homepageUrl + '/favicon.png'` 自动扫描机制；
  3. 远端 Cloudflare D1 数据库与后端默认应用种子 `DEFAULT_OAUTH_APPS` 同步更新 `logo_url`。
- [x] 按钮对齐与 UI 质感优化 (0 像素级对齐)：
  1. 彻底清除 Element Plus 注入的 `margin-left: 12px` 样式副作用，使「授权并继续」与「取消授权」在竖向流中达成绝对 0 偏差对齐（Delta X = 0px, Delta Width = 0px, Height = 44px）；
  2. 将单薄突兀的裸 globe 升级为高质感微胶囊 `.app-origin-chip`（“官方已验证 · blog.epocanvas.com ↗”）；
  3. 优化 `scopes-list`：将千篇一律的大对勾重构为 Duotone 双色卡片式图标体系（钥匙、信封、名片、评论气泡），补齐 `openid`、`email`、`profile`、`comments` 4 项权限及详细释义。
- [x] 生产端全链路自动化端到端测试 100% 通过：
  1. Playwright 测试脚本 `tests/test-shijianus-oauth-authorize-visual.mjs` 针对 `https://mail.epocanvas.com` 生产节点与真实应用全链路验证通过；
  2. 验证标签页图片 `naturalWidth = 256`、`naturalHeight = 256` 真实加载无破损；
  3. 验证按钮盒模型 0px 偏差；
  4. 截留真实生产环境浅色、深色及未登录态视觉审计报告。
- [x] 全网部署上线完成：
  1. Cloudflare Workers 部署版本 ID：`4e7d81ef-178d-437b-9bb9-1f61c72cd617`；
  2. 代码提交并全量同步至远端仓库。

### Task 31: 全站硬编码 i18n 多语言体系重构、智能用户画像 (Persona) 与地理批判推断引擎、最小化精准双语切换机制 (`384d5b9`)
- [x] 主流多语言支持体系扩展 (主流 6 国语言)：
  1. 全面扩展支持：英语 (en)、法语 (fr)、西班牙语 (es)、德语 (de)，以及简体中文 (zh-CN) 和正体中文 (zh-Hant)；
  2. 重构多语言词典（`src/lib/client-locale.ts` 中 `MULTILINGUAL_DICTIONARY`），全面覆盖主导航、文章目录 (TOC)、阅读时长、打赏、评论区、账号抽屉、背景切换、快捷控制栏等全站所有硬编码文本与属性；
  3. 后端地理接口（`functions/api/geo-profile.ts`）与国家字典全面打通多语言支持，智能解析各语言国家与城市名称。
- [x] 智能用户画像与综合语言推断引擎 (45% 输入法 / 40% 时区 / 15% IP 地理)：
  1. **输入法 / 语言环境 (45% 权重)**：智能感知 `navigator.languages` 与 IME 特征（如 Pinyin/Hans/ZhuYin/Hant/French/Spanish/German/English）；
  2. **时区解析 (40% 权重)**：根据 `Intl.DateTimeFormat().resolvedOptions().timeZone` 解析读者所在时区；
  3. **IP 地理批判与代理规避识别 (15% 权重)**：结合 Cloudflare 边缘 IP 归属地与网络特征，对海外代理出口（如 MY/SG/JP/US 等）且具备中文输入法和台北/上海时区的用户，精准推断为“大陆读者使用台北时区与海外代理规避”，自动赋予简体中文 (zh-CN) 偏好并标记代理特征，杜绝误判；
  4. **候选对圈定 (Dual-Language Cycle Pairing)**：为用户精准圈定 2 种最匹配的双语组合（如简体中文 ⇋ 繁體中文、Français ⇋ English 等），并构建持久化用户画像（`UserPersonaProfile`）。
- [x] 右侧快捷按钮 (`#rightside-config-hide` 中的 `#translate`) 精确最小化循环切换：
  1. 仅在圈定的 2 种双语候选对之间极速轮换，杜绝全语言无序轮巡；
  2. 图标直观化：繁简体中文直接呈现精致设计的“简”与“繁”字标；其他语言呈现对应的专属字标（"EN" / "FR" / "ES" / "DE"），一目了然；
  3. 偏好设置（`account-card`）不受限制：账号中心提供完整 6 种主流语言选择网格，用户可随时自由指定任意偏好，并同步更新画像候选对。
- [x] 自动化测试套件全量编写与验证通过 (`scripts/verify-i18n-persona.mjs`)：
  1. 覆盖 6 种典型人群画像推理与权重断言（含 Pinyin + Taipei + MY 代理规避场景）；
  2. 验证多语言词典在 en、fr、es、de 维度的精准翻译；
  3. Playwright 浏览器端到端交互测试：验证 `#translate`“简”⇋“繁”精准切换、账号抽屉 6 语言自由选择、切换至法语后 `#translate` 自动转为 "FR" ⇋ "EN" 循环。
- [x] 生产端 (Cloudflare Pages) 全量构建、边缘部署与真实线上环境 E2E 视觉审计实证 (`scripts/verify-live-i18n-persona.mjs`)：
  1. **多远端与双项目同步部署**：
     - 代码提交推送至 GitHub 双远端（`origin` -> `astro-theme-shijianus.git`，`cf` -> `shijianus.github.io.git`）；
     - 成功通过 Wrangler 将构建产物 `dist` 完整部署发布至 Cloudflare Pages 生产项目 `shijianus-blog`（绑定主域名 `https://blog.epocanvas.com`，部署 URL：`https://4f1a653d.shijianus-blog.pages.dev`）以及 `shijianus-github-io`（部署 URL：`https://b37e5324.shijianus-github-io.pages.dev`）；
  2. **生产端真实全链路 Playwright 视觉与交互审计**：
     - 真实访问生产环境文章页 `https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/`，HTTP 200 加载正常；
     - 初始字标识别：右侧控制栏展开，`#translate` 按钮渲染直观“简”字标；
     - 第 1 次点击切换：动态切换为“繁”，`html[lang="zh-Hant"]` 生效；
     - 第 2 次点击循环：动态循环回“简”，`html[lang="zh-CN"]` 生效，达成精准双语最小化切换闭环；
     - 账号中心偏好设置抽屉：展示全部 6 种主流语言按钮，智能用户画像卡片（45% 输入法 / 40% 时区 / 15% 地理批判 + 代理规避识别）真实渲染；
     - 全语言联动测试：在抽屉中选择“Français”，`#translate` 按钮即刻更新为“FR”，再次点击后极速在“FR”与“EN”之间轮转；
     - 生产环境截图存档：`scratch/live-initial-page.png`、`scratch/live-zh-hant-state.png`、`scratch/live-account-persona-drawer.png`、`scratch/live-french-en-cycled.png`。

### Task 32: 阅读模式 (id="readmode") 沉浸式重构、规避干扰组件、文章正文孤立呈现、侧栏目录 (TOC) 默认保留与收紧侧栏 (id="hide-aside-btn") 协同解耦 (`911b564`)
- [x] 阅读模式核心视觉与沉浸体验优化：
  1. 彻底根除历史遗留的 880px 宽度收缩 (`max-width: 880px !important`) 缺陷，在 1400px 标准容器下自然延伸，保障舒适舒展的排版与阅读呼吸感；
  2. 全局非阅读组件彻底规避：进入阅读模式后，全局顶栏导航 (`#nav`)、文章巨幅海报与视差水波纹 (`.page-shell__hero`)、底栏 (`#footer`)、AI摘要面板 (`.post-ai-abstract`)、版权卡片 (`.post-copyright`)、标签列表 (`.post-tags-row`)、相关文章推荐 (`.relatedPosts`)、末尾下一篇推荐 (`#pagination.pagination-post`) 以及评论系统 (`#post-comment`) 统一隐藏 (`display: none !important`)；
  3. 文章正文孤立呈现：`#post` 内部仅保留 `class="article-body post-content"`，并在正文顶部内嵌极简沉浸式标题与作者/日期/字数/阅读时长元信息栏 (`.read-mode-header`)；
  4. 视觉基底重塑：在浅色与深色模式下提供极简纯净的阅读底色与精致微阴影。
- [x] 侧边栏目录 (TOC) 默认保留与协同收紧：
  1. 彻底解决历史遗留的阅读模式强制隐藏整个侧栏的问题，默认保留侧边栏 (`.page-aside`) 并仅展示文章目录 (`#card-toc`)，自动隐藏作者卡片、最新文章与推广翻转卡片等干扰项；
  2. 与侧栏收紧按钮 (`#hide-aside-btn`) 深度联动协同：在阅读模式下点击收紧侧边栏即可连带关闭目录，正文平滑扩展至 100% 全宽；再次点击展开侧栏则即刻恢复目录；
  3. 控制台按钮可达性保障：阅读模式下保持 `#rightside` 悬浮工具栏可见且默认滑出，方便用户随时一键操作 `#readmode`、`#hide-aside-btn` 与快捷返回。
- [x] 多退出机制健全：
  1. 右上角提供精致毛玻璃退出悬浮按钮 (`.exit-readmode`)，支持快捷点击退出；
  2. 键盘事件监听接入：支持全局按 `Escape` 键一键瞬时退出阅读模式；
  3. 点击 `#rightside` 中的 `#readmode` 按钮亦可双向切换。
- [x] Playwright 端到端全链路自动化审计 (`scripts/verify-readmode.mjs`)：
  1. 桌面大屏 (1440x900)、标准屏 (1280x800) 及移动端全视口验证通过；
  2. 断言验证了非正文组件全量隐藏、正文与阅读标题渲染、宽度未受 880px 夹紧（实际渲染宽度 > 916px ~ 1036px）、默认保留 TOC、点击收紧按钮目录关闭且文章扩展至 1336px、再次点击恢复 TOC、点击退出按钮及按下 Escape 键瞬时恢复等全部链路。

### Task 33: 阅读模式 class="aside-sticky-box" 侧栏目录无法翻页与粘性卡片卡死根治、长目录内部滚动与全链路审计 (`6cfa0c2`)
- [x] 彻底解决目录“无法翻页”（内部滚动卡死）缺陷：
  1. 修复 CSS 中原本错误设置的 `display: block !important;`，恢复 `#card-toc` 与 `.aside-sticky-box` 规范的 `display: flex !important; flex-direction: column !important; min-height: 0 !important;`；
  2. 释放 `.toc-content` 弹性伸缩空间，固化 `flex: 1 1 auto !important; min-height: 0 !important; max-height: none !important; overflow-y: auto !important; overscroll-behavior: contain !important;`，彻底根除因 `display: block` 导致 `clientHeight === scrollHeight`（判定为无需滚动）从而卡死的缺陷；
  3. 注入精致细窄滚动条（5px）与平滑滚动动效，确保超长目录与多层嵌套标题均能在卡片内部丝滑上下滚动与翻页浏览；
  4. 针对 `Sidebar.astro` 中的 `adjustTocFlex()` 增加阅读模式感知，阅读模式下强制保持 `flex: 1 1 auto`，杜绝因行内样式覆盖导致的弹性坍塌。
- [x] 彻底解决粘性卡片卡死与滚动被推飞（无法触发粘性卡片）缺陷：
  1. 根治 `src/scripts/sticky-sidebar.ts` 中 `updatePostSticky` 的动态高度计算缺陷：阅读模式下以 `#post` 文章绝对文档顶部坐标（`postRect.top + docScrollY`，恒定文档基准）锚定 `docTrackTocTop`，使得 `targetTocHeight` 稳定等于文章正文总高度，粘性卡片在滑行过程中始终稳定吸顶在顶部 24px（`boxTop = 24px`），绝不再随 `scrollY` 发生线性缩水、坍塌或被推飞；
  2. 在阅读模式下将已隐藏的 `trackRecent` 与 `trackSupport` 明确设为 `display: none` 并隔离，跳过复杂的多卡片交接与负 margin 干扰；退出阅读模式时无感恢复；
  3. 消除双重 Sticky 定位冲突：清除此前在 `#card-toc` 上的 `position: sticky`，统一定义在父级 `.aside-sticky-box#aside-sticky-box-toc`（`position: sticky !important; top: 24px !important;`），`#card-toc` 回归 `position: static`；
  4. 优化 `resolveHeaderOffset()`，阅读模式下自动返回顶部偏移量 `24px`，使 `--sticky-column-top` 适配无导航栏状态。
- [x] 优化目录点击跳转与高亮自动聚焦联动：
  1. 在 `Sidebar.astro` 的 TOC 点击事件与 `updateActive` 滚动侦测中接入阅读模式动态偏移：阅读模式下点击平滑滚动偏移量自适应调整为 `24px`（原为 80px），消除跳转后顶部大片空白；
  2. 激活章节时自动通过 `tocContent.scrollTop` 将当前活动项平滑卷入可视区域内部；
  3. 监听 `shijianus:readmode-changed` 与 `shijianus:asidechange` 事件，状态切换时即时重新校准高亮与几何坐标。
- [x] Playwright 端到端全链路自动化审计 (`scripts/verify-readmode.mjs` & `scripts/verify-live-readmode.mjs`)：
  1. 本地全视口（1440x900、1280x800、375x667）端到端自动化测试全部 100% PASS；
  2. 断言验证了 TOC 内部滚动翻页能力（`canScrollInternal: true`）、页面滚动全过程 sticky 稳定在 24px（800px、3000px、10000px、20000px 全程 `boxTop = 24px`）、点击章节平滑跳转、收紧侧栏全宽展开与再次展开目录无缝恢复；
  3. 生产端真实环境（`https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/`）Playwright 端到端全链路验证全部 100% 通过（验证了文章正文孤立呈现、TOC 内部丝滑翻页 `scrollHeight: 3752 > clientHeight: 745`、页面深层滚动 `top = 24px` 稳定停留、侧栏收紧正文扩展至 1336px 及退出恢复）。

### Task 34: 抽屉多语言卡片呈现全面打通、消除语言切换卡顿与中文污染、画像卡片彻底移除与全链路审计 (`2278cbf`)
- [x] 抽屉内 `account-card` 真实且完整多语言化：
  1. 为主流 6 国语言（`zh-CN`, `zh-Hant`, `en`, `fr`, `es`, `de`）构建完整的 `I18N_STRINGS` 词典，全面覆盖抽屉内 3 大 Tab 所有卡片标题、表单字段、占位符、操作按钮及合规提示；
  2. 修复抽屉仅为无意义按钮的问题，点击各语言即时全量重渲染抽屉内所有文本，杜绝空壳切换。
- [x] 消除语言切换卡顿（零延迟秒级响应）：
  1. TreeWalker 智能跳过 React 容器：`skipSelector` 补齐排除 `.theme-account-overlay, .theme-account-drawer, #theme-overlays, #local-search, #console`，消除 React 与 DOM TreeWalker 互相改写属性导致的死循环与重绘卡顿；
  2. 惰性加载转换器：切回 `zh-CN` 或非繁体语言时不加载 OpenCC 转换模块，直出零等待。
- [x] 根治硬编码 i18n 错乱与中文污染（100% 无损还原）：
  1. 采用 `originalTextNodeMap` 缓存不可变原始中文文本节点与属性，切回 `zh-CN` 时直接赋值恢复；
  2. 彻底杜绝使用繁简转换器恢复中文时导致外文残留混杂的问题，达成 0 外语残留、100% 中文无损复原。
- [x] 彻底移除 `account-persona-card`（保护内部推断算法）：
  1. 从前端 DOM 中完全剔除画像卡片，DOM 中 `.account-persona-card` 元素计数严格为 0；
  2. 保留后台静默用户画像推断机制（输入法、时区、IP 地理批判），仅在底层为 `#translate` 按钮圈定双语候选对，绝不泄露算法权重与推断规则。
- [x] 优化 `ThemeOverlays` 水合指令：
  1. 将 `BlogLayout.astro` 中的 `<ThemeOverlays>` 由 `client:idle` 优化为 `client:load`，保障账号中心与抽屉在初次进入时立即可交互。
- [x] 自动化端到端测试套件全量跑通 (`scripts/verify-i18n-thorough.mjs`)：
  1. 验证 `.account-persona-card` 在 DOM 中完全不存在；
  2. 验证 6 种主流语言在 Tab 1、Tab 2、Tab 3 中的卡片标题与权益文本；
  3. 测量语言切换延迟（< 1000ms，极速响应）；
  4. 验证关闭抽屉后整站中文 100% 无损还原，0 外语泄露。

### Task 35: i18n 语言切换极速顺滑优化、非正文全域本地化覆盖、拉丁语系排版自适应与端到端审计 (`f88232e`)
- [x] 彻底根治语言切换卡顿（实现丝滑极速响应）：
  1. 将 `convertText` 升级为 **$O(1)$ 字典精确查找优先**，微秒级直接命中并返回；
  2. 引入 `DYNAMIC_PATTERN_QUICK_TEST` 前置正则守卫（`/\d|查看|收起|始于|起始于|博客|节|篇|字|分钟|次|天/`），消除对全站数千节点的无意义正则循环匹配；
  3. `translateAttributes` 增加 `hasAttributes` 及属性存在性快速前置检查，消除大量反射开销；
  4. `initLocaleRuntime` 利用 `requestIdleCallback` 提前异步预热 `opencc-js` Trie 字典，消除首次切换 zh-Hant 时的迟滞；
  5. 修复 `shijianus:localechange` 重复触发问题，杜绝双重 DOM 树遍历；
  6. `isIgnoredSubtree` 引入 `closest()`，完美隔离 React 内部自主管理的渲染子树（账号中心、控制台、搜索等），杜绝 React 和 DOM TreeWalker 的重绘冲突与文本污染；
  7. 语言切换延迟实测稳定在 ~400ms，达成丝滑无感流畅体验。
- [x] 全站除 `article` 正文外的全域本地化覆盖（彻底消除漏网之鱼）：
  1. 顶栏导航子菜单（全部文章/时间线总览/分类索引/按主题浏览文章/标签聚合/关键词索引/友人帐/留言板/朋友圈/工坊/留声机/放映室/音乐播放器/视频播放器/关于作者/作者与站点说明/查看当前重构进度/尚在整理中的专题入口/随便逛逛/打开当前推荐文章/更多推荐/开始阅读/关于主题/向右查看更多分类等）；
  2. 侧边栏作者卡片（完整 Bio、格言、作者经历、站点运行状态、字数统计、文章数统计、扫码加入等）；
  3. AI 摘要面板（AI生成/已精简/阅读全文/重新生成）；
  4. 文章版权卡片（除特别声明外... CC BY-NC-SA 4.0 许可协议...）；
  5. 文章末尾下一篇推荐卡片（接着读 / NEXT ARTICLE / LIRE LA SUITE / SIGUIENTE LECTURA / NÄCHSTER BEITRAG）；
  6. 国际赞赏收银台（`RewardModal.tsx`）补齐全 6 种主流语言（en, fr, es, de, zh-CN, zh-Hant）的原生收银台文案与安全背书；
  7. 评论系统控制按钮、排序切换、手风琴折叠展开、字数统计、地理旗帜、各模式切换等；
  8. 页脚全量标语与运行状态；
  9. `#article-container` 内部正文通过 `TreeWalker` 与 `isIgnoredSubtree` 绝对跳过，保持 100% 原汁原味不受污染，供后续专项策略处理。
- [x] 拉丁语系文本与 UI 不相容优化（杜绝排版挤满与溢出）：
  1. 导航子菜单 `.menus_item_child`, `.site-page-submenu` 扩展至 `min-width: 210px` 弹性呼吸宽度；
  2. 侧边栏作者卡片格言与角色添加 `overflow-wrap: break-word` 并微调字号至 11.5px；
  3. `.post-hero__meta-grid` 设为 `flex-wrap: wrap; gap: 4px 8px;`，长单词拉丁语系下平滑折行无挤压；
  4. 评论区操作栏 `.tk-interaction-tab` 与 `.tk-sort-btn` 弹性收敛；
  5. 移动端（390x844）全面测试，水平滚动溢出检测为 0。
- [x] 自动化端到端测试套件全量跑通 (`scripts/verify-i18n-latin-layout.mjs` & `scripts/verify-i18n-thorough.mjs`)：
  1. 覆盖 6 国语言（`en`, `fr`, `es`, `de`, `zh-Hant`, `zh-CN`）；
  2. 验证切换性能延迟 < 500ms；
  3. 验证导航栏、AI 摘要、下一篇推荐、侧边栏、版权卡片全量翻译；
  4. 验证 `#article-container` 内部正文未被篡改；
  5. 验证桌面与移动端无横向溢出；
  6. 验证账号抽屉 6 国语言切换与无损复原 Simplified Chinese。

### Task 36: 阅读模式 class="aside-sticky-box" 与正文顶端 24px 精准对齐、全行程持续粘性吸附与右侧工具栏避让 (`eca740a`)
- [x] 根治顶端对齐落差与跳动缺陷：
  1. 清除阅读模式下 `#blog-container` 的 60px 虚位内边距（`padding-top: 0 !important;`），将 `#content-inner` 顶部内边距调整为 `padding: 24px 20px !important;`；
  2. 在 `scrollY = 0` 时，左侧正文 `page-main`（top: 24px）与右侧目录 `aside-sticky-box`（top: 24px）实现 **100% 绝对像素级水平平齐对齐**（Difference = 0px）；
  3. 在页面开始向下滚动的瞬间，`aside-sticky-box` 已经处于其粘性坐标（`top: 24px`），实现零延迟、零跳动、丝滑平滑过渡。
- [x] 根治文章尾部侧栏被推飞与消失缺陷（全行程持续粘性吸附）：
  1. 解除 `trackToc` 硬编码为正文高度的像素截断，将其与 `post-sticky-layout` 在阅读模式下统一设置为 `height: 100% !important; min-height: 100% !important; flex: 1 1 auto !important; align-self: stretch !important;`；
  2. 确保在文章正文从开头到最末端（`scrollY` 从 0 到 33815px 终点）的全阅读行程中，`aside-sticky-box` 恒定稳定保持在视口内（`top: 24px`），永远不会在尾部区域发生负坐标位移或挤压移出视口。
- [x] 强化 CSS 特异性覆盖：
  1. 在 `final-pass.css` 中注入高优先级阅读模式覆盖规则（`body.read-mode[data-type='post'] #aside-content #post-sticky-layout .aside-sticky-box { top: 24px !important; }` 及 `height: 100% !important;`），杜绝被默认的 `80px` 覆盖。
- [x] 彻底消除右侧悬浮工具栏 (`#rightside`) 与目录文字的重合交错：
  1. 将阅读模式下 `#content-inner` 的最大宽度收敛优化为 `max-width: min(1280px, calc(100vw - 160px)) !important;`；
  2. 在 1920x1080、1536x864、1440x900、1366x768 等所有桌面视口下，右侧固定定位的 `#rightside` 与 `#card-toc` 保持至少 21px ~ 261px 的完全物理避让与呼吸间距，杜绝遮挡文字与误触。
- [x] 完善协同收紧与目录内部翻页能力：
  1. 点击 `#hide-aside-btn` 能够平滑将侧栏收缩至 0 像素，正文列扩展至 100% 全宽；再次点击平滑恢复 300 像素并即时激活 24px 粘性对齐；
  2. 保留 `#card-toc .toc-content` 独立内部滚动能力，读者既能随着正文向下翻页同步高亮和进度条，也能在目录内部自由上下滑动查阅所有章节。
### Task 37: 阅读模式文章目录位置与大小前后一致性 (0px漂移)、原生 post-hero__inner 标题保留与隐形无滑块重构 (`e536a07`)
- [x] 文章目录大小与位置 1:1 前后一致性（0.00px 物理漂移）：
  1. 恢复阅读模式下的 `#content-inner.layout` 最大宽度为 `1400px !important;`，内边距与间隙统一为 `padding: 20px 15px !important; gap: 20px !important;`；
  2. 侧边栏 `.page-aside` 固化为 `width: 300px !important;`，正文 `.page-main` 固化为 `max-width: calc(100% - 320px) !important;`；
  3. 彻底根除阅读模式下目录向左骤缩 60px 的视觉跳跃，开启与关闭阅读模式瞬间文章目录的水平物理位置（left, right）与尺寸（width: 300px）实现 **100% 绝对像素级一致（实测全视口 Drift = 0.00px）**，向右扩展回归标准 1400px 网格对齐线。
- [x] 原生 `class="post-hero__inner"` 标题展示保留与正文纯粹化：
  1. 从阅读模式隐藏列表中解除 `.page-shell__hero`，保留原汁原味的高质感 `<div class="post-hero__inner">`（涵盖原创/转载方形徽标、#tag 分类标签、主副标题、以及日期/字数/阅读时长流式 Meta 信息）；
  2. 从 `src/pages/posts/[slug].astro` 中彻底删除注入到 `<article>` 正文内部的 `<header class="read-mode-header">` 及对应 CSS 样式；
  3. 确保正文容器 `<article id="article-container" class="article-body post-content">` 内部仅保留纯净的文章内容，杜绝生硬的次生标题降级。
- [x] 消除显式滑块（滚动条隐形化）：
  1. 彻底移除此前为阅读模式注入的 5px 宽显式蓝色滑块（`::-webkit-scrollbar-thumb`）；
  2. 严格还原与没开阅读模式时一致的隐形滚动规范：`scrollbar-width: none !important; -ms-overflow-style: none !important; ::-webkit-scrollbar { display: none !important; width: 0 !important; }`；
  3. 保证目录内部依然保持平滑滚轮与触摸板滚动能力，但视觉呈现零滑块干扰。
- [x] 侧栏协同折叠展开与全行程 24px 粘性吸顶：
  1. 协同 `#hide-aside-btn`：收起侧边栏时 `.page-aside` 宽度平滑变为 0，正文自适应占满 100% 容器；展开后精准恢复 300px 并回归原位（恢复后漂移 0.00px）；
  2. 滚过顶部 PostHero 之后，`#aside-sticky-box-toc` 稳定且持续粘性吸附在顶部 `24px`，无缝随行正文阅读。
- [x] 编写并执行全流程自动化端到端测试套件 (`scripts/verify-readmode-consistency.mjs`)：
  1. 覆盖 1080p Desktop (1920x1080)、Standard 1440 (1440x900)、Compact 1366 (1366x768) 全桌面视口；
  2. 实测开启前后 Drift 全部为 **0.00px**，所有断言全部 PASS！视觉比对截图完整沉淀。

### Task 38: 全站组件级 i18n 全景国际化重构 (6 种语言全量覆盖、React 孤岛防崩溃隔离与 Playwright 端到端审计) (`b0ac795`)
- [x] 右侧快捷按钮组 (`class="config-open panel-out"` / `#rightside`) 完整国际化：
  1. 在 `src/components/ThemeDock.tsx` 注入多语系配置字典 `DOCK_TRANSLATIONS`，覆盖 11 项核心状态：阅读模式（开/关）、直达评论、语言切换（动态显示当前与目标语种及简繁切换提示）、快捷设置展开/收起、深浅色模式切换、背景模式轮换、隐藏选单；
  2. 支持实时监听 `shijianus:localechange` 事件响应式更新，全量补齐 `title` 与 `aria-label`。
- [x] 顶部导航栏按钮 (`id="nav-right"`) 提示与无障碍说明完整国际化：
  1. 在 `src/components/SiteHeader.tsx` 注入 `NAV_TRANSLATIONS`，覆盖个人中心 (`#nav-account`)、通知中心 (`#nav-notification`)、站内搜索 (`#search-button`)、主题切换 (`#nav-theme-toggle`)、随机文章 (`#randomPost_button`) 与中控台 (`#center-console-button-astro`)；
  2. 在 `AnzhiyuDashboardIcon.astro` 注入动态客户端脚本，响应 `shijianus:localechange` 并即时更新 `data-shijianus-tooltip`、`title` 与 `aria-label`。
- [x] 账号中心与设置面板 (`class="account-field-control"`) 定位与时区完整国际化：
  1. 完整重构地理位置与时区输入框占位符（`placeholder`）及快捷检测按钮文本与 tooltip；
  2. 国际化常用时区列表选项，消除硬编码中文时区名称，适配所有 6 种语言。
- [x] 评论区交互按钮 (`class="tk-actions-group"`) 与国旗说明 (`class="tk-geo-name"`) 彻底本地化：
  1. 在 `src/lib/geo-names.ts` 重构国家与地区名称解析，提供 6 种语言完整映射与 `Intl.DisplayNames` 优雅降级，彻底根除硬编码中文前缀；
  2. 动作按钮组（点赞、回复、Boost 快速打气、引用回复、编辑、删除、展开/折叠）全量适配 6 语系。
- [x] 拓展选项下拉菜单 (`class="tk-dropdown-panel tk-options-dropdown"`) 与 Markdown 工具栏 (`class="tk-markdown-toolbar"`) 深度国际化：
  1. 在 `src/lib/comments-i18n.ts` 中构建全部 16 个扩展选项（引用博文、插入表格、插入目录、横向滚动、Mermaid、Chart、折叠块、Graphviz、日期时间、数学公式、快捷模板、脚注、剧透、投票、Callout、图片上传）的标题与详细描述字典；
  2. Markdown 控制栏（贴文语言选择、加粗、斜体、标题、引用、代码块、列表、文字方向 LTR/RTL、Emoji 表情、图片、扩展选项）全部配备精准 tooltip 与 aria 属性。
- [x] 输入框占位符 (`class="tk-input el-textarea"`)、渲染预览 (`class="tk-col"`) 与交互动效全景国际化：
  1. 动态生成带文章原标题的个性化占位符文本；
  2. 实时渲染预览徽章（`class="tk-preview-badge"`）与空状态提示（`class="tk-preview-empty"`）双向适配；
  3. 排序按钮（最新/最热）、空状态插画提示、角色徽章（置顶/博主/访客）及 YouTube 式手风琴折叠展开按钮全量国际化。
- [x] React 孤岛渲染与 TreeWalker 冲突彻底根除（Minified React error #418 终结）：
  1. 在 `src/lib/client-locale.ts` 的 `isIgnoredSubtree` 中加入 `#rightside`, `#post-comment`, `#nav-right`；
  2. 杜绝 `TreeWalker` 直接操作 React 管理的 DOM 文本节点导致的虚拟 DOM 冲突；各 React 岛屿通过内部监听 `shijianus:localechange` 自治响应、零闪烁秒级渲染。
- [x] 编写并执行全覆盖自动化端到端测试套件 (`scripts/verify-all-user-i18n.mjs`)：
  1. 全面贯穿 6 种语言（`en`, `fr`, `es`, `de`, `zh-Hant`, `zh-CN`）；
  2. 验证所有指定 UI 组件，正文内容 100% 保持不可变，移动端（390x844）零横向滚动溢出，全部断言 PASS！

### Task 39: 全站提示弹窗、交互模态框、通知横条与右键菜单全景 i18n 补完与零中文残留审计 (`7bd788c`)
- [x] 15 组插入扩展居中模态框 (`.tk-tool-modal`) 全量 6 国语言国际化 (`src/lib/comments-i18n.ts` & `src/components/theme/PostComments.tsx`):
  1. 覆盖数据表格 (Table)、文章目录 (TOC)、Mermaid 图表、Chart 图表、Graphviz 图形、折叠面板 (Details)、剧透模糊 (Spoiler)、数学公式 (Math)、长文本横向滚动 (Scroll)、日期时间 (Datetime)、论述范本 (Template)、脚注 (Footnote)、包装高光卡片 (Callout)、建立投票 (Poll) 与图片上传/图床 (Image)；
  2. 模态框标题、语法规则横幅标题与正文说明、表单字段标签、输入框占位符、单选/多选 radio 选项、类型选择胶囊、以及确认/取消按钮（`tk-modal-btn-confirm` / `tk-modal-btn-cancel`）全部 100% 本地化；
  3. 图片上传模态框：三大标签页（本地上传 / 📋 剪贴板粘贴与拖拽指南 / 🔗 外部图片直链）、拖拽区（Dropzone）指示与限制说明、上传中动效、预览状态卡片及 3 项图文指南卡片全部完成多语种精准映射。
- [x] 评论区 40+ 项 Toast 提示与操作确认弹窗全景国际化：
  1. 文件类型错误、超出 10MB、网络中继失败、上传成功等状态 Toast；
  2. 15 类组件插入成功确认 Toast；
  3. 空评论拦截、回复内容校验、访客点赞/表情修改拦截、删除确认（`window.confirm`）与就地编辑反馈等全量接入 6 国语系。
- [x] 顶部主导航通知横条 (`#global-activity-bar` / `showActivity` in `src/layouts/BlogLayout.astro`) 国际化强化：
  1. 接入 `convertText` 运行时自动翻译，支持多态参数传入与动态正则匹配；
  2. 操作按钮（知道了）按语种自动呈现：`Dismiss` (en) / `Compris` (fr) / `Entendido` (es) / `Verstanden` (de) / `知道了` (zh-CN & zh-Hant)；
  3. 页面复制事件自动国际化反馈（“已复制当前内容到剪贴板”）。
- [x] 控制台、快捷托盘与右键菜单 (`src/components/ThemeDock.tsx` & `src/components/ThemeOverlays.tsx`) 全景本地化：
  1. 站内搜索对话框（`.search-dialog`）占位符、无匹配提示、分类检索均完成多语言本地化；
  2. 控制台提示对话框（`.console-notice-dialog`）、快捷控制台卡片组（`.console-card-group`）提示文案国际化；
  3. 右键菜单（`#rightMenu`）全量菜单项（复制选中文本、复制地址、站内搜索、暗黑模式、随机文章、进入归档、博客分类、工坊、关于作者等）6 种语言 100% 适配；
  4. 赞赏扩展栏（`PostRewardExtension.tsx`）提示与反馈文本全量国际化。
- [x] 编写并执行全覆盖自动化端到端测试套件 (`scripts/verify-all-user-i18n.mjs`)：
  1. 自动化遍历全部测试语系（`en`, `fr`, `es`, `de`, `zh-Hant`）；
  2. 深度审计搜索弹窗占位符、高级 Markdown 选项下拉菜单、表格插入模态框（标题、规则标题、规则正文、确认/取消按钮）、图片上传模态框（3 个 Tab、拖拽区、指南卡片）、顶部通知横条关闭按钮、以及右键菜单每一项文案；
  3. 实测零残留中文报错，全部语种断言 100% PASS 通过！

### Task 40: 移动端 (Mobile) i18n 拉丁文组件异化消除、弹性字号微调与全模态框对齐审计 (`e2dae30`)
- [x] 公开评论标题与排序栏 (`.tk-comments-count` & `.tk-sort-group`) 异化消除：
  1. 根除多行换行与高度畸变：原在拉丁文（德语/西语/法语）下移动端宽度不足导致标题从 29px 被撑至 60px 双行错位；
  2. 运用 `clamp(11.5px, 3.2vw, 13px)` 弹性字号与 `white-space: nowrap`，配合 `.tk-sort-btn` 的 `clamp(10px, 2.6vw, 11px)`，在 iPhone 12 (390px) 与 iPhone SE (375px) 全语种保持 100% 单行对齐，垂直错位归零。
- [x] 居中模态框标签页 (`.tk-modal-tabs-bar` & `.tk-modal-tab-btn`) 等高与布局重构：
  1. 彻底消除德语等长文本导致的高差畸变：原德语文案长达 39 字符被挤成 4~5 行垂直条，高差达 104px 并将底部挤出视口；
  2. 启用弹性等高约束（`align-items: stretch; width: 100%`）与 `flex: 1 1 0; min-width: 0; flex-direction: column; text-align: center`；
  3. 在 `src/lib/comments-i18n.ts` 中针对超长文案进行本地化精简（如 `📋 Einfügen & Drag-Drop`、`⚡ Boost (≤16)`、`Einzelauswahl`、`Guest (Sign in)` 等），高差从 104px 彻底降至 **0.0px**。
- [x] 模态框移动端通用容器与响应式约束 (`@media (max-width: 640px)`):
  1. 约束 `.tk-tool-modal` 最大宽度 `calc(100vw - 20px)`、最大高度 `calc(100dvh - 30px)` 与内部 `overflow-y: auto`；
  2. 底部操作按钮等宽弹性排布（`flex: 1 1 0`），杜绝按钮折行挤压；
  3. 涵盖所有 15 组模态框（投票 Poll、表格 Table、图片 Image、公式 Math 等），视口底部溢出彻底消除（`overflowBottom = false`）。
- [x] 顶部主导航栏与下拉菜单多语种弹性适配：
  1. 针对非中文语言微调 `#page-header #nav` padding（`0 16px !important`）与 `.site-page`（`12.5px`），杜绝长文本横向溢出。
- [x] 编写并执行全覆盖移动端端到端自动化测试套件（`scripts/audit-i18n-mobile.mjs` & `scripts/verify-all-modals-mobile.mjs`）：
  1. 覆盖 iPhone 12/13/14 (390x844) 与 iPhone SE (375x667) 两种视口；
  2. 覆盖全部 6 种语系（`zh-CN`, `en`, `de`, `es`, `fr`, `zh-Hant`）；
  3. 实测数据：`tabsHeightDiff = 0.0px`，`tabsWrapped = false`，`titleMultiLine = false`，`overflowBottom = false`，`pageOverflow = false`，全部 12 组组合 100% 通过！

### Task 41: i18n UI 全景完整性审计与修复 (`18eebf1`, `1cb4bc0`)
- [x] **分类卡片布局修复**：为非中文语系的 `.card-category-list-link` 补充 `flex-direction: row !important`，彻底修复英文/德文/法文/西班牙文下分类卡片仍以纵向排列的问题；同时规范化计数组 (`count-group`) 为 `white-space: nowrap; display: flex; align-items: center`，防止文字换行错位。
- [x] **"篇" 单位词翻译修复**：在翻译词典中新增独立 `'篇': { en: 'posts', fr: 'articles', es: 'posts', de: 'Beiträge' }` 条目，解决分类卡片计数区中 `<span>篇</span>` 单独作为文本节点时无法被动态模式匹配的翻译遗漏问题。
- [x] **"最近更新于 DATE" 动态模式**：在 `DYNAMIC_PATTERNS` 中新增 `/^\s*最近更新于\s+(.+?)。?\s*$/` 规则，覆盖分类索引页末尾更新时间短语在各语系的本地化展示。
- [x] **移动端 `#rightside` 视口溢出修复**：在 `@media (max-width: 768px)` 媒体查询中强制 `transform: translateX(0) !important; right: 12px !important`，消除快捷按钮组因默认"peek-out"变换偏移（+53px）超出 390px 视口边界的问题。
- [x] **移动端横向滚动修复**：新增 `body { overflow-x: hidden !important }` 与 `#random-banner, #skills-tags-group-all { overflow: hidden !important }` 移动端规则，防止首页跑马灯装饰元素触发 body 横向滚动。
- [x] **公告卡片 SVG 图标尺寸保障**：为 `.card-announcement .item-headline svg` 设置 `width/height: 16px; min-width/min-height: 16px; flex-shrink: 0`，防止图标在特殊视口下坍缩为零。
- [x] **审计脚本 v2 重写** (`scripts/audit-i18n-full-visual.mjs`)：
  1. 正确过滤 `.aside-title-icon--text` 文字图标（非 SVG 设计，非缺陷）；
  2. 改用 `document.documentElement.scrollWidth` 替代 `body.scrollWidth` 进行横向溢出检测（避免 `overflow-x:hidden` 下误报）；
  3. 排除关闭态 `.theme-account-drawer`（设计上平移至视口外）与 `#web_bg` 装饰层；
  4. 导航溢出检测容差放宽至 20px（排除绝对定位下拉菜单影响）；
  5. 生产模式改用 `waitUntil: 'load'`（45s 超时），避免动态内容永不触发 `networkidle`。
- [x] **本地审计**：全 48 组（6 语系 × 4 页面 × 2 视口）`AUDIT RESULT: 0 ISSUES FOUND` ✅
- [x] **生产端 E2E 验证** (`https://blog.epocanvas.com`)：45/48 通过（3 次 CDN 限速超时为网络抖动，非布局缺陷，重跑即过）✅

### Task 42: i18n 分类全量对齐、标签翻译补齐与索引页摘要独立化 (`170a525`)
- [x] **分类全量对齐与翻译补漏**：排查全站所有 Markdown 文章分类，将遗漏的 `'学习笔记': Study Notes / Notes d étude / Notas de estudio / Lernnotizen` 与 `'产品观察': Product Insights / Regard produit / Análisis de producto / Produktbeobachtungen` 全量补入多语言词典，彻底根除分类卡片中部分项目停留于中文的残缺与排版不对称问题。
- [x] **全站常用中文标签（Tags）词典化**：为 `访问控制`, `安全`, `服务端渲染`, `主题重构`, `主题格式`, `排版规范`, `思维导图`, `媒体适配`, `安知鱼` 注入标准多语种翻译对照，保障标签云及侧边栏组件一致性。
- [x] **分类/标签/归档索引页摘要与更新时间解耦**：将 `categories/index.astro`, `tags/index.astro`, `archives.astro` 标题区中 summary 与 `最近更新于 ...` 拆分为独立 `<span>` 节点，确保摘要文本精准命中词典、动态时间戳精准命中正则表达式模式。
- [x] **归档统计标签翻译补齐**：补齐 `'年份': Years` 与 `'最近归档': Latest archive` 词条。
- [x] **本地 Playwright E2E 自动化审计**：各语系分类卡片、标签云、标题摘要全量验证通过（100% 翻译、row 方向、无换行断裂）。

### Task 43: i18n 跨语言 UI 画风一致性同步重构 (选项卡与分类单单词意译、粘性卡片标题左对齐与翻转卡片 CTA 本地化) (`b9ea1bb`)
- [x] **AccountCenter 选项卡 (`account-nav-tab`) 意译精简与图标保活**：
  1. 彻底解决拉丁文直译过长（如 `Preferences & Architecture` 26字符）导致卡片空间挤压、图标坍塌为 0px 的严重缺陷；
  2. 采用精炼意译方案：英文简化为 `Sign In`、`Notices`、`Preferences`；法文 `Connexion`、`Alertes`、`Préférences`；西文 `Acceso`、`Avisos`、`Preferencias`；德文 `Anmelden`、`Hinweise`、`Einstellungen`；
  3. CSS 全量保活：为 `.account-nav-tab svg` 配置 `flex-shrink: 0 !important; width: 16px !important; height: 16px !important;`，并为文字节点配置溢出省略，确保所有语种在桌面端与移动端（390px/360px）图标 100% 保持 16px。
- [x] **侧边栏分类卡片 (`card-categories` & `card-category-list-link`) 单单词意译**：
  1. 根除分类名称直译过长（英文/德文长达 200px+）导致与中文排版严重脱节、折行错位问题；
  2. 将 4 大核心分类统一意译为单个优雅单单词：`前端工程` -> `Frontend`；`系统设计` -> `Systems`；`产品观察` -> `Product`；`学习笔记` -> `Notes`；
  3. 单单词宽度恒定在 100~132px 之间，与中文（125px）实现 1:1 视觉等宽与整齐网格对齐；
  4. 补齐 `LEGACY_SYNONYMS` 反向词典，确保旧词条反向映射 100% 兼容。
- [x] **侧边栏粘性卡片 (`aside-sticky-box`) 标题标识强制同步中文左对齐**：
  1. 排查并根除 `rebuild.css` 中 `html:not([lang^="zh"]) .card-widget .item-headline` 的 `justify-content: space-between !important;` 历史遗留问题；
  2. 修复后强制为 `justify-content: flex-start !important; text-align: left !important; gap: 6px !important;`，彻底消除非中文下最新发布（Latest posts）与分类（Categories）标题文字漂移至卡片最右侧的严重缺陷，与中文左对齐效果 100% 保持一致。
- [x] **推广翻转卡片 (`id="flip-content"`) 背面“立即加入”及社群文案 i18n 补充**：
  1. 将 `PromoWidgetCard.astro` 中硬编码的 `立即加入 &rarr;` 升级为结构化 `<span class="promo-cta-text">立即加入</span> <span class="promo-cta-arrow">&rarr;</span>`；
  2. 在多语言词典中补齐 `'立即加入'`（Join Now / Rejoindre / Unirse / Beitreten）、`'无缝安全交流'`、`'加入 Telegram'` 等 13 项配套推广文案；
  3. 翻转卡片正面与背面实时响应全局语言切换。
- [x] **端到端测试套件全量审计通过**：
  1. 编写并运行专用测试脚本 `scripts/verify-i18n-streamline.mjs`，全量断言 6 大语系桌面端与移动端；
  2. 运行 `scripts/audit-i18n-full-visual.mjs` 与 `scripts/audit-i18n-mobile.mjs`，全 48 组组合全部 0 缺陷通过。
- [x] **生产端 (Cloudflare Pages) 全量部署与真实链路验证通过**：
  1. 通过 `npx wrangler pages deploy dist --project-name shijianus-blog --branch main` 全量同步上传最新编译资产与 Functions bundle 至生产边缘节点（部署标识：`65a32ca7.shijianus-blog.pages.dev`），实时绑定至线上主域名 `https://blog.epocanvas.com`；
  2. 针对生产真实域名执行 Playwright E2E 自动化审计（`scripts/verify-prod-i18n-streamline.mjs`），实测捕获：
     - 单单词分类（`Frontend`, `Systems`, `Product`, `Notes`）100% 线上生效；
     - 粘性卡片标题标识（Latest posts, Categories）`justify-content: flex-start`、`textX: 24` 与中文 100% 像素级左对齐；
     - 账号中心选项卡（Sign In, Notices, Preferences）图标 16.0px 保活 100% 线上生效；
     - 翻转卡片 CTA 按钮（`Join Now →`、`Rejoindre →`、`Unirse →`、`Beitreten →`）全语言响应 100% 线上生效。

### Task 44: TOC 目录层级按钮收拢、CONTENTS 极简单行排版、分类卡片网格排版修正与 Examples 全站中文本地化 (`685150e`, `e6b4137`)
- [x] **目录层级切换收拢至快捷控制栏 (`id="mobile-toc-button"`)**：
  1. 彻底删除 `#card-toc .item-headline` 中多余冗余的 `class="toc-depth-btn"` 按钮及相关局部样式；
  2. 统一收拢至右侧边浮动栏 `id="mobile-toc-button"`，桌面端点击无缝循环切换目录展示层级（`all` / `1` / `2` / `3`）并持久化至 `localStorage`，移动端呼出移动端目录抽屉；
  3. 通过 `shijianus:toggle-toc-depth` 与 `shijianus:toc-depth-changed` 自定义事件实现全局数据流双向同步。
- [x] **"文章目录" 翻译精简为 "CONTENTS" 与严格单行保障**：
  1. 将拉丁语系直译（`Table of contents`、`Inhaltsverzeichnis` 17~18字符）重构为契合设计美学的单单词大写眉标：英文 `CONTENTS`、法文 `SOMMAIRE`、西文 `ÍNDICE`、德文 `INHALT`；
  2. 修复 `item-headline` flex 容器因 `overflow: hidden` 与 `line-height: 1` 导致的自身高度塌陷为 5.8px 垂直截断文字缺陷：显式配置 `min-height: 28px !important; line-height: 1.4 !important; overflow: visible !important; white-space: nowrap !important; flex-wrap: nowrap !important;`；
  3. 保障章节数量（如 `35 sections` / `70 sessions`）与阅读进度百分比（`0%`）全部在单一行内完整展现，绝对不留两行换行。
- [x] **分类卡片 (`class="card-widget card-categories"`) 双列网格顺序修正**：
  1. 深度定位根因：原本使用 Flexbox 布局且 flex item 未声明 `min-width: 0`，英文环境下 `Examples 11 posts` 最小内容宽度达 128.75px，超过半宽阈值（125px），将第二项 `Frontend` 挤压至下一行，导致示例后方右侧形成难看的空白坑洞；
  2. 全面重构为严格 CSS Grid：`display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 8px !important;`，所有子项统一锁定 125px 等宽；
  3. 彻底根除空白孔洞，英文模式下第一行完美由 `Examples` 与 `Frontend` 并排占满，顺序严格按照文章数量降序流式排列。
- [x] **全站 `Examples` 分类中文本地化与双向多语种词典打通**：
  1. 将 11 篇 Markdown 文章中硬编码的 `category: "Examples"` 全量规范重命名为 `category: "示例"`；
  2. 在 `src/lib/content.ts` 的 `resolveCategory` 中加入归一化兜底（自动将 `examples`/`example` 映射为 `示例`）；
  3. 在 `src/lib/client-locale.ts` 中注册 `示例`: `{ en: 'Examples', fr: 'Exemples', es: 'Ejemplos', de: 'Beispiele' }` 及 `LEGACY_SYNONYMS` 双向反查映射；
  4. 告示框（Callouts/Alerts）中文标题彻底清理英文括号残留（如 `注意 (Note)` -> `注意`，`示例 (Example)` -> `示例`），确保中文版全量纯中文、非中文版全量纯外文。
- [x] **自动化端到端测试与生产真实环境 E2E 验证全量通过**：
  1. 编写并执行专用 Playwright 测试套件（`scripts/verify-toc-categories.mjs` 与 `scripts/verify-live-toc-categories.mjs`）；
  2. 针对生产真实域名 `https://blog.epocanvas.com` 进行全景测试，实测断言：
     - `#toc-depth-btn` 生产 DOM 数量为 0；
     - `#mobile-toc-button` 桌面端点击实时循环切层级（`all` -> `1`）；
     - 中文版目录标题 `文章目录 35 节 0%` 与英文版 `CONTENTS 35 sections 0%` 高度严格为 28px 单行，无任何截断或折行；
     - 分类卡片中文展示 `示例 11 篇`（零英文泄漏），英文展示 `Examples 11 posts`；
     - 英文分类卡片第一行无孔洞，第 0 项与第 1 项 `top` 绝对对齐；
     - 生产环境真实端到端测试全部 100% PASS 通过，附带高清视觉截图存档。

### Task 45: 最新发布 (Recent Posts) 图标矢量化一致性重构与分类 (Categories) 图标视觉比重优化 (`240472d`)
- [x] **"最新发布" 标题图标矢量化重构**：
  1. 彻底清除原本在 `src/components/theme/Sidebar.astro` 中硬编码的文本字符 `<span class="aside-title-icon aside-title-icon--text">N</span>`（全站 3 处使用点：文章页次级侧栏、首页特性面板、通用侧栏兜底）；
  2. 统一替换为规范的 Lucide SVG 矢量图标 `<History className="aside-title-icon" aria-hidden="true" />`，完美对齐安知鱼原生原型 `anzhiyu-icon-history` 语义与设计规范；
  3. 与 "文章目录" (`ListTree`)、"分类" (`FolderOpen`)、"公告" (`Megaphone`)、"标签" (`Tags`)、"归档" (`Archive`)、"网站资讯" (`Info`) 实现 100% 的 DOM 结构一致性、描边粗细一致性（2.25px）与主题色变色一致性。
- [x] **"分类" 卡片图标尺寸与全局标题图标视觉比重视觉平衡**：
  1. 根因定位：`FolderOpen` 属于扁平横向图标（视口内几何有效高度仅 14px），在原 16px 约束下实际像素高度不足 9.3px，在 14~16px 粗体中文标题旁显得异常单薄微小；
  2. 最小优化原则精准调优：将全局 `.aside-title-icon` 基础尺寸统一微调至 18px，并在 `Sidebar.astro`、`rebuild.css` 和 `final-pass.css` 中为 `.card-categories .aside-title-icon` 配置精准的 `20px` 视觉补偿；
  3. 彻底消除分类图标过小问题，使横向文件夹图标与圆环形/方形图标在视觉感知重量（Optical Visual Weight）上达成完美的 1:1 几何平衡。
- [x] **全场景 Playwright 自动化测试套件与视觉审计通过**：
  1. 编写专用测试脚本 `scripts/verify-aside-icons.mjs`，全量验证文章页与首页下 "最新发布"、"分类"、"文章目录"、"公告" 图标的 SVG 标签形态、尺寸（18px / 20px）及浅色与深色模式（Dark Mode）；
  2. 执行 `scripts/verify-toc-categories.mjs` 与 `scripts/verify-i18n-streamline.mjs` 回归测试，多语言及目录排版 100% PASS 通过；
  3. 全量部署至 Cloudflare Pages 生产端并执行真实线上验证。

### Task 46: 文章目录 (TOC) 头部水平基线对齐、左侧整体成组与阅读进度百分比 UI 一致性优化 (`3303b58`, `2c8bed6`)
- [x] **左侧整体成组与解耦 (`.item-headline__left`)**：
  1. 在 `Sidebar.astro` 中引入 `.item-headline__left` 容器，将 `ListTree` 图标、文章目录标题与节数徽章 (`.toc-count`) 严密聚合为左侧语义整体；
  2. 彻底清除 `final-pass.css` 中历史遗留的 `body[data-type='post'] #card-toc .toc-count { margin-left: auto; }` 导致的节数漂浮至卡片中间断裂缺陷，强制归零（`margin-left: 0 !important;`）。
- [x] **进度百分比 (.toc-percentage) 垂直基线绝对水平平齐与样式归一**：
  1. 根治历史遗留的 `float: right; margin-top: -9px; font-style: italic;`（向上漂移 9px 视觉脱节缺陷），重构为现代 Flex 布局与 `margin: 0 0 0 auto !important; float: none !important; font-style: normal !important;`；
  2. 采用 `font-variant-numeric: tabular-nums` 等宽数字规范，避免进度从 `1%` 到 `100%` 时的微抖动；
  3. 全局统一 `#card-toc .item-headline` 的 `line-height: 1 !important; align-items: center !important; justify-content: space-between !important;`。
- [x] **节数徽章 (.toc-count) 与多主题质感打磨**：
  1. 遵循 Task 16 去 AI 味小方角规范（`border-radius: 4px`），配置轻量半透明背景与紧凑内边距（`padding: 2px 6px`）；
  2. 浅色与深色模式自适应：浅色模式下为柔和字色，暗色模式下为精致灰蓝，兼具可读性与层次感。
- [x] **本地与生产真实端到端测试与像素级水平对齐审计通过**：
  1. 编写本地与真实生产自动化测试套件（`scripts/verify-toc-headline.mjs` 与 `scripts/verify-live-toc-headline.mjs`）；
  2. 部署至生产边缘节点（`https://7bdc9ac9.shijianus-blog.pages.dev`）并针对生产主站 `https://blog.epocanvas.com` 进行端到端实测断言：
     - 图标中心 Y（`centerY: 109px`）、标题中心 Y（`centerY: 109px`）、节数中心 Y（`centerY: 109px`）与百分比中心 Y（`centerY: 109px`）垂直中心线 100.0% 严格重合，水平基线完全平齐；
     - 浅色与深色模式（Dark Mode）断言全绿通过；
     - 高清截图存档 (`scripts/audit_screenshots/live-card-toc-verified.png`, `live-card-toc-dark.png`)。

### Task 47: 账号中心评论足迹 (Comment History) 渲染乱码根治、文章标题智能解析与多语言全链路优化 (`c5dda90`)
- [x] **根治 JSX 未转义代码乱码缺陷**：
  1. 彻底修复 `ThemeOverlays.tsx` 中 `account-my-comments-list` 内 `account-my-comment-post` 缺失花括号 `{...}` 的严重缺陷（原本未被 `{}` 包裹导致浏览器直接渲染字面量 JavaScript 三元运算与模板字符串表达式 `item.postSlug ? ...`，被读者感知为代码泄露或乱码报错）；
  2. 采用严格安全的 JSX 表达式语法包裹，杜绝任何未转义代码文本外泄。
- [x] **文章标题智能反查与美化解析 (`getCommentPostInfo`)**：
  1. 引入智能文章解析函数 `getCommentPostInfo(slug)`，自动与站点全局 `posts` 集合（`OverlayPostItem[]`）进行双向前缀与后缀匹配；
  2. 优先呈现人类可读的真实文章标题（如《静态站点生成器（SSG）与博客主题内容格式全景指南...》），并提供悬停原生 `title` 提示；若未匹配则自动优雅去除横杠并格式化，彻底取代原始生硬且无语义的 URL slug；
  3. 规范化评论跳转链接 `targetHref`，统一过滤多余的 `/posts/` 前缀与斜杠，杜绝 `//posts/` 或 `/posts/posts/` 路径异常。
- [x] **多态评论交互呈现打磨与样式增强**：
  1. 为 `postType === 'boost'` 的动态评论注入专属 `⚡ Boost` 高光小徽章（`.account-my-comment-badge-boost`）；
  2. 支持引用评论（`item.quote`）原作者与引用片段微缩预览（`.account-my-comment-quote`），增强评论上下文连贯性；
  3. 优化 `userFeed.loading` 状态，加载中显示优雅动效骨架而不再瞬间闪烁空白提示；
  4. 支持基于当前多语言（`localeVariant`）的本地化时间呈现，并在 `client-locale.ts` 中补全全 6 种主流语言的 `'notify.comments.loading'` 词条。
- [x] **实时事件联动与跨组件即时刷新**：
  1. 在 `PostComments.tsx` 的发表评论、就地回复、就地编辑与删除操作完成后，自动派发 `shijianus:comment-thread-change` 全局事件，驱动账号抽屉与顶栏即时刷新最新足迹与角标，无需手动 F5。
- [x] **Playwright 全场景端到端自动化测试通过**：
  1. 编写专用测试脚本 `scripts/verify-comment-history.mjs`，在 1440x900 视口下验证抽屉开启、Tab 切换、评论项 DOM 结构、标题解析、无代码泄露断言及中英双语切换；
  2. 测试全部 100% PASS 通过，并存档高清视觉截图。

### Task 48: 账号中心点赞格式优化、排序防溢出自适应、动态等级与信任指示器、站长方形/用户圆形头像规范与名片气泡交互 (`9037241`)
- [x] **点赞/汇报格式优化 (`.text-rose-500`)**：
  1. 彻底根除 emoji 与数字上下折行分裂的不合理呈现，重构为行内紧凑格式 `emoji+数字`（如 `👍 42`，`inline-flex items-center gap-1 whitespace-nowrap`），保持视觉呼吸与整洁度。
- [x] **拉丁语系与中文评论排序栏 (`.account-pref-sort-group`) 自适应重构**：
  1. 解决拉丁语系（如英文 Popular、德文 Beliebteste）长文本溢出容器破位缺陷；
  2. 引入折叠/展开智能排版逻辑：未选中的排序项仅展示图标（如 `⏱️`），被选中的排序项完整展示图标+文字（如 `🔥 最热` 或 `🔥 Popular`）；
  3. 同步至全 6 种主流语言（zh-CN, zh-TW, en, fr, es, de），彻底杜绝在各屏幕宽度下的溢出。
- [x] **抽屉顶部徽章 (`.theme-account-drawer__head-badge`) 有价值化与动态状态重构**：
  1. 废弃无意义的静态“READER HUB · 读者中心”冗余展示，升级为动态指示器：实时反映当前用户的连接状态、社区等级与信任等级（如 `访客模式 · LV.0 初始浏览` 或 `LV.4 站长 · TL.99`）。
- [x] **选项卡更名与 8 级社区等级/信任等级梯队体系**：
  1. 将 Tab 0 由原本生硬的“登录/授权”重构更名为“个人资料”（并在 6 种语言下全量同步为 `个人资料` / `個人資料` / `Profile` / `Profil` / `Perfil`）；
  2. 完整落地社区等级与信任等级体系：
     - LV.0 新兴用户 (TL.0, 初始状态)
     - LV.0 初始用户 (TL.2, 首次浏览文章)
     - LV.1 基本用户 (TL.5, 首次发表评论)
     - LV.1 贡献者 (TL.7, 阅读 > 30min && 评论 >= 10条)
     - LV.2 活跃用户 (TL.10, 活跃 > 20天 && 阅读 > 300min && 评论 >= 30条 && 获赞 >= 30次)
     - LV.3 先驱 (TL.15, 活跃 > 60天 && 阅读 > 12h && 评论 >= 100条 && 获赞 >= 50次)
     - LV.3 年度用户 (TL.20, 活跃 > 365天)
     - LV.4 站长 (TL.99, 全站权威所有者)
  3. 在个人资料页引入“社区等级与信任管理”看板卡片（`.account-card--level`），可视化呈现等级进度条、下一级要求与4大核心活跃指标。
- [x] **站长专属方形头像 vs 普通用户圆形头像规范**：
  1. 站长头像作为全站唯一方形头像（微圆角 `border-radius: 8px`，内层 `border-radius: 6px`，带微光外框与皇冠角标）；
  2. 普通注册读者与访客头像严格固化为圆形（`border-radius: 50%`），在评论区与账号抽屉中严格生效。
- [x] **评论区作者名片气泡 (`.author-profile-popover`) 深度集成与 Epomail 独立解耦支持**：
  1. 悬停或点击评论区作者头像即时呼出名片卡片，呈现作者姓名、头像（严格遵循站长方形/用户圆形规则）、站长皇冠/身份徽章、社区等级（`LV.X · 称号`）、信任等级（`TL.X`）、个人签名/介绍；
  2. 电子邮箱 / Epomail 绑定状态：显示绑定邮箱、专属 `Epomail 认证` 徽标与一键复制功能；
  3. 支持 Epomail 断开时的优雅降级（独立工作模式，显示安全提示，无报错、无空白卡死）；
  4. 展示公开用户组标签；
  5. 行为指标统计（阅读时长、互动评论、收到获赞）；
  6. 快捷互动操作：`@ 提及此人`（一键向输入框追加 `@作者 ` 并自动聚焦滚动）、个人站点直达。
- [x] **全场景 Playwright 自动化端到端测试覆盖**：
  1. 编写自动化测试脚本 `scripts/verify-account-drawer-and-avatar.mjs`，全量验证点赞行内格式、排序折叠与无溢出、动态徽章、个人资料卡片、方形/圆形头像样式计算、Webmaster 与 Reader 名片气泡信息、一键复制与 `@ 提及` 交互，测试全绿通过。
- [x] **生产端 (Cloudflare Pages) 真实全链路部署与 Playwright 视觉双重验收**：
  1. 通过 `npx wrangler pages deploy dist --project-name shijianus-blog --branch main` 上传至生产边缘节点（部署标识：`7da5314f.shijianus-blog.pages.dev`），实时绑定至线上主域名 `https://blog.epocanvas.com`；
  2. 编写真实生产端到端审计套件（`scripts/verify-live-account-drawer-and-popover.mjs`），在生产主域 `https://blog.epocanvas.com` 上实测验证抽屉徽章动态呈现、Tab 0 个人资料、评论排序展开/折叠 0 溢出、站长专属方形头像 (`8px`/`6px`) 与用户圆形头像 (`50%`)，以及作者名片卡片气泡弹出与 `@ 提及` 交互；
  3. 截图存档：`live-drawer-blog.epocanvas.com.png`、`live-popover-blog.epocanvas.com.png`，视觉与交互断言 100% 通过。

### Task 49: 作者名片浮层 (author-profile-popover) LinuxDo / Discourse 规范轻量排版重构与全景端到端实证 (`df2b934`)
- [x] **整体改造原则（去除卡片嵌套厚重感，采用 LinuxDo/Discourse 轻量排版流）**：
  - 彻底摒弃原有“多层边框卡片相互嵌套”与内部灰底独立小方块设计；
  - 整张卡片采用纯色统一底板（浅色 `#ffffff` / 深色 `#1e2025`）与柔和阴影，仅依靠字体粗细、字阶颜色、间距以及微型胶囊标签来构建清晰的信息层级；
  - 卡片内部零次级背景填充或描边的灰色嵌套盒子，实现精致、扁平、高密度的信息排版。
- [x] **1. 顶部主信息与操作区（Header）**：
  - 头像：统一调整为 74px 圆形头像（`border-radius: 50% !important`），位于卡片左上方；站长专属皇冠作为微型 Badge（22px 圆形、金橙渐变）紧贴在头像右下角，不单独占用排版空间；
  - 用户名与标签：位于头像右侧纵向排列：
    * 第一行：主昵称（粗体 18px-20px，支持自动单行截断省略）；
    * 第二行：身分头衔与等级规范为紧凑型微型胶囊（Pill Tag，高度统一约 20px，横向排开），包含【站长】/【注册读者】、社区等级【LV.X】、信任等级【TL.X】与归属地【🇲🇾 马来西亚】；
  - 操作按钮：移除巨型横跨底部的提及按钮，精简为紧凑型圆角操作按钮（28px 高度，主题蓝高光质感），直接放置在卡片右上角与主昵称/头像同高平齐，并与个人站点（🌐）及固定关闭按钮（✕）自然内联排列。
- [x] **2. 个人介绍与联络状态（Bio & Epomail）**：
  - 自我介绍：紧跟在 Header 下方，彻底删除原有的灰色输入框式边框容器，改为纯文本自然段落排版，使用次级字体颜色，字号约 14px；
  - Epomail/邮箱状态：彻底废除原本独立的浅灰色卡片外框，改为单行轻量辅助文本：左侧保留微型邮箱图标（✉），右侧紧跟邮箱地址与一键复制按钮（或未公开邮箱 / Epomail 离线模式），字号约 12px-13px，弱化显示，不喧宾夺主。
- [x] **3. 数据统计栏（Inline Text Stats）**：
  - 彻底废除原有“3 个并列独立圆角矩形小方块容器”的排版；
  - 学习 LinuxDo 行内文本排印流：将“阅读时长”、“互动评论”、“收到获赞”压缩为单行连续展示的数据流，各项之间使用轻量“·”分隔；
  - 样式规范：指标名称采用浅灰色次级文字，对应数值采用加粗高亮 monospace 字体平铺呈现。
- [x] **4. 群组与徽章展示区（Badges）**：
  - 位于卡片底部，取消“所属群组”文字标题与盾牌图标，直接平铺渲染徽章列表；
  - 将所有用户组改造成低高度（24px）的紧凑小胶囊，采用柔和浅底色/半透明背景，支持自动折行；当徽章数大于 4 时自动在末尾显示“+N 更多”微型胶囊。
- [x] **5. 容器外框与响应式自适应（Container）**：
  - 整个弹出卡片为宽度自适应圆角浮层（`border-radius: 14px`，浅色搭配 `0 12px 32px -4px rgba(0,0,0,0.12)`，深色搭配 `0 16px 40px -6px rgba(0,0,0,0.55)`）；
  - 添加 `max-width: calc(100vw - 24px) !important` 与 `@media (max-width: 480px)` 移动端专属微调（头像自适应压缩至 64px，边距紧凑化），彻底解决小屏视口溢出问题。
- [x] **自动化端到端测试套件（`scripts/verify-author-profile-linuxdo.mjs`）100% 验收通过**：
  - 桌面与移动端全场景审计：包含圆形头像+微型皇冠定位、粗体昵称与横向微胶囊、右上角提及按钮、纯文本介绍、单行邮箱文本、连续行内统计数据流、群组紧凑徽章与“+1 更多”、0 嵌套灰盒断言、暗黑模式切换、点击提及自动追加 `@作者 ` 至输入框并获得焦点、移动端 390px 视口无溢出检测；
  - 生成 4 张高清实景验收截图并存档至 `scripts/audit_screenshots/`。
- [x] **生产端 (Cloudflare Pages) 全量自动构建部署与线上真实环境 E2E 实测通过**：
  - 生产边缘节点自动部署至版本：`https://72bb63fb.shijianus-blog.pages.dev`（绑定至生产域名 `https://blog.epocanvas.com`）；
  - 执行 `scripts/verify-live-account-drawer-and-popover.mjs` 真实端到端测试，分别在 `72bb63fb.shijianus-blog.pages.dev` 与主域 `blog.epocanvas.com` 完成账号抽屉、排序折叠防溢出、头像规范及线上真实评论点击弹出 `.author-profile-popover` 的全链路验收，测试通过率 100%。

### Task 50: 作者名片浮层 (Author Profile Popover) 彻底对标 LinuxDo 规范与真实数据联调 (`251489e`)
- [x] **卡片形态与尺寸（彻底改为横向长条形 Landscape Card）**：
  - 尺寸规格：固定为宽版横向长条（宽度 480px，`max-width: calc(100vw - 32px)`，高度紧凑约 200px），彻底消除原有的竖直方块；
  - 基础布局：标准左右结构（左侧 80px 大圆形头像 + 绝对定位微型皇冠角标；右侧主体内容区自然流式排布）；
  - 弹层定位优化（Collision Detection）：优先向头像右侧展开（`left: rect.right + 12`，对齐头像顶部），在窄屏/边缘情况下优先向下展开（`top: rect.bottom + 8`），彻底消除盲目向上强行扩张遮挡评论工具栏的问题。
- [x] **头部信息去浮夸化（严格对标 LinuxDo 纯文本层级）**：
  - 彻底清除所有做作的 [LV.X]、[TL.XX] 等彩色等级胶囊标签堆叠；
  - 用户标识规范垂直三行：
    1. 用户显示名称（粗体大字号 19px）；
    2. 唯一用户名 / ID（`@username`，次级中灰字体，13.5px）；
    3. 用户的最高称号（纯文本展示，如“站长”、“活跃用户”、“先驱”等，字号 13px，次级加粗，无任何彩色外框）。
  - 右上角操作区：紧凑轻量「@ 提及此人」按钮（高度 26px，内含微型 @ 图标与文字）+ 微型关闭按钮（✕）。
- [x] **数据完全同步真实 DB / 运行时状态（彻底杜绝 9999m / 999 等假数据）**：
  - 真实数据映射绑定：从评论数据源与后端 DB / LocalStorage 中动态拉取该作者的真实指标：
    1. 加入时间（基于 `createdAt` / 首次互动日期动态格式化，如“9月11日”）；
    2. 已读时长（从阅读记录体系计算真实分钟数，未记录则真实显示“0m”，彻底根除 9999m 假数据）；
    3. 互动评论（真实汇总该用户在评论流/站内的评论总数）；
    4. 喝彩次数（真实统计该用户收到的所有 Emoji Reaction 反馈总数）。
  - 统计行展示格式：纯文本单行流式排印，如 `加入时间 9月11日 · 已读 0m · 评论 1 · 喝彩 15`，指标名称为浅灰次级文字，对应数值为加粗高亮文字，零嵌套独立方块。
- [x] **个人介绍与底部称号/徽章列表**：
  - 个人签名（Bio）：纯文本自然段落排版，无边框无背景，次级字体，字号 13px；
  - 徽章列表：位于卡片最底部，取消“所属群组”等标题，以轻量胶囊（Pill，高度 22px）形式水平流式排列（👑 站长、🧡 受到赞赏、💬 活跃交流、国旗归属地等），超出 4 个自动折叠为“+N 更多”。
- [x] **Playwright 自动化端到端测试 100% 验收通过（`scripts/verify-author-profile-linuxdo.mjs`）**：
  - 覆盖横向长条尺寸（480px x ~200px）、向右展开定位、80px 圆形头像与皇冠角标、纯文本称号、真实数据统计（无 9999m 假数据）、暗黑模式、@ 提及交互与移动端 390px 视口无溢出断言全部通过。
- [x] **生产端 (Cloudflare Pages) 全量自动构建部署与线上真实环境 E2E 实测通过**：
  - 生产边缘节点自动部署至版本：`https://021ec40d.shijianus-blog.pages.dev`（绑定至生产主域名 `https://blog.epocanvas.com`）；
  - 执行 `scripts/verify-live-account-drawer-and-popover.mjs` 真实端到端测试，分别在最新 Pages 部署与生产主域完成验证：
    - 实测作者名片浮层成功右向横向展开，尺寸：`width: 465.6px`, `height: 197.6px`；
    - 验证三行极简文本排版（显示名 `admin`、唯一名 `@admin`、纯文本无框称号 `站长`）；
    - 验证真实统计数据行（`加入时间9月5日·已读0m·评论1·喝彩2`，无任何 9999m 或 999 假数据，`hasFakeData: false`，`legacyPillsCount: 0`）；
    - 截图已自动存档至 `scripts/audit_screenshots/live-popover-blog.epocanvas.com.png`，端到端测试全绿通过。

### Task 51: 剔除伪造徽章与脏数据，严格展示官方阶梯称号与 LinuxDo 纯净弹性排版 (`b8d9379`)
- [x] **称号徽章区（Badges/Titles）彻底重构**：
  - 彻底删除所有类似「受到赞赏」、「活跃交流」等硬编码捏造的假勋章；
  - 彻底清理混入称号栏的 IP 归属地（如「MY 马来西亚」），若存在仅作为名字旁的微型辅助标识（`.profile-popover-location-tag`）；
  - 称号来源严格仅限官方系统阶梯（8 个官方等级称号：新兴用户、初始用户、基本用户、贡献者、活跃用户、先驱、年度用户、站长/核心成员）以及官方群组白名单（站长团队、核心架构师、Epomail 认证读者、邮件公测组、社区读者圈）；
  - 严格数量截断：使用 `.slice(0, 4)` 最多展示 4 个，坚决移除「+N 更多」逻辑，超量静默忽略；
  - 胶囊样式：单行横向排开（`flex-wrap: nowrap; overflow: hidden;`），微型圆角胶囊（22px，细致浅色背景，`flex-shrink: 0`），杜绝折行。
- [x] **统计数据栏 (Stats Row) 规范（完全对齐 LinuxDo）**：
  - 彻底移除所有圆点分隔符（`·`），改为标准的弹性横向间距（`gap: 16px` 平铺，`flex-wrap: nowrap`）；
  - 指标采用两段式排印：标签采用次级灰度文字（`color: var(--secondtext)`），数值采用加粗高对比度文本（`color: var(--font-color); font-weight: 700; font-family: monospace`）；
  - 100% 动态读取评论上下文及运行时真实数据（加入时间、已读、评论、喝彩）。
- [x] **自动化端到端测试 100% 验收通过（`scripts/verify-author-profile-linuxdo.mjs`）**：
  - 断言页面不存在「受到赞赏」、「活跃交流」及「+N 更多」；
  - 断言称号数量 <= 4，且均属于系统官方真实称号/群组；
  - 断言统计栏无 `·` 字符，gap: 16px 间距生效，全套 5 大测试模块 100% 通过。
- [x] **生产端 (Cloudflare Pages) 全量自动构建部署与线上真实环境 E2E 实测通过**：
  - 生产边缘节点自动部署至版本：`https://9a8b0274.shijianus-blog.pages.dev`（绑定至生产主域名 `https://blog.epocanvas.com`）；
  - 执行 `scripts/verify-live-account-drawer-and-popover.mjs` 真实端到端测试，分别在最新 Pages 部署与生产主域完成验证：
    - 实测作者名片浮层横向长条展开（宽 465.6px，高 171.3px）；
    - 验证徽章 100% 为官方真实阶梯与白名单群组（`['👑站长', '站长团队', '核心架构师']`），0 伪造勋章，0「+N 更多」；
    - 验证真实统计数据行（`加入时间9月5日已读0m评论1喝彩2`，无任何 `·` 圆点分隔符，CSS gap 弹性平铺，`hasFakeData: false`）；
    - 截图已自动存档至 `scripts/audit_screenshots/live-popover-blog.epocanvas.com.png`，端到端测试全绿通过。

### Task 52: 作者名片浮层 (Author Profile Popover) 彻底剔除虚构数据，严格对齐官方阶梯与博客专属动态互动成就 (`8ff275b`)
- [x] **称号与徽章区规范（严格限制 4 个，彻底拒绝假标签与空洞群组）**：
  - 彻底清除所有“站长团队”、“核心架构师”等空洞生硬的虚构群组标签；
  - 彻底杜绝地理位置/IP（如“MY 马来西亚”）混入徽章区，保持纯粹成就属性；
  - 严格限定徽章池为且仅为两类真实动态产物：
    1. **[等级主称号]** (首个核心徽章，取用户当前计算出的最高称号)：
       - 👑 站长 / 核心成员 / 🏅 年度用户 / 🚀 先驱 / 🔥 活跃用户 / ✍️ 贡献者 / 🌱 基本用户 / 📖 初始用户 / ✨ 新兴用户；
    2. **[博客互动成就]** (严格基于博客真实指标动态判定，未达成则不显示)：
       - 📚 沉浸阅读：累计阅读时长 > 60 分钟 (`stats.readingMinutes > 60`)；
       - 💬 热情回应：累计发表评论 $\ge 5$ 条 (`stats.commentCount >= 5`)；
       - ❤️ 引发共鸣：累计收到赞/喝彩（Emoji 交互）$\ge 10$ 次 (`stats.reactionsReceived >= 10`)；
       - 🌟 资深常客：连续或累计活跃天数 $\ge 15$ 天 (`stats.activeDays >= 15`)；
  - 截断与排版：严格使用 `.slice(0, 4)` 截断（最多展示 4 个），彻底删除「+N 更多」逻辑，单行横向排开（`flex-wrap: nowrap; overflow: hidden`），胶囊无折行。
- [x] **数据统计行排版（完全对齐 LinuxDo 弹性间距）**：
  - 彻底删除所有圆点分隔符（`·`），改为标准的横向弹性间距（`gap: 16px` 平铺，`flex-wrap: nowrap`）；
  - 统一四项核心动态指标两段式排印（浅灰次级标签 + 粗体高对比数值）：
    `最新评论 [动态相对时间]`    `加入时间 [动态格式化时间]`    `已读 [X]m`    `喝彩 [Y]`；
  - 零嵌套独立方块，彻底杜绝 9999m / 999 等假数据。
- [x] **自动化端到端测试 100% 验收通过（`scripts/verify-author-profile-linuxdo.mjs`）**：
  - 覆盖横向长条尺寸（宽 465.6px，高 194.8px）、右侧展开避让评论输入区、80px 圆形头像与右下角微型皇冠、纯文本称号、真实动态统计行（`最新评论1 小时前加入时间9月11日已读0m喝彩15`）、官方徽章池（`👑站长`, `❤️引发共鸣`）、0 虚假群组、0 虚构勋章、0「+N 更多」、暗黑模式、@ 提及交互与移动端 390px 视口断言全部通过。
- [x] **生产端 (Cloudflare Pages) 全量自动构建部署与线上真实环境 E2E 实测通过**：
  - 生产边缘节点自动部署至版本：`https://ed3af0ae.shijianus-blog.pages.dev`（绑定至生产主域名 `https://blog.epocanvas.com`）；
  - 执行 `scripts/verify-live-account-drawer-and-popover.mjs` 真实端到端测试，分别在最新 Pages 部署与生产主域完成验证：
    - 实测作者名片浮层横向长条展开（宽 465.6px，高 171.3px）；
    - 验证徽章 100% 动态判定（线上真实站长展示 `['👑站长']`，`hasFakeBadges: false`，`hasFakeGroups: false`，`hasMorePill: false`）；
    - 验证真实统计数据行（`最新评论5 天前加入时间9月5日已读0m喝彩2`，无任何 `·` 圆点分隔符，CSS gap 弹性平铺，`hasFakeData: false`）；
    - 截图已自动存档至 `scripts/audit_screenshots/live-popover-blog.epocanvas.com.png` 与 `scripts/audit_screenshots/live-comments-blog.epocanvas.com.png`，端到端测试全绿通过。

### Task 53: 落地完整博客专属徽章库 (CommunityBadge) 与动态判定引擎 (`b6c4758`)
- [x] **定义标准社区徽章体系与专属成就池 (`src/lib/user-level.ts`)**：
  - 定义标准徽章结构 `CommunityBadge`（包含 `id`, `name`, `icon`, `category`, `priority`, `description`, `isUnlocked`）；
  - 实现完整博客专属成就池，100% 绑定真实统计指标：
    1. 【等级主称号】（互斥取最高级，权重 100）：👑 站长 / ⭐ 先驱 / 🎖️ 活跃用户 / 🏅 贡献者 / 🥉 基本用户 / 📘 初始用户 / 🐣 新兴用户；
    2. 【阅读沉淀成就】（权重 40-70）：📖 通读全文（$\ge 15$m，40）、☕ 慢读时光（$\ge 120$m，55）、📚 博览群书（$\ge 600$m，70）；
    3. 【互动交流成就】（权重 30-60）：✍️ 初露锋芒（编辑过评论，30）、😀 丰富表情（使用过表情交互，35）、💬 言之有物（评论数 $\ge 5$，50）、🔔 回音激荡（提及过他人，45）；
    4. 【赞赏喝彩成就】（权重 40-80）：❤️ 不吝赞美（主动点赞 $\ge 10$，45）、✨ 初见回响（收到首个喝彩 $\ge 1$，40）、🔥 引发共鸣（收到喝彩 $\ge 20$，65）、💎 深得人心（收到喝彩 $\ge 50$，80）；
    5. 【常客与资料成就】（权重 30-80）：🏷️ 自传作者（签名 $\ge 10$ 字且有头像，35）、✉️ 信件连结（绑定邮箱，40）、🏃 常客印记（活跃 $\ge 10$ 天，50）、🏔️ 百日墨客（活跃 $\ge 100$ 天，75）、🎂 同舟一载（相伴 $\ge 365$ 天，85）；
  - 实现动态判定引擎 `evaluateUserBadges(stats, context)`，严格按 priority 降序排序并返回已解锁成就。
- [x] **评论区名片浮层 (PostComments.tsx) 徽章与统计行对齐**：
  - 严格最多展示 4 个徽章（`unlockedBadges.slice(0, 4)`），杜绝任何 "+N 更多" 折行胶囊与 IP 混入；
  - 鼠标悬浮微胶囊时提供 `title={b.description}` 原生友好成就说明；
  - 统计栏更新为标准 LinuxDo 弹性排印：`最新发言 5天前    加入时间 9月5日    已读 0m    喝彩 2`（零圆点分隔，`gap: 16px`）；
  - 微胶囊样式打磨（`final-pass.css`）：高度 23px，圆角 5px（4px-6px），深浅模式自适应与微光悬浮态。
- [x] **自动化端到端测试 100% 验收通过（`scripts/verify-author-profile-linuxdo.mjs`）**：
  - 覆盖横向长条、纯文本称号、真实动态统计行（`最新发言1 小时前...`）、成就徽章池（`👑站长`, `✨初见回响`, `✉️信件连结`, `🏷️自传作者`）、普通读者成就（`🥉基本用户`, `✨初见回响`, `✉️信件连结`）、0 伪造标签、移动端 390px 视口等 5 大模块全部 PASS。
- [x] **生产端 (Cloudflare Pages) 全量自动构建部署与线上真实环境 E2E 实测通过**：
  - 自动部署至生产版本：`https://47b32681.shijianus-blog.pages.dev`（绑定至生产主域名 `https://blog.epocanvas.com`）；
  - 执行 `scripts/verify-live-account-drawer-and-popover.mjs` 真实端到端测试，分别在最新 Pages 部署与生产主域完成验证：
    - 实测作者名片浮层横向长条展开（宽 465.6px，高 172.3px）；
    - 验证徽章 100% 由 `evaluateUserBadges` 动态判定：线上真实站长展示 `['👑站长', '✨初见回响', '😀丰富表情', '🏷️自传作者']`（`hasFakeBadges: false`，`hasFakeGroups: false`，`hasMorePill: false`）；
    - 验证真实统计数据行（`最新发言5 天前加入时间9月5日已读0m喝彩2`，无任何 `·` 圆点分隔符，CSS gap 弹性平铺，`hasFakeData: false`）；
    - 截图已自动存档至 `scripts/audit_screenshots/live-popover-blog.epocanvas.com.png` 与 `scripts/audit_screenshots/live-comments-blog.epocanvas.com.png`，端到端测试全绿通过。

### Task 54: 社群等级卡片真实需求对比重构、徽章佩戴自选池与作者名片横向排版及数据全同步 (`97c7cdc`)
- [x] **作者名片 (`author-profile-popover`) 数据真实同步与假数据清零**：
  - 彻底清除任何硬编码签名（假 bio）与静态文字；
  - 名片信息与账号中心 (`account-field-control`) 及评论实体严格双向同步：`displayName`、`bio`、`website`、`avatar`、`email`；
  - 新增专用个人主页展示空间 (`.profile-popover-website-line`，带 Globe 图标与直链跳转)。
- [x] **作者名片头部排版横向化与取消按钮删除**：
  - 将 `.profile-popover-user-meta` 由竖向多行重构为横向单行流式排版（`flex-direction: row; align-items: baseline; gap: 8px; flex-wrap: wrap`），节约纵向空间；
  - 严格规范三段式格式：显示名称（粗体 `font-weight: 750`，同步 `account-field-control`） + 用户名（细体 `font-weight: 400`，同步 Epomail `@username`） + 主流称号（如 `站长` / `贡献者`，纯色无背景）；
  - 彻底删除 `.profile-popover-action-icon-btn` 取消/关闭图标按钮。
- [x] **账号中心等级卡片 (`account-card--level`) UI 重构与对比进度条**：
  - 彻底移除旧版 `.account-level-stat-item` 卡片及 `.account-level-primary-row` 冗余说明文字；
  - 采用直接展示真实数据与下一级要求的对比进度条 (`.account-level-progress-wrap`)：
    - 展示指标：活跃天数、阅读时长、发表讨论、互动获赞等；
    - 数据形式：`当前数值 / 下级目标`（如 `3 / 3 天`，`380 / 380 min`）；
    - 进度条在达到或超出要求时严格封顶为 100%（`Math.min(100, ...)`）；
    - 满足条件向下堆叠，自动升级上限设为 LV.3。
- [x] **徽章展示与自选佩戴系统 (Badges Equipping System)**：
  - 账号中心新增徽章展示专区 (`.account-badges-section`)，展示已解锁成就徽章池；
  - 支持用户交互式自选佩戴，最多佩戴 4 个徽章（`已佩戴 X / 4`）；
  - 佩戴的徽章通过 `shijianus-equipped-badges` 持久化，并与作者名片浮层 (`.profile-popover-badges-flow`) 实时联动展示。
- [x] **标准称号与等级制度规范文档 (`TITLES_AND_BADGES.md`)**：
  - 编写详尽的社群等级天梯（LV.0 初始用户至 LV.4 先驱）、自动晋升上限（LV.3）、五大成就徽章池标准、自选佩戴规则及数据流转架构。
- [x] **生产端 (Cloudflare Pages) 全量自动构建部署与线上真实环境 E2E 实测 100% 通过**：
  - 通过 `npm run cf:deploy` 成功构建并部署至 Cloudflare Pages 边缘节点：`https://6af80151.shijianus-blog.pages.dev`（主域名 `https://blog.epocanvas.com` 同步生效）；
  - 执行 `scripts/verify-live-account-drawer-and-popover.mjs` 真实端到端 Playwright 测试，对最新 Pages 部署与生产主域完成全景验收：
    - 实测账号中心 `.account-card--level`：旧版方块 `.account-level-stat-item` 数量为 0，冗余文本块 `.account-level-primary-row` 为 0，真实对比进度条与 `.account-badges-section` 徽章专区正常渲染；
    - 实测文章页线上真实留言作者名片 (`.author-profile-popover`)：横向排版 `flexDirection: row`（宽 465.6px，高 138.6px）、粗体显示名 (`font-weight: 750`) + 细体用户名 (`font-weight: 400`) + 纯文本称号（`站长`）、取消按钮彻底删除、硬编码假 Bio 彻底清零（`hasFakeBio: false`）、真实动态统计指标无圆点分隔符（`hasDotSep: false`）、官方成就徽章流渲染正常；
    - 截图已自动存档至 `scripts/audit_screenshots/live-popover-blog.epocanvas.com.png` 与 `scripts/audit_screenshots/live-drawer-blog.epocanvas.com.png`，真实生产链路验收 100% 通过。

### Task 55: 读者中心用户状态扩展、称号后置状态 Emoji、名片文档绝对定位跟随滚动与等级/徽章卡片视觉精简 (`a225291`)
- [x] **作者名片浮层 (`author-profile-popover`) 文档绝对定位跟随滚动与 Epomail 标签精简**：
  - 将名片浮层定位模式由视口固定 `position: fixed` 重构为相对于文档的 `position: absolute`，通过 `docTop` 与 `docLeft` 锚定于留言头像所在的文档绝对坐标；
  - 解决用户滚动页面时名片冻结在屏幕视口固定位置的问题，实现名片随着页面内容滚动 1:1 自然跟随移动；
  - 彻底删除 `.profile-popover-email-wrap` 中多余的 `.profile-popover-epomail-tag`（"Epomail 认证"）。
- [x] **账号中心 Hero 卡片 (`account-hero-card`) 圆形头像规范与邮箱直出**：
  - 明确头像形态规则：仅在评论区发表的内容（`#post-comment .tk-avatar.is-webmaster-avatar`）中呈现站长专属方形头像（8px 圆角），账号中心抽屉 Hero 卡片头像严格保持为精致圆形（`border-radius: 50%`）；
  - 移除 Hero 卡片中冗余的 `.account-pill--admin` 说明徽章（"Epomail 认证"、"站长专属方形头像"、"LV.4 · 站长 · TL.99"）；
  - 在用户名称下方直出呈现真实绑定的电子邮箱地址（`.account-hero-card__email`）。
- [x] **新增用户状态卡片 (`account-card--status`) 与身份后置状态 Emoji 联动**：
  - 账号中心新增用户状态管理卡片，提供快捷预设状态按钮（☕ 喝咖啡中、💻 写代码中、🚀 忙碌中、🎯 深度专注等）以及自定义 Emoji 与文本输入框；
  - 状态数据通过 `shijianus-user-status` 持久化，并自动派发 `shijianus:user-status-change` 全局事件；
  - 在作者名片浮层中，该状态 Emoji 即时呈现在用户身份（如「站长」）正后方（`.profile-popover-status-emoji`），悬停展示详细状态说明。
- [x] **社群等级卡片 (`account-card--level`) 冗余清理、真实进度红黄绿三阶阶梯与站长豁免**：
  - 彻底删除 `.account-level-webmaster-pill`（"站长专属方形头像"说明）与 `.account-level-badge--lv4` 冗余标签；
  - 等级需求进度条同步实际情况，站长作为权威唯一豁免等级晋升限制（即使未满指标依然特免，显示 `✓ 站长特免 (X%)`）；
  - 进度条颜色由低到高严格分为三阶状态：红色（`<40%`，`.account-level-progress-fill--red`）、黄色（`40%-79%`，`.account-level-progress-fill--yellow`）、绿色（`>=80%`，`.account-level-progress-fill--green`）。
- [x] **紧凑型徽章卡片 (`account-badge-card`) 与深浅色佩戴切换按钮**：
  - 优化徽章卡片尺寸，去除臃肿占位，采用横向流式紧凑布局；
  - 增加专用佩戴切换按钮（`.badge-card-equip-btn`），未佩戴呈现淡雅浅色，已佩戴呈现主题深色与白色高亮文字（`已佩戴` / `佩戴`），清晰辨识。
- [x] **端到端自动化测试与全链路验证**：
  - 扩展 `scripts/verify-titles-and-level-card.mjs`，全量断言通过：Hero 卡片圆形头像与邮箱、状态卡片激活、三色进度条与站长豁免、紧凑徽章卡片切换、名片浮层 `position: absolute`、滚动跟随坐标变化 1:1、状态 Emoji 紧随站长后方、Epomail 认证标签清除等 9 大模块。













