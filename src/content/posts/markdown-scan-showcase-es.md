---
title: "Ejemplo completo de capacidades de escaneo y visualización de Markdown"
pubDate: 2026-04-25
description: "Un artículo largo que ejecuta de una vez el escaneo de Markdown actual, la jerarquía de la tabla de contenidos, el contenido oculto, las tablas GFM, las notas al pie, los bloques de código y los formatos especiales."
author: "shijianus"
category: "Diseño de sistemas"
group: "Ejemplos de Markdown"
cover: "/media/shijianus/system.jpg"
coverAlt: "tablero de demostración de markdown"
tags: ["Markdown", "Astro", "Config", "UI", "Reestructuración del tema"]
featured: true
sticky: 4
i18nKey: "markdown-scan-showcase"
lang: "es"
aiTranslatedFrom: "zh-CN"
---

Este artículo está diseñado específicamente para validar el escaneo de contenido, la sincronización de la tabla de contenidos, el refuerzo de estilos y las estrategias de legibilidad dentro del tema. No es una "explicación conceptual", sino una muestra de contenido **realmente utilizable para probar el tema de la interfaz de usuario**.

En la versión actual, espero cubrir simultáneamente con un solo artículo:

- **Escaneo de niveles de encabezados**
- **Bloques de código y código en línea**
- **Tablas, listas de tareas y notas al pie**
- **Formatos especiales, como <mark>marcadores</mark>, <kbd>Ctrl</kbd> + <kbd>K</kbd>, <ruby>AnZhiYu<rt>AnZhiYu</rt></ruby>**
- **Contenido oculto e interacciones ligeras**
- **Citas, listas, separadores, detalles plegables y tarjetas de aviso**

> Si un tema solo se ve bien con "párrafos normales + encabezados normales", aún no puede considerarse verdaderamente completo.

## Objetivos del escaneo

El escaneo de un artículo por parte del tema no debe detenerse solo en `title` y `description`. Al menos también debe prestar atención a:

1. La **estructura jerárquica real** del artículo, ya que esto afecta directamente la tabla de contenidos en el lado derecho.
2. El **énfasis y el ritmo** en el texto principal, ya que una pantalla completa de texto plano no permite una navegación eficiente.
3. La **presentación semántica** del código, listas, tablas y citas, ya que los blogs técnicos no solo generan párrafos.
4. Si el artículo contiene bloques de contenido especiales como **ocultos, avisos, explicaciones complementarias**, ya que estos afectan la ruta de lectura.

### Por qué la TOC no debe limitarse solo a "sangría"

Un error común es entender la jerarquía de la tabla de contenidos solo como `padding-left`. Esto puede parecer que tiene estructura, pero una vez que la jerarquía se vuelve profunda:

- El espacio en blanco aumenta drásticamente
- Las áreas clicables se comprimen
- Es difícil determinar el elemento activo
- El usuario no sabe en qué nivel se encuentra al hacer desplazamiento

Por lo tanto, el objetivo del manejo de la TOC en esta versión es: **la jerarquía debe ser real, la sangría debe ser moderada y la ruta de activación debe ser clara**.

#### Una solución que cumple ambos objetivos

现在的方案不是把三级、四级标题全部大幅右移，而是同时使用：

- 小步进缩进
- 当前项高亮
- 父路径弱高亮
- 纵向引导线
- 当前标题元信息

这样能兼顾“知道自己在第几层”和“目录依然可点、可扫、可滚动”。

## 行内格式

正文里最常见的一层增强，是**行内信息**的可视化。比如：

- 变量名可以写成 `themeContract`
- 配置项可以写成 `siteConfig.post.comments`
- 状态词可以写成 <mark>in progress</mark>
- 快捷键可以写成 <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
- 缩写可以写成 <abbr title="Tabla de contenidos">TOC</abbr> 与 <abbr title="Interfaz de programación de aplicaciones">API</abbr>
- 特定词可以写成 <span class="article-inline-serif">serif emphasis</span> 或 <span class="article-inline-mono">mono emphasis</span>

有些内容甚至不应该一开始完全展开，例如：

- 这是一个 `普通提示`
- 这是一个 `带强调的词`
- 这是一个 `行内代码`
- 这是一个 `参数名`
- 这是一个 ||需要点击后才显示的 spoiler||
- 这是一个 %%password:24680|需要输入密码后才显示的隐藏内容%%

### 强调与节奏

当一段话里同时出现 **重点句**、`配置名`、<mark>状态词</mark> 与 <kbd>快捷键</kbd> 时，读者就能更快地把段落拆开理解，而不需要逐字阅读。

#### 特殊字符与上下标

例如：

- E = mc<sup>2</sup>
- H<sub>2</sub>O
- <ruby>前端<rt>frontend</rt></ruby>
- <ruby>重构<rt>rebuild</rt></ruby>

## 提示卡与折叠块

下面是一个自定义提示卡，它不依赖额外插件，只使用 Markdown 中允许的 HTML：

<div class="article-note-card">
  <strong>设计判断</strong>
  <p>如果一项样式或动效没有改善信息定位效率，它就不应该只因为“看起来炫”而被保留。</p>
</div>

再往下是一个折叠块：

<details class="article-detail-card">
  <summary>点击展开：这次 Markdown 样本到底在测什么</summary>
  <p>它在测标题扫描、右侧 TOC、GFM 表格、任务列表、脚注、隐藏内容、行内样式、代码块与区块型排版是否一起成立。</p>
  <p>如果其中任何一项渲染失真，说明主题的文章层还没有真正稳定。</p>
