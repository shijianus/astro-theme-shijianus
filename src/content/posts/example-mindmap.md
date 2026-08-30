---
title: "示例：Markmap 动态交互式思维导图与多向分支"
description: "全面展示基于 Markdown 的 Markmap 动态思维导图渲染，演示默认单块折叠保护空间、点击节点多向扩散分支、缩放平移与全屏沉浸式交互。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "mindmap", "markmap", "diagrams"]
category: "Examples"
series: "功能示例"
math: false
mermaid: false
mindmap: true
---

本篇示例专用于展示与测试博客正文中的 **Markmap 动态交互式思维导图** 渲染引擎与分支展开能力。

> [!TIP]
> **多向分支交互规则**：
> 1. **默认单块呈现**：默认状态下仅展示 1 块核心根节点（Level 1），右侧附带折叠小圆点；
> 2. **点击多向散开**：点击带有圆点的节点，对应子分支将**平滑多向散开**；
> 3. **工具栏全能控制**：支持一键展开全部、一键收起单块、放大/缩小、居中自适应、全屏沉浸与复制 Markdown 源码。

---

## 一、系统工程与前端架构全景思维导图

```mindmap
# EpoCanvas 现代前端全栈工程架构
## 1. 编译构建管道
### AST 抽象语法树
- Unified / Remark Markdown 解析
- Rehype Katex 数学公式拓展
- Shiki 代码语法着色
### 打包与构建流水线
- Vite 6 模块热重载
- Rollup 静态代码优化
- Tailwind CSS v4 样式引擎
## 2. 交互与群岛体系
### Islands 架构
- React 19 Client Components
- Astro 静态渲染 Islands
- 会话状态持久化 (SessionStorage)
### 动效与视觉层
- Aurora 极光 / Starfield 动态背景
- Glassmorphism 毛玻璃拟物风格
- 响应式全端自适应布局
## 3. 安全隐私与加密
### 散列与密码学
- WebCrypto SHA-256 哈希校验
- 1级会话持久解锁
- 2级防窥遮罩保护 (模糊/马赛克/剧透)
- 3级视口防窥离开即锁
## 4. 图表与知识网络
### 可视化引擎
- Mermaid 11 流程图与时序图
- Markmap 动态多向分支思维导图
- KaTeX 学术数学排版
```

---

## 二、知识结构树（支持自由折叠与缩放）

```mindmap
# 知识管理与思维模型
## 核心思维模式
### 第一性原理
- 解构本质要素
- 重新推导逻辑
### 逆向思考法
- 从反面审视问题
- 避免常见陷阱
## 系统思考
### 动态反馈回路
- 正向增强回路
- 负向调节回路
### 杠杆点分析
- 寻找关键突破口
- 最小力获得最大成效
```
