# 首页顽疾清除与底层 DOM 穿透 (Root-Cause Eradication Phase)

> **⚠️ AI 执行须知**：
> 上一轮你的修改在前端真实渲染中**全部失效**！原因是存在 CSS 优先级冲突或父级 Wrapper 阻挡。本次必须从 DOM 结构和 `:root` 变量入手，彻底根治。每解决一个，打一个 `[x]`。

## 阶段一：彻底剥夺 nav-totop 父级物理空间
- [x] **Task 1.1**：审查 `SiteHeader.tsx` 或对应布局组件。`nav-totop` 按钮外部是否包裹着 `<div className="nav-button">`？如果是，你必须将隐藏逻辑（`width: 0`, `padding: 0`, `margin: 0`）应用到**它的父级容器**上，或者通过 React 状态直接在 DOM 层控制它的显隐（不满足条件直接 return null），确保右侧按钮列绝对靠紧！

## 阶段二：通知栏与卡片网格的父级上下文对齐
- [x] **Task 2.1**：审查 `.home-top-notice` 和下方的 `.swiper_container_card` / `categoryGroup`。它们是否在同一个拥有 `padding` 或 `max-width` 的父级中？
- [x] **Task 2.2**：必须将 `.home-top-notice` 的父级限制与卡片网格完全拉齐，或者直接在 JSX 中将通知栏移动到与分类卡片同级的 Grid/Flex 容器内，从物理 DOM 层面保证它们的左边缘在同一条线上。

## 阶段三：控制台深色热力图颜色特权覆写
- [x] **Task 3.1**：你上次写的深色模式选择器失效了。请使用最高特权：`:root[data-theme='dark'] #console .activity-cell` 或者直接在 React 组件中根据主题状态内联注入深蓝到亮蓝的 `style={{ backgroundColor: ... }}`，确保科技蓝调 100% 生效覆盖原有绿色。

## 阶段四：Logo 悬停微交互与卡片弹态
- [x] **Task 4.1**：实现 `#site-name`（shijianus文字）在 hover 时平滑隐藏，并原位浮现出 Home 图标的交互（过渡 0.3s）。
- [x] **Task 4.2**：确保 `random-hover` 和 `categoryItem` 的 Hover 放大效果（`transform: translateY(-4px) scale(1.02)`）没有被其他文件（如 `rebuild.css`）中的旧代码覆盖。使用清理冲突或 `!important` 保驾护航。

## 阶段五：人工级真实性验证
- [x] **Task 5.1**：调用 MCP 截图。不仅要截局部，必须全屏截图证明右侧按钮【真的右移了】、通知栏【真的左对齐了】。
- [x] **Task 5.2**：提交代码 `git commit -am "fix(home): eradicate parent wrapper footprint, enforce DOM-level alignment and apply strict dark heatmap"`。
