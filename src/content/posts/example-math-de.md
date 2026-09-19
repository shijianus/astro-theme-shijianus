---
title: "Beispiel: KaTeX-Mathematikformel-Rendering-Demonstration"
description: "Umfassende Demonstration des statischen Renderings von Inline-Formeln und Block-Ableitungsformeln basierend auf remark-math und rehype-katex."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["Beispiel", "Demonstration", "Mathematik", "KaTeX"]
category: "Beispiel"
series: "Funktionsbeispiele"
math: true
mermaid: false
i18nKey: "example-math"
lang: "de"
aiTranslatedFrom: "zh-CN"
---

Dieses Beispiel dient der Demonstration und dem Test der Parsing-Fähigkeiten von **LaTeX-Mathematikformeln (Math / KaTeX)** im Blogtext.

Die Formeln werden während der Astro-Build-Phase in eine reine HTML/MathML-Struktur ohne Laufzeitverluste kompiliert und verfügen über einen flexiblen horizontalen Scroll-Container, der Überläufe verhindert.

---

## 1. Inline-Mathematikformeln

Verwenden Sie im Text ein einzelnes Dollarzeichen `$ ... $`, um Formelausdrücke zu umschließen:

- Energie-Masse-Äquivalenz: $E = mc^2$
- Eulers Identität: $e^{i\pi} + 1 = 0$
- Gaußsche Normalverteilung (Wahrscheinlichkeitsdichtefunktion): $f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$
- Konvergenzgrenzwert der harmonischen Reihe: $\lim_{n \to \infty} \sum_{k=1}^n \frac{1}{k^2} = \frac{\pi^2}{6}$

```markdown
- Energie-Masse-Äquivalenz: $E = mc^2$
- Eulers Identität: $e^{i\pi} + 1 = 0$
- Gauß-Verteilung: $f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$
```

---

## 2. Block-Mathematikformeln (Display Math)

Verwenden Sie doppelte Dollarzeichen `$$ ... $$`, um Formeln als separate Blöcke darzustellen:

$$
\mathcal{L}\{\ddot{x}(t) + 2\zeta\omega_n\dot{x}(t) + \omega_n^2 x(t)\} = X(s)(s^2 + 2\zeta\omega_n s + \omega_n^2)
$$

### Maxwell-Gleichungen (Differentialform)

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

### Gauß-Integral und lineare Algebra-Matrizen

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}, \quad
\mathbf{A} = \begin{bmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \cdots & a_{mn}
\end{bmatrix}
$$