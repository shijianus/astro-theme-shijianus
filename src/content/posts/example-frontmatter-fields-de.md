---
title: "Beispiel: Erweiterte Front Matter Felder und Zod Validierung"
description: "Eine umfassende Analyse aller unterstützten Front Matter Felddefinitionen dieses Blogs und deren Interaktion mit dem Theme."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["Beispiel", "Vorstellung", "Frontmatter", "Konfiguration"]
category: "Beispiel"
series: "功能示例"
math: false
mermaid: false
i18nKey: "example-frontmatter-fields"
lang: "de"
aiTranslatedFrom: "zh-CN"
---
Dieses Beispiel dient ausschließlich der systematischen Analyse und Erklärung aller Front‑Matter‑Felder, die in diesem Thema in `src/content.config.ts` mittels **Zod Schema** definiert sind.

---

## 1. Unterstützte Front‑Matter‑Felder

| Feldname | Typ | Standardwert | Beschreibung |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **erforderlich** | Artikelhaupttitel |
| `pubDate` | `Date` | **erforderlich** | Veröffentlichungsdatum (YYYY‑MM‑DD) |
| `updatedDate` | `Date` | optional | Datum der letzten Aktualisierung |
| `description` | `string` | optional | Artikelzusammenfassung, verwendet für SEO und Kartenanzeige |
| `author` | `string` | `'shijianus'` | Autorname |
| `tags` | `array<string>` | `[]` | Liste von Schlagwörtern |
| `category` | `string` | optional | Hauptkategorie‑Name |
| `cover` | `string` | optional | URL des Haupt‑Cover‑Bildes |
| `coverAlt` | `string` | optional | Alt‑Text des Cover‑Bildes |
| `featured` | `boolean` | `false` | Ob als hervorgehobener Artikel markiert |
| `sticky` | `number` | `0` | Sticky‑Gewicht (höhere Zahl = weiter oben) |
| `draft` | `boolean` | `false` | Entwurfskennzeichen (wird bei Produktions‑Build automatisch gefiltert) |
| `postFormat` | `enum` | `'standard'` | WordPress‑Artikeltyp (`aside`, `status`, `quote`, `gallery` usw.) |
| `toc` / `hideToc` | `boolean` | `true` / `false` | Ob das Inhaltsverzeichnis aktiviert ist / Erzwingt das Ausblenden des rechten Verzeichnisses |
| `math` | `boolean` | `false` | Ob LaTeX‑Mathematik‑Rendering aktiviert ist |
| `mermaid` | `boolean` | `false` | Ob Mermaid‑Vektordiagramme aktiviert sind |
| `series` | `string` | optional | Name der zugehörigen Artikelsereie |
| `access` | `object` | optional | Konfiguration für Passwortschutz und IP‑Region‑Blockierung |

---

## 2. Standard‑Front‑Matter‑Beispiel

```yaml
---
title: "Artikelvollständiger Titel"
pubDate: 2026-08-28
description: "Dies ist ein Demonstrationsartikel mit vollständigen Metadaten."
author: "shijianus"
category: "Systemdesign"
tags: ["Astro", "Markdown", "Beispiel"]
cover: "/media/shijianus/workbench.jpg"
featured: true
sticky: 1
toc: true
math: true
mermaid: true
postFormat: "standard"
---
```