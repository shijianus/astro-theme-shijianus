---
title: "Beispiel: Vollständige Übersicht der Callout-Hinweisboxen"
description: "Umfassende Darstellung der 13 unterstützten semantischen Callout-Typen, der Standard- und Aufklappvarianten sowie des Markdown-Quellcode-Vergleichs."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["Beispiel", "Showcase", "Callouts"]
category: "Beispiele"
series: "Funktionsbeispiele"
math: false
mermaid: false
i18nKey: "example-callouts"
lang: "de"
aiTranslatedFrom: "zh-CN"
---

Dieses Beispiel dient ausschließlich der Verifikation und dem Test der **Callout-/Admonition-/Hinweisboxen**-Rendering-Fähigkeiten des Blog-Themas im Inhaltsbereich.

Basierend auf der GitHub-Alerts-Spezifikation und der Designästhetik von Anzhiyu unterstützt dieses Theme nativ 13 verschiedene semantische farbige Hinweisboxen. Alle Boxen passen ihre hochkontrastigen Farben automatisch auf der Client-Seite an den hellen und dunklen Modus an.

---

## Standard-Hinweisboxen (Standard Callouts)

Verwenden Sie die `[!TYPE]`-Syntax in der ersten Zeile eines Zitatblocks, um die entsprechende Box zu deklarieren.

### 1. Note (Allgemeine Hinweise)

> [!NOTE]
> Dies ist eine Standard-**Note**-Hinweisbox, die zur Erläuterung von Hintergrundkontext und allgemeinen Hinweisen dient.

```markdown
> [!NOTE]
> Dies ist eine Standard-**Note**-Hinweisbox, die zur Erläuterung von Hintergrundkontext und allgemeinen Hinweisen dient.
```

### 2. Tip (Praktische Tipps)

> [!TIP]
> **Schnellsuch-Tipp**: Drücken Sie <kbd>Strg</kbd> + <kbd>K</kbd>, um die globale Artikel-Suchpalette schnell aufzurufen!

```markdown
> [!TIP]
> **Schnellsuch-Tipp**: Drücken Sie <kbd>Strg</kbd> + <kbd>K</kbd>, um die globale Artikel-Suchpalette schnell aufzurufen!
```

### 3. Important (Wichtige Hinweise)

> [!IMPORTANT]
> Stellen Sie vor dem Build der Produktionsversion sicher, dass die Umgebungsvariable `BLOG_BUILD_TARGET=static` korrekt aktiviert ist.

```markdown
> [!IMPORTANT]
> Stellen Sie vor dem Build der Produktionsversion sicher, dass die Umgebungsvariable `BLOG_BUILD_TARGET=static` korrekt aktiviert ist.
```

### 4. Warning (Risikowarnungen)

> [!WARNING]
> Commiten Sie niemals Datenbank-Private Keys oder Cloud-Service-AccessKeys in öffentliche Code-Repositories.

```markdown
> [!WARNING]
> Commiten Sie niemals Datenbank-Private Keys oder Cloud-Service-AccessKeys in öffentliche Code-Repositories.
```

### 5. Caution & Danger (Gefahrenwarnungen)

> [!CAUTION]
> Führen Sie vor der Durchführung von Datenbank-Migrationen unbedingt eine vollständige Datensicherung durch.

> [!DANGER]
> Das direkte Löschen der Produktionsdatenbank führt zum unwiederbringlichen Verlust aller Kommentare und Benutzerdaten.

```markdown
> [!CAUTION]
> Führen Sie vor der Durchführung von Datenbank-Migrationen unbedingt eine vollständige Datensicherung durch.

> [!DANGER]
> Das direkte Löschen der Produktionsdatenbank führt zum unwiederbringlichen Verlust aller Kommentare und Benutzerdaten.
```

### 6. Success (Erfolgsbestätigung)

> [!SUCCESS]
> Der statische Build wurde erfolgreich abgeschlossen, alle statischen Routen wurden generiert!

```markdown
> [!SUCCESS]
> Der statische Build wurde erfolgreich abgeschlossen, alle statischen Routen wurden generiert!
```

### 7. Question, Quote, Info, Todo, Bug, Example

> [!QUESTION]
> Wie lässt sich eine Volltextsuche in Millisekunden ohne Server-Abhängigkeiten implementieren?

> [!QUOTE]
> „Eleganter Code kann nicht nur von Maschinen ausgeführt werden, sondern vermittelt Menschen wie ein Gedicht Gedanken.“

> [!INFO]
> Dieser Blog basiert auf Astro 6 und Tailwind 4 und wird vollständig statisch exportiert.

> [!TODO]
> Geplant ist die Einführung einer WebAssembly-basierten Client-Side-Tokenisierung für die Suche in der nächsten Version.

> [!BUG]
> Das Layout-Problem mit dem horizontalen Abschneiden von Tabellen auf extrem schmalen Bildschirmen wurde in der alten Version behoben.

> [!EXAMPLE]
> Die Beispieldaten sind bereit, der Quellcode kann direkt kopiert und weiterentwickelt werden.

```markdown
> [!QUESTION]
> Wie lässt sich eine Volltextsuche in Millisekunden ohne Server-Abhängigkeiten implementieren?

> [!QUOTE]
> „Eleganter Code kann nicht nur von Maschinen ausgeführt werden, sondern vermittelt Menschen wie ein Gedicht Gedanken.“

> [!INFO]
> Dieser Blog basiert auf Astro 6 und Tailwind 4 und wird vollständig statisch exportiert.

> [!TODO]
> Geplant ist die Einführung einer WebAssembly-basierten Client-Side-Tokenisierung für die Suche in der nächsten Version.

> [!BUG]
> Das Layout-Problem mit dem horizontalen Abschneiden von Tabellen auf extrem schmalen Bildschirmen wurde in der alten Version behoben.

> [!EXAMPLE]
> Die Beispieldaten sind bereit, der Quellcode kann direkt kopiert und weiterentwickelt werden.
```

---

## Aufklappbare Hinweisboxen (Collapsible Details Admonitions)

Fügen Sie nach dem Markierungstyp ein `-` (standardmäßig eingeklappt) oder `+` (standardmäßig aufgeklappt) hinzu, um native aufklappbare Karten zu generieren:

### 1. Standardmäßig eingeklappte Hinweisbox (`[!TIP]-`)

> [!TIP]- Klicken Sie zum Aufklappen: Nginx-Long-Term-Cache-Konfiguration für die Produktionsumgebung
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```

```markdown
> [!TIP]- Klicken Sie zum Aufklappen: Nginx-Long-Term-Cache-Konfiguration für die Produktionsumgebung
> ```nginx
> location ~* \.(?:css|js|woff2?|svg|png|jpg|webp)$ {
>     expires 1y;
>     add_header Cache-Control "public, immutable";
>     access_log off;
> }
> ```
```

### 2. Standardmäßig aufgeklappte Hinweisbox (`[!NOTE]+`)

> [!NOTE]+ Standardmäßig aufgeklappte Architekturbeschreibung
> Dieser Bereich ist standardmäßig im aufgeklappten Zustand. Klicken Sie auf die Titelleiste, um ihn sanft einzuklappen und Bildschirmplatz zu sparen.

```markdown
> [!NOTE]+ Standardmäßig aufgeklappte Architekturbeschreibung
> Dieser Bereich ist standardmäßig im aufgeklappten Zustand. Klicken Sie auf die Titelleiste, um ihn sanft einzuklappen und Bildschirmplatz zu sparen.
```