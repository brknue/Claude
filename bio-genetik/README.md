# Genetik verstehen

Interaktive Lernseite für die Biologie-Kursarbeit „Genetik“ (Sekundarstufe I). Sie deckt alle Begriffe der Lernliste ab: Zellkern, Chromosomen, Karyogramm, Bau der DNA, Replikation, Zellzyklus & Mitose, Proteinbiosynthese und den genetischen Code.

## Funktionen

- 7 Kapitel mit Erklärungen, Merkkästen, Eselsbrücken und typischen Fehlern
- 13 interaktive Animationen: Zelle zum Antippen, Chromatin → Chromosom, Chromosomenbau, Karyogramm (XX/XY, haploid/diploid), drehbare Doppelhelix, Basenpaarungs-Spiel, Replikation, Zellzyklus, Mitose in 6 Schritten, Transkription, Translation, interaktive Code-Sonne
- Quiz pro Kapitel mit Erklärung zu jeder Antwort
- Typische Kursarbeitsaufgaben mit Musterlösungen
- Karteikarten mit Lernboxen (Wiederholung nach 1, 2, 4, 8 und 16 Tagen)
- Übungslabor mit unendlich vielen generierten Aufgaben (Komplementärstrang, Transkription, Translation, Chromosomenzahlen)
- Probearbeit in 3 Teilen mit ungefährer Note und Checkliste
- Lexikon mit Suche
- Sprachen: Deutsch (Standard), English, Türkçe, العربية (von rechts nach links), Русский, Українська. In jeder Sprache steht der deutsche Fachbegriff dabei, weil die Arbeit auf Deutsch geschrieben wird.
- Fortschritt wird nur lokal im Browser gespeichert (localStorage), mit Export, Import und Löschen
- Handy, Tablet und Computer, Dunkelmodus, Tastaturbedienung, „Bewegung reduzieren“

## Datenschutz

Keine Cookies, kein Tracking, keine Werbung, keine externen Schriften, Skripte oder Bilder. Eine Content-Security-Policy blockiert Verbindungen zu fremden Servern. Alle Texte, Grafiken und Animationen sind eigens erstellt.

## Lokal starten

```bash
python3 -m http.server 8080
```

Dann `http://localhost:8080/` öffnen. Kein Build-Schritt nötig.

## Prüfen

```bash
node tests.mjs
```

Prüft, dass alle Sprachen vollständig sind, dass der genetische Code stimmt und dass jede generierte Übungsaufgabe ihre eigene Lösung akzeptiert.

## Lizenz

MIT, siehe [LICENSE](LICENSE).
