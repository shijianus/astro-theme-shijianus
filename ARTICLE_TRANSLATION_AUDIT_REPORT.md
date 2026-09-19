# 博客文章多语言翻译与 DOM 变体 (.article-translation-variant) 全量审查报告

> **审计执行时间**：2026-09-18  
> **审计环境**：Cloudflare Pages 线上真实生产环境 (`https://blog.epocanvas.com`) + 本地源码对比  
> **审计手段**：Playwright 无头浏览器端到端自动化深度提取 + 本地 Markdown 资产全量解析  
> **审计模式**：只读检查（Read-Only），未改动任何业务代码

---

## 一、 核心审计结论 (Executive Summary)

针对用户提出的核心关切：**“翻译功能是否正常？是否还有翻译版本没有显示到的问题？所有的 class='article-translation-variant' 是否正常？Playwright 提取结果如何？”**，全景审查结论如下：

1. **已具备翻译文件的文章 (10 篇)：翻译版本 100% 全部正常显示，零遗漏，零故障！**
   - 对线上已完成 6 语系翻译的 **10 篇核心公开文章** 进行全量 Playwright 提取，在 DOM 中 **100% 均检测到了全部 6 种语言的 `.article-translation-variant`**（`zh-CN`, `de`, `en`, `es`, `fr`, `zh-Hant`，共计 60 个变体容器）。
   - 针对 60 个变体进行了 60 次真实客户端无刷新语言切换测试（In-Place Zero-Reload Switch），**通过率 100%**：目标语言变体瞬间由 `display: none` 转为 `display: block`（可见），其余 5 种语言自动隐藏，PostHero 大标题 `<h1>` 同步替换为对应语言，**不存在任何“已有翻译版本却在页面中未显示到”的缺陷**。

2. **仅有单一语言文件的文章 (12 篇)：未显示外语翻译版本的根本原因是“物理源码文件尚未生成”，而非前端渲染漏掉！**
   - 博客全量 23 篇独立文章中，有 **12 篇文章在 `src/content/posts/` 源码目录中物理上仅存在 1 个简体中文 `.md` 主文件**（未生成对应的 `-en.md`, `-es.md`, `-de.md`, `-fr.md`, `-zh-Hant.md` 文件）。
   - 在 Playwright 真实提取中，这 12 篇文章的页面 DOM 中均只包含 **1 个** `.article-translation-variant[data-lang="zh-CN"]`，且可见性正常。PostHero 组件按照设计规范自动隐藏了语言切换按钮（单语文章无需切换）。
   - 本地构建脚本 `scripts/sync-post-i18n.mjs` 默认设置了 `ENABLE_ARTICLE_AI_I18N=false`（AI 自动翻译助手未全局开启），因此这 12 篇文章尚未产出多语言静态版本。

3. **密码受限文章 (1 篇，`access-control-lab`)：未渲染正文是符合预期的安全阻断机制**
   - 本地磁盘存在该文章的全部 6 种语言版本；但因配置了 `access.passwordHash` 访问密码，在静态 SSG 构建时，为防止受保护正文源码外泄，服务端安全逻辑强制不输出正文，改由渲染 `<section class="content-access-panel">` 密码输入框，未解锁前 DOM 中自然无 `.article-translation-variant`。

4. **潜在脚本规范隐患排查 (只读发现)**：
   - 脚本 `scripts/sync-post-i18n.mjs` 的通用正则 `/^(.*?)[.-]([a-zA-Z]{2,3}(?:-[a-zA-Z]{2,4})?)$/` 会把 `media-capability-lab.md` 的 `-lab` 误匹配为语言代码 `lab`，导致其在 `src/.generated/article-i18n-map.json` 中被记录为 `lang: "lab"`。但生产端页面渲染使用的是严格白名单正则 `(en|zh-Hant|zh-CN|fr|es|de)`，因此线上实际不受影响（正常以 `zh-CN` 单语展示）。

---

## 二、 全量 23 篇文章 Playwright 真实端到端提取矩阵

