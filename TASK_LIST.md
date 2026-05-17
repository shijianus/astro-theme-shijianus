# 首页 Hero 核心视觉与交互重塑 (Phase 1: Hero Section Strict Refactor)

> **⚠️ AI 执行须知**：
> 你的修改经常被旧 CSS 覆盖而失效。本次任务中，你必须使用足够高的选择器权重（如 `body[data-type='home'] #bannerGroup` 配合 `!important`）。每完成一步打一个 `[x]`。

## 阶段一：Hero 区域全局比例纠偏 (Golden Proportion)
- [x] **Task 1.1 - 容器比例重建**：审查包含左侧大横幅和右侧卡片组的顶级父容器。强制左侧大卡片容器（如 `#bannerGroup`）与右侧小卡片容器（如 `.topGroup` 或 `.categoryGroup` 的父级）形成严格的 `flex: 7` 与 `flex: 3`（或类似黄金比例）的关系。
- [x] **Task 1.2 - 防挤压约束**：为右侧小卡片容器设置合理的 `min-width`（如 `300px`），确保在缩放时不会被左侧大卡片无限挤压导致内部排版崩溃。

## 阶段二：categoryGroup 三列网格与溢出裁剪 (Grid & Clip)
- [x] **Task 2.1 - 强制三列网格**：定位到右侧的 `.categoryGroup` 容器。强制声明其为 Grid 布局（`display: grid !important`），并在桌面端设定为三等分列（`grid-template-columns: repeat(3, 1fr) !important`），设置间距 `gap: 12px !important`。
- [x] **Task 2.2 - 卡片圆角与裁剪**：确保每一个小卡片（`.categoryItem`）自身拥有统一的大圆角（如 `border-radius: 12px`），且**必须包含 `overflow: hidden !important`**。这样卡片右下角的装饰性 Icon 才不会飞出边界！

## 阶段三：安知鱼专属高级微交互 (Premium Micro-interactions)
- [x] **Task 3.1 - 物理级上浮与阴影**：为大横幅 `#random-banner` 和分类卡片 `.categoryItem` 注入统一的过渡属性 `transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s ease !important`。在 `:hover` 时，实现 `transform: translateY(-5px) scale(1.01)` 和深层次阴影 `box-shadow: 0 12px 30px -10px rgba(0,0,0,0.3)`。
- [x] **Task 3.2 - 内部装饰图标联动**：找到 `.categoryItem` 右下角/右上角的装饰性背景图标（可能是 `.categoryButtonIcon` 或某个 `<i>` 标签）。在父级卡片 `:hover` 时，让这个图标产生微小的吸附放大或位移动画（例如 `transform: scale(1.15) rotate(3deg) translate3d(-4px, -2px, 0)`）。

## 阶段四：验证与固化 (Verification & Commit)
- [x] **Task 4.1 - 静态排版截图**：调用 MCP 截取首页首屏。向用户证明左 7 右 3 的比例已恢复，且小卡片内的图标不再乱飞。
- [x] **Task 4.2 - 悬停动效截图**：调用 Puppeteer 悬停在右侧任意一个小卡片上截图。证明卡片上浮了，且内部背景 Icon 产生了联动动效。
- [x] **Task 4.3 - 阶段提交**：执行 `git commit -am "feat(home): phase 1 - strictly rebuild hero section proportions, grid layout and premium micro-interactions"`。
