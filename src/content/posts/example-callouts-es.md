---
title: "Ejemplo: Demostración completa de Callouts y tarjetas de aviso"
description: "Muestra exhaustiva de los 13 tipos semánticos de Callout soportados, versiones de expansión/colapso predeterminadas y comparación con el código fuente Markdown."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["ejemplo", "demostración", "callouts"]
category: "Ejemplos"
series: "Ejemplos de funcionalidades"
math: false
mermaid: false
i18nKey: "example-callouts"
lang: "es"
aiTranslatedFrom: "zh-CN"
---

Este ejemplo está diseñado específicamente para verificar y probar la capacidad de renderizado de **Callouts / Admonitions / Cuadros de aviso** en la columna de contenido del tema del blog.

Basado en la especificación de GitHub Alerts y la estética de diseño de Anzhifu, este tema admite nativamente 13 tipos de tarjetas de aviso de colores con diferentes semánticas. Todas las tarjetas adaptan automáticamente sus colores de alto contraste para los modos claro y oscuro en el cliente.

---

## Cuadros de aviso estándar (Standard Callouts)

Para declarar la tarjeta correspondiente, utiliza la sintaxis `[!TYPE]` en la primera línea de un bloque de cita.

### 1. Note (Nota general)

> [!NOTE]
> Este es el cuadro de aviso estándar **Note**, utilizado para proporcionar contexto de fondo y notas generales.

```markdown
> [!NOTE]
> Este es el cuadro de aviso estándar **Note**, utilizado para proporcionar contexto de fondo y notas generales.
```

### 2. Tip (Consejo práctico)

> [!TIP]
> **Truco de búsqueda rápida**: presiona <kbd>Ctrl</kbd> + <kbd>K</kbd> para invocar rápidamente la paleta de búsqueda global de artículos.

```markdown
> [!TIP]
> **Truco de búsqueda rápida**: presiona <kbd>Ctrl</kbd> + <kbd>K</kbd> para invocar rápidamente la paleta de búsqueda global de artículos.
```

### 3. Important (Importante)

> [!IMPORTANT]
> Antes de construir la versión de producción, asegúrate de que la variable de entorno `BLOG_BUILD_TARGET=static` esté correctamente establecida.

```markdown
> [!IMPORTANT]
> Antes de construir la versión de producción, asegúrate de que la variable de entorno `BLOG_BUILD_TARGET=static` esté correctamente establecida.
```

### 4. Warning (Advertencia de riesgo)

> [!WARNING]
> No subas claves privadas de bases de datos ni AccessKeys de servicios en la nube en repositorios de código públicos.

```markdown
> [!WARNING]
> No subas claves privadas de bases de datos ni AccessKeys de servicios en la nube en repositorios de código públicos.
```

### 5. Caution & Danger (Precaución y Peligro)

> [!CAUTION]
> Asegúrate de realizar una copia de seguridad completa de los datos antes de ejecutar operaciones de reestructuración de la base de datos.

> [!DANGER]
> Eliminar directamente la base de datos de producción causará la destrucción permanente de todos los comentarios y activos de los usuarios.

```markdown
> [!CAUTION]
> Asegúrate de realizar una copia de seguridad completa de los datos antes de ejecutar operaciones de reestructuración de la base de datos.

> [!DANGER]
> Eliminar directamente la base de datos de producción causará la destrucción permanente de todos los comentarios y activos de los usuarios.
```

### 6. Success (Operación exitosa)

> [!SUCCESS]
> La construcción estática se ha completado con éxito; todas las rutas estáticas han sido generadas.

```markdown
> [!SUCCESS]
> La construcción estática se ha completado con éxito; todas las rutas estáticas han sido generadas.
```

### 7. Question, Quote, Info, Todo, Bug, Example

> [!QUESTION]
> ¿Cómo implementar una búsqueda de texto completo en milisegundos sin dependencias de servidor?

> [!QUOTE]
> "El código elegante no solo puede ser ejecutado por máquinas, sino que también puede transmitir ideas a los humanos como un poema."

> [!INFO]
> Este blog se construye con Astro 6 y Tailwind 4, con una exportación completamente estática de todo el sitio.

> [!TODO]
> Se planea introducir la búsqueda de tokenización en el cliente mediante WebAssembly en la próxima versión.

> [!BUG]
> Se corrigió el problema de maquetación de truncamiento horizontal de tablas en dispositivos con pantallas extremadamente estrechas en versiones anteriores.

> [!EXAMPLE]
> Los datos de ejemplo están listos; puedes copiar el código fuente directamente para el desarrollo secundario.

```markdown
> [!QUESTION]
> ¿Cómo implementar una búsqueda de texto completo en milisegundos sin dependencias de servidor?

> [!QUOTE]
> "El código elegante no solo puede ser ejecutado por máquinas, sino que también puede transmitir ideas a los humanos como un poema."

> [!INFO]
> Este blog se construye con Astro 6 y Tailwind 4, con una exportación completamente estática de todo el sitio.

> [!TODO]
> Se planea introducir la búsqueda de tokenización en el cliente mediante WebAssembly en la próxima versión.

> [!BUG]
> Se corrigió el problema de maquetación de truncamiento horizontal de tablas en dispositivos con pantallas extremadamente estrechas en versiones anteriores.

> [!EXAMPLE]
> Los datos de ejemplo están listos; puedes copiar el código fuente directamente para el desarrollo secundario.
```

---

## Cuadros de aviso plegables (Collapsible Details Admonitions)

Para generar tarjetas plegables nativas, agrega `-` (colapsado por defecto) o `+` (expandido por defecto) inmediatamente después del tipo de etiqueta:

### 1. Cuadro de aviso plegable colapsado por defecto (`[!TIP]-`)

> [!TIP]- Haz clic para expandir y ver: Configuración de caché a largo plazo de Nginx para producción
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```

```markdown
> [!TIP]- Haz clic para expandir y ver: Configuración de caché a largo plazo de Nginx para producción
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```
```

### 2. Cuadro de aviso plegable expandido por defecto (`[!NOTE]+`)

> [!NOTE]+ Descripción del diseño de arquitectura expandida por defecto
> Esta área está en estado expandido por defecto; haz clic en la barra de título para colapsarla suavemente y ahorrar espacio en pantalla.

```markdown
> [!NOTE]+ Descripción del diseño de arquitectura expandida por defecto
> Esta área está en estado expandido por defecto; haz clic en la barra de título para colapsarla suavemente y ahorrar espacio en pantalla.
```