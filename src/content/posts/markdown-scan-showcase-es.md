---
title: "Ejemplo completo de las capacidades de escaneo y visualización de Markdown"
pubDate: 2026-04-25
description: "Utilice un artículo largo para cubrir de una vez todas las capacidades actuales de escaneo de Markdown, niveles de directorio, contenido oculto, tablas GFM, notas al pie, bloques de código y formatos especiales."
author: "shijianus"
category: "Diseño de sistemas"
group: "Ejemplo de Markdown"
cover: "/media/shijianus/system.jpg"
coverAlt: "tablero de exhibición de markdown"
tags: ["Markdown", "Astro", "Configuración", "UI", "Refactorización de tema"]
featured: true
sticky: 4
i18nKey: "markdown-scan-showcase"
lang: "es"
aiTranslatedFrom: "zh-CN"
---
Este artículo está diseñado específicamente para validar la estrategia de escaneo de contenido, sincronización de la tabla de contenidos, mejora de estilos y legibilidad del tema. No es una "explicación conceptual", sino una **muestra de contenido real que puede utilizarse para realizar pruebas de humo al tema de la interfaz de usuario**.

En la versión actual, mi objetivo es cubrir simultáneamente con un solo artículo:

- **Escaneo de jerarquías de títulos**
- **Bloques de código y código en línea**
- **Tablas, listas de tareas y notas al pie**
- **Formatos especiales, como <mark>marcado</mark>, <kbd>Ctrl</kbd> + <kbd>K</kbd>, <ruby>AnZhiYu<rt>AnZhiYu</rt></ruby>**
- **Contenido oculto e interacciones ligeras**
- **Citas, listas, separadores, bloques de detalles plegables y tarjetas de aviso**

> Si un tema solo se ve bien con "párrafos normales + títulos normales", aún no puede considerarse verdaderamente completo.

## Objetivos de escaneo

El escaneo de un artículo por parte del tema no debe limitarse a `title` y `description`. Al menos debe prestar atención simultáneamente a:

1. La **estructura jerárquica real** del artículo, ya que esto afecta directamente la tabla de contenidos (TOC) en el lado derecho.
2. El **énfasis y el ritmo** en el cuerpo del texto, ya que una pantalla completa de texto plano no permite una navegación eficiente.
3. La **presentación semántica** de código, listas, tablas y citas, ya que un blog técnico no solo genera párrafos.
4. Si el artículo contiene bloques de contenido especiales como **contenido oculto, avisos o explicaciones complementarias**, ya que estos afectan la ruta de lectura.

### Por qué la TOC no debe limitarse a la "sangría"

Un error común es entender la jerarquía de la tabla de contenidos únicamente como `padding-left`. Esto puede parecer tener profundidad, pero una vez que la jerarquía se vuelve profunda:

- El espacio en blanco aumenta drásticamente
- El área clicable se comprime
- Es difícil determinar el elemento activo
- El usuario no sabe en qué nivel se encuentra al hacer desplazamiento

Por lo tanto, el objetivo del manejo de la TOC en esta versión es: **la jerarquía debe ser real, la sangría debe ser moderada y la ruta activa debe ser evidente**.

#### Una solución integral

La solución actual no consiste en desplazar significativamente hacia la derecha todos los títulos de tercer y cuarto nivel, sino en utilizar simultáneamente:

- Sangría de paso pequeño
- Resaltado del elemento actual
- Resaltado tenue de la ruta del padre
- Línea guía vertical
- Metadatos del título actual

Esto permite equilibrar "saber en qué nivel te encuentras" con "que la TOC siga siendo clicable, escaneable y desplazable".

## Formato en línea

La capa de mejora más común en el cuerpo del texto es la visualización de la **información en línea**. Por ejemplo:

