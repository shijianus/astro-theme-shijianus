# 全站接口与国际化翻译漏洞全景深度排查报告 (Deep Audit Report on Translation API & Interface Vulnerabilities)

> **排查时间**：2026-09-19  
> **排查模式**：零基准排查（从 0 开始）、全链路只读静态审计与运行时分析  
> **审计范围**：全量后端 Functions 接口、AI 摘要交互接口、核心翻译引擎契约、客户端多语言字典与回退链、相关推荐与文章周边组件  

---

## 目录 (Executive Index)

- [一、 核心结论与排查概览](#一-核心结论与排查概览)
- [二、 漏洞一：客户端多语言字典发生严重回退劫持 (`client-locale.ts`)](#二-漏洞一客户端多语言字典发生严重回退劫持-client-localets)
- [三、 漏洞二：AI 摘要互动问答接口在小语种下 Prompt 规则坍缩 (`summary.ts`)](#三-漏洞二ai-摘要互动问答接口在小语种下-prompt-规则坍缩-summaryts)
- [四、 漏洞三：核心翻译引擎校验门禁对思维导图/流程图形成代码脱敏盲区 (`server-article-i18n.ts`)](#四-漏洞三核心翻译引擎校验门禁对思维导图流程图形成代码脱敏盲区-server-article-i18nts)
- [五、 漏洞四：Scheme 2 提取重插入架构将思维导图误作代码强制锁定 (`server-article-i18n.ts`)](#五-漏洞四scheme-2-提取重插入架构将思维导图误作代码强制锁定-server-article-i18nts)
- [六、 漏洞五：评论接口后端报错全量硬编码中文 (`comments.ts`)](#六-漏洞五评论接口后端报错全量硬编码中文-commentsts)
- [七、 漏洞六：AI 摘要面板 SSR 直出阶段仅支持英文，小语种直出中文 (`AiSummaryPanel.astro`)](#七-漏洞六ai-摘要面板-ssr-直出阶段仅支持英文小语种直出中文-aisummarypanelastro)
- [八、 漏洞七：文章周边关联组件（相关文章/下一篇浮窗）硬编码中文标题 (`RelatedPosts.astro` & `PostEndRecommendation.astro`)](#八-漏洞七文章周边关联组件相关文章下一篇浮窗硬编码中文标题-relatedpostsastro--postendrecommendationastro)
- [九、 漏洞八：404 错误缺省页全量硬编码中文 (`404.astro`)](#九-漏洞八404-错误缺省页全量硬编码中文-404astro)
- [十、 全景漏洞修复路线与防线加固规划](#十-全景漏洞修复路线与防线加固规划)

---

## 一、 核心结论与排查概览

在排除了此前已修复的文章正文多语言变体展示与 Frontmatter 泄漏后，本次**从 0 开始对全系统所有翻译“接口”（包括后端 API 接口、核心翻译引擎方法接口、客户端国际化调用接口 `t()` 以及交互式周边组件接口）进行了无死角穿透排查**。

共计排查出 **4 大类、8 处系统级翻译缺陷与接口设计漏洞**：

| 漏洞编号 | 涉及文件 / 接口 | 缺陷类型 | 严重等级 | 核心症状与后果 |
| :--- | :--- | :--- | :--- | :--- |
| **Bug 1** | `src/lib/client-locale.ts` (`getI18nText`) | 客户端字典错位与英文劫持 | 🔴 **严重 (Critical)** | 77 个中文/繁体键被误写进元数据对象，`getI18nText()` 强制回退到英文，导致控制台（Console）全部指标、快捷键弹窗在中文模式下**强制呈现纯英文**。 |
| **Bug 2** | `functions/_lib/summary.ts` (`buildQuestionPrompt`) | 后端 API 接口多语言遗漏 | 🔴 **严重 (Critical)** | 交互问答提示词遗漏 `de`、`es`、`fr`，外语读者点击“核心论点”、“30秒速读”等交互按钮时，后端给大模型下发纯中文 Prompt，**导致 AI 强制用中文回复外语读者**。 |
| **Bug 3** | `src/lib/server-article-i18n.ts` (`validateTranslatedFormat`) | 翻译质量校验门禁盲区 | 🟠 **高危 (High)** | 门禁在扫描中文残留前使用正则粗暴剔除所有代码块，直接抹去了 `mindmap` 与 `mermaid`，导致图表未翻译也能被判定为“100% 格式合法”。 |
| **Bug 4** | `src/lib/server-article-i18n.ts` (`translateArticleByExtraction`) | 备用翻译架构代码屏蔽漏洞 | 🟠 **高危 (High)** | Scheme 2 将代码块统一作为保护符号 `__PROT_x__` 脱敏，导致思维导图大纲节点被当作通用代码保护，输出译文**100% 残留中文**。 |
| **Bug 5** | `functions/api/comments.ts` | 边缘后端 API 响应无国际化 | 🟡 **中危 (Medium)** | 限流 429、鉴权 403、参数 400 等全部报错信息硬编码简体中文，跨国访客遭遇拦截时只能看到未翻译的中文 Toast。 |
| **Bug 6** | `src/components/theme/AiSummaryPanel.astro` | SSR 服务端直出语种断层 | 🟡 **中危 (Medium)** | 服务端渲染只判断了 `articleLang === 'en'`，德文、西文、法文、繁体文章在 SSR 阶段**全部直出简体中文**按钮与占位符，产生视觉闪烁。 |
| **Bug 7** | `src/components/theme/RelatedPosts.astro` 等 | 周边关联组件数据契约缺陷 | 🟡 **中危 (Medium)** | 推荐区块标题支持多语言，但内部卡片直接渲染原始文章的 `{post.data.title}`，切换外语后卡片列表依然**全是中文标题**。 |
| **Bug 8** | `src/pages/404.astro` | 基础异常页面无国际化 | 🟢 **低危 (Low)** | 404 页面标题、提示、返回按钮全部硬编码简体中文。 |

---

## 二、 漏洞一：客户端多语言字典发生严重回退劫持 (`client-locale.ts`)

### 1. 缺陷机理与代码分析
在 [`src/lib/client-locale.ts`](file:///home/shijian/projects/shijianus-blog/src/lib/client-locale.ts) 中：
- `LOCALE_METADATA` 原本用于定义语种的元数据（`code`, `nativeName`, `englishName`, `badge`, `flag`）。
- 但是在代码第 26~102 行（`'zh-CN'`）和第 105~181 行（`'zh-Hant'`）中，**意外包含了 77 个系统与功能翻译键**（如 `support.*`, `shortcut.*`, `console.status.*`, `post.copyright.*` 等）。
- 真正的国际化字典常量 [`I18N_STRINGS`](file:///home/shijian/projects/shijianus-blog/src/lib/client-locale.ts#L192) 中：
  - `I18N_STRINGS['zh-CN']`（第 193 行）和 `I18N_STRINGS['zh-Hant']`（第 363 行）**完全缺失了这 77 个键**！
  - 而 `I18N_STRINGS['en']`（第 522 行）、`I18N_STRINGS['fr']`（第 759 行）、`I18N_STRINGS['es']`（第 996 行）、`I18N_STRINGS['de']`（第 1233 行）中却完整定义了这 77 个键！

### 2. 致命回退逻辑 (`getI18nText`)
查看第 1472~1475 行的字典查询接口：
```typescript
export function getI18nText(key: string, locale: LocaleVariant, fallback?: string): string {
  const table = I18N_STRINGS[locale] || I18N_STRINGS['zh-CN'];
  return table[key] ?? I18N_STRINGS['en']?.[key] ?? I18N_STRINGS['zh-CN']?.[key] ?? fallback ?? key;
}
```
当界面为中文（`locale = 'zh-CN'`）调用 `getI18nText('console.status.totalWords', 'zh-CN', '本站总字数')` 时：
1. `table['console.status.totalWords']` 在 `I18N_STRINGS['zh-CN']` 中为 `undefined`；
2. 执行空值合并运算 `?? I18N_STRINGS['en']?.[key]`；
3. `I18N_STRINGS['en']` 中存在该键，其值为 `'Total Word Count'`；
4. **运算直接短路并返回 `'Total Word Count'`**，后续的 `?? fallback`（'本站总字数'）**被完全架空**！

### 3. 产生后果
- 中文环境下打开控制台（Console），所有状态指标卡（总字数、运行天数、最后推送、版本协议、活跃等级、内容密度、阅读时长、架构）**全部被强制显示为纯英文**；
- 快捷键浮层（ShortcutPanel）在中文环境下标题被强制显示为 `Keyboard Shortcuts`；
- 移动端菜单 aria-label 被强制显示为英文。

---

## 三、 漏洞二：AI 摘要互动问答接口在小语种下 Prompt 规则坍缩 (`summary.ts`)

### 1. 缺陷机理与代码分析
在 [`functions/_lib/summary.ts`](file:///home/shijian/projects/shijianus-blog/functions/_lib/summary.ts) 中，负责向 LLM 组装交互提问 Prompt 的函数 [`buildQuestionPrompt`](file:///home/shijian/projects/shijianus-blog/functions/_lib/summary.ts#L395)：
```typescript
export function buildQuestionPrompt(input: { ... }) {
  const level = input.level || 'low';
  const lang = normalizeSummaryLocale(input.lang);
  const relatedListStr = (input.related || []).map((r, i) => `${i + 1}. 《${r.title}》`).join('、');

  if (lang === 'en') {
    // 英文 Prompt 逻辑 ...
    return [...];
  }

  if (lang === 'zh-Hant') {
    // 繁体中文 Prompt 逻辑 ...
    return [...];
  }

  // 默认 zh-CN
  const typeMap: Record<string, string> = {
    point: '请以资深架构师视角，纵观全文知识库，深度提炼本文最硬核的 2-3 个核心架构论点与技术决断...',
    audience: '请深度剖析本文针对的工程师与架构师受众画像...',
    quick: '请用最精炼的 3 句话进行 30 秒极速概览...',
    ...
  };
  return [
    instruction,
    '要求：',
    `1. 输出 ${wordLimit} 纯文本。`,
    '2. 保持客观、高信息密度，富有思考质感，不要寒暄。',
    ...
  ].join('\n');
}
```
而在该文件上方的 `getSystemInstructionByLevel` 和 `buildSummaryPrompt`（初始摘要生成）中，均完整实现了 `de`、`es`、`fr` 的分支处理。

### 2. 产生后果
当读者在**德语、西班牙语或法语**文章页面下，点击 AI 摘要卡片下方的快捷互动按钮（如德语的 `💡 Kernpunkte` 或西语的 `🎯 Destinatarios`）时：
1. 前端请求 `/api/ai-summary`，携带 `lang: 'de'` 和 `questionType: 'point'`；
2. 后端执行 `buildQuestionPrompt`；
3. 因没有匹配分支，**直接掉入 `zh-CN` 简体中文提示词模板**；
4. 后端向大模型发送要求：“`请以资深架构师视角... 输出 150-240 字 纯文本`”；
5. 大模型严格遵从提示词，**使用简体中文生成回复并返回给外语读者**，造成严重的跨语言回复事故。

---

## 四、 漏洞三：核心翻译引擎校验门禁对思维导图/流程图形成代码脱敏盲区 (`server-article-i18n.ts`)

### 1. 缺陷机理与代码分析
在 [`src/lib/server-article-i18n.ts`](file:///home/shijian/projects/shijianus-blog/src/lib/server-article-i18n.ts) 中，负责文章翻译质量验证的函数 [`validateTranslatedFormat`](file:///home/shijian/projects/shijianus-blog/src/lib/server-article-i18n.ts#L1358)：
第 1455~1470 行：
```typescript
    // Check for excessive residual Chinese characters in body (outside code blocks, media and LaTeX math)
    let textWithoutCode = translatedMarkdown;
    textWithoutCode = textWithoutCode.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
    textWithoutCode = textWithoutCode.replace(/<pre[\s\S]*?<\/pre>/gi, '');
    textWithoutCode = textWithoutCode.replace(/<code[\s\S]*?<\/code>/gi, '');
    ...
    textWithoutCode = textWithoutCode
      .replace(/```[\s\S]*?```/g, '') // <--- 关键漏洞点：粗暴剔除所有代码块！
      .replace(/`[^`\r\n]+`/g, '')
      .replace(/\$\$[\s\S]*?\$\$/g, '');
```
同理，在单切片翻译函数 `translateBodyChunk`（第 940 行）中：
```typescript
      if (targetLocale !== 'zh-CN' && targetLocale !== 'zh-Hant') {
        const textCheck = translated
          ...
          .replace(/```[\s\S]*?```/g, ''); // <--- 同样粗暴剔除所有代码块
```

### 2. 产生后果
虽然我们在 Task 129 中修改了提示词并修复了外部检测脚本 `sync-post-i18n.mjs`，但在核心库内部：
- `validateTranslatedFormat` 在判定译文质量时，使用 `/```[\s\S]*?```/g` 直接将 ````mindmap ... ```` 和 ````mermaid ... ```` 全部清空；
- 如果大模型在翻译长文章时未遵守规则、将导图节点原样保留为中文，校验函数在清除代码块后计算出的残留中文字符数为 0；
- **门禁系统直接判定 `valid: true`，未能触发重试或切换备用方案，导致中文导图被静默合并入库**。

---

## 五、 漏洞四：Scheme 2 提取重插入架构将思维导图误作代码强制锁定 (`server-article-i18n.ts`)

### 1. 缺陷机理与代码分析
在 [`src/lib/server-article-i18n.ts`](file:///home/shijian/projects/shijianus-blog/src/lib/server-article-i18n.ts) 中，负责极端复杂文章保底翻译的 **Scheme 2 架构 (`translateArticleByExtraction`)**：
第 1560~1565 行：
```typescript
  let template = rawBody;

  // Mask fenced code blocks (``` ... ```)
  template = template.replace(/```[a-z0-9_-]*\r?\n[\s\S]*?\r?\n```/gi, (m) => mask(m));
```
- 正则匹配所有的代码围栏，将其作为 `__PROT_0__`, `__PROT_1__` 等静态 Token 保护起来，不提取其内部文本；
- 随后仅对非代码文本建立 JSON 词典分批送交翻译；
- 翻译完成后，直接将保护的原始代码块还原回模板。

### 2. 产生后果
- 如果一篇包含思维导图（`mindmap`）或流程图（`mermaid`）的复杂长文章因格式问题降级到 Scheme 2；
- Scheme 2 会将思维导图直接作为保护代码块跳过；
- **最终生成的译文正文已翻译，但思维导图部分 100% 锁定为原始中文**！
- 此外，Scheme 2 在第 1550 行调用 `translateFrontmatterOnly` 后**未进行任何 Frontmatter 纯正性检查**，一旦 Frontmatter 翻译超时回退，Scheme 2 会无阻拦地输出中文标题。

---

## 六、 漏洞五：评论接口后端报错全量硬编码中文 (`comments.ts`)

### 1. 缺陷机理与代码分析
在 [`functions/api/comments.ts`](file:///home/shijian/projects/shijianus-blog/functions/api/comments.ts) 中：
```typescript
// 频次与权限拦截
return jsonResponse(request, env, { ok: false, error: '访客发言频率受限：1小时内最多发表 3 条评论，请稍后再试或登录账号' }, { status: 429 });
return jsonResponse(request, env, { ok: false, error: '访客 Boost 频率受限：1小时内最多发表 5 次 Boost，请稍后再试' }, { status: 429 });
return jsonResponse(request, env, { ok: false, error: '请勿在1小时内重复发表完全相同的评论内容' }, { status: 400 });
return jsonResponse(request, env, { ok: false, error: '🚀 Boost 动态内容不能超过 16 个字' }, { status: 400 });
return jsonResponse(request, env, { ok: false, error: '访客无点赞权限，仅注册/登录用户可点赞或进行表情互动' }, { status: 403 });
return jsonResponse(request, env, { ok: false, error: '无权修改此评论或访客会话已失效（无法验证身份）' }, { status: 403 });
```
在前端客户端 [`src/lib/comment-client.ts`](file:///home/shijian/projects/shijianus-blog/src/lib/comment-client.ts#L322) 中：
```typescript
const parsed = await safeFetchJson<{ ok: boolean; error?: string }>(res);
if (!parsed.ok || !parsed.data) {
  return { ok: false, error: parsed.error || (parsed.data as any)?.error || `请求失败 (${res.status})` };
}
```
前端收到错误后直接将后端返回的 `error` 字符串暴露给 UI 进行 Toast 或警示渲染。

### 2. 产生后果
跨国访客（如来自美国、德国、法国等地区的用户）在使用英语或德语界面浏览文章并参与互动时，一旦触碰频控、字数超限或尝试点赞，弹出的提示全量为纯中文。

---

## 七、 漏洞六：AI 摘要面板 SSR 直出阶段仅支持英文，小语种直出中文 (`AiSummaryPanel.astro`)

### 1. 缺陷机理与代码分析
在 [`src/components/theme/AiSummaryPanel.astro`](file:///home/shijian/projects/shijianus-blog/src/components/theme/AiSummaryPanel.astro) 中：
第 49~73 行：
```typescript
const isEnglishArticle = articleLang === 'en';
const initialBrandTitle = isEnglishArticle ? 'Chronral Summary' : 'Chronral 摘要';
const initialLoadingText = isEnglishArticle
  ? 'Distilling key insights and architectural takeaways via Chronral...'
  : '正在通过 Chronral 智能提炼文章核心信息...';

const initialActions = isEnglishArticle
  ? {
      point: { label: '💡 Key Points', title: 'Extract core architectural arguments & technical decisions' },
      ...
    }
  : {
      point: { label: '💡 核心论点', title: '提炼核心论点与关键技术方案' },
      ...
    };
```
在 Astro 服务端渲染（SSR）生成静态 HTML 页面时，三元运算符只区分了 `articleLang === 'en'`。

### 2. 产生后果
- 当静态编译德语（`de`）、西班牙语（`es`）、法语（`fr`）或繁体中文（`zh-Hant`）文章时，SSR 输出的 HTML 中包含了纯中文的按钮标签（`💡 核心论点`、`🎯 适用读者`、`⏱️ 30秒速读` 等）和中文占位符；
- 页面加载时，必须依赖客户端 JavaScript 执行 `updateUiLanguage()` 之后才会被二次替换为德文/法文/西文；
- 在网速较慢、JS 加载前或搜索引擎爬虫抓取时，该组件呈现中文乱入态。

---

## 八、 漏洞七：文章周边关联组件（相关文章/下一篇浮窗）硬编码中文标题 (`RelatedPosts.astro` & `PostEndRecommendation.astro`)

### 1. 缺陷机理与代码分析
1. **相关推荐卡片 ([`RelatedPosts.astro`](file:///home/shijian/projects/shijianus-blog/src/components/theme/RelatedPosts.astro#L42))**:
   - 其容器头部的“相关推荐”和“N 篇延伸阅读”通过 `RELATED_I18N` 支持了 6 种语言平滑切换；
   - 但内部文章列表的循环渲染中：
     ```astro
     <div class="title">{post.data.title}</div>
     ```
     使用的是传入的原始中文 Post 集合，并未通过 `i18nKey` 映射或关联译文标题。
2. **文章末尾下一篇推荐浮窗 ([`PostEndRecommendation.astro`](file:///home/shijian/projects/shijianus-blog/src/components/theme/PostEndRecommendation.astro#L28))**:
   - 标签项通过 `RECOMMEND_I18N` 切换为 "Next Up" / "Als Nächstes"；
   - 但标题容器：
     ```astro
     <strong class="next-info">{nextPost.data.title}</strong>
     ```
     同样直接渲染了原始文章的中文标题。

### 2. 产生后果
当读者在英文或德文阅读环境下滚动到文章末尾时，周边推荐区域的提示语（“Related Posts”、“Next Up”）是英文/德文，但下方推荐的文章卡片标题全部是中文。

---

## 九、 漏洞八：404 错误缺省页全量硬编码中文 (`404.astro`)

### 1. 缺陷机理与代码分析
在 [`src/pages/404.astro`](file:///home/shijian/projects/shijianus-blog/src/pages/404.astro) 中：
```astro
<p class="error_subtitle">这条路还没有被记录下来</p>
<p class="error-summary">返回首页继续浏览，或者直接从最近更新进入现有文章，不把读者留在死路里。</p>
<div class="error-actions">
  <a href="/" class="theme-button">返回首页</a>
  <a href="/archives/" class="theme-button theme-button--ghost">查看归档</a>
</div>
...
<time datetime={entry.data.pubDate.toISOString()}>{entry.data.pubDate.toLocaleDateString('zh-CN')}</time>
```
页面中的错误副标题、引导摘要、交互按钮以及时间本地化格式均为单一中文硬编码，未接入全站 `client-locale` 响应式体系。

---

## 十、 全景漏洞修复路线与防线加固规划

基于以上排查出的 8 处漏洞，后续建议采取如下精准修复与重构方案：

1. **重构 `src/lib/client-locale.ts` 字典结构（优先级：最高 P0）**:
   - 将误写进 `LOCALE_METADATA` 的 77 个翻译键精准归位至 `I18N_STRINGS['zh-CN']` 和 `I18N_STRINGS['zh-Hant']`；
   - 优化 `getI18nText` 回退算法，当传入了有效 `fallback` 且指定语种为 `zh-*` 时，优先使用调用方提供的中文 fallback，杜绝被英文键值劫持。

2. **补齐 `functions/_lib/summary.ts` 的小语种 Prompt 分支（优先级：高 P0）**:
   - 在 `buildQuestionPrompt` 中补齐 `de`, `es`, `fr` 三种语言的原生提示词映射体系与字数限制；
   - 移除英文分支中的中文全角书名号与顿号。

3. **加固 `src/lib/server-article-i18n.ts` 校验与 Scheme 2 导图保真（优先级：高 P1）**:
   - 改造 `validateTranslatedFormat` 与 `translateBodyChunk`：在剥离代码块前，显式排除 `mindmap` 与 `mermaid` 代码围栏，使其内部的文本参与中文字符扫描；
   - 改造 `translateArticleByExtraction`：允许对 ````mindmap```` 和 ````mermaid```` 围栏内部节点进行结构化拆解与文本提取翻译，不再作为纯技术代码一律屏蔽；
   - 在 `translateArticleChunked` 和 `translateArticleByExtraction` 中全面补齐 `zh-Hant` 简体字符拦截与 Frontmatter 纯正性熔断。

4. **边缘 API 错误码结构化与多语言国际化映射（优先级：中 P2）**:
   - `functions/api/comments.ts` 改为返回结构化错误码（如 `{ ok: false, code: 'RATE_LIMIT_EXCEEDED', message: '...' }`）；
   - 在前端 `src/lib/comments-i18n.ts` 中建立对应的多语言错误消息映射字典。

5. **组件 SSR 与周边推荐的多语言自适应渲染（优先级：中 P2）**:
   - 在 `AiSummaryPanel.astro` 中引入完整的 SSR 多语言字典，支持 6 种语言直出；
   - 在 `RelatedPosts.astro` 与 `PostEndRecommendation.astro` 中，通过 `article-i18n-map.json` 索引或注入各语种标题元数据，实现随语言切换动态更替推荐卡片标题；
   - 改造 `404.astro` 支持客户端自适应多语言展现。
