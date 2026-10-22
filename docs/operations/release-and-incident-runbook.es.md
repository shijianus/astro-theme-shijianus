---
title: "Manual de Lanzamiento y Gestión de Incidentes de EpoCanvas"
description: "Proporciona una lista de verificación previa al lanzamiento para cambios de documentos y código, trazabilidad de confirmaciones, límites de implementación de Cloudflare Pages, verificación en línea, contención de incidentes y procedimientos de reversión."
pubDate: 2026-10-20
updatedDate: 2026-10-20
author: "EpoCanvas Engineering Team"
category: "Project Management"
group: "Project Operations"
tags: ["Release Runbook", "Incident Handling", "Cloudflare Pages", "Rollback", "E2E Verification"]
toc: true
draft: false
version: "v1.0.0"
i18nKey: "operations-release-and-incident-runbook"
lang: "es"
aiTranslatedFrom: "zh-Hant"
---

# Manual de Lanzamiento y Gestión de Incidentes de EpoCanvas

<div class="article-aside">
  <p><span class="badge badge-primary">OPS-001</span> <span class="badge badge-success">Release and Incident</span> <span class="badge badge-warning">Requiere Autorización Explícita</span></p>
  <p>Este manual está destinado a los mantenedores del proyecto cuando se producen cambios en la documentación, el código, la configuración o los servicios de producción. Requiere que cada conclusión sea rastreable hasta comandos, confirmaciones, implementaciones, URL y marcas de tiempo, sin utilizar informes históricos ni capturas de pantalla de la interfaz como evidencia actual.</p>
</div>

> [!WARNING]
> Este manual no autoriza envíos automáticos, implementaciones de Cloudflare Pages, migraciones de D1, pagos reales ni administración de servicios externos. Antes de realizar operaciones de producción, se debe obtener autorización explícita para la tarea actual y se debe confirmar el proyecto de destino y el plan de reversión. Los pasos no realizados deben marcarse como 'No ejecutados'.

## 1. Niveles de Evidencia y Responsabilidades

Los registros de publicación utilizan las siguientes clasificaciones:

| Etiqueta | Afirmación respaldada | Evidencia mínima |
| :--- | :--- | :--- |
| `SOURCE-VERIFIED` | Existe un cierto comportamiento en el código fuente, la configuración o el enrutamiento | Ruta del archivo, función/configuración y confirmación |
| `TEST-VERIFIED` | El entorno especificado ha superado las pruebas de compilación o automatizadas | Comando, código de salida, aserción, marca de tiempo y confirmación |
| `LIVE-VERIFIED` | Se observó un cierto comportamiento en la URL de producción especificada | URL, ID de implementación, marca de tiempo, resultados de solicitud/navegador |
| `KNOWN-GAP` | Inconsistencias conocidas entre el comportamiento bilateral o la documentación y la implementación | Diferencias, alcance del impacto y método de reproducción |
| `BLOCKED` | No se puede ejecutar debido a autorizaciones, credenciales, plataforma o decisiones externas | Motivo del bloqueo, límite de responsabilidad y comprobaciones alternativas |

'Compilación exitosa' solo respalda la conclusión de compilación de `TEST-VERIFIED`; 'Confirmado' no respalda la visibilidad en línea; 'Página responde 200' tampoco representa la salud completa del enlace de comentarios, inicios de sesión, pagos o notificaciones.

## 2. Preparación Previa al Lanzamiento

### 2.1 Confirmar Alcance y Espacio de Trabajo

1. Leer los directorios raíz `AGENTS.md`, `GUIDES.md` y las especificaciones de subdirectorios aplicables;
2. Registrar la rama actual, `git rev-parse HEAD` completo y `git status --short`;
3. Confirmar las modificaciones del usuario existentes en el espacio de trabajo, no sobrescribir, no restablecer y no agregar archivos irrelevantes a esta confirmación;
4. Enumerar los documentos, programas, pruebas, configuraciones y rutas explícitamente modificados en esta iteración;
5. Buscar contenido nuevo o modificado para asegurarse de que no contenga contraseñas, claves API, cookies, tokens de sesión, URL privadas, IP internas ni información de identificación personal (PII) completa.

Si el espacio de trabajo en sí tiene cambios no confirmados, debe ser posible distinguir entre la confirmación actual y otros cambios antes de publicar. Si no es posible un aislamiento seguro, detenga la publicación y obtenga primero una decisión del mantenedor.

### 2.2 Compilación y Pruebas