- Los nombres de variables pueden escribirse como `themeContract`
- Los elementos de configuración pueden escribirse como `siteConfig.post.comments`
- Las palabras de estado pueden escribirse como <mark>en progreso</mark>
- Los atajos de teclado pueden escribirse como <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
- Las abreviaturas pueden escribirse como <abbr title="Tabla de Contenidos">TOC</abbr> y <abbr title="Interfaz de Programación de Aplicaciones">API</abbr>
- Palabras específicas pueden escribirse como <span class="article-inline-serif">énfasis serif</span> o <span class="article-inline-mono">énfasis mono</span>

Algunos contenidos ni siquiera deberían expandirse completamente al inicio, por ejemplo:

- Este es un `aviso normal`
- Esta es una `palabra con énfasis`
- Este es un `código en línea`
- Este es un `nombre de parámetro`
- Este es un ||spoiler que se muestra solo después de hacer clic||
- Este es un %%password:24680|contenido oculto que se muestra solo después de ingresar la contraseña%%

### Énfasis y ritmo

Cuando en un párrafo aparecen simultáneamente una **frase clave**, un `nombre de configuración`, una <mark>palabra de estado</mark> y un <kbd>atajo de teclado</kbd>, el lector puede descomponer y comprender el párrafo más rápidamente, sin necesidad de leerlo palabra por palabra.

#### Caracteres especiales y subíndices/superíndices

Por ejemplo:

- E = mc<sup>2</sup>
- H<sub>2</sub>O
- <ruby>frontend<rt>frontend</rt></ruby>
- <ruby>rebuild<rt>rebuild</rt></ruby>

## Tarjetas de aviso y bloques plegables

A continuación se muestra una tarjeta de aviso personalizada que no depende de plugins adicionales y solo utiliza HTML permitido en Markdown:

<div class="article-note-card">
  <strong>Judgment de diseño</strong>
  <p>Si un estilo o animación no mejora la eficiencia en la localización de la información, no debería conservarse solo porque "se ve impresionante".</p>
</div>

Más abajo hay un bloque plegable:

<details class="article-detail-card">
  <summary>Haz clic para expandir: ¿Qué está probando exactamente esta muestra de Markdown?</summary>
  <p>Está probando si el escaneo de títulos, la TOC lateral, las tablas GFM, las listas de tareas, las notas al pie, el contenido oculto, los estilos en línea, los bloques de código y la maquetación de bloques funcionan juntos correctamente.</p>
  <p>Si cualquiera de estos elementos se renderiza de forma distorsionada, significa que la capa de artículos del tema aún no es realmente estable.</p>
</details>

### Bloques de cita

> "No se trata de hacer el tema llamativo, sino de hacer la información clara."
>
> Para un blog técnico, lo que realmente importa es la estructura, el orden y la retroalimentación, no las decoraciones flotantes.

#### Citas de segundo nivel y explicaciones

> La tabla de contenidos es importante no porque se parezca a la documentación, sino porque permite que los artículos largos sean navegables.

## Bloques de código

Un artículo técnico debe ser capaz de alojar simultáneamente bloques de código en diferentes lenguajes.

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

#### Principios de uso del código en línea

No escribas frases completas como `código en línea`; solo debes encapsular como código los nombres de configuración, nombres de funciones o palabras clave reales, por ejemplo `navigator.share()`, `remark-gfm`, `scrollIntoView()`.

## Tablas GFM

La siguiente tabla se utiliza para validar encabezados, alineación, bordes y desplazamiento en dispositivos móviles:

| Módulo | Objetivo | Estrategia actual | Notas |
| --- | --- | --- | --- |
| Tarjetas de categoría de inicio | Alinear con el hover de AnZhiYu | Usar iconos reales + animación de expansión comprimida | Verificación especial de `lime` |
| Tabla de contenidos | Jerarquía real pero sin desperdiciar espacio | Estructura de árbol + sangría ligera + ruta activa | Equilibrio con la eficiencia de clic |
| Sección de comentarios | Publicación directa | Mantener solo el cuadro de mensajes y el flujo de comentarios públicos | No exponer entradas de prueba |
| Sección de compartir | Corresponder a redes sociales reales | Construir parámetros de compartir individualmente para cada plataforma | No solo copiar enlaces |

