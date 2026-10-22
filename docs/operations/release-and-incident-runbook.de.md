---
title: "EpoCanvas Release- und Incident-Handling-Handbuch"
description: "Bietet Pre-Release-Checklisten für Dokumenten- und Code-Änderungen, Commit-Rückverfolgbarkeit, Cloudflare Pages Deployment-Grenzen, Online-Verifizierung, Incident-Containment und Rollback-Verfahren."
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
lang: "de"
aiTranslatedFrom: "zh-Hant"
---

# EpoCanvas Release- und Incident-Handling-Handbuch

<div class="article-aside">
  <p><span class="badge badge-primary">OPS-001</span> <span class="badge badge-success">Release and Incident</span> <span class="badge badge-warning">Erfordert explizite Autorisierung</span></p>
  <p>Dieses Handbuch ist für Projekt-Maintainer gedacht, wenn Änderungen an Dokumentation, Code, Konfiguration oder Produktionsdiensten auftreten. Es erfordert, dass jede Schlussfolgerung auf Befehle, Commits, Deployments, URLs und Zeitstempel zurückgeführt werden kann, ohne historische Berichte oder Schnittstellen-Screenshots als aktuelle Beweise zu verwenden.</p>
</div>

> [!WARNING]
> Dieses Handbuch autorisiert keine automatischen Pushes, Cloudflare Pages Deployments, D1-Migrationen, echte Zahlungen oder externe Dienstverwaltung. Vor der Durchführung von Produktionsvorgängen muss eine explizite Autorisierung für die aktuelle Aufgabe eingeholt werden, und das Zielprojekt sowie der Rollback-Plan müssen bestätigt werden. Nicht durchgeführte Schritte sind als 'Nicht ausgeführt' zu kennzeichnen.

## 1. Evidenzstufen und Verantwortlichkeiten

Release-Aufzeichnungen verwenden die folgenden Klassifizierungen:

| Kennzeichnung | Unterstützte Behauptung | Mindestevidenz |
| :--- | :--- | :--- |
| `SOURCE-VERIFIED` | Ein bestimmtes Verhalten existiert im Quellcode, in der Konfiguration oder im Routing | Dateipfad, Funktion/Konfiguration und Commit |
| `TEST-VERIFIED` | Die angegebene Umgebung hat Build- oder automatisierte Tests bestanden | Befehl, Exit-Code, Assertion, Zeitstempel und Commit |
| `LIVE-VERIFIED` | Ein bestimmtes Verhalten wurde unter der angegebenen Produktions-URL beobachtet | URL, Deployment-ID, Zeitstempel, Request/Browser-Ergebnisse |
| `KNOWN-GAP` | Bekannte Inkonsistenzen zwischen zweiseitigem Verhalten oder Dokumentation und Implementierung | Unterschiede, Auswirkungsbereich und Reproduktionsmethode |
| `BLOCKED` | Kann aufgrund von Autorisierung, Anmeldeinformationen, Plattform oder externen Entscheidungen nicht ausgeführt werden | Blockierungsgrund, Zuständigkeitsgrenze und alternative Prüfungen |

'Build erfolgreich' unterstützt nur die Build-Schlussfolgerung von `TEST-VERIFIED`; 'Committed' unterstützt nicht die Online-Sichtbarkeit; 'Seite antwortet mit 200' stellt auch nicht die vollständige Verbindungsintegrität von Kommentaren, Logins, Zahlungen oder Benachrichtigungen dar.

## 2. Vorbereitung vor der Veröffentlichung

### 2.1 Umfang und Arbeitsbereich bestätigen

1. Stammverzeichnisse `AGENTS.md`, `GUIDES.md` und geltende Unterverzeichnis-Spezifikationen lesen;
2. Aktuellen Branch, vollständigen `git rev-parse HEAD` und `git status --short` aufzeichnen;
3. Vorhandene Benutzermodifikationen im Arbeitsbereich bestätigen, nicht überschreiben, nicht zurücksetzen und keine irrelevanten Dateien zu diesem Commit hinzufügen;
4. Die in dieser Iteration explizit geänderten Dokumente, Programme, Tests, Konfigurationen und Routen auflisten;
5. Nach neuen oder geänderten Inhalten suchen, um sicherzustellen, dass sie keine Passwörter, API-Schlüssel, Cookies, Sitzungstoken, private URLs, interne IPs oder vollständige personenbezogene Daten (PII) enthalten.

Wenn der Arbeitsbereich selbst nicht festgeschriebene Änderungen aufweist, muss es möglich sein, vor der Veröffentlichung zwischen dem aktuellen Commit und anderen Änderungen zu unterscheiden. Wenn keine sichere Isolierung möglich ist, stoppen Sie die Veröffentlichung und holen Sie zuerst eine Entscheidung des Maintainers ein.

### 2.2 Build und Test

Wählen Sie Prüfungen basierend auf dem Änderungsrisiko aus:

