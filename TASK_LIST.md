# 顶栏重构终极校验清单 (Nav Refactor Final Checklist)

> **⚠️ AI 执行须知**：
> 在执行本次会话的任何代码修改后，你必须同步更新此文件。将完成的任务从 `[ ]` 修改为 `[x]`。提交代码前，必须确保所有任务均已打钩！

## 阶段一：排版与几何对齐 (Typography & Alignment)
- [x] **Task 1.1 - 整体居中**：重构菜单项 `<a>` 标签的 Flex 布局。确保左侧 Icon 与右侧的“双语文本整体（中+英）”实现完美的绝对垂直居中对齐，绝不能只对齐中文。
- [x] **Task 1.2 - 悬浮背景修复**：调整菜单项或 Hover 伪元素的垂直 `padding` 或 `height`。当鼠标悬停出现黄色高亮背景时，背景必须完全包裹住底部的英文字母，绝对禁止字母溢出背景框！
- [x] **Task 1.3 - 物理等宽印章**：精确计算并设置 `letter-spacing`（结合负 `margin-right` 抵消多余间隙）。让底部 3 字母英文（如 ART, FRD）的物理总宽度，与顶部 2 个汉字（如 文章, 友邻）的宽度达到像素级的一致，形成规整的“印章式”方块。

## 阶段二：图标补全与降级 (Icon Restoration)
- [x] **Task 2.1 - MCP 主动检索**：针对目前丢失的大量图标（分类索引、标签聚合、实验田等），使用 MCP 工具主动查阅 `github.com/anzhiyu-c/hexo-theme-anzhiyu` 源码寻找正确类名。
- [x] **Task 2.2 - 强制补齐**：如果字体库确实缺失，必须使用 `lucide-react` 组件进行像素级替换。确保下拉菜单中【每一个】选项都有语义相符且可见的图标！

## 阶段三：Logo 微交互 (Logo Hover Interaction)
- [x] **Task 3.1 - CSS 交互注入**：为左侧站点名称 `#site-name` (或 `#blog_name`) 注入 Hover 交互。
- [x] **Task 3.2 - 形变逻辑**：默认显示文本 `shijianus`；鼠标悬停时，文本平滑隐藏（opacity 变 0 且带位移/缩放），并在原位置平滑浮现出一个“房子 (Home)”图标。过渡动画时间设为 `0.3s ease`。

## 阶段四：自证与提交 (Verification & Commit)
- [x] **Task 4.1 - 截图取证**：调用 Puppeteer 获取三张截图：1. 证明印章对齐与背景不溢出；2. 证明下拉菜单 Icon 全覆盖；3. 证明 Logo 悬停变房子。
- [x] **Task 4.2 - 最终提交**：执行 `git commit -am "feat(nav): complete pixel-perfect typography, logo micro-interaction and full icon restoration"` 并向用户汇报 Hash。