Seleccione las comprobaciones según el riesgo de cambio:

- Cambios de documentos/rutas: `git diff --check`, comprobaciones de Markdown/materia frontal, compilación estática de Astro;
- Cambios en la colección de contenido o en la versión: Confirme que el esquema, el manifiesto de versión y los comandos de sincronización en tiempo de compilación no produzcan diferencias no revisadas;
- Cambios en la interfaz de usuario/interacción: Ejecute las pruebas correspondientes de Playwright/Puppeteer, que cubran el escritorio, el móvil y los estados del teclado/modal;
- Cambios en la API/base de datos: Ejecute pruebas unitarias o de integración, verificando el formato de error JSON, los permisos, la limitación de velocidad, la migración y las ramas de error;
- Cambios en pagos/cuentas/notificaciones: Utilice datos de entorno de pruebas explícitamente marcados para confirmar que los mensajes de prueba, los números de tarjeta o la PII real no se envíen a las notificaciones de producción.

Cada comando debe registrar el tiempo de ejecución, el entorno, el código de salida y la salida importante. El éxito local por sí solo no se puede escribir directamente como verificado en línea.

## 3. Trazabilidad de Confirmaciones y Lanzamientos

Cada subtarea independiente debe formar una única confirmación revisable:

1. Solo preparar archivos dentro del alcance actual;
2. Utilizar mensajes de confirmación que describan el propósito de los cambios;
3. Ejecutar `git rev-parse --short HEAD` y `git show --stat --oneline HEAD`;
4. Enumerar el hash de confirmación, los resultados de las pruebas y los elementos no ejecutados en el informe de entrega;
5. Si los comandos de compilación modifican listas de versiones, instantáneas o generan archivos, verifique las diferencias antes de decidir si incluirlos en la confirmación.

El hash de confirmación es evidencia de la trazabilidad del código fuente, no de la implementación. No escriba manualmente, adivine ni reutilice hashes de tareas históricas; tampoco se debe realizar un restablecimiento/extracción destructivo en las modificaciones del usuario solo para limpiar el espacio de trabajo.

## 4. Límites de Envíos y Cloudflare Pages

La sincronización y la implementación de producción son dos acciones que deben registrarse por separado:

1. Primero confirme el nombre remoto, la rama de destino, el proyecto de Cloudflare Pages de destino, las variables de entorno y si afecta a las operaciones comerciales reales;
2. Solo ejecute `git push` u otras sincronizaciones remotas después de obtener una autorización explícita;
3. Los proyectos de `shijianus-blog` solo pueden utilizar los artefactos de compilación y la configuración de destino de su propio proyecto; los artefactos de otros proyectos no deben implementarse entre proyectos;
4. Antes de la implementación, utilice el proceso de compilación estática correspondiente y confirme que los secretos se inyectan únicamente a partir de variables de entorno/secretos de plataforma y no se escriben en Markdown, JavaScript ni artefactos;
5. Después de la implementación, registre el ID de implementación de Pages, el Commit SHA, el dominio de destino, la hora y los resultados de los comandos;
6. Si faltan autorizaciones, credenciales o información de implementación necesaria, el estado debe ser `BLOCKED` o 'no ejecutado', y el éxito local no puede sustituir al lanzamiento.

El `npm run cf:deploy` en el repositorio son simplemente comandos disponibles, no aprobaciones automáticas. Para implementaciones de producción que involucren migración de bases de datos, rotación de claves, pagos, cuentas o notificaciones, las limitaciones de compatibilidad y reversión deben registrarse elemento por elemento.

## 5. Verificación en Línea

La verificación de producción solo debe realizarse después de que la implementación haya sido autorizada y los artefactos sean efectivos en el entorno de destino. Los registros mínimos deben incluir:

- URL de destino, por ejemplo, `https://blog.epocanvas.com/`;
- ID de implementación de Pages, Commit SHA, fecha de verificación, hora y zona horaria;
- Estado HTTP, tipo de contenido y respuestas clave de las páginas y API afectadas;
- Cuando se requiere interacción, use un navegador sin interfaz gráfica para verificar la carga, los clics, los modales, los formularios, los mensajes de error, los diseños adaptables y los errores críticos de la consola;
- Si los flujos de datos afectados utilizan datos reales o de entorno de pruebas, y si hay efectos secundarios externos;
- Salida original en caso de error, ubicación de la captura de pantalla/video y si se han mitigado las pérdidas.