- Dokumenten-/Routenänderungen: `git diff --check`, Markdown/Front-Matter-Prüfungen, statischer Astro-Build;
- Änderungen an der Inhaltssammlung oder an der Version: Bestätigen Sie, dass Schema, Versionsmanifest und Build-Time-Synchronisationsbefehle keine ungeprüften Unterschiede erzeugen;
- UI-/Interaktionsänderungen: Führen Sie entsprechende Playwright/Puppeteer-Tests durch, die Desktop-, Mobil- und Tastatur-/Modal-Zustände abdecken;
- API-/Datenbankänderungen: Führen Sie Unit- oder Integrationstests durch und überprüfen Sie das JSON-Fehlerformat, Berechtigungen, Ratenbegrenzung, Migration und Fehlerzweige;
- Zahlungs-/Konto-/Benachrichtigungsänderungen: Verwenden Sie explizit gekennzeichnete Sandbox-Daten, um zu bestätigen, dass Testnachrichten, Kartennummern oder echte PII nicht in Produktionsbenachrichtigungen gesendet werden.

Jeder Befehl muss Ausführungszeit, Umgebung, Exit-Code und wichtige Ausgaben aufzeichnen. Lokaler Erfolg allein kann nicht direkt als online verifiziert gewertet werden.

## 3. Commit- und Release-Rückverfolgbarkeit

Jede unabhängige Teilaufgabe sollte einen einzelnen überprüfbaren Commit bilden:

1. Nur Dateien im aktuellen Umfang bereitstellen;
2. Commit-Nachrichten verwenden, die den Zweck der Änderungen beschreiben;
3. `git rev-parse --short HEAD` und `git show --stat --oneline HEAD` ausführen;
4. Commit-Hash, Testergebnisse und nicht ausgeführte Elemente im Übergabebericht auflisten;
5. Wenn Build-Befehle Versionslisten, Snapshots ändern oder Dateien generieren, überprüfen Sie die Unterschiede, bevor Sie entscheiden, ob Sie sie in den Commit aufnehmen.

Der Commit-Hash ist ein Beweis für die Rückverfolgbarkeit des Quellcodes, nicht für das Deployment. Schreiben, erraten oder verwenden Sie Hashes aus historischen Aufgaben nicht manuell; zerstörerisches Reset/Checkout sollte auch nicht an Benutzermodifikationen vorgenommen werden, nur um den Arbeitsbereich zu bereinigen.

## 4. Push- und Cloudflare Pages-Grenzen

Produktionssynchronisation und Bereitstellung sind zwei Aktionen, die separat aufgezeichnet werden müssen:

1. Bestätigen Sie zuerst den Remote-Namen, den Ziel-Branch, das Ziel-Cloudflare-Pages-Projekt, die Umgebungsvariablen und ob dies reale Geschäftsabläufe beeinflusst;
2. Führen Sie `git push` oder andere Remote-Synchronisationen erst nach Einholung einer expliziten Autorisierung aus;
3. `shijianus-blog`-Projekte dürfen nur die Build-Artefakte und Zieleinstellungen ihres eigenen Projekts verwenden; Artefakte aus anderen Projekten dürfen nicht projektübergreifend bereitgestellt werden;
4. Verwenden Sie vor der Bereitstellung den entsprechenden statischen Build-Prozess und bestätigen Sie, dass Geheimnisse nur aus Umgebungsvariablen/Plattformgeheimnissen injiziert und nicht in Markdown, JavaScript oder Artefakte geschrieben werden;
5. Zeichnen Sie nach der Bereitstellung Pages-Deployment-ID, Commit-SHA, Zieldomäne, Zeit und Befehlsergebnisse auf;
6. Wenn Autorisierung, Anmeldeinformationen oder erforderliche Deployment-Informationen fehlen, sollte der Status `BLOCKED` oder 'nicht ausgeführt' sein, und lokaler Erfolg kann die Veröffentlichung nicht ersetzen.

Die `npm run cf:deploy` im Repository sind lediglich verfügbare Befehle, keine automatischen Genehmigungen. Bei Produktionsbereitstellungen, die Datenbankmigrationen, Schlüsselrotationen, Zahlungen, Konten oder Benachrichtigungen beinhalten, müssen Kompatibilitäts- und Rollback-Einschränkungen Element für Element aufgezeichnet werden.

## 5. Online-Verifizierung

Die Produktionsüberprüfung sollte erst durchgeführt werden, nachdem die Bereitstellung autorisiert wurde und die Artefakte in der Zielumgebung wirksam sind. Die Mindestaufzeichnungen sollten Folgendes umfassen:

- Ziel-URL, zum Beispiel `https://blog.epocanvas.com/`;
- Pages-Deployment-ID, Commit-SHA, Verifizierungsdatum, -uhrzeit und -zeitzone;
- HTTP-Status, Inhaltstyp und wichtige Antworten der betroffenen Seiten und APIs;
- Wenn eine Interaktion erforderlich ist, verwenden Sie einen Headless-Browser, um Ladevorgänge, Klicks, Modale, Formulare, Fehlermeldungen, responsive Layouts und kritische Konsolenfehler zu überprüfen;
- Ob die betroffenen Datenströme Sandbox- oder echte Daten verwenden und ob externe Nebenwirkungen vorliegen;
- Originalausgabe bei Fehlschlag, Screenshot-/Videospeicherort und ob der Verlust gemindert wurde.

