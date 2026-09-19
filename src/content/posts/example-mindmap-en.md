---
title: "Example: Markmap Dynamic Interactive Mind Map with Infinite Hierarchy Expansion"
description: "Comprehensive demonstration of Markmap dynamic mind map rendering based on Markdown, showcasing 6-level deep stacking, infinite hierarchy expansion syntax, default single-block folding for space protection, multi-directional branch diffusion upon node click, and full-screen immersive interaction."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "mindmap", "markmap", "diagrams"]
category: "Example"
series: "Feature Examples"
math: false
mermaid: false
mindmap: true
i18nKey: "example-mindmap"
lang: "en"
aiTranslatedFrom: "zh-CN"
---

This example is specifically for demonstrating and testing the **Markmap dynamic interactive mind map** rendering engine, the **6-layer depth stacking** structure, and the **Infinite Depth expansion mechanism** in the blog body.

> [!TIP]
> **Mind map multi-directional branching and hierarchy rules**:
> 1. **Infinite depth support**: The engine uses recursive parsing of the Markdown AST and D3 flexible layout, with **no hierarchy limit**, supporting `H1 ~ H6` combined with multi-level list items to infinitely descend (Level 1 to Level N).
> 2. **Default single block display**: By default, only the core root node (Level 1) is shown, with a pulsing halo dot on the right to protect the article reading view;
> 3. **Click to spread multi-directionally**: Clicking a node with a dot or text will cause the corresponding sub-branches to **smoothly spread out** in multiple directions, supporting drill-down layer by layer;
> 4. **All-in-one toolbar control**: Supports one-click expansion of all multi-directional branches, one-click collapse of single block, zoom in/out, center adaptive, full-screen immersive mode (Esc to exit), and copying the Markdown source code.

---

## I. 6-layer depth stacking: a panoramic view of modern front-end full-stack engineering system architecture

The following mind map fully displays the **6-layer depth (Level 1 to Level 6)** deep architectural branches:
- **Level 1 (H1)**: Top-level system core
- **Level 2 (H2)**: Business domain and infrastructure
- **Level 3 (H3)**: Core subsystems and pipelines
- **Level 4 (H4)**: Technical modules and protocols
- **Level 5 (H5)**: Components and functional units
- **Level 6 (List / H6)**: Algorithm implementation and low-level detail specifications

```mindmap
# EpoCanvas 现代前端全栈工程系统
## 1. 核心构建管道与编译引擎
### AST 抽象语法树处理集群
#### Markdown / MDX 语义解析流水线
##### Unified / Remark 语法拓展
- GFM 表格与删除线语法转换
- 自动生成 Heading 锚点与 ID
##### Markmap 交互式多向思维导图拓展
- 递归 AST 树构建 (Transformer.transform)
- D3 层次化弹性布局 (Flextree Algorithm)
- 交互式折叠状态机 (payload.fold)
- 动态调色板分支染色 (d3.scaleOrdinal)
##### Rehype Katex 数学公式拓展
- 行内公式与独立块公式解析
- 宏定义支持与错误容错回退
#### 代码高亮与静态着色器
##### Shiki 双主题编译器
- VSCode TextMate 语法规则解析
- 浅色/深色模式双主题预渲染零水合
### 打包与构建流水线
#### Vite 6 模块热重载
##### ESM 原生模块加载
- 毫秒级按需编译与热更新 (HMR)
##### Rollup 静态代码优化
- 智能代码分块 (Code Splitting)
- Tree-Shaking 冗余消除
## 2. 交互与群岛体系
### Islands 架构设计
#### 客户端组件分岛挂载
##### React 19 Client Components
- 独立状态隔离与上下文通信
- 会话持久化 (SessionStorage)
##### Astro 静态优先服务端 Islands
- 零运行时客户端 JS (Zero-JS by Default)
- 按需激活交互岛屿 (client:visible)
### 动效与视觉体验层
#### Canvas 渲染引擎
##### Aurora 极光 / Starfield 动态背景
- WebGL / Canvas 2D 硬件加速
- 节能模式与视口离开自动暂停
##### Glassmorphism 毛玻璃拟物风格
- 动态高斯模糊与多重环境阴影
- 响应式全端自适应布局 (PC/Pad/Mobile)
## 3. 安全隐私与分级加密体系
### 散列与密码学引擎
#### WebCrypto 现代浏览器密码标准
##### SHA-256 哈希校验
- 零明文外露客户端散列验证
- 1级会话持久解锁 (Session Persistent)
##### 防窥遮罩与视口拦截
- 2级高斯模糊/马赛克/剧透遮罩保护
- 3级视口离开即锁 (IntersectionObserver)
- 外联分段解密端点隔离
```

---

## II. Infinite hierarchy expansion demonstration: pure list infinite indentation (Level 7 and above)

Besides mixing `H1 ~ H6` headings, the Markdown engine supports using **pure indented lists** to achieve seamless expansion of **infinite depth (Level 1 -> Level 2 -> ... -> Level N)**:

```mindmap
- 🌐 根主题：计算机科学知识图谱 (Level 1)
  - 🖥️ 软件系统工程 (Level 2)
    - 📦 操作系统与内核 (Level 3)
      - ⚙️ 进程与线程调度 (Level 4)
        - 🔄 并发同步原语 (Level 5)
          - 🔒 互斥锁与信号量 (Level 6)
            - ⚡ 硬件级 CAS 原子指令 (Level 7)
              - ⏱️ Cache Coherency MESI 协议 (Level 8)
                - 🔬 内存屏障与流水线指令重排 (Level 9)
  - 🧠 人工智能与机器学习 (Level 2)
    - 📊 深度学习架构 (Level 3)
      - 🤖 大语言模型 (LLM) (Level 4)
        - 🧩 Transformer 架构 (Level 5)
          - 👁️ 多头自注意力机制 (Level 6)
            - 📐 Scaled Dot-Product Attention (Level 7)
```

---

## III. Writing and optimization suggestions for infinite hierarchy expansion

When writing multi-level and deep mind maps, it is recommended to follow the following engineering and layout best practices:

1. **Mixed syntax method (recommended for levels 1-6)**:
   - Prefer using `#` to `######` to express the 1-6 level backbone, and for levels below 6 use unordered list `-` or `*` indentation to descend.
2. **Pure list method (recommended for 6 levels and above or lightweight structures)**:
   - Use `- 节点` and add 2 or 4 spaces of indentation per level to theoretically achieve **arbitrary infinite depth**.
3. **Initial expansion level control**:
   - Adding a JSON parameter configuration on the first line of the code block, e.g., `{"initialExpandLevel": 2, "height": "560px", "title": "自定义超深导图"}`, will allow the mind map to default expand to the specified depth (e.g., the second level of the backbone), with deeper levels expanding on demand.
4. **Large screen and immersive exploration**:
   - For mind maps deeper than six levels, make good use of the toolbar's **Fullscreen Immersive Mode (Fullscreen)** and **Fit View (Fit View)**, allowing the complex knowledge web to be fully visible.