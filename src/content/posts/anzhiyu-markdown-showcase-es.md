---
title: "Revisión completa de las capacidades de Markdown al estilo Anzhiyu: tabla de contenido, formato, contenido oculto, medios y bloques de contenido"
pubDate: 2026-04-25
updatedDate: 2026-04-25
description: "Un artículo de ejemplo largo diseñado específicamente para probar el escaneo de artículos, los niveles de la tabla de contenido, GFM, contenido oculto, formato especial, visualización de medios y bloques de contenido comunes."
author: "shijianus"
category: "Ingeniería Frontend"
group: "Ejemplos de Markdown"
cover: "/media/shijianus/workbench.jpg"
coverAlt: "escritorio de exhibición de markdown"
featured: true
sticky: 4
tags: ["Astro", "Markdown", "Refactorización de Tema", "UI", "Estudio"]
i18nKey: "anzhiyu-markdown-showcase"
lang: "es"
aiTranslatedFrom: "zh-CN"
---
# Este es un artículo largo diseñado específicamente para validar las capacidades del tema

Este artículo no es una entrada de blog convencional, sino una inspección general destinada a verificar si la página de artículos actual se ha acercado verdaderamente a la experiencia de lectura del tema Anzhiyu. Cubrirá simultáneamente el **escaneo de la imagen de cabecera**, la **identificación de categorías y etiquetas**, el **mapeo de la jerarquía de la tabla de contenidos**, la **mejora de los bloques de código**, las **tablas GFM y listas de tareas**, el **contenido oculto**, las **fuentes y formatos especiales**, la **presentación de medios**, la **combinación de bloques de contenido** y el **rendimiento del desplazamiento en párrafos largos**.

Si estas capacidades aparecen de manera estable en un mismo artículo, y si la tabla de contenidos, el compartir, los comentarios, la barra lateral, las propinas y la ruta de lectura general no se desintegran, entonces este tema habrá entrado realmente en la fase de entregabilidad.

## Escaneo de formatos básicos

Primero, usemos un texto básico para confirmar que las semánticas de Markdown más comunes son estables y legibles:

