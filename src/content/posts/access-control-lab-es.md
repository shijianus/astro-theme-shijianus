---
title: "Laboratorio de Control de Acceso para Artículos"
pubDate: 2026-04-26
updatedDate: 2026-04-26
description: "Para verificar que el control de acceso por contraseña funciona según las reglas del servidor y confirmar que el contenido restringido no se muestra directamente en la página si no está desbloqueado."
author: "shijianus"
category: "Diseño de Sistemas"
group: "Experimento de Seguridad"
cover: "/media/shijianus/system.jpg"
coverAlt: "Laboratorio de Control de Acceso para Artículos"
featured: false
sticky: 1
tags: ["Control de Acceso", "Seguridad", "Renderizado en Servidor"]
access:
  passwordHash: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"
  message: "Este artículo tiene el control de acceso habilitado en el servidor. El contenido solo se renderizará después de introducir la contraseña correcta."
i18nKey: "access-control-lab"
lang: "es"
aiTranslatedFrom: "zh-CN"
---

# Este es un artículo protegido

Si ves este artículo sin desbloquearlo, el siguiente contenido no será generado por el servidor en la página, en lugar de simplemente ser generado y luego ocultado por el frontend.

## ¿Qué debes verificar después de desbloquear?

1.  Cuando no se introduce la contraseña, el contenido principal no aparece en el HTML.
2.  Después de introducir la contraseña correcta `12345`, el servidor escribirá una credencial de acceso temporal.
3.  Al actualizar este artículo de nuevo, no será necesario volver a introducir la contraseña.
4.  Las tarjetas de la página de inicio, los artículos recientes y los resúmenes no revelarán el contenido protegido.

## ¿Qué soporta actualmente esta capa de reglas?

-   Acceso por contraseña
-   Visible para IP específicas
-   Invisible para IP específicas
-   Visible para países o regiones específicas
-   Invisible para países o regiones específicas

## Ejemplos de sintaxis en Frontmatter

Los siguientes fragmentos de código se pueden colocar directamente en el frontmatter del artículo:

```yaml
access:
  passwordHash: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"
  message: "Continúa leyendo después de introducir la contraseña correcta."
```

```yaml
access:
  blockedCountries: ["CN"]
  message: "Este artículo no es accesible desde tu región actual."
```

```yaml
access:
  allowedIps: ["203.0.113.7", "198.51.100.*", "192.0.2.0/24"]
  message: "Tu dirección de red actual no está dentro del rango permitido."
```

Si solo quieres permitir el acceso desde un país o región específica, también puedes escribir directamente:

```yaml
access:
  allowedCountries: ["US", "GB", "HK"]
```

## ¿Por qué se recomienda usar passwordHash?

Aunque actualmente sigue siendo compatible escribir `password` directamente, se recomienda encarecidamente escribir solo `passwordHash` en Markdown. De esta manera, el tema solo realizará la comparación en el servidor, sin necesidad de guardar la contraseña en texto plano en la configuración del contenido.

Si necesitas generar el valor hash tú mismo, el tema actual utiliza `SHA-256` internamente. Se recomienda convertir la contraseña a hash localmente y luego escribirla en el frontmatter, en lugar de colocar la contraseña en texto plano directamente en el archivo fuente del artículo.

## ¿Por qué esta capa no filtra el contenido restringido de antemano?

Esta implementación no consiste en "primero generar el texto completo y luego ocultarlo con el frontend". Las páginas de artículos restringidos se basan en la determinación del servidor:

1.  Cuando no se cumplen las reglas de contraseña o de región/IP, el servidor solo devuelve el panel de bloqueo.
2.  El contenido principal, el índice, los artículos relacionados y los resúmenes públicos no se renderizarán en la página si no están desbloqueados.
3.  La página de inicio, la paginación, los artículos recientes, los índices de búsqueda y la barra lateral tampoco incluirán artículos restringidos.

## Conclusión

Este artículo es principalmente para que realices pruebas de humo posteriores. Siempre que la página de bloqueo, la página de desbloqueo y el estado de retención después de la actualización funcionen correctamente, significa que este sistema de control de acceso ha pasado de ser una "función conceptual" a un estado de uso práctico.