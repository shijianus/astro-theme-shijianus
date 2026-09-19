---
title: "Ejemplo: Diagramas y visualizaciones con Mermaid 11"
description: "Demostración completa de diagramas de arquitectura, secuencias, Gantt, gráficos de pastel y GitGraph con Mermaid."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["ejemplo", "demostración", "mermaid", "diagramas"]
category: "Ejemplos"
series: "Ejemplos de funciones"
math: false
mermaid: true
i18nKey: "example-mermaid"
lang: "es"
aiTranslatedFrom: "zh-CN"
---

Este ejemplo está diseñado específicamente para demostrar y probar la capacidad de compilación y renderizado de **diagramas vectoriales de Mermaid 11** en el cuerpo del artículo del blog.

Los diagramas se declaran mediante código de texto plano, el motor ESM se carga de forma asíncrona bajo demanda en el cliente y se adapta automáticamente a los temas claro y oscuro.

---

## 1. Diagrama de flujo de decisiones de arquitectura del sistema (Flowchart)

```mermaid
graph TD
    A[El lector inicia la visita al artículo] --> B{¿Se ha establecido una contraseña de acceso?}
    B -->|Sí| C[Abrir el modal de contraseña con efecto de vidrio esmerilado]
    C --> D{Verificación de la contraseña}
    D -->|Correcta| E[Descifrar el contenido y reproducir la animación]
    D -->|Incorrecta| F[Activar la vibración de la ventana y la advertencia]
    B -->|No| E
    E --> G[Cargar las fórmulas de KaTeX y los diagramas de Mermaid]
    G --> H[Mostrar la interfaz de lectura inmersiva]
```

---

## 2. Diagrama de secuencia de interacción del cliente (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Lector (User)
    participant Browser as Navegador del cliente
    participant PostPage as Motor de renderizado del artículo
    participant Security as Módulo de seguridad de cifrado

    User->>Browser: Hacer clic en el área de contenido protegido
    Browser->>PostPage: Abrir el cuadro de diálogo de entrada de contraseña
    User->>Browser: Introducir la clave de descifrado
    Browser->>Security: Validar el Hash de acceso
    alt Validación exitosa
        Security-->>Browser: Devolver el token de desbloqueo
        Browser->>PostPage: Mostrar el contenido descifrado
    else Validación fallida
        Security-->>Browser: Devolver error de contraseña
        Browser->>User: Activar la vibración del cuadro de diálogo como advertencia
    end
```

---

## 3. Diagrama de Gantt de hitos del proyecto (Gantt Chart)

```mermaid
gantt
    title Plan de avance del proyecto de reestructuración del tema del blog
    dateFormat  YYYY-MM-DD
    section Infraestructura base
    Actualización del motor de escaneo de Markdown     :done,    des1, 2026-08-01, 2026-08-07
    Reestructuración de estilos de tablas y prevención de conflictos      :done,    des2, 2026-08-08, 2026-08-14
    section Características principales
    Integración de fórmulas KaTeX y Mermaid :done,    des3, 2026-08-15, 2026-08-20
    Implementación del modal de cifrado y funciones especiales     :active,  des4, 2026-08-21, 2026-08-28
    section Aceptación y entrega
    Pruebas de estrés integrales y auditoría visual         :         des5, 2026-08-29, 2026-08-31
```

---

## 4. Gráfico de pastel de proporción de código de la pila tecnológica (Pie Chart)

```mermaid
pie title Proporción de la pila tecnológica del frontend del blog
    "TypeScript / Astro" : 48
    "React 19 Components" : 26
    "Tailwind 4 & CSS" : 18
    "Markdown & Assets" : 8
```