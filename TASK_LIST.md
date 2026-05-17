# 首页布局精雕、卡片动效与控制台数据接入 (Home Polish & Console Data)

> **⚠️ AI 执行须知**：
> 每次代码修改后，必须同步更新此文件，将完成的任务从 `[ ]` 修改为 `[x]`。全部打钩后方可提交！

## 阶段一：导航栏收尾与即刻通知栏极简对齐 (Header & Notice Bar)
- [x] **Task 1.1 - `nav-totop` 物理空间剥夺**：修改 CSS。当回到顶部按钮隐藏时，不仅要 `opacity: 0`，还必须让其 `width: 0`, `min-width: 0`, `margin: 0`, `padding: 0`，使其旁边的按钮平滑右移，完全占领右侧边缘。
- [x] **Task 1.2 - 通知栏极致瘦身与对齐**：彻底移除 `.home-top-notice` 廉价的渐变、边框和臃肿阴影。调整其 `margin-left` 或 Flex 对齐方式，使其左边缘与正下方的内容卡片网格达到**绝对像素级对齐**。

## 阶段二：安知鱼专属卡片交互动效 (Hero Cards Interaction)
- [x] **Task 2.1 - `categoryItem` 动效复刻**：优化首页分类卡片的比例。注入安知鱼标准的 Hover 交互：鼠标悬停时，卡片整体产生平滑的轻微放大（`transform: scale(...)`），且内部图标产生相应的位移或放大反馈。
- [x] **Task 2.2 - `random-hover` 交互同步**：对 `id="random-hover"` 相关的卡片应用同等水准的布局比例 optimization 与悬浮弹性动效，彻底消除僵硬感。

## 阶段三：星空背景隔离与控制台热力图调优 (Background & Console UX)
- [x] **Task 3.1 - 背景层级与隔离修复**：修复上一步星空背景带来的瑕疵。确保背景 Canvas 的 `z-index` 在最底层，使用 `pointer-events: none` 防止点击穿透阻挡，且确保它**绝对不影响**其他任何背景样式。
- [x] **Task 3.2 - 热力图蓝调暗黑重构**：修改控制台 (Console) 中的热力图（贡献图）CSS 颜色映射。在 `[data-theme='dark']` 状态下，将其绿色色阶替换为极具科技感的**冷调深蓝到亮蓝的色阶**。

## 阶段四：控制台无损数据框架接入 (Data Sync Architecture)
- [x] **Task 4.1 - 无损数据获取骨架**：在不破坏现有前端 UI 和 DOM 结构的前提下，为控制台（站点概览、最新更新等）编写状态管理或数据 Fetch 的占位逻辑/Hooks。确保后续接入真实 API 时 UI 依然稳定渲染。

## 阶段五：验证与固化 (Verification & Commit)
- [x] **Task 5.1 - 截图取证**：获取三张截图：1. 通知栏与下方内容对齐的左侧局部图；2. 隐藏 `nav-totop` 时顶部右侧全部靠右的截图；3. 深色模式下蓝调热力图的截图。
- [x] **Task 5.2 - 最终提交**：执行 `git commit -am "feat(home): polish notice bar alignment, hero cards interaction, blue heatmap and dynamic data skeleton"`。
