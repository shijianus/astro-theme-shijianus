---
title: "Example: KaTeX Math Formula Rendering Display"
description: "A comprehensive demonstration of static rendering for inline and block-level derivation formulas based on remark-math and rehype-katex."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "math", "katex"]
category: "Example"
series: "功能示例"
math: true
mermaid: false
i18nKey: "example-math"
lang: "en"
aiTranslatedFrom: "zh-CN"
---
This example is dedicated to demonstrating and testing the **LaTeX mathematical formula (Math / KaTeX)** rendering capabilities within blog posts.

Formulas are compiled during Astro's build phase into pure HTML/MathML structures with no runtime overhead, and they come with a flexible horizontal scroll container that prevents overflow.

---

## 1. Inline Math

Wrap an expression with a single dollar sign `$ ... $` in the text:

- Mass–energy equation: $E = mc^2$
- Euler's identity: $e^{i\pi} + 1 = 0$
- Gaussian normal distribution probability density function: $f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$
- Harmonic series convergence limit: $\lim_{n \to \infty} \sum_{k=1}^n \frac{1}{k^2} = \frac{\pi^2}{6}$

```markdown
- Mass–energy equation: $E = mc^2$
- Euler's identity: $e^{i\pi} + 1 = 0$
- Gaussian distribution: $f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$
```

---

## 2. Display Math

Use double dollar signs `$$ ... $$` to display a block of equations:

$$
\mathcal{L}\{\ddot{x}(t) + 2\zeta\omega_n\dot{x}(t) + \omega_n^2 x(t)\} = X(s)(s^2 + 2\zeta\omega_n s + \omega_n^2)
$$

### Maxwell's Equations (Differential Form)

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

### Gaussian Integral and Linear Algebra Matrix

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}, \quad
\mathbf{A} = \begin{bmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \cdots & a_{mn}
\end{bmatrix}
$$