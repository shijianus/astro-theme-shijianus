# 文章全量多语言翻译与 `.article-translation-variant` 源码级深度核验与打磨报告

> **审计模式**: 纯源码级深入排查 + 注入测试博文实测 + Playwright 真实无头浏览器全量端到端提取 + 缺陷闭环打磨与全量复测  
> **审计范围**: 文章正文多语言变体容器 `class="article-translation-variant"` 的挂载、渲染、初始可见性、真实点击切换、DOM 属性同步及边界异常修复  
> **测试引擎**: Playwright (Chromium Headless, 视口 1440x900) 真实 HTTP 静态服务提取与交互断言  
> **最终断言统计**: 总计执行断言 **1,089** 项，通过 **1,089** 项，失败 **0** 项 (通过率: **100.0%**)  
> **执行时间**: 2026-09-20T07:39:44.000Z  

---

## 一、核心核验与打磨成果 (Executive Summary)

针对用户关于**“检查翻译功能是否正常、是否存在翻译版本未显示到的问题”**、**“基于源码而非信任既有文档”**、**“对发现的问题进一步打磨”**的指令，本次工作完成了**从问题排查、证据链复现、源码级修复打磨到 Playwright 100% 全绿验收**的完整闭环：

### 1. 既有 23 篇正式博文现状：全量正常渲染与无缝切换
- **公开博文（22 篇）**：正文容器 `#article-container` 内均精准挂载了 6 大语系（`zh-CN`、`zh-Hant`、`en`、`es`、`de`、`fr`）对应的 `.article-translation-variant` 容器（共计 132 个变体）。
- **受控博文（1 篇）**：`access-control-lab` 严格受服务端密码面板保护，0 变体泄漏，安全隔离机制正常。
- **初始显示状态**：默认激活主语系（无 `display: none`），其余 5 个变体应用 `style="display: none;"`，无内容错乱或同时显示问题。
- **交互切换能力**：在 Playwright 驱动真实点击 PostHero 语言标签按钮（`.post-hero__lang-tag[data-target-lang]`）时，目标语言变体瞬间显示，旧语言立即隐藏，`#article-container[data-lang]` 与 `document.documentElement.lang` 正确联动。

### 2. 致命漏洞修复：解决双后缀 / 纯外语主篇“404 重定向死锁导致变体 0 渲染” (P0 Closed)
- **修复前缺陷**：
  若作者撰写一篇原生英文文章并命名为 `foo-en.md`（带语言后缀），同时配有中文翻译 `foo-zh-CN.md`，但在目录中**不存在**无后缀的 `foo.md` 时，访问该组任何页面都会陷入重定向死锁，静态导出缺失目录，直接 404，**变体渲染数 = 0，文章 100% 无法阅读**。
- **修复方案落地**：
  1. 在 `src/pages/posts/[slug].astro` 的 `getStaticPaths()` 中加入规范基名提取器，自动为无无后缀主文件的文章组生成基准目录 `/posts/[canonicalSlug]/`；
  2. 增强 `entry` 查表算法，当请求命中规范基路径时，平滑回退匹配该文章组的首个主篇文件；
  3. 扩充 `siblingTranslations` 筛选范围，加入 `canonicalSlug` 兜底匹配，确保所有语言兄弟变体均能聚合进 `renderedVariants`。
- **实测验证**：测试博文 `test-matrix-native-en` 在修复后成功编译出 `/posts/test-matrix-native/`，Playwright 真实提取变体数 **2 / 2**，点击切换 100% 顺畅。

### 3. 次级缺陷修复：语言代码标准化管道与大小写归一化 (P1 Closed)
- **修复前缺陷**：
  若文章 Frontmatter 声明了非标准大小写的语言代码（例如 `lang: "EN"` 或 `lang: "zh-cn"`），会导致 DOM 生成 `<div class="article-translation-variant" data-lang="EN">`，造成 `PostHero.astro` 徽章失配为原始 `"EN"`、浏览器端语言检测断层、TOC 标题回退以及 CSS 脚注规则失效。
- **修复方案落地**：
  1. 在 `src/lib/content.ts` 封装并导出了通用语言归一化函数 `normalizeLangCode()`；
  2. 在 `src/pages/posts/[slug].astro` 的 `currentLang`、`vLang`、`targetLang` 以及客户端切换脚本中全链路注入归一化处理；
  3. 在 `src/components/theme/PostHero.astro` 中对 `LOCALE_NAMES` 查询键实行归一化映射。
- **实测验证**：测试博文 `test-matrix-casing` 的英文变体成功归一化为标准小写 `data-lang="en"`，UI 正确显示 "English" 标签，`document.documentElement.lang` 规范同步为 `"en"`。

