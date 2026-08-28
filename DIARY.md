# Markdown 扫描与 UI 增强修改日记 (DIARY.md)

**记录时间**：2026-08-28  
**工程师**：前端 UI 优化全栈工程师  
**目标专案**：`shijianus-blog` (Astro 6 + React 19 + Tailwind 4)  
**设计来源模型**：Hexo Anzhiyu (安知鱼主题) & Astro Theme Pure / Modern MDX  

---

## 1. 修改背景与痛点诊断

在本次重构之前，博客文章页（`post post-page-shell`）的 Markdown 扫描与渲染存在以下核心问题：

1. **表格（Table）识别冲突与样式坍塌**：
   - 旧样式中存在多处选择器冲突（如 `.article-body table` 与 `.article-body.post-content table`）。
   - 错误地对 `table` 元素直接设置了 `display: block; white-space: nowrap; border-collapse: collapse;`，导致表格单元格失去表格布局比例、文字无法折行排版、圆角边框被截断破坏。
2. **Markdown 格式扫描能力严重不足**：
   - 缺乏对 LaTeX 数学公式（`$ ... $` 与 `$$ ... $$`）的编译解析。
   - 缺少 Mermaid 代码图表（流程图、时序图、甘特图等）的动态渲染。
   - 缺少 GitHub 风格 Alert / Anzhiyu 风格告示框（`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` 等）。
   - 代码块缺少增删行 Diff 高亮、长代码折叠展开机制。
   - 缺少交互式 Tabs 选项卡、步骤条 Steps、图片灯箱 Lightbox、脚注悬浮气泡预览。
   - 缺少专属于安知鱼/现代博客的特殊语法功能（局部密码加密弹窗解锁、文字/图片高斯模糊与马赛克、隐藏内容折叠、音频卡片、GitHub 卡片等）。

---

## 2. 核心架构与修改清单

### 一、 编译与扫描管道升级 (`astro.config.mjs`)
- **引入依赖**：
  - `remark-math`：扫描并解析行内与块级 LaTeX 数学公式语法。
  - `rehype-katex`：将数学 AST 转换为可渲染的 KaTeX HTML 结构。
  - `katex`：提供底层字体与符号样式（引入 `katex/dist/katex.min.css`）。
  - `mermaid`：提供客户端动态图表渲染引擎。
- **配置双主题代码高亮**：
  - 配置 Shiki `github-light` / `github-dark-dimmed` 双主题亮暗切换。

### 二、 表格冲突终极修复 (`src/styles/markdown-enhancements.css`)
- **响应式包裹层**：通过运行时自动将文章内的所有 `table` 包装在 `.article-table-wrap` 容器内。
- **解绑 display 冲突**：
  - `.article-table-wrap` 负责 `overflow-x: auto` 横向弹性滚动与阴影、圆角边框容器。
  - `table` 恢复原生 `display: table; width: 100%; border-collapse: separate;`，保证单元格按比例自适应和换行。
  - 添加表头主色调微光（`var(--theme-main)` 8% 色彩混合）、交替隔行变色（`tr:nth-child(even)`）、行悬浮过渡高亮（`tr:hover`）。

### 三、 告示框与提示块扫描 (`src/components/ContentFeatureEnhancer.astro`)
- **自动拦截与转换**：拦截并扫描文章中的 `blockquote`，智能识别 `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`, `[!DANGER]`, `[!SUCCESS]`, `[!QUESTION]`, `[!QUOTE]`。
- **UI 呈现**：
  - 生成安知鱼风格彩色边框卡片（左侧 4.5px 强调色条，7% 透明度微背景）。
  - 自动注入 Lucide SVG 图标与加粗标题栏。
  - 支持折叠告示框语法（`[!NOTE]- 折叠标题` 自动转换为可展开收起的 `<details>` 告示块）。

### 四、 代码块全能增强 (`src/components/CodeBlockEnhancer.astro`)
- **macOS 拟物控制台**：注入红黄绿（Traffic Lights）三色光圈。
- **语言标签与复制交互**：大写语言胶囊徽章，一键复制代码（支持一键剥离 Diff 符号，成功后动态打勾与提示）。
- **Diff 差异高亮**：自动扫描 `+` / `-` 前缀或 `// [!code ++]` / `// [!code --]`，渲染绿/红背景与左侧对比色条。
- **长代码折叠器**：当代码超过 22 行或 380px 时，自动添加底部半透明渐变遮罩和“展开全部代码 / 收起代码”胶囊按钮。

