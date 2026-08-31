# TOC Implementation Plan

## 1. 备份与初始化
- [x] 完成本地代码全量备份
- [x] 备份Commit Hash: `6616960d0bf61a7364a1eafe61cdf5f3006cbb54`

## 2. 需求分析与研究
- [x] 参考 `hexo-theme-anzhiyu` 源码，学习其文章目录（TOC）的UI状态、粘性卡片（Sticky Card）和标题目录的实现规则。
- [x] 结合 `.agent/skills/ui-ux-pro-max` 的UI/UX规范，规划Astro中的前端UI实现（包括配色、动画、阴影、层级结构等）。

## 3. 全量开发
- [x] 创建或更新 Astro/React 的 TOC 组件。
- [x] 实现粘性定位（Sticky）以及基于滚动监听的高亮显示当前阅读章节。
- [x] 确保与当前 `shijianus-blog` 的布局融合。
- [x] 应用响应式设计，在移动端和PC端提供合适的UI展示。

## 4. 视觉验证
- [x] 启动本地开发服务器 (`npm run dev`)。
- [x] 调用/编写 Playwright 脚本（或MCP Playwright工具）捕获包含TOC的博客文章页面。
- [x] 多角度截图，动态展示滚动前后的TOC高亮状态和粘性效果。

## 5. 审计与修正
- [x] 提交截图给用户进行审计检视。
- [x] 代码全量 Commit 完成 (`8dedf41`, `8c9d1c6`)。
- [x] 全量自动化审计通过（包括单项唯一高亮、深层章节 100% 对齐、右侧工具栏反馈与 1 级放大聚焦效果）。
- [x] 审核全量通过，完成本次开发。
