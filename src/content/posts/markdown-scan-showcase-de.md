---
title: "Markdown 扫描与展示能力全量示例"
pubDate: 2026-04-25
description: "用一篇长文把当前的 Markdown 扫描、目录层级、隐藏内容、GFM 表格、脚注、代码块和特殊格式一次性跑全。"
author: "shijianus"
category: "系统设计"
group: "Markdown 示例"
cover: "/media/shijianus/system.jpg"
coverAlt: "markdown showcase board"
tags: ["Markdown", "Astro", "Config", "UI", "主题重构"]
featured: true
sticky: 4
i18nKey: "markdown-scan-showcase"
lang: "de"
aiTranslatedFrom: "zh-CN"
---
Dieser Artikel dient ausschließlich der Validierung der Inhaltsanalyse, der Synchronisation des Inhaltsverzeichnisses, der Stilerweiterungen und der Lesbarkeitsstrategie innerhalb des Themes. Es handelt sich nicht um eine „konzeptionelle Erläuterung“, sondern um eine **echte Inhaltssample, die sich für Smoke-Tests des Frontend-Themes eignet**.

In der aktuellen Version soll ein einzelner Artikel gleichzeitig folgende Aspekte abdecken:

- **Scanning der Überschriftenhierarchie**
- **Codeblöcke und Inline-Code**
- **Tabellen, Aufgabenlisten und Fußnoten**
- **Sonderformate wie <mark>Markierungen</mark>, <kbd>Strg</kbd> + <kbd>K</kbd>, <ruby>AnZhiYu<rt>AnZhiYu</rt></ruby>**
- **Versteckte Inhalte und leichte Interaktionen**
- **Zitate, Listen, Trennlinien, aufklappbare Details und Hinweis-Karten**

> Wenn ein Theme nur bei „normalen Absätzen + normalen Überschriften“ korrekt aussieht, ist es noch nicht wirklich fertig.

## Scan-Ziele

Die Analyse eines Artikels durch das Theme sollte nicht nur bei `title` und `description` enden. Mindestens sollten auch folgende Punkte berücksichtigt werden:

1. Die **tatsächliche Hierarchie** des Artikels, da diese das Inhaltsverzeichnis auf der rechten Seite direkt beeinflusst.
2. Die **Betonung und der Rhythmus** im Fließtext, da eine reine Textwand ohne Struktur nicht effizient lesbar ist.
3. Die **semantische Darstellung** von Code, Listen, Tabellen und Zitaten, da technische Blogs nicht nur Absätze ausgeben.
4. Ob der Artikel **versteckte Inhalte, Hinweise oder ergänzende Erklärungen** enthält, da diese den Lesepfad beeinflussen.

### Warum das TOC nicht nur „Einzüge“ sein darf

Ein häufiger Fehler besteht darin, die Ebenen des Inhaltsverzeichnisses nur als `padding-left` zu verstehen. Das mag zwar eine Hierarchie suggerieren, aber sobald die Ebenen tiefer werden:

- Vergrößern sich die Abstände drastisch
- Werden die klickbaren Bereiche komprimiert
- Ist der aktive Eintrag schwerer zu erkennen
- Verliert der Nutzer beim Scrollen den Überblick über die aktuelle Ebene

Das Ziel der TOC-Implementierung in dieser Version lautet daher: **Die Hierarchie muss real sein, die Einzüge moderat, und der aktive Pfad muss deutlich hervorgehoben werden.**

#### Eine Lösung, die beide Seiten berücksichtigt

Der aktuelle Ansatz besteht nicht darin, Überschriften der dritten und vierten Ebene stark nach rechts zu verschieben, sondern nutzt gleichzeitig:

- Kleine Einzugsschritte
- Hervorhebung des aktuellen Eintrags
- Schwache Hervorhebung des Elternpfads
- Vertikale Führungslinien
- Metainformationen zur aktuellen Überschrift

So wird sowohl die Orientierung („In welcher Ebene befinde ich mich?“) als auch die Nutzbarkeit des Verzeichnisses (klickbar, überfliegbar, scrollbar) gewährleistet.

## Inline-Formatierung

Die häufigste Form der visuellen Aufwertung im Fließtext ist die Darstellung von **Inline-Informationen**. Zum Beispiel:

- Variablennamen können als `themeContract` geschrieben werden
- Konfigurationsoptionen als `siteConfig.post.comments`
- Statusbegriffe als <mark>in progress</mark>
- Tastenkombinationen als <kbd>Strg</kbd> + <kbd>Enter</kbd>
- Abkürzungen als <abbr title="Table of Contents">TOC</abbr> und <abbr title="Application Programming Interface">API</abbr>
- Bestimmte Begriffe als <span class="article-inline-serif">serif emphasis</span> oder <span class="article-inline-mono">mono emphasis</span>

