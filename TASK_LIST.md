# 首页比例纠偏与底层 CSS 穿透修复 (Deep Layout & Specificity Fixes)

> **⚠️ AI 执行须知**：
> 上一轮修改完全没有在 UI 上生效！这次你必须深挖 DOM 树和优先级。每完成一步，将 `[ ]` 改为 `[x]`。

## 阶段一：消灭右侧导航栏幽灵占位 (Nav Totop Zero-Footprint)
- [x] **Task 1.1**：审查 `nav-totop` 的隐藏状态。如果它没有 `.show` 类名，必须通过 CSS 彻底抹除其物理体积。不仅仅是 `opacity: 0`，必须包含 `width: 0 !important; margin: 0 !important; padding: 0 !important; transform: scale(0) !important; display: none;` （或彻底的隐藏方式），确保左侧按钮【瞬间贴合】右边缘，不留任何空隙！

## 阶段二：通知栏与正文主体的像素级对齐 (Notice Bar Alignment)
- [x] **Task 2.1**：使用 MCP (Puppeteer) 分析首页内容区（如 `.layout`, `#recent-posts`, 或包裹卡片的父网格）的 `max-width` 和左侧坐标。
- [x] **Task 2.2**：强制让 `.home-top-notice` 继承相同的容器宽度限制或使用相同的左右 Margin，确保它的左边缘与下方的 `categoryItem` 或 `random-hover` 卡片的左边缘绝对对齐，形成一条完美的垂直基准线。

## 阶段三：卡片比例与高级 Hover 动画纠偏 (Hero Cards Proportion & Hover)
- [x] **Task 3.1**：修正 `random-hover` 和分类卡片网格的尺寸比例。查阅安知鱼标准布局，确保 `random-hover` 占据合理的网格空间（如 6:4 或 7:3 的视觉比例），不再显得拥挤或不协调。
- [x] **Task 3.2**：注入安知鱼级别的高级弹性动效。对卡片父级添加 `transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s;`，悬停时实现明显的 `translateY(-4px)` 与阴影扩散，确保动画不生硬。

## 阶段四：热力图深层穿透 (Heatmap SVG/Fill Override)
- [x] **Task 4.1**：审查控制台热力图的实际 DOM。如果热力图方块是 SVG `<rect>`，你需要修改的是 `fill` 属性而不是 `background-color`！使用深色模式限定符 `[data-theme='dark']`，精准覆写 Level 1-4 的科技蓝调色阶。

## 阶段五：验证与固化 (Verification & Commit)
- [x] **Task 5.1 - 控制台计算打印**：在终端打印出你提取到的热力图 DOM 元素类型（是 div 还是 svg rect）以及你应用的准确 CSS 属性。
- [x] **Task 5.2 - 截图取证**：1. 隐藏 `nav-totop` 时，右侧按钮紧贴屏幕边缘的截图；2. 通知栏和下方卡片完美左对齐的截图。
- [x] **Task 5.3 - 最终提交**：执行 `git commit -am "fix(home): enforce strict component alignment, fix nav footprint and penetrate heatmap colors"`。
