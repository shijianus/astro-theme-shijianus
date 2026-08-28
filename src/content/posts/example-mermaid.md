---
title: "示例：Mermaid 11 图表与可视化展示"
description: "全面展示 Mermaid 架构流程图、时序图、甘特图、统计饼图与 GitGraph 分支图。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "mermaid", "diagrams"]
category: "Examples"
series: "功能示例"
math: false
mermaid: true
---

本篇示例专用于展示与测试博客正文中的 **Mermaid 11 矢量图表** 编译与渲染能力。

图表基于纯文本代码声明，客户端按需异步加载 ESM 引擎，自动适配明暗主题。

---

## 一、系统架构决策流程图（Flowchart）

```mermaid
graph TD
    A[读者发起文章访问] --> B{是否设置访问密码?}
    B -->|是| C[唤起毛玻璃密码弹窗]
    C --> D{密码核验}
    D -->|正确| E[解密正文并播放动画]
    D -->|错误| F[触发窗口震动与警示]
    B -->|否| E
    E --> G[加载 KaTeX 公式与 Mermaid 图表]
    G --> H[呈现沉浸式阅读界面]
```

---

## 二、客户端交互时序图（Sequence Diagram）

```mermaid
sequenceDiagram
    autonumber
    actor User as 读者 (User)
    participant Browser as 客户端浏览器
    participant PostPage as 文章渲染引擎
    participant Security as 加密安全模块

    User->>Browser: 点击受保护的内容区域
    Browser->>PostPage: 唤起密码输入对话框
    User->>Browser: 输入解密密钥
    Browser->>Security: 校验访问 Hash
    alt 校验通过
        Security-->>Browser: 返回解锁令牌
        Browser->>PostPage: 呈现解密正文
    else 校验失败
        Security-->>Browser: 返回密码错误
        Browser->>User: 触发对话框震动警示
    end
```

---

## 三、项目里程碑甘特图（Gantt Chart）

```mermaid
gantt
    title 博客主题重构工程推进计划
    dateFormat  YYYY-MM-DD
    section 基础架构
    Markdown 扫描引擎升级     :done,    des1, 2026-08-01, 2026-08-07
    表格样式重构与防冲突      :done,    des2, 2026-08-08, 2026-08-14
    section 核心特性
    KaTeX 公式与 Mermaid 接入 :done,    des3, 2026-08-15, 2026-08-20
    加密弹窗与特异功能实现     :active,  des4, 2026-08-21, 2026-08-28
    section 验收交付
    全景压测与视觉审计         :         des5, 2026-08-29, 2026-08-31
```

---

## 四、技术栈代码占比饼图（Pie Chart）

```mermaid
pie title 博客前端技术栈占比
    "TypeScript / Astro" : 48
    "React 19 Components" : 26
    "Tailwind 4 & CSS" : 18
    "Markdown & Assets" : 8
```
