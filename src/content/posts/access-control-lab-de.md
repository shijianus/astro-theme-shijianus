---
title: "Labor für Artikel-Zugriffskontrolle"
pubDate: 2026-04-26
updatedDate: 2026-04-26
description: "Zur Überprüfung, ob die passwortbasierte Zugriffskontrolle gemäß den Serverregeln funktioniert und um sicherzustellen, dass eingeschränkter Inhalt nicht direkt auf der Seite ausgegeben wird, wenn er nicht freigeschaltet ist."
author: "shijianus"
category: "Systemdesign"
group: "Sicherheitsexperimente"
cover: "/media/shijianus/system.jpg"
coverAlt: "Labor für Artikel-Zugriffskontrolle"
featured: false
sticky: 1
tags: ["Zugriffskontrolle", "Sicherheit", "Serverseitiges Rendering"]
access:
  passwordHash: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"
  message: "Dieser Artikel verwendet serverseitige Zugriffskontrolle. Der Inhalt wird erst nach Eingabe des korrekten Passworts gerendert."
i18nKey: "access-control-lab"
lang: "de"
aiTranslatedFrom: "zh-CN"
---

# Dies ist ein geschützter Artikel

Wenn Sie diesen Artikel im ungesperrten Zustand direkt aufrufen, wird der folgende Inhalt nicht vom Server auf der Seite ausgegeben, anstatt einfach zuerst ausgegeben und dann vom Frontend versteckt zu werden.

## Was Sie nach dem Entsperren überprüfen sollten

1.  Wenn kein Passwort eingegeben wurde, erscheint der Inhalt nicht im HTML.
2.  Nach Eingabe des korrekten Passworts `12345` schreibt der Server ein kurzlebiges Zugriffs-Token.
3.  Beim erneuten Laden des Artikels muss das Passwort nicht erneut eingegeben werden.
4.  Startseitenkarten, neueste Artikel und Zusammenfassungen geben den geschützten Inhalt nicht preis.

## Was diese Regel derzeit unterstützt

-   Passwortzugriff
-   Sichtbar für bestimmte IPs
-   Unsichtbar für bestimmte IPs
-   Sichtbar für bestimmte Länder oder Regionen
-   Unsichtbar für bestimmte Länder oder Regionen

## Beispiele für Frontmatter-Syntax

Die folgenden Syntaxbeispiele können direkt in das Frontmatter des Artikels eingefügt werden:

```yaml
access:
  passwordHash: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"
  message: "Nach Eingabe des korrekten Passworts weiterlesen."
```

```yaml
access:
  blockedCountries: ["CN"]
  message: "Dieser Artikel ist in Ihrer aktuellen Region nicht zugänglich."
```

```yaml
access:
  allowedIps: ["203.0.113.7", "198.51.100.*", "192.0.2.0/24"]
  message: "Ihre aktuelle Netzwerkadresse liegt außerhalb des zulässigen Bereichs."
```

Wenn Sie nur den Zugriff aus einem bestimmten Land oder einer Region erlauben möchten, können Sie dies auch direkt schreiben:

```yaml
access:
  allowedCountries: ["US", "GB", "HK"]
```

## Warum `passwordHash` empfohlen wird

Obwohl die direkte Verwendung von `password` derzeit noch kompatibel ist, wird empfohlen, im Markdown nur `passwordHash` zu verwenden. Auf diese Weise führt das Theme den Vergleich nur serverseitig durch, ohne das Klartextpasswort in der Inhaltskonfiguration speichern zu müssen.

Wenn Sie den Hash-Wert selbst generieren müssen, verwendet das aktuelle Theme intern `SHA-256`. Es wird empfohlen, das Passwort zuerst lokal in einen Hash umzuwandeln und diesen dann in das Frontmatter zu schreiben, anstatt das Klartextpasswort direkt in die Artikel-Quelldatei einzufügen.

## Warum diese Ebene den eingeschränkten Inhalt nicht vorzeitig preisgibt

Diese Implementierung gibt nicht zuerst den vollständigen Text aus und versteckt ihn dann per Frontend. Die Seite für eingeschränkte Artikel basiert auf serverseitiger Überprüfung:

1.  Wenn die Passwort- oder Region-/IP-Regeln nicht erfüllt sind, gibt der Server nur das Sperrpanel zurück.
2.  Inhalt, Inhaltsverzeichnis, verwandte Artikel und öffentliche Zusammenfassungen werden nicht auf der Seite gerendert, wenn sie nicht freigeschaltet sind.
3.  Startseite, Paginierung, neueste Artikel, Suchindex und Seitenleiste werden ebenfalls keine eingeschränkten Artikel enthalten.

## Fazit

Dieser Artikel dient hauptsächlich dazu, Ihnen bei späteren Smoke-Tests zu helfen. Solange die Sperrseite, die Entsperrseite und der beibehaltene Status nach dem Neuladen korrekt funktionieren, bedeutet dies, dass diese Zugriffskontrolle vom „Konzept“ in einen tatsächlich nutzbaren Zustand übergegangen ist.