Dokumentenrouten können nur auf Seitentitel, Hauptinhalt, Links und das Fehlen von 404-Fehlern überprüft werden; Kommentare, Konten, Zahlungen oder Benachrichtigungen müssen ihre entsprechenden APIs und Berechtigungsgrenzen überprüfen. Eine einzelne 200-Antwort der Startseite kann die vollständige funktionale Abnahme nicht ersetzen.

## 6. Ereignisklassifizierung und sofortige Behandlung

### 6.1 Dokumenten- oder Build-Ereignisse

Wenn Dokumente nicht analysiert werden können, Routen 404 zurückgeben, Front-Matter-Fehler auftreten, statische Builds fehlschlagen oder Artefakte Inhalte enthalten, die nicht öffentlich sein sollten:

1. Pushes und Deployments stoppen;
2. Fehlerbefehle, Commits, Dateipfade und Umgebung speichern;
3. Wenn noch nicht bereitgestellt, beheben und neu erstellen;
4. Wenn bereits bereitgestellt, auf das autorisierte vorherige fehlerfreie Artefakt oder die minimale Korrekturlösung zurücksetzen;
5. Dokumentenstatus und Übergabebericht aktualisieren.

### 6.2 API-, Daten- und Identitätsereignisse

Wenn unbefugtes Lesen/Ändern, verlorene Kommentardaten, ungültige Sitzungen, öffentliche personenbezogene Daten oder Migrationsanomalien auftreten:

1. Betroffene Routen zuerst einschränken oder nachfolgende Migrationen stoppen;
2. Potenziell durchgesickerte Token und Geheimnisse widerrufen/rotieren und keine Geheimnisse in Berichte einfügen;
3. Anforderungszeit, Deployment-ID, Fehlerantwort und betroffene Datentypen speichern;
4. Benachrichtigungen und Datenanfragen gemäß der [Sicherheitsoffenlegungsrichtlinie](/community/security-disclosure/) und der [Datenschutz- und Datennutzungsrichtlinie](/community/privacy-and-data/) verarbeiten;
5. Behaupten Sie nicht 'wiederhergestellt' oder 'Daten vollständig', bis die Datenkonsistenz bestätigt ist.

### 6.3 Zahlungs- und Benachrichtigungsereignisse

Wenn Anomalien bei Stripe, Wertschätzungsaufzeichnungen, Rückerstattungen, Telegram-Benachrichtigungen oder Zahlungsstatus auftreten:

- Wiederholen Sie keine Zahlungsanfragen mit unbekanntem Status und fragen Sie in Kommentaren oder E-Mails nicht nach Kartennummern/Sicherheitscodes;
- Speichern Sie Zahlungsanbieter-Antworten, Website-Aufzeichnungen, Benachrichtigungsergebnisse und Zeitpläne separat;
- Stellen Sie zuerst fest, ob die Transaktion abgeschlossen ist und ob Doppelabbuchungen möglich sind, und entscheiden Sie dann über Wiederholungs- oder Rückerstattungspfade;
- Behandeln Sie nicht zugestellte Benachrichtigungen und unvollständige Zahlungen separat; Telegram-Nachrichten können nicht als alleiniger Transaktionsnachweis verwendet werden;
- Erklären Sie den Benutzern die verfügbaren Verarbeitungsmethoden gemäß der [Richtlinie zu Wertschätzung, Rückerstattungen und Zahlungen Dritter](/community/support-and-refunds/).

## 7. Rollback und Wiederherstellung

Bestätigen Sie vor dem Rollback, ob das Ziel 'Code-/Dokumentenartefakte', 'Datenbankschema', 'Umgebungsvariablen' oder 'Transaktionsstatus Dritter' ist; sie können möglicherweise nicht mit derselben Aktion wiederhergestellt werden.

1. Wählen Sie einen bekannten fehlerfreien Commit/eine Deployment-ID aus und bestätigen Sie, dass er keine Datenbankmigrationen oder Sicherheitskorrekturen enthält, die noch beibehalten werden müssen;
2. Speichern Sie zuerst den aktuellen Status und die Incident-Beweise und führen Sie dann ein autorisiertes Rollback durch;
3. Verwenden Sie kein zerstörerisches Git reset/checkout, um unbestätigte Benutzermodifikationen zu löschen;
4. Führen Sie nach dem Rollback eine minimale Online-Verifizierung für betroffene Routen und APIs erneut durch;
5. Wenn Daten geschrieben wurden oder eine Zahlung erfolgt ist, führen Sie Datenreparatur, Rückerstattungen oder manuellen Abgleich separat durch; verwechseln Sie das Seiten-Rollback nicht mit der Datenwiederherstellung;
6. Dokumentieren Sie nach Abschluss des Vorfalls Ursache, Zeitachse, Auswirkungen, Korrekturen, ungelöste Risiken und nachfolgende Tests.

## 8. Vorlage für den Übergabebericht

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

Zuletzt aktualisiert: 2026-10-20.