Manche Inhalte sollten zudem nicht sofort vollständig angezeigt werden, zum Beispiel:

- Dies ist ein `normaler Hinweis`
- Dies ist ein `betonter Begriff`
- Dies ist ein `Inline-Code`
- Dies ist ein `Parametername`
- Dies ist ein ||Spoiler, der erst nach Klick angezeigt wird||
- Dies ist ein %%password:24680|versteckter Inhalt, der erst nach Passworteingabe angezeigt wird%%

### Betonung und Rhythmus

Wenn in einem Absatz gleichzeitig **wichtige Sätze**, `Konfigurationsnamen`, <mark>Statusbegriffe</mark> und <kbd>Tastenkombinationen</kbd> vorkommen, kann der Leser den Absatz schneller in sinnvolle Einheiten zerlegen, ohne jedes Wort einzeln lesen zu müssen.

#### Sonderzeichen und Hoch-/Tiefstellung

Beispiele:

- E = mc<sup>2</sup>
- H<sub>2</sub>O
- <ruby>Frontend<rt>frontend</rt></ruby>
- <ruby>Refactoring<rt>rebuild</rt></ruby>

## Hinweis-Karten und aufklappbare Blöcke

Hier ist eine benutzerdefinierte Hinweis-Karte, die keine zusätzlichen Plugins benötigt und nur HTML verwendet, das in Markdown erlaubt ist:

<div class="article-note-card">
  <strong>Gestaltungsentcheidung</strong>
  <p>Wenn ein Stil oder eine Animation die Effizienz der Informationsfindung nicht verbessert, sollte er nicht nur deshalb beibehalten werden, weil er „spektakulär aussieht“.</p>
</div>

Darunter befindet sich ein aufklappbarer Block:

<details class="article-detail-card">
  <summary>Klicken zum Aufklappen: Was testet diese Markdown-Sample genau?</summary>
  <p>Sie testet, ob Titel-Scanning, das TOC auf der rechten Seite, GFM-Tabellen, Aufgabenlisten, Fußnoten, versteckte Inhalte, Inline-Stile, Codeblöcke und blockbasiertes Layout zusammen funktionieren.</p>
  <p>Wenn einer dieser Punkte fehlerhaft gerendert wird, ist die Artikel-Ebene des Themes noch nicht wirklich stabil.</p>
</details>

### Zitatblöcke

> „Es geht nicht darum, das Theme bunt zu gestalten, sondern die Informationen klar zu machen.“
>
> Für technische Blogs sind Struktur, Ordnung und Feedback entscheidend, nicht schwebende Dekorationen.

#### Zitate zweiter Ebene und Erläuterungen

> Das Inhaltsverzeichnis ist wichtig, nicht weil es wie eine Dokumentation aussieht, sondern weil es lange Artikel navigierbar macht.

## Codeblöcke

Ein technischer Artikel muss mindestens Codeblöcke in verschiedenen Sprachen gleichzeitig enthalten können.

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

#### Grundsätze für die Verwendung von Inline-Code

Schreiben Sie nicht ganze Sätze als `inline code`. Nur echte Konfigurationsnamen, Funktionsnamen oder Schlüsselwörter sollten in den Code-Stil gesetzt werden, z. B. `navigator.share()`, `remark-gfm`, `scrollIntoView()`.

## GFM-Tabellen

Die folgende Tabelle dient der Validierung von Kopfzeilen, Ausrichtung, Rahmen und dem Scrollverhalten auf mobilen Geräten:

| Modul | Ziel | Aktuelle Strategie | Anmerkung |
| --- | --- | --- | --- |
| Startseiten-Kategoriekarten | Hover-Effekt wie bei AnZhiYu | Echte Icons + komprimierte Hover-Animation | Spezielle Prüfung von `lime` |
| Inhaltsverzeichnis | Echte Hierarchie ohne Platzverschwendung | Baumstruktur + leichte Einzüge + aktiver Pfad | Balance zwischen Klick-Effizienz und Übersicht |
| Kommentarbereich | Direkt veröffentlicht | Nur Kommentarfeld und öffentlicher Kommentar-Feed | Keine Test-Eingänge sichtbar |
| Share-Bereich | Entsprechend echten Social-Media-Plattformen | Individuelle Share-Parameter pro Plattform | Nicht nur Link kopieren |

### Aufgabenliste