- Aquí hay **texto en negrita**, para confirmar que el énfasis en el cuerpo del texto no sea demasiado brillante ni borroso.
- Aquí hay *texto en cursiva*, para confirmar que el ritmo del texto no se interrumpa.
- Aquí hay ~~texto tachado~~, para verificar si la extensión GFM ya está activa.
- Aquí hay `código en línea`, para confirmar los márgenes, las esquinas redondeadas y el tamaño de fuente de los bloques de código en línea.
- Aquí hay [un enlace externo a Astro](https://astro.build/), para confirmar el color del enlace y la retroalimentación al pasar el cursor (hover).

Este párrafo también mezcla deliberadamente chino, inglés, números y símbolos, por ejemplo `Astro 6 + React 19 + Tailwind 4`, para confirmar que el espaciado entre letras y los saltos de línea no parezcan abarrotados en un artículo largo real.

### Formatos y fuentes especiales

Los siguientes elementos no son contenido que se escriba a diario en un blog normal, pero son muy adecuados para probar si el sistema de artículos tiene una capacidad de expresión lo suficientemente completa:

- `<mark>texto resaltado</mark>` para probar la marca de énfasis.
- `<kbd>Ctrl</kbd> + <kbd>K</kbd>` para probar la representación de los atajos de teclado.
- `<ruby>目录<rt>mulu</rt></ruby>` para probar la tipografía con anotaciones fonéticas.
- `<abbr title="Application Programming Interface">API</abbr>` para probar la explicación de las siglas.
- Ejemplo de superíndice en línea: E = mc<sup>2</sup>.
- Ejemplo de subíndice en línea: H<sub>2</sub>O y log<sub>n</sub>.

También se puede insertar directamente un fragmento de HTML nativo con diferentes fuentes:

<p>
  <span style="font-family: 'Times New Roman', serif; font-size: 1.08em; letter-spacing: 0.04em;">This sentence uses a serif rhythm.</span>
  <br />
  <span style="font-family: 'Courier New', monospace; font-size: 0.96em;">const typographyMode = "editorial + geek";</span>
</p>

<div class="article-note-card article-note-card--accent">
  <strong>Prueba de estrés de combinación de formatos especiales</strong>
  <p>Este bloque cubre simultáneamente <mark>marcas de resaltado</mark>, <kbd>teclas</kbd>, `código en línea`, diferentes pesos de fuente y HTML nativo, con el objetivo de confirmar que la mejora del cuerpo del texto no es válida solo bajo una única forma de contenido.</p>
</div>

### Contenido oculto y spoilers

El tema actual ya soporta varios tipos de contenido en línea con mejoras de front-end:

- Máscara de spoiler: ||Este es un texto de spoiler que se mostrará tras hacer clic, para confirmar que la máscara botoneada se ha escaneado correctamente.||
- Mostrar al hacer clic directamente: %%Aquí hay una pista oculta que se desplegará tras hacer clic.%%

Esta capa ahora solo mantiene la mejora de visibilidad del front-end y ya no ofrece la escritura de "ocultación por contraseña de front-end", que es una capacidad de seguridad que se suele malinterpretar. Cuando se necesite realmente acceso por contraseña, se debe utilizar el control de acceso del servidor en el frontmatter del artículo.

Si ambas interacciones de este párrafo funcionan correctamente, significa que el script de mejora del cuerpo del texto está en línea con la renderización de Markdown y no ha dañado accidentalmente nodos de texto comunes, `code`, `pre` u otros elementos protegidos.

## Prueba de estrés de la jerarquía de la tabla de contenidos

Esta sección está diseñada específicamente para verificar si el esquema de compresión de niveles de la tabla de contenidos cumple simultáneamente dos objetivos:

1. Las relaciones jerárquicas deben ser precisas; no se debe disfrazar un H4 como un H2.
2. La sangría no debe ser excesiva, de lo contrario la tabla de contenidos perderá su clicabilidad práctica debido al exceso de espacio en blanco.

### Primer nivel de agrupación: Estructura de la información

Cuando la tabla de contenidos se ajusta realmente a la estructura del artículo, el lector no necesita leer los títulos palabra por palabra para poder determinar aproximadamente si el contenido de esa sección es una introducción general, un subargumento o un elemento complementario. La tarea de la tabla de contenidos no es "copiar todos los títulos", sino ayudar al lector a construir un mapa del artículo.

#### Segundo nivel de agrupación: Pistas de jerarquía

Si la tabla de contenidos no tiene sangría en absoluto, todos los títulos se apretarán en la misma línea horizontal, lo que dificultará que el lector distinga de un vistazo a qué parte pertenece cada título. Por el contrario, si cada nivel utiliza una sangría excesiva, la tabla de contenidos perderá rápidamente su eficiencia de clic.

#### Segundo nivel de agrupación: Eficiencia de salto

La solución realmente utilizable normalmente no consiste en seguir ampliando la sangría, sino en añadir sobre una base de sangría pequeña el resaltado de la ruta, la marca de la rama activa, el fondo del elemento activado y las indicaciones de numeración, para que las relaciones jerárquicas y la eficiencia operativa se mantengan simultáneamente.

### Primer nivel de agrupación: Ruta de lectura

Este párrafo sirve para probar otro escenario común: el lector primero barre la tabla de contenidos de arriba hacia abajo, luego se detiene en un H3 y finalmente hace clic directamente para saltar al medio del cuerpo del texto.

#### Segundo nivel de agrupación: Posicionamiento actual

Si el área de posicionamiento actual puede mostrar de manera estable el título activo, el nivel actual y el número de serie total, se mejorará significativamente la orientación durante la lectura de artículos largos.

#### Segundo nivel de agrupación: Desplazamiento de la tabla de contenidos

Cuando cambia el título activo, la propia lista de la tabla de contenidos también debería mantenerse en seguimiento, pero no debe forzar la recuperación del foco cuando el usuario desplaza manualmente la tabla de contenidos.

### Primer nivel de agrupación: Artículos extremadamente largos

Si el artículo es lo suficientemente largo, la tabla de contenidos debe mantenerse fija y utilizable, en lugar de perder directamente el comportamiento sticky debido a una estrategia incorrecta de altura de la tarjeta.

#### Segundo nivel de agrupación: Prueba de densidad H4

Después de este párrafo se añadirá un lote más de H4, con el objetivo de que aparezcan nodos más profundos en la tabla de contenidos y observar si la sangría comprimida sigue siendo legible.

##### Tercer nivel de complemento: Compresión de ruta H5

Este nivel sirve para confirmar que la tabla de contenidos, al profundizar más, no comprime el área clicable hasta hacerla demasiado estrecha debido al aumento de niveles. Es decir, **que la jerarquía sea más profunda no significa que el área de interacción pueda ser más pequeña**.

###### Cuarto nivel final: Prueba de ancla H6

Si aún puedes ver claramente la posición de este nivel en la tabla de contenidos de la derecha, y si el salto de ancla tras hacer clic es preciso y el resaltado de la ruta actual es estable, entonces el escaneo de títulos de niveles más profundos ya está completo.

#### Segundo nivel de agrupación: Nodo adicional A

Aquí está el nodo adicional A, utilizado para crear una lista de tabla de contenidos más larga.

#### Segundo nivel de agrupación: Nodo adicional B

Aquí está el nodo adicional B, utilizado para crear una lista de tabla de contenidos más larga.

#### Segundo nivel de agrupación: Nodo adicional C

Aquí está el nodo adicional C, utilizado para crear una lista de tabla de contenidos más larga.

## Listas, tareas y tablas

El siguiente conjunto de contenido verifica principalmente si la extensión GFM se ha integrado completamente.

### Listas desordenadas y ordenadas

- Estructura de la página de inicio prioritaria.
- Tabla de contenidos de la página de artículo prioritaria.
- La sección de comentarios debe mantenerse intuitiva.

1. Primero ver si la tabla de contenidos es fiable.
2. Luego ver si compartir y dar propinas es cómodo.
3. Finalmente ver si la sección de comentarios es realmente publicable.

### Lista de tareas

- [x] Escaneo de imagen de cabecera y metadatos
- [x] Agregación de etiquetas y categorías
- [x] Corrección de la jerarquía de la tabla de contenidos
- [x] Reestructuración de la estructura de propinas y compartir
- [ ] Integración de datos de comentarios remotos reales
- [ ] Complementar con más etiquetas de contenido estilo Anzhiyu

### Tabla

| Módulo | Objetivo actual | Criterios de aceptación |
| --- | --- | --- |
| Tarjeta de categoría de inicio | Alinear con la animación de An Zhiyu | Ángulo del icono, estrategia de ampliación y ritmo de hover consistentes |
| TOC | Jerarquía precisa y clicable | H2/H3/H4 distinguibles, ruta activa clara |
| Ventana emergente de donación | Mostrar solo información efectiva | Selección de área + código QR, y evitar automáticamente el viewport |
| Herramienta para compartir | Corresponder realmente a diferentes plataformas | No solo copiar el enlace, sino generar contenido de compartir correspondiente |
| Sección de comentarios | Publicación directa | Disposición vertical, altura fija, desplazamiento para ver comentarios públicos |

## Citas, bloques plegables y código largo

> Un tema de blog maduro no solo debe verse bien en las capturas de pantalla, sino que debe funcionar de manera estable y continua en artículos largos reales.

Esta cita prueba principalmente si la sensación de jerarquía del blockquote y el ritmo del texto principal son apropiados.

<details>
  <summary>Haga clic para expandir el bloque plegable y verificar si summary/details ya tienen un estilo legible</summary>
  <p>Los bloques plegables son muy adecuados para explicaciones secundarias, materiales complementarios y notas temporales. Aquí se colocan deliberadamente como HTML nativo, en lugar de etiquetas privadas del tema, con el objetivo de mantener la portabilidad del contenido Markdown en sí.</p>
  <p>Si en el futuro cambia el sistema de artículos de Markdown local a API o CMS, estas estructuras HTML estándar serán más estables que los shortcodes privados del tema.</p>
</details>

### Bloque de código TypeScript

```ts
type TocNode = {
  id: string;
  depth: 2 | 3 | 4;
  title: string;
  children: TocNode[];
};

export function compressTocIndent(nodes: TocNode[], offset = 0): TocNode[] {
  return nodes.map((node) => ({
    ...node,
    children: compressTocIndent(node.children, offset + 1),
  }));
}

const sharePayload = {
  title: "Alineación del tema estilo An Zhiyu",
  summary: "Completar las rutas de uso real para el índice, compartir, comentarios y donaciones.",
  platforms: ["wechat", "weibo", "x", "telegram", "email"],
};
```

### Bloque de código Bash

```bash
npm install
npm run build
npm run preview -- --host 0.0.0.0
```

### Bloque de código CSS

```css
#card-toc .toc-item {
  padding-left: calc(var(--toc-level, 0) * 12px);
}

#card-toc .toc-item.is-active-branch > .toc-link {
  background: color-mix(in srgb, var(--theme-main) 10%, var(--card-bg));
}

.post-share-grid__surface {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

## Imágenes, líneas divisorias y notas al pie

La siguiente imagen se utiliza principalmente para confirmar que las imágenes del cuerpo del texto no excedan el ancho del artículo en textos largos y mantengan un espaciado estable con el contexto.

![Entorno de trabajo y escritura](/media/shijianus/workbench.jpg)

---

Las notas al pie también son una estructura muy común en textos largos, y ahora se utilizan para probar si la capacidad de notas al pie de GFM ya está activa. [^toc]

[^toc]: El texto de esta nota al pie se colocará al final del artículo para verificar la numeración, el salto y el espaciado de las notas al pie con el texto principal.

## Medios y complementos incrustados

Si este artículo se considera una revisión general del tema, también es necesario revisar los bloques de medios en el cuerpo del texto:

<figure>
  <video src="/media/shijianus/avatar-dynamic.mp4" poster="/media/shijianus/default.png" muted loop playsinline controls></video>
  <figcaption>Video local + póster, para confirmar que los medios del cuerpo del texto se ajustan de manera estable en diferentes anchos.</figcaption>
</figure>

<figure>
  <img src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80" alt="Ejemplo de alojamiento de imágenes remoto" />
  <figcaption>Imagen de alojamiento de imágenes remoto, para confirmar que los recursos de origen cruzado y el espaciado del cuerpo del texto no interfieren entre sí.</figcaption>
</figure>

Si los recursos remotos fallan, el script de mejora del cuerpo del texto los revertirá a imágenes de marcador de posición predeterminadas, en lugar de dejar cuadros vacíos rotos.

## Demostración de equivalencia de bloques de contenido comunes

Esta sección ya no se limita a probar el Markdown básico, sino que complementa algunos de los bloques de contenido más comunes en los temas de blogs diarios y que son más fáciles de perder durante la migración. Aquí se utiliza HTML nativo y el estilo del tema actual para una demostración de equivalencia, centrándose en verificar la maquetación, el espaciado y la capacidad de respuesta, en lugar de vincularse a la sintaxis privada de un tema antiguo.

<div class="article-demo-stack">
  <div class="article-demo-tabs">
    <div class="article-demo-tabs__nav">
      <span>Panel de pestañas</span>
      <span>Instrucciones</span>
      <span>Conclusión de adaptación</span>
    </div>
    <div class="article-demo-tabs__panel">
      Este grupo simula las áreas de contenido comunes de pestañas/botones, verificando si los bloques de información con formato de botón aún tienen suficiente jerarquía en el cuerpo del texto sin interrumpir el ritmo del mismo.
    </div>
  </div>

  <div class="article-demo-timeline">
    <div class="article-demo-timeline__item">
      <strong>Fase uno: Alineación estructural</strong>
      <span>Primero, alinee el esqueleto de la página del artículo, la página de inicio, el índice y la barra lateral fija para asegurar que los lectores no pierdan la navegación antes de la sección de comentarios o el pie de página.</span>
    </div>
    <div class="article-demo-timeline__item">
      <strong>Fase dos: Consolidación interactiva</strong>
      <span>Limpie los botones duplicados y coloque las funciones de compartir, idioma, cuenta y configuración en ubicaciones más claras para evitar que compitan por el espacio.</span>
    </div>
    <div class="article-demo-timeline__item">
      <strong>Fase tres: Relleno de contenido</strong>
      <span>Complemente con medios, contenido oculto, códigos QR, tarjetas de sitio y pruebas de estrés de artículos largos para asegurar que no se desmorone al escribir textos extensos.</span>
    </div>
  </div>

  <div class="article-demo-gallery">
    <img src="/media/shijianus/workbench.jpg" alt="Pantalla del escritorio de trabajo" />
    <img src="/media/shijianus/hero.jpg" alt="Bloque de imagen principal de la página de inicio" />
    <img src="/media/shijianus/tg-group.jpg" alt="Prueba de código QR e imagen larga" />
  </div>

  <div class="article-demo-links">
    <div class="article-demo-link-card">
      <strong>Tarjeta de sitio</strong>
      <span>Equivalente a las comunes site-card / link-card, verifica si los enlaces en formato de tarjeta aún mantienen suficiente área de clic en el cuerpo del texto.</span>
    </div>
    <div class="article-demo-link-card">
      <strong>Tarjeta de medios</strong>
      <span>Se utiliza junto con pruebas de alojamiento de imágenes, códigos QR y portadas de video para confirmar que el contenido de diferentes tamaños no alterará el ancho del texto ni el ritmo del espacio en blanco.</span>
    </div>
  </div>
</div>

## Prueba de estrés de desplazamiento de párrafos largos

Los problemas reales no suelen aparecer en un documento de demostración muy corto, sino en un artículo lo suficientemente largo, que contenga varios módulos y que tenga un índice y herramientas flotantes. Por lo tanto, aquí se añaden deliberadamente dos párrafos más largos para probar si la conexión del contenido después de la imagen principal del artículo, la sensación de "respiración" del texto, la barra lateral fija, los elementos activos del índice, y la diferencia de lectura entre la sección de donaciones y la sección de comentarios, se mantienen estables durante el desplazamiento.

Una página de artículo estable no debería requerir que el usuario entienda la estructura de los componentes, la pila tecnológica o la motivación de la interacción. El usuario solo percibe tres cosas: primero, si puedo encontrar rápidamente el párrafo que quiero leer; segundo, cuando me preparo para compartir, donar o comentar, si estas entradas aparecen justo cuando las necesito, en lugar de interrumpir el texto principal de forma masiva; tercero, cuando el artículo es muy largo, hay muchos nodos en el índice y los comentarios siguen creciendo, ¿puede la página mantener el orden? Si estas tres cosas se cumplen, el tema ha pasado de "parecer un tema" a ser un "sistema de contenido verdaderamente utilizable a largo plazo".

Finalmente, se añade un resumen desde la perspectiva del autor: alinear con el tema Anzhiyu no significa copiar cada línea de la plantilla, sino reinterpretar sus juicios de diseño validados por un uso prolongado y luego replicarlos en el ecosistema Astro de una manera más adecuada para la estructura de ingeniería actual. Lo que realmente vale la pena replicar no es la antigua pila tecnológica, sino su capacidad de juicio sobre la prioridad de la información, la retroalimentación interactiva, la ruta de lectura y el orden de los módulos. Si estos juicios han sido completamente validados en este artículo, entonces este trabajo de alineación ha entrado verdaderamente en una fase entregable.