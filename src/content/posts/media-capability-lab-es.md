---
title: "封面、图床与视频适配实验室"
pubDate: 2026-04-26
updatedDate: 2026-04-26
description: "集中验证文章头图、远程图床、本地资源、视频封面、失效回退和不同宽度下的媒体展示效果。"
author: "shijianus"
category: "前端工程"
group: "媒体适配"
coverVideo: "/media/shijianus/avatar-dynamic.mp4"
coverVideoPoster: "/media/shijianus/workbench.jpg"
coverAlt: "封面与媒体适配实验室"
featured: true
sticky: 2
tags: ["媒体适配", "Markdown", "主题重构", "Astro"]
i18nKey: "media-capability-lab"
lang: "es"
aiTranslatedFrom: "zh-CN"
---
# Revisión general de la portada y la adaptación de medios

Este artículo está diseñado específicamente para probar si `post-hero__cover`, las imágenes del cuerpo del texto, los servicios de alojamiento de imágenes remotos, los videos y las imágenes de relleno predeterminadas funcionan de manera estable. Las reglas actuales son:

- La imagen de portada del artículo puede utilizar directamente una imagen local.
- La imagen de portada del artículo también puede utilizar un video local con un atributo `poster`.
- Si una imagen en el cuerpo del texto falla al cargar, se revertirá automáticamente a la portada predeterminada.
- Si un video en el cuerpo del texto no tiene un atributo `poster`, se añadirá automáticamente la portada predeterminada.

## Imágenes locales

La siguiente imagen utiliza un recurso local:

![Imagen de la mesa de trabajo local](/media/shijianus/workbench.jpg)

## Imágenes de servicios de alojamiento remotos

A continuación se incluye intencionalmente una imagen remota para confirmar que los recursos remotos también se muestren correctamente:

![Imagen de ejemplo remota](https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80)

## Reversión ante imágenes no válidas

La siguiente imagen tiene una dirección incorrecta a propósito, para confirmar que la imagen de relleno predeterminada se complete automáticamente:

![Prueba de reversión ante imagen no válida](/media/shijianus/does-not-exist.jpg)

## Video nativo

Los videos en el cuerpo del texto también deben admitir direcciones locales y mantener una reproducción controlable en diferentes dispositivos:

<video src="/media/shijianus/avatar-dynamic.mp4" poster="/media/shijianus/default.png" muted loop playsinline controls></video>

## Video sin poster

El siguiente video no incluye el atributo `poster`, para verificar si el tema completa automáticamente la imagen de relleno predeterminada:

<video src="/media/shijianus/avatar-dynamic.mp4" muted loop playsinline controls></video>

## Imágenes anchas, estrechas y largas

![Ejemplo de imagen ancha](/media/shijianus/hero.jpg)

![Imagen larga vertical de código QR](/media/shijianus/tg-group.jpg)

Cuando estos contenidos aparecen simultáneamente, la página debe garantizar:

1. Que las imágenes no excedan el ancho del cuerpo del texto.
2. Que los videos muestren correctamente la barra de controles en dispositivos móviles.
3. Que los recursos no válidos no dejen imágenes de relleno rotas.
4. Que, si el video de la portada falla, se revertirá automáticamente a la imagen predeterminada.

## Conclusión

Si en las pruebas de humo (smoke tests) observa que la imagen de portada de este artículo se reproduce, que las imágenes del cuerpo del texto se ajustan al ancho, que las imágenes erróneas son reemplazadas por la portada predeterminada y que los videos del cuerpo del texto son reproducibles, entonces esta capa de adaptación de medios ya puede avanzar hacia un refinamiento visual más detallado.