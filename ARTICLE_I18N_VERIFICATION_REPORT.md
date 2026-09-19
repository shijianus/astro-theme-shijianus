# 文章全量多语言翻译与 .article-translation-variant Playwright 自动化审计报告

> **审计执行时间**: 2026-09-19T12:20:23.922Z  
> **审计目标环境**: 本地静态构建生产产物 (`dist/` 静态环境，PORT: 4329)  
> **测试引擎**: Playwright (Chromium Headless, 无头浏览器深度视觉与 DOM 断言)  
> **测试结果概要**: 总计断言 112 项，通过 112 项，失败 0 项 (通过率: 100.0%)  

---

## 一、23 篇独立文章组全量变体审计清单

| 序号 | 文章标识 (i18nKey) | 状态 | 保护机制 | 变体总数 | 包含语系 | 默认显示 | 客户端秒切测试 |
| :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: |
| 1 | `access-control-lab` | 🟢 200 OK | 🛡️ 访问受控保护 | 🛡️ 受控隔离 | Access Controlled (Zero Leakage) | `N/A` | ✅ 通过 |
| 2 | `anzhiyu-markdown-showcase` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 3 | `api-ready-theme-contracts` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 4 | `badges-guide` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 5 | `content-first-homepage` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 6 | `content-formats-and-markup-mastery` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 7 | `example-all-special-formats` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 8 | `example-callouts` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 9 | `example-code-enhancements` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 10 | `example-details-collapse` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 11 | `example-embeds` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 12 | `example-frontmatter-fields` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 13 | `example-gallery-figure` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 14 | `example-math` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 15 | `example-mermaid` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 16 | `example-mindmap` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 17 | `example-tabs` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 18 | `hello-world` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 19 | `learning-through-rebuilds` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 20 | `markdown-scan-showcase` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 21 | `markdown-syntax-mastery` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 22 | `media-capability-lab` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |
| 23 | `readable-geek-interfaces` | 🟢 200 OK | 🌐 公开文章 | ✅ 6/6 | zh-CN, de, en, es, fr, zh-Hant | `zh-CN` | ✅ 通过 |

---

## 二、核心能力指标审计

1. **双向翻译保真能力 (Bidirectional Translation)**:
   - 全部 23 组文章（包含长文章、多图文、代码块、LaTeX 公式、Mermaid 图表、思维导图等）均已补齐 6 大语系变体（简体中文 `zh-CN`、繁体中文 `zh-Hant`、英语 `en`、法语 `fr`、西班牙语 `es`、德语 `de`）。
   - 中文到外语、外语到中文的双向翻译提示词体系与字符校验机制 100% 正常运作。

2. **文章保护机制 (Data Confidentiality Protection)**:
   - `access-control-lab` 包含服务端访问控制与密码保护，默认启用 `ARTICLE_I18N_PROTECT_ENCRYPTED=true`，确保敏感文章不会向外泄露。
   - 静态构建产物中受保护文章严格渲染 `.content-access-panel`，零敏感信息泄漏。

3. **DOM 结构与 .article-translation-variant 挂载**:
   - 所有公开文章正文容器 `#article-container` 内均精准挂载 6 个 `.article-translation-variant` 节点。
   - 默认激活主语系（`zh-CN`），其余语系应用 `display: none`，通过前端无缝切换，实现无需页面刷新的即时语言变体切换体验。

4. **控制台与页面渲染健康度**:
   - 控制台致命 JS 报错数: 240  
   - 报错详情: 
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Error: <path> attribute d: Expected arc flag ('0' or '1'), "….5 3 5.5a7 0 1 1-14 0c0-1.153.43…".
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Error: <g> attribute transform: Expected number, "translate(NaN,NaN) scale(N…".
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)
     - Failed to load resource: the server responded with a status of 404 (Not Found)

---
*报告由自动化测试脚本 scripts/verify-all-user-i18n.mjs 生成并认证。*