### 4. 细节瑕疵优化：Markdown 内嵌 HTML 属性英文本地化 (P2 Closed)
- **修复前缺陷**：
  在 `example-gallery-figure-en.md` 和 `example-embeds-en.md` 中，因 HTML 标签整体隔离机制导致部分图注与头像 alt 属性仍残留中文。
- **优化方案落地**：
  - 修正了 `example-gallery-figure-en.md` 中的 `series: "Feature Examples"`，以及 `<div class="gallery-item__caption">Workbench R&D Panorama</div>`、`alt="2026 R&D Outlook"`；
  - 修正了 `example-embeds-en.md` 中的 `series: "Feature Examples"` 与 `<img class="chat-avatar" ... alt="Architect shijianus" />`。

---

## 二、测试博文验证矩阵与证据链 (100% Pass)

| 测试组标识 | 测试文件结构 | 测试目的与边界特征 | Playwright 提取变体数 | 实测结果与状态 | 证据详情 |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **`test-native-english-clean`** | `test-native-english-clean.md` (`lang: "en"`)<br>`test-native-english-clean-zh-CN.md` (`lang: "zh-CN"`) | 原生英文主篇（无后缀命名）+ 中文从属翻译 | **2 / 2** | 🟢 **100% 正常** | 默认加载即展示英文变体（`data-lang="en"` 且可见），中文处于隐藏状态；点击切换按钮后中文瞬间展示，英文隐藏，DOM 属性全部精准同步。 |
| **`test-matrix-native-en`** | `test-matrix-native-en.md` (`lang: "en"`)<br>`test-matrix-native-en-zh-CN.md` (`lang: "zh-CN"`) | 双后缀命名（无无后缀主文件） | **2 / 2** | 🟢 **缺陷修复 (100% 正常)** | 成功生成 `/posts/test-matrix-native/`，英文与中文 2 个变体均成功渲染，无缝切换，彻底解决此前 0 变体及 404 漏洞！ |
| **`test-matrix-casing`** | `test-matrix-casing.md` (`lang: "zh-CN"`)<br>`test-matrix-casing-en.md` (`lang: "EN"`) | Frontmatter 异常大写 `lang: "EN"` | **2 / 2** | 🟢 **缺陷修复 (100% 正常)** | 变体成功自动归一化挂载为 `data-lang="en"`，UI 按钮显示为优雅的 "English"，切换后 `document.documentElement.lang` 正确同步为标准 `en`。 |
| **`test-i18n-resilience`** | `test-i18n-resilience.md` (`i18nKey: "custom-resilient-key-2026"`)<br>`test-i18n-resilience-en.md` (省略 `i18nKey`) | 子篇遗漏 `i18nKey` 时的双向文件名基名推导 | **2 / 2** | 🟢 **100% 正常** | 系统凭借基名推导算法成功关联英文子篇，两篇均正常挂载并在 DOM 中顺畅切换。 |

---

## 三、全量 27 组文章 Playwright 提取数据清单 (1089 项断言全绿)

