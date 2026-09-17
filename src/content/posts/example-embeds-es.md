---
title: "Ejemplo: Incrustaciones de Medios Ricos, Formatos de Publicación y Burbujas de Chat"
description: "Demostración completa de los Formatos de Publicación estilo WordPress, tarjetas de audio/video de vinilo, tarjetas de marcadores y flujos de diálogo de burbujas de chat."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["ejemplo", "demostración", "incrustaciones", "formatos-de-publicación"]
category: "Ejemplo"
series: "Ejemplos de Funcionalidades"
math: false
mermaid: false
i18nKey: "example-embeds"
lang: "es"
aiTranslatedFrom: "zh-CN"
---

Este ejemplo está dedicado a mostrar y probar las **incrustaciones de medios ricos (Embeds), los formatos de publicación de WordPress y los flujos de diálogo de chat para dos personas** dentro del cuerpo del blog.

---

## I. Notas y Micro-citas (Aside & Status)

### 1. Tarjeta de Nota (Aside)

<div class="article-aside">
  <p><strong>💡 Nota rápida</strong>: El verdadero valor de los sitios estáticos no reside en la ostentación tecnológica, sino en ofrecer una experiencia de lectura pura, ultrarrápida y sin carga de mantenimiento del lado del servidor.</p>
</div>

### 2. Estado Dinámico (Status)

<div class="article-status">
  <div class="article-status__header">
    <div class="article-status__user">
      <img class="article-status__avatar" src="/media/shijianus/avatar.jpg" alt="Avatar del autor" />
      <div>
        <div class="article-status__name">shijianus</div>
        <div class="article-status__meta">Publicado el 28-08-2026 14:32 · 🇨🇳 Hangzhou</div>
      </div>
    </div>
    <div class="article-status__badge">
      <span>📱 Desde Geek Workshop Mac Studio</span>
    </div>
  </div>
  <p class="article-status__content">
    ¡Hoy finalmente he completado todas las extensiones de formato y la reestructuración visual de la columna de contenido! Desde KaTeX y Mermaid hasta los desplegables interactivos y las tarjetas de vinilo, ¡la entrega estática es increíble! 🚀✨
  </p>
</div>

---

## II. Tarjeta de Audio de Vinilo

Cuando se reproduce el audio, la portada del disco activará automáticamente un efecto de rotación suave y continuo:

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="Portada del disco" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">Paseo Estelar (Enfoque Ambiental)</div>
    <div class="audio-card__author">shijianus · Ruido blanco original para concentración profunda</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>

---

## III. Tarjeta de Marcador de Enlace Externo (Bookmark Card)

<a class="article-bookmark" href="https://github.com/anzhiyu-c/hexo-theme-anzhiyu" target="_blank" rel="noopener">
  <div class="article-bookmark__content">
    <div class="article-bookmark__title">anzhiyu-c / hexo-theme-anzhiyu (Repositorio oficial del tema AnZhiYu)</div>
    <p class="article-bookmark__desc">AnZhiYu es un tema de blog geek muy aclamado en la plataforma Hexo, que se ha convertido en un referente de la industria por sus excelentes microanimaciones y diseño de densidad de información.</p>
    <div class="article-bookmark__site">
      <span class="badge badge-primary">GitHub</span>
      <span>github.com · ⭐ 2.8k Stars</span>
    </div>
  </div>
  <div class="article-bookmark__icon">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
  </div>
</a>

---

## IV. Flujo de Diálogo Animado con Burbujas de Chat para Dos Personas (Organic Animated Dialogue Stream)

Configura `data-animate="true"` para activar el efecto de envío con secuencia de escritura real, el avatar dinámico (`footer_mini_logo__media`) y el sonido de notificación exclusivo, que se activa al deslizarse por primera vez:

<div class="article-chat" data-animate="true" data-sound="true">
  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Desarrollador <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:15</div>
      <div class="chat-bubble">
        ¡Hola! ¿La implementación de la renderización estática de <code>KaTeX</code> y <code>Mermaid</code> en Astro ralentizará la velocidad de carga de la página frontend?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Arquitecto shijianus" />
    <div class="chat-body">
      <div class="chat-author">Arquitecto <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:16</div>
      <div class="chat-bubble">
        ¡Para nada! Porque <code>remark-math</code> y <code>rehype-katex</code> ya compilan las fórmulas en cadenas puras de HTML/MathML durante el tiempo de construcción (Build-time), lo que significa <strong>0 carga de tiempo de ejecución de JS</strong> en el navegador; y los diagramas de Mermaid también se cargan de forma asíncrona y bajo demanda como módulos ESM, ¡haciendo que la primera pantalla sea extremadamente rápida! ⚡
      </div>
    </div>
  </div>

  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Desarrollador <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:17</div>
      <div class="chat-bubble">
        ¡Genial! ¡Esta animación de escritura que varía según la longitud del mensaje y el efecto de avatar dinámico son fantásticos! 🎉
      </div>
    </div>
  </div>
</div>

---

## V. Convertidor Interactivo de Unidades y Tasas de Cambio de Alta Precisión (Interactive Unit Converter)

<div class="interactive-unit-converter" data-default="1"></div>