</details>

### 引用块

> “不是把主题做得花，而是把信息做得清楚。”
>
> 对技术博客来说，真正重要的是结构、秩序和反馈，而不是漂浮的装饰。

#### 二级引用与说明

> 目录之所以重要，不是因为它像文档，而是因为它能让长文变得可导航。

## 代码块

一篇技术文章至少要能同时容纳不同语言的代码块。

### TypeScript

```ts
type TocNode = {
  id: string;
  depth: 2 | 3 | 4;
  title: string;
  children: TocNode[];
};

function buildCompactToc(nodes: TocNode[]) {
  return nodes.map((node) => ({
    ...node,
    offset: Math.max(0, node.depth - 2) * 12,
    activePath: false,
  }));
}
```

### Bash

```bash
npm install
npm run build
npm run preview:host
```

### CSS

```css
#card-toc .toc-item.is-active > .toc-link {
  background: var(--theme-main);
  color: var(--white);
  box-shadow: inset 3px 0 0 rgba(255, 255, 255, 0.34);
}
```

#### 行内代码的使用原则

不要把整句都写成 `inline code`，只应该把真正的配置名、函数名或关键字收成代码态，例如 `navigator.share()`、`remark-gfm`、`scrollIntoView()`。

## Tabla GFM

La tabla a continuación se usa para validar encabezados, alineación, bordes y desplazamiento en dispositivos móviles:

| Módulo | Objetivo | Estrategia actual | Observaciones |
| --- | --- | --- | --- |
| Tarjeta de categoría de la página principal | Alinear hover de 安知鱼 | Usar íconos reales + animación de compresión y expansión | Validación especial `lime` |
| Índice | Jerarquía real sin desperdiciar espacio | Estructura de árbol + ligera sangría + ruta activada | Equilibrar la eficiencia de clics |
| Sección de comentarios | Se puede publicar directamente | Mantener solo el cuadro de mensaje y el flujo de comentarios públicos | No exponer la entrada de pruebas |
| Área de compartir | Correspondiente a redes sociales reales | Construir parámetros de compartición individualmente para cada plataforma | No solo copiar el enlace |

### Lista de tareas

- [x] Cubrir párrafos normales y encabezados de varios niveles
- [x] Cubrir código en línea y bloques de código
- [x] 覆盖 spoiler 与 password hidden
- [x] 覆盖表格与任务列表
- [x] 覆盖折叠块、提示卡与引用
- [ ] 继续补齐更多安知鱼特有的内容块语法[^future]

#### 有序列表与无序列表混合

1. 先确定文章结构。
2. 再确定右侧目录的映射。
3. 然后决定每种内容块的视觉层次。

- 重点不是功能数量
- 而是展示是否有秩序
- 以及不同模块是否真的能共同工作

## 脚注

脚注本身也是内容扫描的一部分，因为它会影响文章尾部的排版与锚点行为。这里放两个例子：一个解释性脚注[^scan-note]，一个偏工程判断的脚注[^engineering-note]。

### 跨段补充

当正文里出现“顺带一提，但不想打断主线”的内容时，脚注通常比把整段都塞进括号里更有效。

#### 什么时候不该用脚注

如果那段信息对主线理解是必要的，就不应该藏到脚注里。脚注适合补充，不适合承载核心论点。

## 内容块的组合

下面这段内容故意把多种能力混在一起，确保主题不会“单项能渲染，组合就失真”。

<div class="article-note-card article-note-card--accent">
  <strong>组合测试</strong>
  <p>当前段落同时包含 <mark>高亮</mark>、<kbd>键位</kbd>、<ruby>术语<rt>term</rt></ruby>、`inline code` 与脚注引用[^combo]。</p>
</div>

如果一篇文章里既有：

- 说明性段落
- 分级标题
- 代码块
- Tabla
- Cita
- Énfasis en línea
- Contenido oculto
- Plegado de contenido adicional

y el tema aún pueda mantener el orden de lectura, entonces solo entonces se puede decir que este sistema de contenido es realmente estable.

### Cómo usar este artículo como prueba de humo

Puedes usar directamente este artículo para verificar los siguientes puntos:

1. Si el índice de la derecha identifica correctamente los H2 / H3 / H4.
2. Si el elemento activo, la ruta padre y la posición de desplazamiento son naturales.
3. Si los bloques de código, las tablas y las listas de tareas tienen una apariencia visual unificada.
4. Si el contenido oculto es interactivo.
5. Si el ritmo vertical entre compartir, comentar, la barra lateral y el cuerpo del texto es armonioso.

#### Conclusión final

Un tema de blog publicable no debería verse bien solo en los artículos más simples. Debe poder soportar una muestra que "intencionalmente maximice la complejidad del contenido de una sola vez".

---

[^scan-note]: Aquí, "escaneo" incluye tanto el escaneo de campos de frontmatter como el escaneo de la renderización de títulos, resúmenes, jerarquía del cuerpo y contenido interactivo.
[^engineering-note]: Si el índice se basa solo en la indentación visual para simular la jerarquía, tarde o temprano expondrá problemas de posicionamiento y áreas clicables en textos largos.
[^future]: Por ejemplo, una sintaxis de etiquetas más completa para Anzhifu, alias de bloques de aviso reutilizables y un conjunto de componentes de contenido más cercano al tema original.
[^combo]: El propósito de la prueba combinada es evitar que el tema funcione correctamente solo bajo un único tipo de contenido.