| 序号 | 文章 Slug (Canonical URL) | 本地文件数 | DOM 变体数 | 渲染语言列表 | Playwright 切换测试 | 翻译完备状态 | 说明 |
|:---:|:---|:---:|:---:|:---|:---:|:---:|:---|
| 1 | `api-ready-theme-contracts` | 6 | **6** | zh-CN, de, en, es, fr, zh-Hant | ✅ 6/6 全通过 | 完整 6 语系 | 所有变体渲染正常，切换即时生效 |
| 2 | `badges-guide` | 6 | **6** | zh-CN, de, en, es, fr, zh-Hant | ✅ 6/6 全通过 | 完整 6 语系 | 目录与正文 0 中文残留，变体切换正常 |
| 3 | `content-formats-and-markup-mastery` | 6 | **6** | zh-CN, de, en, es, fr, zh-Hant | ✅ 6/6 全通过 | 完整 6 语系 | 聊天流/任务流/脚注全语系无缝切换 |
| 4 | `example-all-special-formats` | 6 | **6** | zh-CN, de, en, es, fr, zh-Hant | ✅ 6/6 全通过 | 完整 6 语系 | 特异功能全格式多语言变体就绪 |
| 5 | `example-code-enhancements` | 6 | **6** | zh-CN, de, en, es, fr, zh-Hant | ✅ 6/6 全通过 | 完整 6 语系 | 代码增强示例多语言变体就绪 |
| 6 | `example-details-collapse` | 6 | **6** | zh-CN, de, en, es, fr, zh-Hant | ✅ 6/6 全通过 | 完整 6 语系 | 折叠块组件多语言变体就绪 |
| 7 | `example-embeds` | 6 | **6** | zh-CN, de, en, es, fr, zh-Hant | ✅ 6/6 全通过 | 完整 6 语系 | 富媒体嵌入多语言变体就绪 |
| 8 | `example-tabs` | 6 | **6** | zh-CN, de, en, es, fr, zh-Hant | ✅ 6/6 全通过 | 完整 6 语系 | 交互式多标签页多语言变体就绪 |
| 9 | `hello-world` | 6 | **6** | zh-CN, de, en, es, fr, zh-Hant | ✅ 6/6 全通过 | 完整 6 语系 | 始祖文章多语言变体就绪 |
| 10 | `markdown-syntax-mastery` | 6 | **6** | zh-CN, de, en, es, fr, zh-Hant | ✅ 6/6 全通过 | 完整 6 语系 | 全语法大篇幅分块翻译变体就绪 |
| 11 | `anzhiyu-markdown-showcase` | 1 | **1** | zh-CN | - (无切换栏) | 仅中文 | 本地仅有单个 `.md` 源文件，无翻译版本 |
| 12 | `content-first-homepage` | 1 | **1** | zh-CN | - (无切换栏) | 仅中文 | 本地仅有单个 `.md` 源文件，无翻译版本 |
| 13 | `example-callouts` | 1 | **1** | zh-CN | - (无切换栏) | 仅中文 | 本地仅有单个 `.md` 源文件，无翻译版本 |
| 14 | `example-frontmatter-fields` | 1 | **1** | zh-CN | - (无切换栏) | 仅中文 | 本地仅有单个 `.md` 源文件，无翻译版本 |
| 15 | `example-gallery-figure` | 1 | **1** | zh-CN | - (无切换栏) | 仅中文 | 本地仅有单个 `.md` 源文件，无翻译版本 |
| 16 | `example-math` | 1 | **1** | zh-CN | - (无切换栏) | 仅中文 | 本地仅有单个 `.md` 源文件，无翻译版本 |
| 17 | `example-mermaid` | 1 | **1** | zh-CN | - (无切换栏) | 仅中文 | 本地仅有单个 `.md` 源文件，无翻译版本 |
| 18 | `example-mindmap` | 1 | **1** | zh-CN | - (无切换栏) | 仅中文 | 本地仅有单个 `.md` 源文件，无翻译版本 |
| 19 | `learning-through-rebuilds` | 1 | **1** | zh-CN | - (无切换栏) | 仅中文 | 本地仅有单个 `.md` 源文件，无翻译版本 |
| 20 | `markdown-scan-showcase` | 1 | **1** | zh-CN | - (无切换栏) | 仅中文 | 本地仅有单个 `.md` 源文件，无翻译版本 |
| 21 | `media-capability-lab` | 1 | **1** | zh-CN | - (无切换栏) | 仅中文 | 本地仅有单个 `.md` 源文件，无翻译版本 |
| 22 | `readable-geek-interfaces` | 1 | **1** | zh-CN | - (无切换栏) | 仅中文 | 本地仅有单个 `.md` 源文件，无翻译版本 |
| 23 | `access-control-lab` | 6 | **0** | - (受密码保护) | - | 密码保护受限 | 页面被服务端访问控制拦截，正文未解锁不输出 |

---

## 三、 `.article-translation-variant` DOM 元素详细审计数据

通过 Playwright 对已翻译完成的典型多语言文章进行深度抓取，每个变体容器的物理特征如下：

