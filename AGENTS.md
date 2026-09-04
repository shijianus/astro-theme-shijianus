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