### Tarea lista

- [x] Cubrir párrafos normales y encabezados de varios niveles
- [x] Cubrir código en línea y bloques de código
- [x] Cubrir spoiler y contenido oculto con contraseña
- [x] Cubrir tablas y listas de tareas
- [x] Cubrir bloques plegables, tarjetas de aviso y citas
- [ ] Continuar completando más sintaxis de bloques de contenido propios de AnZhiYu[^future]

#### Mezcla de listas ordenadas y desordenadas

1. Primero, determinar la estructura del artículo.  
2. Luego, determinar el mapeo del índice lateral.  
3. Después, decidir la jerarquía visual de cada bloque de contenido.

- El foco no está en la cantidad de funciones  
- sino en si la presentación tiene orden  
- y si los diferentes módulos realmente pueden trabajar juntos  

## Notas al pie

Las notas al pie son también parte del escaneo de contenido, ya que afectan la maquetación y el comportamiento de los anclajes al final del artículo. Aquí se presentan dos ejemplos: una nota al pie explicativa[^scan-note] y una nota al pie de juicio más técnico[^engineering-note].

### Suplemento entre párrafos

Cuando en el cuerpo del texto aparece contenido del tipo “por cierto, pero sin interrumpir la línea principal”, las notas al pie suelen ser más efectivas que encerrar todo el párrafo entre paréntesis.

#### Cuándo no deberías usar notas al pie

Si esa información es necesaria para comprender la línea principal, no debería ocultarse en una nota al pie. Las notas al pie son adecuadas para complementos, no para sostener argumentos centrales.

## Combinación de bloques de contenido

El siguiente fragmento combina deliberadamente múltiples capacidades para asegurar que el tema no “rinda bien en un solo tipo de contenido, pero se distorsione al combinarse”.

<div class="article-note-card article-note-card--accent">
  <strong>Prueba de combinación</strong>
  <p>El párrafo actual contiene simultáneamente <mark>resaltado</mark>、<kbd>teclas</kbd>、<ruby>término<rt>term</rt></ruby>、`código en línea` y una referencia de nota al pie[^combo].</p>
</div>

Si un artículo contiene tanto:

- párrafos explicativos
- encabezados jerárquicos
- bloques de código
- tablas
- citas
- énfasis en línea
- contenido oculto
- suplementos plegables

Y si el tema aún mantiene el orden de lectura, entonces este nivel del sistema de contenido se considera realmente estable.

### Cómo usarlo como artículo de prueba rápida

Puedes usar directamente este artículo para verificar los siguientes aspectos:

1. Si el índice lateral reconoce correctamente H2 / H3 / H4.  
2. Si el elemento activo actual, la ruta padre y la posición de desplazamiento son naturales.  
3. Si los bloques de código, tablas y listas de tareas presentan una visual uniforme.  
4. Si el contenido oculto es interactivo.  
5. Si el ritmo vertical entre compartir, comentar, la barra lateral y el cuerpo del texto está coordinado.  

#### Conclusión final

Un tema de blog publicable no debería verse correcto solo en los artículos más simples. Debería resistir muestras que “intencionalmente maximizan la complejidad del contenido” de una sola vez.

---

[^scan-note]: La “exploración” aquí incluye tanto el escaneo de campos del frontmatter como el de títulos, resúmenes, niveles del cuerpo y el renderizado de contenido interactivo.  
[^engineering-note]: Si el índice solo simula niveles mediante sangrías visuales, tarde o temprano revelará problemas de posicionamiento y áreas clicables en textos extensos.  
[^future]: Por ejemplo, una sintaxis de etiquetas de AnZhiYu más completa, alias de bloques de aviso reutilizables y un conjunto de componentes de contenido más cercano al tema original.  
[^combo]: El objetivo de la prueba de combinación es evitar que el tema solo funcione correctamente con un tipo de contenido único.