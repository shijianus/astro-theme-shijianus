# 顶栏收尾、深色美学与全局微交互重构 (Dark Aesthetics & Micro-interactions)

> **⚠️ AI 执行须知**：
> 在执行本次会话的任何代码修改后，你必须同步更新此文件。将完成的任务从 `[ ]` 修改为 `[x]`。提交代码前，确保所有任务均已打钩！

## 阶段一：纯粹的极暗科技美学 (Deep Dark Mode Palette)
- [x] **Task 1.1 - 重塑暗黑色彩体系**：修改深色模式下的 CSS 变量。将主导航栏（`aria-label="主导航"` 相关的 `#page-header` 等）的背景色改为极低透明度或极黑的颜色（如近乎纯黑配合高斯模糊）。将网页主背景（Body 级）改为与之有肉眼可见区分度、但依然极度深邃的冷调灰黑色（消除土灰感，提升科技感）。

## 阶段二：安知鱼专属粒子星空背景 (Particle & Comet Animation)
- [x] **Task 2.1 - 星空背景架构**：在全局布局（如 `BlogLayout.astro` 或类似顶层组件）中注入 `<canvas>` 节点或专属背景组件，用于绘制深色模式专属的动态背景。
- [x] **Task 2.2 - 物理运动轨迹实现**：编写动画逻辑（Canvas 或 CSS 动画）。实现大量带有微弱发光/半透明效果的随机粒子，统一呈 **向右上方 (↗)** 缓慢漂浮移动。
- [x] **Task 2.3 - 彗星拖尾特效**：在粒子流中，偶尔随机生成向右上方极速划过的“流星/彗星”拖尾特效。注意控制亮度，绝不能喧宾夺主影响正文阅读。

## 阶段三：顶部通知栏重构与右侧按钮精调 (Notice Bar & Right Nav)
- [x] **Task 3.1 - 右侧按钮间距修复**：精调 `#nav-totop` 等右侧功能按钮的布局。确保它们在 Flex 容器中垂直居中、间距（Gap/Margin）一致，并修复部分截图暴露的溢出或不对齐问题。
- [x] **Task 3.2 - 通知栏 (home-top-notice) 瘦身**：重构类似“安知鱼即刻”的顶部通知滚动栏。摒弃当前臃肿膨胀的 UI 结构，将其改造为极极简、单行、平滑滚动的精致轮播条（精简 Padding 和高度，提升 UI 美感）。

## 阶段四：全局快捷键面板 (Shift Shortcuts Modal)
- [x] **Task 4.1 - MCP 机制探明**：使用 MCP 查阅 `github.com/anzhiyu-c/hexo-theme-anzhiyu` 源码，明确其快捷键提示框的激活机制与 DOM 结构。
- [x] **Task 4.2 - 事件监听与面板注入**：在 React/Astro 的顶层注入键盘监听事件（如监听 `Shift` 键按下）。当触发时，在屏幕左上角顺滑弹出快捷键指令提示框（UI 需包含半透明磨砂背景和规整的键位说明）。

## 阶段五：验证与固化 (Verification & Commit)
- [x] **Task 5.1 - 截图取证**：调用 Puppeteer 获取深色模式全屏截图（需体现星空背景和极暗色彩）、右侧重构后的精简通知栏截图、以及按下 Shift 后弹出的快捷键面板截图。
- [x] **Task 5.2 - 最终提交**：执行 `git commit -am "feat(ux): implement deep dark aesthetics, particle background, refined notice bar and shortcut modal"`。