Las rutas de documentos solo se pueden verificar para los títulos de las páginas, el contenido del cuerpo, los enlaces y la ausencia de errores 404; los comentarios, las cuentas, los pagos o las notificaciones deben verificar sus API correspondientes y los límites de permisos. Una sola respuesta 200 de la página de inicio no puede sustituir la aceptación funcional completa.

## 6. Clasificación de Eventos y Manejo Inmediato

### 6.1 Eventos de Documentos o Compilación

Si los documentos no se pueden analizar, las rutas devuelven 404, ocurren errores de portada, fallan las compilaciones estáticas o los artefactos contienen contenido que no debería ser público:

1. Detener envíos e implementaciones;
2. Guardar comandos de error, confirmaciones, rutas de archivo y entorno;
3. Si aún no se ha implementado, corregir y reconstruir;
4. Si ya está implementado, revertir al artefacto en buen estado anterior autorizado o a la solución de corrección mínima;
5. Actualizar el estado del documento y el informe de entrega.

### 6.2 Eventos de API, Datos e Identidad

Si ocurre una lectura/modificación no autorizada, pérdida de datos de comentarios, invalidación de sesión, datos personales públicos o anomalías de migración:

1. Primero, restrinja las rutas afectadas o detenga las migraciones posteriores;
2. Revoque/rote los tokens y secretos potencialmente filtrados, y no pegue secretos en los informes;
3. Guarde la hora de la solicitud, el identificador de implementación, la respuesta de error y los tipos de datos afectados;
4. Procese las notificaciones y las solicitudes de datos de acuerdo con la [Política de divulgación de seguridad](/community/security-disclosure/) y la [Política de privacidad y uso de datos](/community/privacy-and-data/);
5. No afirme 'recuperado' o 'datos completos' hasta que se confirme la coherencia de los datos.

### 6.3 Eventos de Pagos y Notificaciones

Si hay anomalías con Stripe, registros de agradecimiento, reembolsos, notificaciones de Telegram o estados de pago:

- No reproduzca solicitudes de pago con estado desconocido y no solicite números de tarjeta/códigos de seguridad en comentarios o correos electrónicos;
- Guarde las respuestas de los proveedores de pago, los registros del sitio, los resultados de las notificaciones y los cronogramas por separado;
- Primero determine si la transacción está completa y si son posibles cargos duplicados, luego decida las rutas de reintento o reembolso;
- Maneje las notificaciones no entregadas y los pagos incompletos por separado; los mensajes de Telegram no se pueden usar como prueba única de la transacción;
- Explique los métodos de procesamiento disponibles a los usuarios de acuerdo con la [Política de agradecimiento, reembolsos y pagos de terceros](/community/support-and-refunds/).

## 7. Reversión y Recuperación

Antes de revertir, confirme si el objetivo son 'artefactos de código/documento', 'esquema de base de datos', 'variables de entorno' o 'estado de transacción de terceros'; es posible que no se puedan recuperar con la misma acción.

1. Seleccione una confirmación/ID de implementación en buen estado conocida y confirme que no contenga migraciones de bases de datos ni correcciones de seguridad que aún deban conservarse;
2. Primero guarde el estado actual y la evidencia del incidente, luego realice una reversión autorizada;
3. No use git reset/checkout destructivo para borrar las modificaciones de usuario no confirmadas;
4. Después de la reversión, vuelva a realizar una verificación en línea mínima para las rutas y API afectadas;
5. Si se han escrito datos o se ha producido un pago, realice la reparación de datos, reembolsos o conciliación manual por separado; no confunda la reversión de páginas con la recuperación de datos;
6. Una vez concluido el incidente, documente la causa raíz, el cronograma, el impacto, las correcciones, los riesgos no resueltos y las pruebas posteriores.

## 8. Plantilla de Informe de Entrega

```text
任務類型：文件 / 程式 / API / 配置 / 運維
檢查基線：分支、完整 HEAD、工作區既有修改
實際修改文件：列出檔案與路由
證據等級：SOURCE-VERIFIED / TEST-VERIFIED / LIVE-VERIFIED / KNOWN-GAP / BLOCKED
已執行命令：命令、時間、退出碼與關鍵結果
測試結果：建置、單元、E2E、API 或無障礙檢查
線上驗收：網址、部署識別、時間；未執行則寫明原因
已知問題：影響範圍與暫時處理方式
未執行項目：推送、部署、migration、真實支付等
Commit Hash：完整或短 SHA
部署版本：未部署 / deployment ID
回滾方式：目標提交、部署或資料修復步驟
```

Última actualización: 2026-10-20.
