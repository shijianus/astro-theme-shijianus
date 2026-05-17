# 首页 Hero 区域专项重构 (Phase 1: categoryGroup & Hero Cards)

> **⚠️ AI 执行须知**：
> 本次任务【仅限】修复首页顶部的卡片布局（`categoryGroup`, `categoryItem`, `random-hover` 等）。绝不允许触碰代码库中的其他无关功能！完成一步打一个 `[x]`。

## 阶段一：卡片网格比例与结构重塑 (Grid & Proportion)
- [ ] **Task 1.1 - 重构 categoryGroup 布局**：精准定位 `categoryGroup` 容器。必须强制其采用标准的 CSS Grid 布局（如 PC 端 `grid-template-columns: repeat(3, 1fr)`），并设置完美的卡片间距（`gap: 12px` 到 `16px`），消除原有的错位或大小不一。
- [ ] **Task 1.2 - 协调左右区块比例**：审查包含 `random-hover` (大横幅卡片) 和 `categoryGroup` (分类小卡片组) 的父级容器（如 `swiper_container_card` 或 `bannerGroup` / `topGroup`）。利用 Flex 或 Grid 将左右比例严格约束在安知鱼标准的 7:3 左右，确保视觉重心的平衡。

## 阶段二：安知鱼专属“呼吸感”悬停动效 (Breathing Hover Physics)
- [ ] **Task 2.1 - 物理引擎级缓动过渡**：为所有卡片（`.categoryItem` 和 `#random-hover`）的基础状态注入统一的高级过渡曲线：`transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s ease;`。
- [ ] **Task 2.2 - 上浮与阴影扩散**：在 `:hover` 状态下，严格加入 `transform: translateY(-4px) scale(1.015);`，并配合深邃的悬浮阴影扩散，拒绝僵硬的瞬间位移。
- [ ] **Task 2.3 - 内部 Icon 联动微动效**：如果卡片内部存在 Icon（`.categoryButtonIcon` 或类似元素），在父级卡片 `:hover` 时，必须让内部图标产生极其轻微的放大（如 `scale(1.1)`）或位移反馈，拉满交互密度。

## 阶段三：单点验证与固化 (Verification & Commit)
- [ ] **Task 3.1 - 静态比例截图**：调用 MCP 截取首页首屏。必须证明左右区块比例完美，`categoryGroup` 形成整齐的 3 列网格。
- [ ] **Task 3.2 - 悬停动效捕捉**：调用 Puppeteer 将鼠标强行 Hover 到其中一个分类卡片上并截图，证明它发生了平滑的上浮放大。
- [ ] **Task 3.3 - 阶段性独立提交**：所有框打钩后，执行 `git commit -am "feat(home): phase 1 - perfect categoryGroup grid proportions and advanced hover physics"`。
