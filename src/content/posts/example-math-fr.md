---
title: "Exemple : rendu des formules mathématiques avec KaTeX"
description: "Présentation complète du rendu statique des formules en ligne et des dérivations en bloc, basées sur remark-math et rehype-katex."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "démonstration", "mathématiques", "katex"]
category: "Exemples"
series: "Exemples de fonctionnalités"
math: true
mermaid: false
i18nKey: "example-math"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---

Cet exemple est dédié à la démonstration et au test de la capacité d'analyse des **formules mathématiques LaTeX (Math / KaTeX)** dans le corps des articles du blog.

Les formules sont compilées lors de la phase de build d'Astro en structures HTML/MathML pures, sans surcharge d'exécution, et sont accompagnées d'un conteneur de défilement horizontal élastique qui empêche le débordement.

---

## 1. Formules mathématiques en ligne (Inline Math)

Pour utiliser une formule dans le texte, encadrez l'expression entre deux symboles dollar `$ ... $` :

- Équation de l'équivalence masse-énergie : $E = mc^2$
- Identité d'Euler : $e^{i\pi} + 1 = 0$
- Fonction de densité de probabilité de la distribution normale de Gauss : $f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$
- Limite de convergence de la série harmonique : $\lim_{n \to \infty} \sum_{k=1}^n \frac{1}{k^2} = \frac{\pi^2}{6}$

```markdown
- Équation de l'équivalence masse-énergie : $E = mc^2$
- Identité d'Euler : $e^{i\pi} + 1 = 0$
- Distribution de Gauss : $f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$
```

---

## 2. Formules mathématiques en bloc multi-lignes (Display Math)

Utilisez deux symboles dollar `$$ ... $$` pour afficher la formule en paragraphe indépendant :

$$
\mathcal{L}\{\ddot{x}(t) + 2\zeta\omega_n\dot{x}(t) + \omega_n^2 x(t)\} = X(s)(s^2 + 2\zeta\omega_n s + \omega_n^2)
$$

### Équations de Maxwell (forme différentielle)

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

### Intégrale de Gauss et matrice d'algèbre linéaire

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}, \quad
\mathbf{A} = \begin{bmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \cdots & a_{mn}
\end{bmatrix}
$$