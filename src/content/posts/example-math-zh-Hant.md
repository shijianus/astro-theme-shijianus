---
title: "範例：KaTeX 數學公式呈現展示"
description: "全面呈現基於 remark-math 與 rehype-katex 的行內公式與區塊推導公式靜態渲染。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "math", "katex"]
category: "範例"
series: "功能範例"
math: true
mermaid: false
i18nKey: "example-math"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---

本篇範例專用於展示與測試部落格正文中的 **LaTeX 數學公式（Math / KaTeX）** 解析能力。

公式在 Astro 建構期即被編譯為無執行時損耗的純 HTML/MathML 結構，並自帶防溢出的彈性水平捲動容器。

---

## 一、行內數學公式（Inline Math）

在文字中使用單個美元符號 `$ ... $` 包裹公式表達式：

- 質能方程：$E = mc^2$
- 歐拉恆等式：$e^{i\pi} + 1 = 0$
- 高斯常態分佈機率密度函數：$f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$
- 調和級數收斂極限：$\lim_{n \to \infty} \sum_{k=1}^n \frac{1}{k^2} = \frac{\pi^2}{6}$

```markdown
- 質能方程：$E = mc^2$
- 歐拉恆等式：$e^{i\pi} + 1 = 0$
- 高斯分佈：$f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$
```

---

## 二、區塊多行數學公式（Display Math）

使用雙美元符號 `$$ ... $$` 獨立成段呈現：

$$
\mathcal{L}\{\ddot{x}(t) + 2\zeta\omega_n\dot{x}(t) + \omega_n^2 x(t)\} = X(s)(s^2 + 2\zeta\omega_n s + \omega_n^2)
$$

### 馬克士威方程組（微分形式）

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

### 高斯積分與線性代數矩陣

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}, \quad
\mathbf{A} = \begin{bmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \cdots & a_{mn}
\end{bmatrix}
$$