### 1. `content-formats-and-markup-mastery` (代表性全功能长文)
- **预渲染变体总数**：6 个
- **变体明细**：
  - `data-lang="zh-CN"`：长度 29,124 字符，中文占比 0.582，样本：`静态站点生成器（SSG）与主题内容格式全景指南 在现代静态站点生成器（SSG）与...`
  - `data-lang="de"`：长度 58,417 字符，德语原生，样本：`Umfassender Leitfaden zu Static Site Generatoren (SSG)...`
  - `data-lang="en"`：长度 52,480 字符，英语原生（0 中文残留），样本：`A Comprehensive Guide to Static Site Generators (SSG)...`
  - `data-lang="es"`：长度 62,295 字符，西语原生，样本：`Guía panorámica de generadores de sitios estáticos (SSG)...`
  - `data-lang="fr"`：长度 62,724 字符，法语原生，样本：`Guide panoramique des générateurs de sites statiques (SSG)...`
  - `data-lang="zh-Hant"`：长度 25,600 字符，繁体中文，样本：`靜態網站產生器（SSG）與主題內容格式全景指南 在現代靜態網站產生器（SSG）與...`
- **初始显隐状态**：默认激活匹配语言（`visible=true`），其余 5 个变体精准挂载 `style="display: none;"`（`visible=false`）。
- **客户端点击切换测试**：依次触发 6 个语言按钮，对应的变体立即显示，其他变体立即隐藏，控制台 0 报错。

### 2. `badges-guide` (代表性结构化排版指南)
- **预渲染变体总数**：6 个
- **变体明细**：
  - `zh-CN`: 16,339 字符；`de`: 19,088 字符；`en`: 17,211 字符；`es`: 19,531 字符；`fr`: 19,926 字符；`zh-Hant`: 16,380 字符。
- **正文与侧边栏 TOC 对齐测试**：切至英文时，不仅 `.article-translation-variant[data-lang="en"]` 正常显示，右侧目录卡片也同步无缝切换为 30 项英文目录，无任何中文串扰。

### 3. `markdown-syntax-mastery` (代表性超长全语法文章)
- **预渲染变体总数**：6 个
- **变体明细**：
  - `zh-CN`: 22,921 字符；`de`: 18,627 字符；`en`: 16,050 字符；`es`: 19,257 字符；`fr`: 38,458 字符；`zh-Hant`: 22,540 字符。
- **切换验证**：6 种语言变体在 Playwright 提取下均 100% 成功切换。

---

## 四、 核心疑问解答

### 疑问 1：到底有没有“已翻译好的版本在页面上没显示到”的问题？
**明确回答：绝对没有。**  
所有在本地磁盘上存在多语言文件的文章（共 10 篇公开文章），服务端静态构建（SSG）已将全部 6 种语言版本完整预渲染至 DOM，且通过 Playwright 验证了：
1. DOM 里 6 个 `.article-translation-variant` 全部存在；
2. PostHero 语言切换按钮齐全；
3. 点击任意语言按钮，对应的语言变体都能瞬间切换为可见；
4. 不存在“代码漏掉了某个变体”、“样式导致变体无法显示”或“切换后依然是其它语言”的问题。

### 疑问 2：为什么有些文章在页面上完全看不到多语言切换按钮和翻译版本？
**明确回答：因为这些文章目前尚未生成外语翻译文件。**  
以下 12 篇文章在项目源码 `src/content/posts/` 中只有单一的原始中文文件，没有对应的 `-en.md`、`-es.md` 等翻译文件：
- `anzhiyu-markdown-showcase`
- `content-first-homepage`
- `example-callouts`
- `example-frontmatter-fields`
- `example-gallery-figure`
- `example-math`
- `example-mermaid`
- `example-mindmap`
- `learning-through-rebuilds`
- `markdown-scan-showcase`
- `media-capability-lab`
- `readable-geek-interfaces`

由于博客的多语言机制要求必须有物理源文件（或通过 AI 构建流水线生成对应 Markdown 文件），在没有翻译源文件的情况下，系统会正常降级为“单语文章”，仅输出一个 `data-lang="zh-CN"` 的 `.article-translation-variant`，并自然隐藏语言切换栏。

---

## 五、 总结与后续建议 (只读性质，无需立即改动)

1. **当前翻译渲染功能极其稳健**：单一规范 URL 架构（Single Canonical URL）、零刷新就地语言切换、DOM 预渲染变体控制均处于完美运行状态，经过 Playwright 全量审计，不存在功能性故障。
2. **如需让所有 23 篇文章都支持多语言**：
   - 可在后续任务中开启 `scripts/sync-post-i18n.mjs` 的 AI 翻译助手（将 `ENABLE_ARTICLE_AI_I18N` 设为 `true`），针对上述 12 篇单语文章批量生成对应语系的 Markdown 文件。
   - 生成文件后重新执行 `npm run build:static`，系统将自动把这 12 篇文章升级为 6 语系全景架构。
3. **修复 `sync-post-i18n.mjs` 正则的小建议**：
   - 后续如需维护构建脚本，可将 `scripts/sync-post-i18n.mjs` 中的通用语言匹配正则收敛为与 Astro 模板一致的精确语言白名单 `/(?:[.-])(en|zh-Hant|zh-CN|fr|es|de)$/i`，避免将 `-lab` 等单词后缀误识别为语言代码。