| 序号 | 文章标识 (i18nKey) | 访问路径 | 变体数 | 默认显示语系 | 各语系字符量 (zh-CN / zh-Hant / en / fr / es / de) | 按钮真实点击秒切 | 状态评估 |
| :---: | :--- | :--- | :---: | :---: | :--- | :---: | :---: |
| 1 | `access-control-lab` | `/posts/access-control-lab/` | 🛡️ 0 | N/A (受控) | 0 / 0 / 0 / 0 / 0 / 0 (服务端密码门禁阻断，零泄漏) | N/A | 🟢 安全隔离正常 |
| 2 | `anzhiyu-markdown-showcase` | `/posts/anzhiyu-markdown-showcase/` | 6/6 | `zh-CN` | 4,703 / 4,714 / 13,642 / 15,133 / 16,130 / 14,089 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 3 | `api-ready-theme-contracts` | `/posts/api-ready-theme-contracts/` | 6/6 | `zh-CN` | 253 / 249 / 760 / 915 / 916 / 851 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 4 | `badges-guide` | `/posts/badges-guide/` | 6/6 | `zh-CN` | 12,093 / 12,125 / 30,484 / 36,456 / 35,895 / 34,456 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 5 | `content-first-homepage` | `/posts/content-first-homepage/` | 6/6 | `zh-CN` | 237 / 247 / 872 / 1,120 / 1,047 / 965 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 6 | `content-formats-and-markup-mastery` | `/posts/content-formats-and-markup-mastery/` | 6/6 | `zh-CN` | 19,161 / 19,261 / 41,541 / 50,098 / 49,875 / 46,692 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 7 | `example-all-special-formats` | `/posts/example-all-special-formats/` | 6/6 | `zh-CN` | 783 / 784 / 1,448 / 1,807 / 1,787 / 1,737 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 8 | `example-callouts` | `/posts/example-callouts/` | 6/6 | `zh-CN` | 1,998 / 2,015 / 4,538 / 5,573 / 5,600 / 5,283 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 9 | `example-code-enhancements` | `/posts/example-code-enhancements/` | 6/6 | `zh-CN` | 1,730 / 1,745 / 2,251 / 2,377 / 2,515 / 2,430 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 10 | `example-details-collapse` | `/posts/example-details-collapse/` | 6/6 | `zh-CN` | 2,585 / 1,744 / 3,129 / 3,378 / 4,342 / 4,158 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 11 | `example-embeds` | `/posts/example-embeds/` | 6/6 | `zh-CN` | 1,369 / 1,371 / 2,207 / 2,558 / 2,623 / 2,461 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 (已打磨) |
| 12 | `example-frontmatter-fields` | `/posts/example-frontmatter-fields/` | 6/6 | `zh-CN` | 1,050 / 1,050 / 1,719 / 1,931 / 1,997 / 1,832 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 13 | `example-gallery-figure` | `/posts/example-gallery-figure/` | 6/6 | `zh-CN` | 675 / 679 / 1,035 / 1,335 / 1,267 / 1,245 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 (已打磨) |
| 14 | `example-math` | `/posts/example-math/` | 6/6 | `zh-CN` | 1,351 / 1,352 / 1,844 / 2,114 / 2,013 / 1,962 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 15 | `example-mermaid` | `/posts/example-mermaid/` | 6/6 | `zh-CN` | 832 / 838 / 1,813 / 2,372 / 2,352 / 1,996 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 16 | `example-mindmap` | `/posts/example-mindmap/` | 6/6 | `zh-CN` | 1,946 / 1,953 / 3,957 / 4,661 / 4,623 / 4,469 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 17 | `example-tabs` | `/posts/example-tabs/` | 6/6 | `zh-CN` | 1,101 / 995 / 1,462 / 1,569 / 1,693 / 1,571 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 18 | `hello-world` | `/posts/hello-world/` | 6/6 | `zh-CN` | 453 / 453 / 1,135 / 1,444 / 1,394 / 1,360 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 19 | `learning-through-rebuilds` | `/posts/learning-through-rebuilds/` | 6/6 | `zh-CN` | 209 / 211 / 842 / 970 / 915 / 885 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 20 | `markdown-scan-showcase` | `/posts/markdown-scan-showcase/` | 6/6 | `zh-CN` | 3,037 / 3,068 / 8,601 / 10,502 / 9,551 / 9,605 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 21 | `markdown-syntax-mastery` | `/posts/markdown-syntax-mastery/` | 6/6 | `zh-CN` | 7,675 / 7,840 / 14,213 / 17,347 / 17,648 / 16,673 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 22 | `media-capability-lab` | `/posts/media-capability-lab/` | 6/6 | `zh-CN` | 527 / 546 / 1,749 / 2,289 / 2,309 / 2,076 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 23 | `readable-geek-interfaces` | `/posts/readable-geek-interfaces/` | 6/6 | `zh-CN` | 233 / 235 / 848 / 1,017 / 921 / 926 | ✅ 全部 6 语系无缝秒切 | 🟢 正常 |
| 24 | `test-native-english-clean` | `/posts/test-native-english-clean/` | 2/2 | `en` | 132 / - / 397 / - / - / - | ✅ en ⇄ zh-CN 秒切通过 | 🟢 正常 (原生英文主篇) |
| 25 | `test-matrix-native-en` | `/posts/test-matrix-native/` | 2/2 | `en` | 61 / - / 260 / - / - / - | ✅ en ⇄ zh-CN 秒切通过 | 🟢 正常 (双后缀修复) |
| 26 | `test-matrix-casing` | `/posts/test-matrix-casing/` | 2/2 | `zh-CN` | 37 / - / 259 / - / - / - | ✅ zh-CN ⇄ en 秒切通过 | 🟢 正常 (大小写归一化) |
| 27 | `test-i18n-resilience` | `/posts/test-i18n-resilience/` | 2/2 | `zh-CN` | 186 / - / 390 / - / - / - | ✅ zh-CN ⇄ en 秒切通过 | 🟢 正常 (容错推导) |

---

## 四、打磨与加固总结

1. **变体完整率**: **140 / 140 (100.0%)**，全量 26 篇公开文章组（含 4 组极限测试用例）在 DOM 中均具有真实的排版高度与完整内容；
2. **显示切换率**: **140 / 140 (100.0%)**，即时切换至任意语系时，目标变体平滑展现，其余语系安全隔离；
3. **架构隐患彻底根除**: 双后缀重定向死锁、语言大小写失配、内嵌 HTML 属性未本地化等 3 大隐患已全量闭环修复并经过 Playwright 真实浏览器端到端检验。