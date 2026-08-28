---
title: "示例：KaTeX 数学公式渲染展示"
description: "全面展示基于 remark-math 与 rehype-katex 的行内公式与块级推导公式静态渲染。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "math", "katex"]
category: "Examples"
series: "功能示例"
math: true
mermaid: false
---

本篇示例专用于展示与测试博客正文中的 **LaTeX 数学公式（Math / KaTeX）** 解析能力。

公式在 Astro 构建期即被编译为无运行时损耗的纯 HTML/MathML 结构，并自带防溢出的弹性水平滚动容器。

---

## 一、行内数学公式（Inline Math）

在文本中使用单个美元符号 `$ ... $` 包裹公式表达式：

- 质能方程：$E = mc^2$
- 欧拉恒等式：$e^{i\pi} + 1 = 0$
- 高斯正态分布概率密度函数：$f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$
- 调和级数收敛极限：$\lim_{n \to \infty} \sum_{k=1}^n \frac{1}{k^2} = \frac{\pi^2}{6}$

```markdown
- 质能方程：$E = mc^2$
- 欧拉恒等式：$e^{i\pi} + 1 = 0$
- 高斯分布：$f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$
```

---

## 二、块级多行数学公式（Display Math）

使用双美元符号 `$$ ... $$` 独立成段展示：

$$
\mathcal{L}\{\ddot{x}(t) + 2\zeta\omega_n\dot{x}(t) + \omega_n^2 x(t)\} = X(s)(s^2 + 2\zeta\omega_n s + \omega_n^2)
$$

### 麦克斯韦方程组（微分形式）

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

### 高斯积分与线性代数矩阵

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}, \quad
\mathbf{A} = \begin{bmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \cdots & a_{mn}
\end{bmatrix}
$$
