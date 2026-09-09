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
  2. 断言验证了 TOC 内部滚动翻页能力（`canScrollInternal: true`）、页面滚动全过程 sticky 稳定在 24px（800px、3000px、10000px、20000px 全程 `boxTop = 24px`）、点击章节平滑跳转、收紧侧栏全宽展开与再次展开目录无缝恢复。