- [x] Abdeckung von normalen Absätzen und mehrstufigen Überschriften
- [x] Abdeckung von Inline-Code und Codeblöcken
- [x] Abdeckung von Spoilern und passwortgeschützten Bereichen
- [x] Abdeckung von Tabellen und Aufgabenlisten
- [x] Abdeckung von Aufklappblöcken, Hinweis-Karten und Zitaten
- [ ] Ergänzung weiterer, für Anzhiyu spezifischer Inhaltsblock-Syntaxen[^future]

#### Gemischte geordnete und ungeordnete Listen

1. Zuerst die Artikelstruktur festlegen.
2. Dann die Zuordnung im Inhaltsverzeichnis auf der rechten Seite bestimmen.
3. Anschließend die visuelle Hierarchie für jeden Inhaltsblocktyp festlegen.

- Der Fokus liegt nicht auf der Anzahl der Funktionen
- Sondern darauf, ob die Darstellung geordnet ist
- Und ob die verschiedenen Module tatsächlich zusammenarbeiten

## Fußnoten

Fußnoten sind ebenfalls Teil des Inhalts-Scans, da sie das Layout am Ende des Artikels und das Verhalten der Anker beeinflussen. Hier sind zwei Beispiele: eine erklärende Fußnote[^scan-note] und eine eher ingenieurtechnische Einschätzung[^engineering-note].

### Ergänzungen über Absätze hinweg

Wenn im Fließtext Inhalte vorkommen, die „beiläufig erwähnt werden, aber den Hauptstrang nicht unterbrechen sollen“, sind Fußnoten in der Regel effektiver, als den gesamten Absatz in Klammern zu packen.

#### Wann man keine Fußnoten verwenden sollte

Wenn die Information für das Verständnis des Hauptstrangs notwendig ist, sollte sie nicht in einer Fußnote versteckt werden. Fußnoten eignen sich für Ergänzungen, nicht aber, um zentrale Argumente zu tragen.

## Kombination von Inhaltsblöcken

Der folgende Abschnitt kombiniert absichtlich verschiedene Funktionen, um sicherzustellen, dass das Theme nicht „einzelne Elemente korrekt rendert, aber bei Kombinationen verzerrt“.

<div class="article-note-card article-note-card--accent">
  <strong>Kombinationstest</strong>
  <p>Der aktuelle Absatz enthält gleichzeitig <mark>Hervorhebung</mark>, <kbd>Tastenkürzel</kbd>, <ruby>Begriff<rt>Begriff</rt></ruby>, `Inline-Code` und einen Fußnotenverweis[^combo].</p>
</div>

Wenn ein Artikel sowohl Folgendes enthält:

- Erklärende Absätze
- Gestufte Überschriften
- Codeblöcke
- Tabellen
- Zitate
- Inline-Betonnungen
- Versteckte Inhalte
- Aufklappbare Ergänzungen

und das Theme dennoch die Lesbarkeit und Ordnung aufrechterhalten kann, dann ist dieses Inhalts-System wirklich stabil.

### Verwendung als Smoke-Test-Artikel

Sie können diesen Artikel direkt verwenden, um die folgenden Punkte zu überprüfen:

1. Erkennt das Inhaltsverzeichnis auf der rechten Seite H2 / H3 / H4 korrekt?
2. Sind der aktuell aktive Eintrag, der Pfad der übergeordneten Elemente und die Scroll-Positionierung natürlich?
3. Haben Codeblöcke, Tabellen und Aufgabenlisten ein einheitliches visuelles Erscheinungsbild?
4. Sind die versteckten Inhalte interaktiv?
5. Ist der vertikale Rhythmus zwischen Teilen, Kommentaren, Seitenleiste und Fließtext harmonisch?

#### Fazit

Ein veröffentlichungsfähiges Blog-Theme sollte nicht nur in den einfachsten Artikeln normal aussehen. Es sollte in der Lage sein, einem Sample standzuhalten, das die Inhaltskomplexität „absichtlich auf ein Maximum bringt“.

---

[^scan-note]: Der hier verwendete Begriff „Scan“ umfasst sowohl das Scannen von Frontmatter-Feldern als auch das Rendering-Scannen von Überschriften, Zusammenfassungen, Textebenen und interaktiven Inhalten.
[^engineering-note]: Wenn das Inhaltsverzeichnis die Hierarchie nur durch visuelle Einrückung simuliert, werden sich in langen Artikeln früher oder später Probleme mit der Positionierung und den klickbaren Bereichen zeigen.
[^future]: Zum Beispiel eine vollständigere Anzhiyu-Tag-Syntax, wiederverwendbare Aliase für Hinweisblöcke sowie eine Sammlung von Inhaltskomponenten, die dem ursprünglichen Theme näherkommt.
[^combo]: Der Zweck des Kombinationstests besteht darin, zu verhindern, dass das Theme nur bei einem einzelnen Inhaltstyp korrekt funktioniert.