# RFC-002 · 信息熵与内容密度评价标准

**文档标识符**：`SHIJIANUS-RFC-002`  
**版本**：`v1.0.0`  
**状态**：`ACTIVE`  
**生效日期**：见 Git Tag  
**所有者**：Shijianus Infrastructure Working Group  
**依赖文档**：无  
**被依赖文档**：`SHIJIANUS-RFC-001`（活跃度等级标准）、`SHIJIANUS-RFC-003`（版本治理协议）

---

## 目录

1. [概述与动机](#1-概述与动机)
2. [术语定义](#2-术语定义)
3. [AST 解析规范](#3-ast-解析规范)
4. [多维度特征提取](#4-多维度特征提取)
5. [信息密度数学模型](#5-信息密度数学模型)
6. [结构质量评估](#6-结构质量评估)
7. [内容层级分类系统](#7-内容层级分类系统)
8. [输出规范与集成](#8-输出规范与集成)
9. [已知局限与边界条件](#9-已知局限与边界条件)
10. [附录](#10-附录)

---

## 1. 概述与动机

### 1.1 问题陈述

字数统计（Word Count）是博客内容评价中最普遍、也最具误导性的指标。它将以下本质不同的内容等同对待：

- 一篇 2000 词逻辑严密、有代码支撑的系统设计文章
- 一篇 2000 词充斥重复表达、无结构的流水账记录
- 一篇 500 词但附有 80 行核心算法实现的技术备忘

真正需要衡量的是内容的**信噪比（Signal-to-Noise Ratio）**，即在给定篇幅内，有多大比例属于可被读者有效吸收的结构化信息。

### 1.2 技术路线选择

本 RFC 选择基于 **Remark/Rehype AST（抽象语法树）** 而非 HTML 字符串处理的原因：

| 对比维度 | HTML 字符串处理 | AST 节点分析（本方案）|
|---------|---------------|----------------------|
| MDX 组件兼容性 | 组件渲染结果不可预测 | 直接读取组件占位节点 |
| 代码块语言识别 | 需要正则解析 class 属性 | `node.lang` 字段直接可用 |
| 标题层级提取 | 依赖 DOM 解析 | `node.depth` 字段原生支持 |
| 构建阶段可用性 | 需要额外渲染步骤 | 在 Remark 管道中直接挂载 |
| 维护成本 | 随 HTML 结构变化而脆化 | 与 Markdown 语法耦合稳定 |

**构建开销说明**：在 200 篇文章规模下，完整 AST 遍历约增加 1.5–3 秒的构建时间。超过 1000 篇时，建议启用增量计算（仅对 Git diff 中出现的文件重新分析）。

---

## 2. 术语定义

| 术语 | 符号 | 定义 |
|------|------|------|
| 等效词数 | $W$ | 将文章中所有内容折算为"信息当量词数"的综合度量，非简单字数统计 |
| 纯文本词数 | $W_{\text{text}}$ | Paragraph、Blockquote 等节点中的原始词数（中文做折算） |
| 代码等效词数 | $W_{\text{code}}$ | 所有代码块折算后的信息当量 |
| 媒体加成 | $B_{\text{media}}$ | 图片、数学公式、脚注等富媒体元素的附加得分 |
| 结构质量系数 | $S_q$ | 衡量内容组织合理性的系数，范围 $[0.5, 1.0]$ |
| 内容密度得分 | $\text{CD}$ | 综合以上所有维度的最终分值，范围 $[0, 1]$ |
| 内容密度权重 | $w$ | $\text{CD}$ 映射到 RFC-001 使用的 $[0.1, 2.0]$ 区间的值 |
| 代码语言类别 | $C_{\text{lang}}$ | 代码块语言对应的信息权重分类 |
| 标题树深度 | $H_{\text{depth}}$ | 文章使用的最深标题层级（H1=1, H6=6）|
| 段落超长指数 | $P_{\text{over}}$ | 超过长度阈值的段落数量占比 |

---

## 3. AST 解析规范

### 3.1 MDAST 节点类型覆盖

本系统在 Remark 处理管道中注入自定义插件，遍历以下 MDAST 节点类型：

```
Root
├── paragraph          → 纯文本词数提取
├── heading            → 标题层级与密度分析
├── code               → 代码块语言、行数
├── blockquote         → 引用块词数（权重折减）
├── list               → 列表项计数
│   └── listItem       → 单项词数
├── image              → 富媒体计数
├── math               → 数学公式计数（remark-math）
├── footnoteDefinition → 脚注计数
├── table              → 表格行列数
│   ├── tableRow
│   └── tableCell
└── thematicBreak      → 分隔符（用于内容分段检测）
```

不参与计算的节点类型：`html`（内嵌 HTML）、`yaml`（Frontmatter）、`definition`（链接定义）。

### 3.2 Remark 插件实现框架

```typescript
// src/plugins/remark-content-density.ts
import type { Root, Node, Paragraph, Heading, Code, Image } from 'mdast';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

export interface RawDensityData {
  // 文本维度
  plainTextWords: number;
  blockquoteWords: number;
  listItemCount: number;
  listItemTotalWords: number;
  paragraphLengths: number[];         // 每段词数，用于段落长度分析

  // 代码维度
  codeBlocks: CodeBlockMeta[];

  // 结构维度
  headings: HeadingMeta[];
  tables: TableMeta[];
  thematicBreakCount: number;

  // 富媒体维度
  imageCount: number;
  mathBlockCount: number;
  inlineMathCount: number;
  footnoteCount: number;
}

export interface CodeBlockMeta {
  lang: string | null;
  lineCount: number;
  charCount: number;
}

export interface HeadingMeta {
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  wordCount: number;
}

export interface TableMeta {
  rows: number;
  cols: number;
}

export function remarkContentDensity() {
  return (tree: Root, file: VFile) => {
    const data: RawDensityData = {
      plainTextWords: 0,
      blockquoteWords: 0,
      listItemCount: 0,
      listItemTotalWords: 0,
      paragraphLengths: [],
      codeBlocks: [],
      headings: [],
      tables: [],
      thematicBreakCount: 0,
      imageCount: 0,
      mathBlockCount: 0,
      inlineMathCount: 0,
      footnoteCount: 0,
    };

    visit(tree, (node: Node) => {
      switch (node.type) {
        case 'paragraph': {
          const text = extractPlainText(node as Paragraph);
          const words = countWords(text);
          data.plainTextWords += words;
          data.paragraphLengths.push(words);
          break;
        }
        case 'blockquote': {
          const text = extractPlainText(node as any);
          data.blockquoteWords += countWords(text);
          break;
        }
        case 'heading': {
          const h = node as Heading;
          const text = extractPlainText(h as any);
          data.headings.push({
            depth: h.depth,
            text,
            wordCount: countWords(text),
          });
          break;
        }
        case 'code': {
          const c = node as Code;
          const lines = (c.value ?? '').split('\n');
          data.codeBlocks.push({
            lang: c.lang ?? null,
            lineCount: lines.length,
            charCount: c.value?.length ?? 0,
          });
          break;
        }
        case 'listItem': {
          data.listItemCount++;
          const text = extractPlainText(node as any);
          data.listItemTotalWords += countWords(text);
          break;
        }
        case 'image':
          data.imageCount++;
          break;
        case 'math':
          data.mathBlockCount++;
          break;
        case 'inlineMath':
          data.inlineMathCount++;
          break;
        case 'footnoteDefinition':
          data.footnoteCount++;
          break;
        case 'table': {
          const t = node as any;
          data.tables.push({
            rows: t.children?.length ?? 0,
            cols: t.children?.[0]?.children?.length ?? 0,
          });
          break;
        }
        case 'thematicBreak':
          data.thematicBreakCount++;
          break;
      }
    });

    // 挂载到 vfile.data 供后续插件读取
    (file.data as any).densityRawData = data;
  };
}
```

### 3.3 多语言词数统计

```typescript
/**
 * 统计文本词数，兼容中英文混排。
 * 策略：
 *   - 英文：按空格分词
 *   - 中文汉字序列：按字符数 ÷ 1.8 折算（平均词长约 1.8 字）
 *   - 日文平假名/片假名：按字符数 ÷ 2.0 折算
 *   - 数字与标点：不计入词数
 */
export function countWords(text: string): number {
  if (!text) return 0;

  // 提取并统计英文词
  const englishWords = (text.match(/[a-zA-Z]+(?:['-][a-zA-Z]+)*/g) ?? []).length;

  // 提取并统计中文字符
  const chineseChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) ?? []).length;

  // 提取并统计日文假名
  const japaneseChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) ?? []).length;

  return englishWords
    + Math.ceil(chineseChars / 1.8)
    + Math.ceil(japaneseChars / 2.0);
}
```

---

## 4. 多维度特征提取

### 4.1 代码块信息权重分类

代码块携带的信息密度因语言类型有显著差异。依据语言的语义复杂度和信息压缩比，分为五个权重级别：

| 类别标识 | 权重系数 $\gamma$ | 包含语言 | 分类依据 |
|---------|-----------------|---------|---------|
| `LOGIC` | 1.5 | `ts`, `tsx`, `js`, `jsx`, `py`, `rs`, `go`, `java`, `cpp`, `c`, `cs`, `swift`, `kotlin`, `ruby`, `php` | 含逻辑、控制流、类型信息，信息压缩比最高 |
| `QUERY` | 1.3 | `sql`, `graphql`, `cypher`, `sparql` | 声明式查询语言，语义密度较高 |
| `SHELL` | 1.2 | `bash`, `sh`, `zsh`, `fish`, `powershell`, `cmd` | 命令与参数携带操作意图 |
| `MARKUP` | 0.8 | `json`, `yaml`, `toml`, `xml`, `html`, `css`, `scss`, `less`, `md`, `mdx` | 结构化数据/标记，可读性高但语义密度较低 |
| `OUTPUT` | 0.4 | `text`, `log`, `output`, `console`, `diff`，以及 `lang: null`（无标注） | 纯输出内容，信息密度最低 |

```typescript
export const LANG_WEIGHT: Record<string, number> = {
  // LOGIC
  ts: 1.5, tsx: 1.5, js: 1.5, jsx: 1.5,
  py: 1.5, python: 1.5, rs: 1.5, rust: 1.5,
  go: 1.5, java: 1.5, cpp: 1.5, 'c++': 1.5,
  c: 1.5, cs: 1.5, swift: 1.5, kotlin: 1.5,
  ruby: 1.5, php: 1.5, scala: 1.5, haskell: 1.5,
  // QUERY
  sql: 1.3, graphql: 1.3, cypher: 1.3,
  // SHELL
  bash: 1.2, sh: 1.2, zsh: 1.2, fish: 1.2,
  powershell: 1.1, cmd: 1.0,
  // MARKUP
  json: 0.8, yaml: 0.8, toml: 0.8, xml: 0.8,
  html: 0.8, css: 0.8, scss: 0.8, less: 0.8,
  // OUTPUT (default fallback = 0.4)
};

export function getLangWeight(lang: string | null): number {
  if (!lang) return 0.4;
  return LANG_WEIGHT[lang.toLowerCase()] ?? 0.4;
}
```

### 4.2 表格信息当量

表格以其高信息密度（结构化比较、多属性展示）获得独立的词数折算：

$$
W_{\text{table},j} = \text{rows}_j \times \text{cols}_j \times \beta_{\text{table}}
$$

其中 $\beta_{\text{table}} = 3$（每个表格单元格约等于 3 词的信息量，反映表格的结构化压缩效率）。单篇文章内所有表格的贡献上限为 $W_{\text{table,max}} = 200$ 等效词数，防止大型数据表格虚增密度。

### 4.3 列表信息折算

列表内容的词数以 0.85 系数折算（相比普通段落，列表的连续性和上下文密度略低）：

$$
W_{\text{list}} = 0.85 \times W_{\text{listItems}}
$$

---

## 5. 信息密度数学模型

### 5.1 总等效词数

文章的总等效词数 $W_{\text{total}}$ 由以下各项累加：

$$
W_{\text{total}} = W_{\text{text}} + W_{\text{blockquote}} + W_{\text{list}} + W_{\text{code}} + W_{\text{table}}
$$

其中各分项定义：

$$
W_{\text{text}} = W_{\text{plain}}
$$

$$
W_{\text{blockquote}} = 0.9 \times W_{\text{bq\_raw}}
\quad \text{（引用块以 0.9 系数折算，因为被引内容可能非原创）}
$$

$$
W_{\text{code}} = \sum_{k=1}^{M} \gamma_k \cdot L_k \cdot \beta_{\text{code}}
$$

其中 $L_k$ 为第 $k$ 个代码块的**有效行数**（去除空行和纯注释行后的实质代码行）：

$$
L_k^{\text{eff}} = L_k \times \left(1 - r_{\text{blank},k} - 0.5 \times r_{\text{comment},k}\right)
$$

$\beta_{\text{code}} = 6$：每行有效代码的等效词数基准值（经验标定）。

$$
W_{\text{table}} = \min\!\left(200,\; \sum_{j} \text{rows}_j \times \text{cols}_j \times 3\right)
$$

### 5.2 内容密度核心公式

使用双曲正切函数 $\tanh$ 对总等效词数进行非线性映射，得到初始密度信号 $D_{\text{raw}}$：

$$
D_{\text{raw}} = \tanh\!\left(\frac{W_{\text{total}}}{W_{\text{ref}}}\right)
$$

其中参考词数 $W_{\text{ref}} = 1200$。选择 $\tanh$ 的工程理由：
- 自然上界趋近 1.0，无需额外截断处理
- 在 $[0, W_{\text{ref}}]$ 区间内（即 $[0, 1]$ 自变量范围）呈现近似线性增长，直觉友好
- 对超长内容的边际增益递减，符合"2000 词后每增加 500 词的信息增量递减"的直觉

关键数值对照：

| $W_{\text{total}}$ | $D_{\text{raw}}$ |
|---------------------|-----------------|
| 300 | 0.245 |
| 600 | 0.462 |
| 1200 | 0.762 |
| 2000 | 0.909 |
| 3000 | 0.970 |
| 5000 | 0.995 |

### 5.3 富媒体加成项

$$
B_{\text{media}} = b_{\text{img}} \cdot \min(I, 5) + b_{\text{math}} \cdot \min(M_b + 0.3 \cdot M_i, 8) + b_{\text{fn}} \cdot \min(F, 10)
$$

其中：
- $b_{\text{img}} = 0.025$：每张图片加成系数（上限 5 张，防止图床堆砌）
- $b_{\text{math}} = 0.020$：数学公式加成系数（块级 $M_b$ 全计，行内 $M_i$ 按 0.3 折算）
- $b_{\text{fn}} = 0.010$：脚注加成系数（每条脚注代表额外的知识链接）
- $I$：图片数量；$M_b$：块级数学公式数；$M_i$：行内数学公式数；$F$：脚注数

$B_{\text{media}}$ 的最大理论值 $\approx 0.125 + 0.160 + 0.100 = 0.385$，但因各项均有上限，实际很少超过 0.20。

### 5.4 结构质量系数

结构质量系数 $S_q \in [0.5, 1.0]$ 由两个惩罚项计算：

$$
S_q = 1.0 - P_{\text{heading}} - P_{\text{para}}
$$

其中 $S_q$ 被下限截断为 $0.5$（即使结构极差，内容本身的信息量不被完全抹除）。

**标题覆盖度惩罚** $P_{\text{heading}}$：

期望每 400 词有至少一个 H2 或更深级别的标题。设 $H_{\text{count}}$ 为 H2–H6 级标题总数，期望标题数 $H_{\text{exp}} = \lfloor W_{\text{total}} / 400 \rfloor$：

$$
P_{\text{heading}} = \begin{cases}
0 & \text{if } W_{\text{total}} \leq 600 \text{（短文不要求结构）} \\
0.25 & \text{if } W_{\text{total}} > 600 \text{ and } H_{\text{count}} = 0 \\
0.25 \cdot \max\!\left(0,\; 1 - \frac{H_{\text{count}}}{H_{\text{exp}}}\right) & \text{otherwise}
\end{cases}
$$

**段落超长惩罚** $P_{\text{para}}$：

超过 180 词的段落被认为是"缺少分段的长篇叙述"，影响可读性。设 $N_{\text{over}}$ 为词数超过 180 的段落数量：

$$
P_{\text{para}} = \min\!\left(0.15,\; 0.04 \times N_{\text{over}}\right)
$$

### 5.5 综合内容密度得分

$$
\boxed{
\text{CD} = \min\!\left(1.0,\;\; D_{\text{raw}} \cdot S_q + B_{\text{media}}\right)
}
$$

### 5.6 密度权重映射（输出给 RFC-001）

将 $\text{CD} \in [0, 1]$ 映射到 RFC-001 所需的权重范围 $w \in [0.1, 2.0]$：

$$
w = 0.1 + 1.9 \times \text{CD}
$$

这是一个简单的线性映射：$\text{CD} = 0$ 时 $w = 0.1$（赋予最低但非零权重，避免完全排除空文章），$\text{CD} = 1$ 时 $w = 2.0$（顶级密度内容获得双倍活跃度贡献）。

---

## 6. 结构质量评估

### 6.1 标题树合法性检查

除了标题数量，标题树的**层级连贯性**也反映了内容的组织质量。以下情况触发结构警告（不惩罚得分，但在构建日志中标注）：

| 违规类型 | 示例 | 严重程度 |
|---------|------|---------|
| 跳级标题 | H2 之后直接出现 H4 | WARNING |
| 孤立 H1 | 正文内出现多个 H1 | WARNING |
| 标题词数过短 | 标题少于 2 词（如 "总结"） | INFO |
| 重复标题 | 同一层级出现两个相同文本的标题 | WARNING |

```typescript
export function validateHeadingTree(headings: HeadingMeta[]): HeadingIssue[] {
  const issues: HeadingIssue[] = [];
  let prevDepth = 0;

  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    
    // 跳级检测：层级跳跃超过 1
    if (h.depth > prevDepth + 1 && prevDepth > 0) {
      issues.push({
        type: 'SKIP_LEVEL',
        severity: 'WARNING',
        message: `Heading depth jumped from H${prevDepth} to H${h.depth}: "${h.text}"`,
      });
    }
    
    // H1 重复检测
    if (h.depth === 1 && headings.filter(x => x.depth === 1).length > 1) {
      issues.push({
        type: 'MULTIPLE_H1',
        severity: 'WARNING',
        message: `Multiple H1 found: "${h.text}"`,
      });
    }
    
    prevDepth = h.depth;
  }

  return issues;
}
```

### 6.2 内容分布均匀性

计算文章内容在各章节间的分布标准差（检测"头重脚轻"问题）：

设文章被 H2 分割为 $K$ 个章节，各章节词数为 $\{s_1, s_2, \ldots, s_K\}$，均值 $\bar{s}$，则分布不均匀系数：

$$
\text{CV} = \frac{\sqrt{\frac{1}{K}\sum_{j=1}^{K}(s_j - \bar{s})^2}}{\bar{s}}
$$

$\text{CV} > 2.0$ 时（变异系数过大）触发 INFO 提示，建议作者检查章节平衡性。此项不影响得分，仅作为写作质量参考。

---

## 7. 内容层级分类系统

基于 $\text{CD}$ 与辅助特征，将文章划分为以下四个层级：

### 7.1 碎念片段（Snippet）

**判定条件（满足任意一项）**：
- $W_{\text{total}} < 250$
- $\text{CD} < 0.30$

**内容画像**：短篇随想、工具备忘、单条命令记录、生活记录。体量小，结构简单，但不代表价值低——一条精准的命令备忘可能比一篇冗长的教程更有用。

**前端渲染策略**：
- 在列表视图中以紧凑样式呈现（无封面图占位）
- 首页不单独展示，聚合进"最近随笔"模块
- 文章页不显示阅读时长和目录
- 在 RSS 中完整推送，不截断

**推荐系统权重**：$0.6 \times$ 标准权重

---

### 7.2 标准文章（Standard Article）

**判定条件**：$0.30 \leq \text{CD} < 0.65$，且 $W_{\text{total}} \geq 250$

**内容画像**：完整的教程、问题解决记录、工具评测、观点阐述。有清晰的开头-正文-结论结构，配有代码或图片支撑，是技术博客的主流内容形态。

**前端渲染策略**：
- 标准展示模式（封面图 + 摘要 + 阅读时长）
- 文章词数 $W_{\text{total}} \geq 800$ 时自动生成文章内目录（ToC）
- 正常推荐权重

**推荐系统权重**：$1.0 \times$ 标准权重

---

### 7.3 深度文章（In-depth Article）

**判定条件**：$0.65 \leq \text{CD} < 0.85$，且 $W_{\text{total}} \geq 1200$，且存在 H2+H3 两级标题结构

**内容画像**：深度技术解析、系统设计记录、长篇研究综述。具备完整的知识体系和引用支撑，读者需要投入较多时间，但回报率高。

**前端渲染策略**：
- 强制生成浮动目录（ToC）
- 文章头部展示预计阅读时长（基于 $W_{\text{total}} \div 230$，单位分钟）
- 文章底部展示"延伸阅读"推荐
- 在首页"精选"模块享有优先展示权

**推荐系统权重**：$1.4 \times$ 标准权重

---

### 7.4 深度白皮书（Deep-dive Paper）

**判定条件**：$\text{CD} \geq 0.85$，且 $W_{\text{total}} \geq 2500$，且标题树深度 $H_{\text{depth}} \geq 3$

**内容画像**：RFC 文档、技术白皮书、长篇研究报告。这类内容是博客生态价值密度最高的部分，通常包含完整的理论模型、实现细节和边界情况讨论。

**前端渲染策略**：
- 顶部显示"深度白皮书"类型标签
- 固定侧边栏 ToC（桌面端）
- 自动提取摘要：取前两个 H2 章节的首段作为文章摘要
- 移动端 RSS 中代码块超过 30 行时折叠展示
- 在站点归档页面单独维护"白皮书专区"

**推荐系统权重**：$1.8 \times$ 标准权重

---

### 7.5 代码优先型（Code-heavy Reference）

**判定条件（叠加标记，不排斥上述分类）**：

$$
\frac{W_{\text{code}}}{W_{\text{total}}} > 0.55
$$

当此比值超过 55% 时，在原有层级基础上叠加"代码优先"标记，附加以下前端行为：
- 自动为代码块添加语言标注标签（若原始 Markdown 缺失 `lang`）
- 移动端代码块横向滚动优化
- 在文章元信息区展示"代码占比高，建议宽屏阅读"提示

---

## 8. 输出规范与集成

### 8.1 插件输出格式

Remark 插件计算完成后，将结果写入 Astro 内容集合的扩展字段：

```typescript
export interface ContentDensityOutput {
  cd: number;                   // CD ∈ [0, 1]
  w: number;                    // 密度权重 ∈ [0.1, 2.0]，输出给 RFC-001
  level: 'snippet' | 'standard' | 'in-depth' | 'paper';
  isCodeHeavy: boolean;
  estimatedReadingMinutes: number;
  totalEquivalentWords: number;
  breakdown: {
    textWords: number;
    codeEquivWords: number;
    tableEquivWords: number;
    structureScore: number;     // S_q
    mediaBonus: number;         // B_media
  };
  structureWarnings: HeadingIssue[];
}
```

### 8.2 Astro 集成示例

```typescript
// astro.config.ts
import { remarkContentDensity } from './src/plugins/remark-content-density';
import { computeContentDensity } from './src/utils/density';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkContentDensity],
    // remarkContentDensity 将原始数据挂载到 vfile.data.densityRawData
    // 然后在 content collection schema 中通过 transform 读取
  },
});
```

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { computeContentDensity } from '../utils/density';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    draft: z.boolean().default(false),
  }),
  // density 数据在 build pipeline 中独立计算并注入，不在 schema 定义
});
```

---

## 9. 已知局限与边界条件

### 9.1 模型盲区

本评价体系基于**结构化信号**，对以下内容质量维度不敏感：

| 盲区 | 说明 | 潜在影响 |
|-----|------|---------|
| 写作逻辑与论证质量 | 无法区分严密论证与堆砌词句 | 高词数低质量文章可能被高估 |
| 代码正确性 | 语言权重不反映代码是否可运行 | 错误代码与正确代码得分相同 |
| 内容独创性 | 无法识别复制粘贴内容 | 外部内容迁移可能虚增得分 |
| 图片信息质量 | 所有图片计数相同 | 截图与信息图不加区分 |

### 9.2 中文内容的系统性偏差

中文词数折算系数 $1/1.8$ 是统计近似值，在以下场景下存在偏差：

- **学术性中文文本**：词汇密度高，实际信息量高于折算值，被轻微低估
- **口语化中文文本**：重复词汇多，实际信息量低于折算值，被轻微高估

这种偏差在当前系统精度要求下可以接受，不作专项补偿。

### 9.3 MDX 组件的处理策略

包含自定义 MDX 组件（如 `<CodeSandbox />`、`<InteractiveDemo />`）的文章，其组件部分在 AST 中以 `mdxJsxFlowElement` 节点表示，本系统不对这类节点做词数估算，仅计数（每个交互式组件等效为 50 词的信息量加成，上限 3 个）。

---

## 10. 附录

### A. 关键公式汇总

$$
W_{\text{total}} = W_{\text{text}} + 0.9 W_{\text{bq}} + W_{\text{list}} + W_{\text{code}} + W_{\text{table}}
$$

$$
W_{\text{code}} = \sum_{k} \gamma_k \cdot L_k^{\text{eff}} \cdot 6
$$

$$
D_{\text{raw}} = \tanh\!\left(\frac{W_{\text{total}}}{1200}\right), \quad
S_q = \max\!\left(0.5,\; 1 - P_{\text{heading}} - P_{\text{para}}\right)
$$

$$
\text{CD} = \min\!\left(1.0,\; D_{\text{raw}} \cdot S_q + B_{\text{media}}\right), \quad
w = 0.1 + 1.9 \times \text{CD}
$$

### B. 层级判定决策树

```
W_total < 250 OR CD < 0.30
    └─→ Snippet

W_total ≥ 250 AND 0.30 ≤ CD < 0.65
    └─→ Standard Article

W_total ≥ 1200 AND 0.65 ≤ CD < 0.85 AND has H2+H3
    └─→ In-depth Article

W_total ≥ 2500 AND CD ≥ 0.85 AND H_depth ≥ 3
    └─→ Deep-dive Paper

(任意层级) W_code / W_total > 0.55
    └─→ + Code-heavy 叠加标记
```

### C. 变更历史

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v1.0.0 | 见 Git Tag | 初始发布 |

---

*本文档受 RFC-003 版本治理协议约束。核心公式参数（$W_{\text{ref}}$、$\beta_{\text{code}}$、语言权重 $\gamma$）的任何调整须经由正式 RFC 修订流程，并在 `CHANGELOG.md` 中记录。*
