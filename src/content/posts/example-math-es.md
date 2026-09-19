---
title: "Ejemplo: Demostración de renderizado de fórmulas matemáticas con KaTeX"
description: "Demostración completa del renderizado estático de fórmulas en línea y de bloques basado en remark-math y rehype-katex."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["ejemplo", "demostración", "matemáticas", "katex"]
category: "Ejemplo"
series: "功能示例"
math: true
mermaid: false
i18nKey: "example-math"
lang: "es"
aiTranslatedFrom: "zh-CN"
---
Este ejemplo está dedicado a demostrar y probar la capacidad de análisis de **fórmulas matemáticas LaTeX (Math / KaTeX)** en el cuerpo del blog.

Las fórmulas se compilan durante la fase de construcción de Astro en una estructura HTML/MathML pura sin coste de tiempo de ejecución, y vienen con un contenedor de desplazamiento horizontal elástico que evita desbordamientos.

---

## 1. Fórmulas matemáticas en línea (Inline Math)

En el texto se usan signos de dólar simples `$ ... $` para envolver la expresión de la fórmula:

- Ecuación de equivalencia masa‑energía: $E = mc^2$
- Identidad de Euler: $e^{i\pi} + 1 = 0$
- Función de densidad de probabilidad de la distribución normal gaussiana: $f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$
- Límite de convergencia de la serie armónica: $\lim_{n \to \infty} \sum_{k=1}^n \frac{1}{k^2} = \frac{\pi^2}{6}$

```markdown
- 质能方程：$E = mc^2$
- 欧拉恒等式：$e^{i\pi} + 1 = 0$
- 高斯分布：$f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$
```

---

## 2. Fórmulas matemáticas en bloque (Display Math)

Se usan dobles signos de dólar `$$ ... $$` para presentar la fórmula en un bloque independiente:

$$
\mathcal{L}\{\ddot{x}(t) + 2\zeta\omega_n\dot{x}(t) + \omega_n^2 x(t)\} = X(s)(s^2 + 2\zeta\omega_n s + \omega_n^2)
$$

### Conjunto de ecuaciones de Maxwell (forma diferencial)

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

### Integral de Gauss y matriz de álgebra lineal

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}, \quad
\mathbf{A} = \begin{bmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \cdots & a_{mn}
\end{bmatrix}
$$