### 五、 Mermaid 代码图表渲染
- 客户端自动检索 `.language-mermaid` 代码块。
- 动态加载 `mermaid` 引擎，并根据当前网站主题模式（Dark / Light）自动适配图表色彩。
- 输出为高质量居中、支持横向自适应的 SVG 图表卡片。

### 六、 特殊功能与安全交互
1. **局部密码加密段落（Password Modal UI）**：
   - 新增 `.article-encrypted-box` 语法支持。
   - 点击“输入密码解锁”时触发全屏毛玻璃弹窗（Modal Dialog）。
   - 输入密码错误时触发卡片左右摇晃抖动（Shake Animation）和错误提示；
   - 验证通过后触发解密动画，同时在 `sessionStorage` 记住解锁状态。
2. **高斯模糊与马赛克效果（Mosaic / Gaussian Blur）**：
   - `.blur-text`：文字默认高斯模糊，悬浮或点击即刻清晰。
   - `.mosaic-text`：文字马赛克遮罩。
   - `.blur-image-wrap`：图片默认高斯模糊（16px），叠加“👁️ 悬浮或点击揭开迷雾”勋章，交互后平滑消除模糊。
3. **隐藏内容盒子（Hidden Box）**：
   - `.hidden-box`：提供折叠式安全隐藏面板，一键点击展示。
4. **图片灯箱（Image Lightbox）**：
   - 点击文章任意配图即可唤起全屏高透暗黑毛玻璃预览灯箱，支持大图缩放、居中自适应、图片说明展示、`Esc` 快捷退出。
5. **脚注悬浮气泡（Footnote Tooltips）**：
   - 鼠标悬停在 `[^1]` 脚注上标时，自动提取正文底部对应释义并在光标上方弹出半透明 Tooltip 气泡，无需跳转阅读。
6. **交互式 Tabs 与步骤条 Steps**：
   - 多语言代码切换与步骤式教程指南排版。
7. **富媒体卡片组件**：
   - GitHub 仓库卡片（`.github-repo-card`，展示 Star/Fork/语言）。
   - 响应式 16:9 视频嵌入卡（Bilibili/YouTube）。
   - 音频播放卡片（`.article-audio-card`）。
   - 多彩标记 `<mark class="mark-yellow|green|blue|pink|purple">`、按键 `<kbd>`、注音 `<ruby>`。

---

## 3. 文件修改与新增一览

| 文件路径 | 变更类型 | 说明 |
| :--- | :--- | :--- |
| `astro.config.mjs` | 修改 | 注册 `remark-math`、`rehype-katex` 及 Shiki 双主题 |
| `package.json` | 修改 | 安装 `remark-math`, `rehype-katex`, `katex`, `mermaid` |
| `src/styles/markdown-enhancements.css` | **新建** | 包含 KaTeX、表格、Admonition、代码块、Tabs、Steps、加密弹窗、马赛克、灯箱、脚注气泡与富文本全套样式 |
| `src/layouts/BlogLayout.astro` | 修改 | 引入 KaTeX CSS 与 `markdown-enhancements.css` |
| `src/components/ContentFeatureEnhancer.astro` | 修改 | 升级核心扫描器，支持 Admonition、表格包裹、Mermaid、Tabs、密码弹窗、灯箱、脚注、模糊控制等 |
| `src/components/CodeBlockEnhancer.astro` | 修改 | 升级代码块增强器，支持 Diff 行高亮、长代码折叠、macOS 控制台与复制过滤 |
| `src/content/posts/markdown-syntax-mastery.md` | **新建** | 包含所有基础 Markdown、进阶排版、特殊功能（加密、模糊、马赛克）、公式、图表、卡片的全量演示与使用指南长文 |
| `DIARY.md` | **新建** | 本修改日记文件 |

---

## 4. 验证与交付状态

- [x] 本地全量静态构建测试（`npm run build:static`）耗时 ~6s，43 个路由全部通过编译，0 错误。
- [x] 表格渲染无水平撕裂、无样式冲突，自适应包裹器工作正常。
- [x] 数学公式与 Mermaid 图表正常解析。
- [x] 加密弹窗交互、模糊遮罩、剧透、灯箱与代码折叠功能全部就绪。
