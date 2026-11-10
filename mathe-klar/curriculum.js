window.LESSONS = [
  {
    "id": "5-01",
    "grade": 5,
    "category": "Zahlen & Algebra",
    "title": "Zahlen und Stellenwerte",
    "description": "Große Zahlen lesen, ordnen und am Zahlenstrahl finden.",
    "visual": {
      "type": "place",
      "digits": "34726"
    },
    "steps": [
      {
        "title": "Ziffer oder Zahl?",
        "formula": "34 726",
        "text": "Die Zahl besteht aus fünf Ziffern. Ihr Wert hängt von der Stelle ab. Die Ziffer 4 steht hier für vier Tausender."
      },
      {
        "title": "Das Zehnersystem",
        "formula": "10 E = 1 Z; 10 Z = 1 H",
        "text": "Zehn Einer werden zu einem Zehner gebündelt. Jede Stelle links ist zehnmal so viel wert wie ihre rechte Nachbarstelle."
      },
      {
        "title": "In Stellenwerte zerlegen",
        "formula": "34 726 = 30 000 + 4 000 + 700 + 20 + 6",
        "text": "Von links: Zehntausender, Tausender, Hunderter, Zehner, Einer. Eine Null hält eine leere Stelle frei."
      },
      {
        "title": "Zahlen vergleichen",
        "formula": "34 726 < 34 762",
        "text": "Vergleiche zuerst die Stellenanzahl, dann von links die erste verschiedene Ziffer. Hier entscheiden die Zehner: 2 ist kleiner als 6."
      },
      {
        "title": "Zahlenstrahl und Nachbarn",
        "formula": "34 700 < 34 726 < 34 800",
        "text": "Gleiche Abstände müssen gleiche Zahlunterschiede bedeuten. Die Zahl liegt zwischen den benachbarten Hundertern."
      }
    ],
    "rule": "Der Stellenwert wächst nach links jeweils mit dem Faktor 10.",
    "error": "Eine Null mitten in einer Zahl darf nicht weggelassen werden.",
    "quiz": {
      "question": "Welchen Wert hat die Ziffer 7 in 47 305?",
      "answer": 7000,
      "solution": "Die 7 steht an der Tausenderstelle: 7 · 1000 = 7000."
    },
    "prerequisite": ""
  },
  {
    "id": "5-02",
    "grade": 5,
    "category": "Zahlen & Algebra",
    "title": "Runden und Überschlagen",
    "description": "Ergebnisse abschätzen und sinnvoll genau angeben.",
    "visual": {
      "type": "numberline",
      "start": 3400,
      "end": 3500,
      "value": 3476
    },
    "steps": [
      {
        "title": "Genauigkeit festlegen",
        "formula": "3476 auf Hunderter runden",
        "text": "Gesucht ist der nächstgelegene Hunderter. Er liegt bei 3400 oder 3500."
      },
      {
        "title": "Entscheidende Ziffer",
        "formula": "3476 → Zehnerziffer 7",
        "text": "Betrachte die Stelle direkt rechts von der Rundungsstelle. Bei 0 bis 4 rundest du ab, bei 5 bis 9 auf."
      },
      {
        "title": "Runden",
        "formula": "3476 ≈ 3500",
        "text": "Die 7 führt zum Aufrunden. Rechts von den Hundertern stehen danach Nullen. Das Zeichen ≈ bedeutet ungefähr gleich."
      },
      {
        "title": "Überschlag",
        "formula": "398 · 21 ≈ 400 · 20 = 8000",
        "text": "Runde vor der Rechnung auf gut rechenbare Zahlen. Der Überschlag hilft, einen groben Fehler im genauen Ergebnis zu erkennen."
      },
      {
        "title": "Kontext beachten",
        "formula": "398 · 21 = 8358",
        "text": "Das genaue Ergebnis passt zum Überschlag. Bei Geld, Messwerten und Personenzahlen hängt die passende Genauigkeit von der Frage ab."
      }
    ],
    "rule": "Erst Rundungsstelle wählen, dann die nächste Ziffer prüfen.",
    "error": "Beim mehrmaligen Runden können Fehler entstehen. Runde direkt von der ursprünglichen Zahl.",
    "quiz": {
      "question": "Runde 7649 auf Hunderter.",
      "answer": 7600,
      "solution": "Die Zehnerziffer ist 4. Deshalb wird abgerundet: 7600."
    },
    "prerequisite": ""
  },
  {
    "id": "5-03",
    "grade": 5,
    "category": "Zahlen & Algebra",
    "title": "Schriftlich addieren und subtrahieren",
    "description": "Stellengerecht rechnen und Überträge verstehen.",
    "visual": {
      "type": "arithmetic"
    },
    "steps": [
      {
        "title": "Gleiche Stellen untereinander",
        "formula": "478 + 257",
        "text": "Einer gehören unter Einer, Zehner unter Zehner. Beginne rechts."
      },
      {
        "title": "Einer mit Übertrag",
        "formula": "8 + 7 = 15",
        "text": "Schreibe 5 Einer. Die übrigen 10 Einer werden als 1 Zehner in die nächste Spalte übertragen."
      },
      {
        "title": "Zehner und Hunderter",
        "formula": "7 + 5 + 1 = 13; 4 + 2 + 1 = 7",
        "text": "Bei den Zehnern entsteht erneut ein Übertrag. So ergibt sich die Summe 735."
      },
      {
        "title": "Umkehrung: subtrahieren",
        "formula": "735 − 257",
        "text": "Bei 5 − 7 reicht die Einerstelle nicht. Entbündele einen Zehner: 15 − 7 = 8. Es bleiben 2 Zehner."
      },
      {
        "title": "Weiter entbündeln",
        "formula": "12 − 5 = 7; 6 − 2 = 4",
        "text": "Ein Hunderter wird zu zehn Zehnern. Die Differenz lautet 478. Die Addition 478 + 257 = 735 ist die Probe."
      }
    ],
    "rule": "Rechne von rechts nach links und berücksichtige jeden Übertrag.",
    "error": "Nach dem Entbündeln muss die spendende Stelle um 1 kleiner sein.",
    "quiz": {
      "question": "Berechne 603 − 278.",
      "answer": 325,
      "solution": "Entbündeln über die Null: 13 − 8 = 5, 9 − 7 = 2, 5 − 2 = 3. Ergebnis: 325."
    },
    "prerequisite": ""
  },
  {
    "id": "5-04",
    "grade": 5,
    "category": "Zahlen & Algebra",
    "title": "Schriftlich multiplizieren und dividieren",
    "description": "Teilprodukte und die schriftliche Division mit Rest.",
    "visual": {
      "type": "arithmetic"
    },
    "steps": [
      {
        "title": "Multiplikation zerlegen",
        "formula": "234 · 16 = 234 · (10 + 6)",
        "text": "Der zweite Faktor enthält einen Zehner und sechs Einer. Beide Teilprodukte müssen berücksichtigt werden."
      },
      {
        "title": "Teilprodukte",
        "formula": "234 · 6 = 1404; 234 · 10 = 2340",
        "text": "Beim Rechnen mit den Zehnern verschiebt sich das Produkt um eine Stelle nach links."
      },
      {
        "title": "Addieren",
        "formula": "1404 + 2340 = 3744",
        "text": "Die Summe der Teilprodukte ist das Ergebnis. Ein Überschlag 200 · 20 = 4000 passt dazu."
      },
      {
        "title": "Division beginnen",
        "formula": "945 : 4",
        "text": "9 : 4 = 2 Rest 1. Schreibe 2 auf, ziehe 8 ab und hole die nächste Ziffer 4 herunter: 14."
      },
      {
        "title": "Division fortsetzen",
        "formula": "14 : 4 = 3 R 2; 25 : 4 = 6 R 1",
        "text": "Nach dem nächsten Herunterholen entsteht 25. Ergebnis: 236 Rest 1. Der Rest ist kleiner als der Divisor."
      },
      {
        "title": "Probe",
        "formula": "236 · 4 + 1 = 945",
        "text": "Dividend = Quotient · Divisor + Rest. Eine Division durch 0 ist nicht definiert."
      }
    ],
    "rule": "Bei der Division ist der Rest immer kleiner als der positive Divisor.",
    "error": "Die Stellenverschiebung bei Teilprodukten nicht vergessen.",
    "quiz": {
      "question": "Berechne 156 : 6.",
      "answer": 26,
      "solution": "15 : 6 = 2 Rest 3; 36 : 6 = 6. Probe: 26 · 6 = 156."
    },
    "prerequisite": ""
  },
  {
    "id": "5-05",
    "grade": 5,
    "category": "Zahlen & Algebra",
    "title": "Rechenregeln und Klammern",
    "description": "Punkt vor Strich und geschickt umformen.",
    "visual": {
      "type": "equation"
    },
    "steps": [
      {
        "title": "Reihenfolge",
        "formula": "18 − 2 · (3 + 4)",
        "text": "Klammern bestimmen zuerst zusammengehörige Teile. Danach folgen Potenzen, Punktrechnungen und Strichrechnungen."
      },
      {
        "title": "Klammer ausrechnen",
        "formula": "18 − 2 · 7",
        "text": "3 + 4 = 7. Die übrigen Zeichen bleiben unverändert."
      },
      {
        "title": "Punkt vor Strich",
        "formula": "18 − 14 = 4",
        "text": "Zuerst 2 · 7, erst dann subtrahieren. Gleichrangige Rechnungen bearbeitest du von links nach rechts."
      },
      {
        "title": "Vertauschen und verbinden",
        "formula": "25 + 17 + 75 = (25 + 75) + 17 = 117",
        "text": "Bei Addition und Multiplikation darfst du vertauschen und neu klammern. Für Subtraktion und Division gilt das nicht allgemein."
      },
      {
        "title": "Verteilen",
        "formula": "7 · 19 = 7 · (20 − 1) = 140 − 7 = 133",
        "text": "Das Distributivgesetz verteilt einen Faktor auf alle Summanden in der Klammer."
      }
    ],
    "rule": "Klammer → Potenz → Punkt → Strich; gleichrangig von links.",
    "error": "18 − 2 · 7 ist nicht 16 · 7.",
    "quiz": {
      "question": "Berechne 30 − 3 · (2 + 4).",
      "answer": 12,
      "solution": "Klammer: 6; Produkt: 18; Differenz: 30 − 18 = 12."
    },
    "prerequisite": ""
  },
  {
    "id": "5-06",
    "grade": 5,
    "category": "Zahlen & Algebra",
    "title": "Teiler, Vielfache und Primzahlen",
    "description": "Teilbarkeit prüfen, ggT und kgV finden.",
    "visual": {
      "type": "tiles",
      "n": 24
    },
    "steps": [
      {
        "title": "Teiler und Vielfache",
        "formula": "24 = 6 · 4",
        "text": "6 ist ein Teiler von 24, denn die Division geht ohne Rest auf. 24 ist ein Vielfaches von 6."
      },
      {
        "title": "Teilbarkeitsregeln",
        "formula": "2: letzte Ziffer gerade; 5: 0 oder 5; 10: 0",
        "text": "Durch 3 ist eine Zahl teilbar, wenn ihre Quersumme durch 3 teilbar ist. Für 9 gilt die entsprechende Quersummenregel."
      },
      {
        "title": "Primzahlen",
        "formula": "2, 3, 5, 7, 11, 13, …",
        "text": "Eine Primzahl hat genau zwei positive Teiler: 1 und sich selbst. 1 ist keine Primzahl. 2 ist die einzige gerade Primzahl."
      },
      {
        "title": "Primfaktorzerlegung",
        "formula": "24 = 2 · 2 · 2 · 3; 36 = 2 · 2 · 3 · 3",
        "text": "Zerlege solange, bis alle Faktoren prim sind. Das hilft beim Finden gemeinsamer Teiler und Vielfacher."
      },
      {
        "title": "ggT und kgV",
        "formula": "ggT(24,36) = 12; kgV(24,36) = 72",
        "text": "Für den ggT nimm gemeinsame Primfaktoren mit kleinsten Exponenten. Für das kgV nimm alle mit größten Exponenten."
      }
    ],
    "rule": "Teiler teilen ohne Rest; Primzahlen haben genau zwei positive Teiler.",
    "error": "Teilbar durch 2 und 3 bedeutet teilbar durch 6; für 4 entscheidet die Zahl aus den letzten zwei Ziffern.",
    "quiz": {
      "question": "Wie groß ist der größte gemeinsame Teiler von 18 und 24?",
      "answer": 6,
      "solution": "Teiler von 18: 1,2,3,6,9,18. Gemeinsame Teiler mit 24: 1,2,3,6. Der größte ist 6."
    },
    "prerequisite": ""
  },
  {
    "id": "5-07",
    "grade": 5,
    "category": "Zahlen & Algebra",
    "title": "Größen und Einheiten",
    "description": "Länge, Masse, Geld und Zeit sicher umrechnen.",
    "visual": {
      "type": "table",
      "rows": [
        [
          "km",
          "m",
          "cm"
        ],
        [
          "1",
          "1000",
          "100000"
        ]
      ]
    },
    "steps": [
      {
        "title": "Größe und Einheit",
        "formula": "2,5 m",
        "text": "Eine Größenangabe braucht Maßzahl und Einheit. Zum Vergleichen brauchst du dieselbe Einheit."
      },
      {
        "title": "Längen",
        "formula": "1 km = 1000 m; 1 m = 100 cm; 1 cm = 10 mm",
        "text": "Von einer größeren zur kleineren Einheit wird die Maßzahl größer. 2,5 m = 250 cm."
      },
      {
        "title": "Masse und Geld",
        "formula": "1 t = 1000 kg; 1 kg = 1000 g; 1 € = 100 ct",
        "text": "2,4 kg = 2400 g. Rechne Geldbeträge stellengerecht und gib üblicherweise zwei Nachkommastellen an."
      },
      {
        "title": "Zeit ist anders",
        "formula": "1 h = 60 min; 1 min = 60 s",
        "text": "1,5 Stunden sind 1 Stunde und 30 Minuten. Eine Stunde ist nicht 100 Minuten."
      },
      {
        "title": "Sachaufgabe",
        "formula": "9:45 Uhr + 50 min = 10:35 Uhr",
        "text": "Rechne zuerst bis zur nächsten vollen Stunde: 15 min. Die übrigen 35 min ergeben 10:35 Uhr. Prüfe, ob eine Zeitspanne oder ein Zeitpunkt gesucht ist."
      }
    ],
    "rule": "Einheiten zuerst angleichen; bei Zeit gelten 60er-Schritte.",
    "error": "1,5 h bedeutet nicht 1 h 5 min.",
    "quiz": {
      "question": "Wie viele Minuten sind 2,25 Stunden?",
      "answer": 135,
      "solution": "2 Stunden sind 120 Minuten. 0,25 · 60 = 15 Minuten. Zusammen 135."
    },
    "prerequisite": ""
  },
  {
    "id": "5-08",
    "grade": 5,
    "category": "Geometrie",
    "title": "Geometrische Grundbegriffe",
    "description": "Punkt, Strecke, Gerade, senkrecht und parallel.",
    "visual": {
      "type": "geometry"
    },
    "steps": [
      {
        "title": "Punkte und Strecken",
        "formula": "A •────────• B",
        "text": "Ein Punkt hat eine Lage. Eine Strecke AB hat zwei Endpunkte und eine messbare Länge."
      },
      {
        "title": "Gerade und Strahl",
        "formula": "Gerade g; Strahl ab A",
        "text": "Eine Gerade ist in beide Richtungen unbegrenzt. Ein Strahl hat einen Anfangspunkt und läuft in eine Richtung unbegrenzt weiter."
      },
      {
        "title": "Parallel",
        "formula": "g ∥ h",
        "text": "Parallele Geraden einer Ebene schneiden sich nicht. Ihr senkrechter Abstand ist überall gleich."
      },
      {
        "title": "Senkrecht",
        "formula": "g ⟂ k; α = 90°",
        "text": "Senkrechte Geraden bilden einen rechten Winkel. Mit dem Geodreieck kannst du diesen zeichnen und überprüfen."
      },
      {
        "title": "Abstand messen",
        "formula": "d(P,g) = Länge des Lots",
        "text": "Der kürzeste Weg von einem Punkt zur Geraden verläuft senkrecht. Eine schräg gemessene Strecke ist länger."
      }
    ],
    "rule": "Abstände werden immer auf dem kürzesten, senkrechten Weg gemessen.",
    "error": "Eine Strecke ist begrenzt; eine Gerade geht über die Zeichnung hinaus.",
    "quiz": {
      "question": "Wie viele Grad hat ein rechter Winkel?",
      "answer": 90,
      "solution": "Ein rechter Winkel beträgt 90°. Zwei senkrechte Geraden bilden vier rechte Winkel."
    },
    "prerequisite": ""
  },
  {
    "id": "5-09",
    "grade": 5,
    "category": "Geometrie",
    "title": "Koordinatensystem",
    "description": "Punkte über x und y eindeutig finden.",
    "visual": {
      "type": "coordinates",
      "points": [
        [
          3,
          2
        ],
        [
          1,
          4
        ]
      ]
    },
    "steps": [
      {
        "title": "Die Achsen",
        "formula": "O(0|0)",
        "text": "Die waagerechte Achse heißt x-Achse, die senkrechte y-Achse. Ihr Schnittpunkt ist der Ursprung."
      },
      {
        "title": "Erst waagerecht",
        "formula": "P(3|2): x = 3",
        "text": "Gehe vom Ursprung drei Einheiten nach rechts. Beachte die Skalierung: ein Kästchen muss nicht immer eine Einheit bedeuten."
      },
      {
        "title": "Dann senkrecht",
        "formula": "P(3|2): y = 2",
        "text": "Gehe von dort zwei Einheiten nach oben und markiere P. Die Reihenfolge ist immer x vor y."
      },
      {
        "title": "Ablesen",
        "formula": "Q(1|4)",
        "text": "Lies zuerst die waagerechte Lage, dann die Höhe ab. P(3|2) und (2|3) sind verschiedene Punkte."
      },
      {
        "title": "Figuren zeichnen",
        "formula": "A(1|1), B(4|1), C(4|3), D(1|3)",
        "text": "Trage alle Punkte ein und verbinde sie der Reihe nach. Die Achsenabschnitte helfen beim Prüfen paralleler Seiten."
      }
    ],
    "rule": "Ein Punkt wird als P(x|y) geschrieben.",
    "error": "Die Koordinaten nicht vertauschen.",
    "quiz": {
      "question": "Welche x-Koordinate hat P(4|7)?",
      "answer": 4,
      "solution": "In P(x|y) steht x immer zuerst: x = 4."
    },
    "prerequisite": ""
  },
  {
    "id": "5-10",
    "grade": 5,
    "category": "Geometrie",
    "title": "Rechteck, Quadrat und Flächen",
    "description": "Umfang und Fläche unterscheiden und berechnen.",
    "visual": {
      "type": "area",
      "w": 6,
      "h": 4
    },
    "steps": [
      {
        "title": "Rand oder Inhalt?",
        "formula": "a = 6 cm; b = 4 cm",
        "text": "Der Umfang ist die Länge des Randes. Der Flächeninhalt beschreibt, wie viele Einheitsquadrate hineinpassen."
      },
      {
        "title": "Umfang",
        "formula": "U = a + b + a + b = 2a + 2b",
        "text": "Die gegenüberliegenden Seiten eines Rechtecks sind gleich lang. 6 + 4 + 6 + 4 = 20 cm."
      },
      {
        "title": "Fläche zählen",
        "formula": "4 Reihen · 6 Quadrate = 24 Quadrate",
        "text": "Ein Quadrat von 1 cm Seitenlänge hat die Fläche 1 cm². Die Einteilung zeigt das Produkt aus Länge und Breite."
      },
      {
        "title": "Flächenformel",
        "formula": "A = a · b = 6 · 4 = 24 cm²",
        "text": "Beim Quadrat sind beide Seiten gleich: A = a² und U = 4a."
      },
      {
        "title": "Flächeneinheiten",
        "formula": "1 m² = 10 000 cm²",
        "text": "1 m = 100 cm; deshalb passen 100 · 100 Quadrate hinein. Benachbarte metrische Flächenschritte haben Faktor 100, nicht 10."
      }
    ],
    "rule": "Rechteck: A = a · b; U = 2(a + b).",
    "error": "Fläche erhält cm², Umfang erhält cm.",
    "quiz": {
      "question": "Ein Rechteck ist 8 cm lang und 3 cm breit. Wie groß ist seine Fläche in cm²?",
      "answer": 24,
      "solution": "A = 8 · 3 = 24 cm²."
    },
    "prerequisite": ""
  },
  {
    "id": "5-11",
    "grade": 5,
    "category": "Geometrie",
    "title": "Symmetrie und Verschiebung",
    "description": "Spiegeln, drehen und Figuren verschieben.",
    "visual": {
      "type": "transform"
    },
    "steps": [
      {
        "title": "Achsenspiegelung",
        "formula": "P(x|y) → P′(−x|y) an der y-Achse",
        "text": "Original und Bild haben denselben senkrechten Abstand von der Spiegelachse. Die Verbindungsstrecke steht senkrecht zur Achse."
      },
      {
        "title": "Beispiel spiegeln",
        "formula": "P(3|2) → P′(−3|2)",
        "text": "Die Höhe bleibt gleich. Rechts und links der y-Achse liegen die Punkte jeweils drei Einheiten entfernt."
      },
      {
        "title": "Punktspiegelung",
        "formula": "P(x|y) → P′(−x|−y) am Ursprung",
        "text": "Das Zentrum ist die Mitte zwischen Punkt und Bildpunkt. Dies entspricht einer Drehung um 180°."
      },
      {
        "title": "Verschieben",
        "formula": "P(3|2) → P′(5|3)",
        "text": "Bei einer Verschiebung um 2 nach rechts und 1 nach oben bewegt sich jeder Punkt um denselben Vektor. Längen und Winkel bleiben gleich."
      },
      {
        "title": "Drehen und verketten",
        "formula": "Drehzentrum Z, Winkel α, Drehsinn",
        "text": "Alle Punkte drehen sich gleich weit um das Zentrum. Zwei Spiegelungen an parallelen Achsen ergeben eine Verschiebung; an sich schneidenden Achsen eine Drehung."
      }
    ],
    "rule": "Bei Spiegelung, Drehung und Verschiebung bleiben Längen und Winkel erhalten.",
    "error": "Eine Figur kann mehrere Symmetrieachsen haben; ein allgemeines Rechteck hat zwei.",
    "quiz": {
      "question": "P(2|3) wird um 4 nach rechts verschoben. Welche x-Koordinate hat P′?",
      "answer": 6,
      "solution": "Addiere zur x-Koordinate 4: 2 + 4 = 6; y bleibt 3."
    },
    "prerequisite": ""
  },
  {
    "id": "5-12",
    "grade": 5,
    "category": "Geometrie",
    "title": "Körper, Netze und Schrägbilder",
    "description": "Würfel und Quader räumlich verstehen.",
    "visual": {
      "type": "box",
      "a": 4,
      "b": 3,
      "h": 2
    },
    "steps": [
      {
        "title": "Körper erkennen",
        "formula": "Würfel · Quader · Prisma · Pyramide · Zylinder · Kegel · Kugel",
        "text": "Körper sind räumlich. Unterscheide ebene Flächen, gekrümmte Flächen, Kanten und Ecken. Eine Kugel hat keine Ecken und Kanten."
      },
      {
        "title": "Der Quader",
        "formula": "6 Flächen; 12 Kanten; 8 Ecken",
        "text": "Gegenüberliegende Flächen sind gleich große Rechtecke. Beim Würfel sind alle sechs Flächen gleich große Quadrate."
      },
      {
        "title": "Ein Netz entfalten",
        "formula": "2 · (ab + ah + bh)",
        "text": "Ein Quadernetz enthält drei Rechteckpaare. Es muss sich ohne Überlappung und ohne Lücke zu einem Quader falten lassen."
      },
      {
        "title": "Schrägbild",
        "formula": "Vorderfläche maßtreu; Tiefe verkürzt",
        "text": "Häufig werden Tiefenkanten im 45°-Winkel und halb so lang gezeichnet. Verdeckte Kanten sind gestrichelt. Die Zeichnung ist keine Messvorlage für alle Längen."
      },
      {
        "title": "Räumlich bewegen",
        "formula": "Drehen verändert die Ansicht, nicht den Körper",
        "text": "Nach einer Drehung sieht man andere Flächen. Die tatsächlichen Kantenlängen bleiben gleich."
      }
    ],
    "rule": "Ein Körpernetz zeigt alle Oberflächenstücke in der Ebene.",
    "error": "Nicht jede Anordnung von sechs Quadraten ist ein Würfelnetz.",
    "quiz": {
      "question": "Wie viele Kanten hat ein Quader?",
      "answer": 12,
      "solution": "Es gibt vier Kanten unten, vier oben und vier senkrechte: 12."
    },
    "prerequisite": ""
  },
  {
    "id": "5-13",
    "grade": 5,
    "category": "Daten & Zufall",
    "title": "Daten erheben und darstellen",
    "description": "Von der Urliste zum Säulendiagramm.",
    "visual": {
      "type": "bars",
      "values": [
        4,
        7,
        5,
        2
      ],
      "labels": [
        "Rad",
        "Bus",
        "Fuß",
        "Auto"
      ]
    },
    "steps": [
      {
        "title": "Eine Frage stellen",
        "formula": "Wie kommt unsere Klasse zur Schule?",
        "text": "Lege fest, wer befragt wird und welche Antwortmöglichkeiten gelten. Jede Person wird nur einmal erfasst."
      },
      {
        "title": "Ur- und Strichliste",
        "formula": "Rad: 4; Bus: 7; Fuß: 5; Auto: 2",
        "text": "Die Urliste enthält einzelne Antworten. Eine Strichliste zählt sie, oft in Fünfergruppen."
      },
      {
        "title": "Absolute Häufigkeit",
        "formula": "n = 4 + 7 + 5 + 2 = 18",
        "text": "Die absolute Häufigkeit ist die Anzahl einer Antwort. Die Summe muss zur Zahl der Befragten passen."
      },
      {
        "title": "Säulendiagramm",
        "formula": "Höhe der Säule = Anzahl",
        "text": "Beschrifte beide Achsen, wähle gleiche Abstände und beginne die Anzahlachse bei null. Die Säulenbreite bleibt gleich."
      },
      {
        "title": "Gruppieren und prüfen",
        "formula": "z. B. Alter: 10–11, 12–13, 14–15",
        "text": "Für viele verschiedene Messwerte helfen eindeutige, überlappungsfreie Klassen. Eine Befragung nur der Fahrrad-AG wäre für die ganze Schule nicht repräsentativ."
      }
    ],
    "rule": "Ein Diagramm braucht Überschrift, beschriftete Achsen und eine nachvollziehbare Skala.",
    "error": "Die Höhe zeigt die Häufigkeit, nicht die Breite der Säule.",
    "quiz": {
      "question": "4 Kinder fahren Rad, 7 Bus, 5 gehen und 2 fahren Auto. Wie viele Kinder sind es insgesamt?",
      "answer": 18,
      "solution": "Die absoluten Häufigkeiten werden addiert: 4 + 7 + 5 + 2 = 18."
    },
    "prerequisite": ""
  },
  {
    "id": "5-14",
    "grade": 5,
    "category": "Funktionen",
    "title": "Muster, Tabellen und einfache Terme",
    "description": "Regeln entdecken und mit Variablen beschreiben.",
    "visual": {
      "type": "table",
      "rows": [
        [
          "n",
          "1",
          "2",
          "3",
          "4"
        ],
        [
          "3n + 1",
          "4",
          "7",
          "10",
          "13"
        ]
      ]
    },
    "steps": [
      {
        "title": "Muster erkennen",
        "formula": "4, 7, 10, 13, …",
        "text": "Die Differenz benachbarter Zahlen ist immer 3. Die nächste Zahl lautet 16."
      },
      {
        "title": "Position beachten",
        "formula": "n = 1, 2, 3, …",
        "text": "n zählt die Position in der Folge. Es ist eine Variable, also ein Platzhalter für wechselnde Zahlen."
      },
      {
        "title": "Regel formulieren",
        "formula": "T(n) = 3n + 1",
        "text": "Bei n = 1 ergibt sich 4. Jeder weitere Schritt erhöht den Wert um 3. 3n bedeutet 3 · n."
      },
      {
        "title": "Einsetzen",
        "formula": "T(10) = 3 · 10 + 1 = 31",
        "text": "Ersetze die Variable durch die gesuchte Position und beachte Punkt vor Strich."
      },
      {
        "title": "Grenzen einer Vermutung",
        "formula": "2, 4, 6, …",
        "text": "Aus wenigen Zahlen folgt nicht zwingend eine einzige Regel. Prüfe deine Regel an allen gegebenen Werten und erkläre die angenommene Fortsetzung."
      }
    ],
    "rule": "Eine Variable kann eine Position, eine veränderliche Größe oder eine Unbekannte darstellen.",
    "error": "3n ist ein Produkt, nicht die Zahl mit den Ziffern 3 und n.",
    "quiz": {
      "question": "T(n) = 4n + 2. Wie groß ist T(5)?",
      "answer": 22,
      "solution": "Setze n = 5 ein: 4 · 5 + 2 = 22."
    },
    "prerequisite": ""
  },
  {
    "id": "6-01",
    "grade": 6,
    "category": "Zahlen & Algebra",
    "title": "Brüche verstehen",
    "description": "Anteil, Division und Verhältnis als Bruch.",
    "visual": {
      "type": "fraction",
      "n": 3,
      "d": 4
    },
    "steps": [
      {
        "title": "Ein Ganzes teilen",
        "formula": "3/4",
        "text": "Der Nenner 4 sagt: Das Ganze ist in vier gleich große Teile zerlegt. Der Zähler 3 sagt: Drei Teile werden betrachtet."
      },
      {
        "title": "Bruch als Zahl",
        "formula": "3/4 = 0,75",
        "text": "Auf dem Zahlenstrahl teilst du den Weg von 0 bis 1 in vier gleich lange Abschnitte und gehst drei davon."
      },
      {
        "title": "Bruch als Division",
        "formula": "3 : 4 = 3/4",
        "text": "Drei Pizzen für vier Personen ergeben für jede Person drei Viertel Pizza, wenn gerecht verteilt wird."
      },
      {
        "title": "Bruchteil einer Größe",
        "formula": "3/4 von 20 € = 20 : 4 · 3 = 15 €",
        "text": "Teile zuerst durch den Nenner, multipliziere danach mit dem Zähler."
      },
      {
        "title": "Gemischte Zahl und Ganzes",
        "formula": "7/4 = 1 3/4; 15 € : 3 · 4 = 20 €",
        "text": "Unechte Brüche können größer als 1 sein. Ist der Bruchteil bekannt, kehre die Rechenschritte um, um das Ganze zu bestimmen."
      }
    ],
    "rule": "Der Nenner nennt die Teilung, der Zähler die Anzahl gleich großer Teile.",
    "error": "Die Teile müssen gleich groß sein. Der Nenner darf nicht null sein.",
    "quiz": {
      "question": "Wie viel sind 3/5 von 40?",
      "answer": 24,
      "solution": "40 : 5 = 8. Drei solche Teile: 8 · 3 = 24."
    },
    "prerequisite": ""
  },
  {
    "id": "6-02",
    "grade": 6,
    "category": "Zahlen & Algebra",
    "title": "Erweitern, Kürzen und Vergleichen",
    "description": "Gleichwertige Brüche durch neue Einteilungen.",
    "visual": {
      "type": "fraction",
      "n": 2,
      "d": 3,
      "expand": 2
    },
    "steps": [
      {
        "title": "Gleicher Anteil",
        "formula": "2/3 = 4/6",
        "text": "Teilst du jedes Drittel in zwei Teile, werden aus drei Dritteln sechs Sechstel. Der markierte Anteil ändert sich nicht."
      },
      {
        "title": "Erweitern",
        "formula": "2/3 = (2 · 2)/(3 · 2) = 4/6",
        "text": "Multipliziere Zähler und Nenner mit derselben von null verschiedenen natürlichen Zahl."
      },
      {
        "title": "Kürzen",
        "formula": "12/18 = (12 : 6)/(18 : 6) = 2/3",
        "text": "Teile Zähler und Nenner durch denselben gemeinsamen Teiler. Mit dem ggT kürzt du in einem Schritt vollständig."
      },
      {
        "title": "Gleichnamig vergleichen",
        "formula": "2/3 = 8/12; 3/4 = 9/12",
        "text": "Mit demselben Nenner sind die Teile gleich groß. Nun entscheidet der Zähler: 8 < 9, also 2/3 < 3/4."
      },
      {
        "title": "Gemischte Zahlen",
        "formula": "1 2/3 = 5/3",
        "text": "Multipliziere den ganzzahligen Anteil mit dem Nenner und addiere den Zähler. Der Nenner bleibt erhalten."
      }
    ],
    "rule": "Erweitern und Kürzen verändern den Wert eines Bruchs nicht.",
    "error": "Man darf nicht Zähler und Nenner um dieselbe Zahl erhöhen.",
    "quiz": {
      "question": "Kürze 18/24 vollständig. Gib den Bruch ein.",
      "answer": "3/4",
      "solution": "ggT(18,24) = 6. Teile beide durch 6: 3/4."
    },
    "prerequisite": ""
  },
  {
    "id": "6-03",
    "grade": 6,
    "category": "Zahlen & Algebra",
    "title": "Brüche addieren und subtrahieren",
    "description": "Gleiche Teile schaffen, dann Zähler verrechnen.",
    "visual": {
      "type": "fractionSum",
      "a": 1,
      "b": 3,
      "c": 1,
      "d": 4
    },
    "steps": [
      {
        "title": "Warum gleiche Nenner?",
        "formula": "1/3 + 1/4",
        "text": "Drittel und Viertel sind unterschiedlich große Teile. Deshalb kann man die Zähler noch nicht direkt addieren."
      },
      {
        "title": "Gemeinsamen Nenner finden",
        "formula": "kgV(3,4) = 12",
        "text": "Eine Unterteilung in Zwölftel passt zu beiden Brüchen."
      },
      {
        "title": "Beide Brüche erweitern",
        "formula": "1/3 = 4/12; 1/4 = 3/12",
        "text": "Aus einem Drittel werden vier Zwölftel, aus einem Viertel drei Zwölftel."
      },
      {
        "title": "Zähler addieren",
        "formula": "4/12 + 3/12 = 7/12",
        "text": "Vier Teile und drei Teile ergeben sieben Teile derselben Größe. Der Nenner bleibt 12."
      },
      {
        "title": "Subtraktion und Probe",
        "formula": "3/4 − 1/3 = 9/12 − 4/12 = 5/12",
        "text": "Für das Subtrahieren gilt derselbe Weg. Kürze am Ende, falls möglich. Prüfe durch Addition."
      }
    ],
    "rule": "Erst gleichnamig machen, dann Zähler addieren oder subtrahieren.",
    "error": "1/3 + 1/4 ist nicht 2/7.",
    "quiz": {
      "question": "Berechne 1/2 + 1/3. Gib den gekürzten Bruch ein.",
      "answer": "5/6",
      "solution": "1/2 = 3/6 und 1/3 = 2/6. Zusammen 5/6."
    },
    "prerequisite": "Erweitern, Kürzen und Vergleichen"
  },
  {
    "id": "6-04",
    "grade": 6,
    "category": "Zahlen & Algebra",
    "title": "Dezimalzahlen und Brüche",
    "description": "Endliche und periodische Dezimalzahlen.",
    "visual": {
      "type": "place",
      "digits": "2,375"
    },
    "steps": [
      {
        "title": "Nach dem Komma",
        "formula": "2,375 = 2 + 3/10 + 7/100 + 5/1000",
        "text": "Nach den Einern kommen Zehntel, Hundertstel und Tausendstel. Jede Stelle rechts ist ein Zehntel ihrer linken Nachbarstelle."
      },
      {
        "title": "Bruch umwandeln",
        "formula": "3/8 = 3 : 8 = 0,375",
        "text": "Teile den Zähler durch den Nenner oder erweitere auf einen Zehnerpotenz-Nenner."
      },
      {
        "title": "Dezimalzahl als Bruch",
        "formula": "0,375 = 375/1000 = 3/8",
        "text": "Die Anzahl der Nachkommastellen bestimmt den Nenner. Kürze den Bruch danach."
      },
      {
        "title": "Periodische Zahlen",
        "formula": "1/3 = 0,333…; 1/6 = 0,1666…",
        "text": "Wenn bei der schriftlichen Division ein Rest wiederkehrt, wiederholen sich Ziffern. Diese Wiederholung heißt Periode."
      },
      {
        "title": "Vergleichen",
        "formula": "0,4 = 0,400 > 0,375",
        "text": "Ergänzte Nullen am Ende ändern den Wert nicht. Vergleiche stellenweise. Jeder vollständig gekürzte Bruch mit nur 2 und 5 als Nenner-Primfaktoren ist endlich."
      }
    ],
    "rule": "Eine endliche Dezimalzahl lässt sich als Bruch mit Nenner 10, 100, 1000, … schreiben.",
    "error": "0,25 ist größer als 0,2; die Zahl der Ziffern allein entscheidet nicht.",
    "quiz": {
      "question": "Schreibe 7/20 als Dezimalzahl.",
      "answer": 0.35,
      "solution": "7/20 = 35/100 = 0,35."
    },
    "prerequisite": ""
  },
  {
    "id": "6-05",
    "grade": 6,
    "category": "Zahlen & Algebra",
    "title": "Mit Dezimalzahlen rechnen",
    "description": "Komma und Stellenwerte bei allen vier Rechenarten.",
    "visual": {
      "type": "arithmetic"
    },
    "steps": [
      {
        "title": "Addieren und subtrahieren",
        "formula": "3,45 + 2,7 = 3,45 + 2,70",
        "text": "Schreibe die Kommas untereinander. Ergänze bei Bedarf Nullen und rechne wie mit natürlichen Zahlen."
      },
      {
        "title": "Addition",
        "formula": "3,45 + 2,70 = 6,15",
        "text": "Hundertstel: 5; Zehntel: 4 + 7 = 11, also 1 Zehntel und 1 Übertrag zu den Einern."
      },
      {
        "title": "Multiplizieren",
        "formula": "1,2 · 0,3",
        "text": "Zuerst 12 · 3 = 36. Beide Faktoren haben zusammen zwei Nachkommastellen, also ist das Ergebnis 0,36."
      },
      {
        "title": "Division vorbereiten",
        "formula": "4,8 : 0,6 = 48 : 6",
        "text": "Multipliziere Dividend und Divisor mit derselben Zehnerpotenz, bis der Divisor ganzzahlig ist. Der Quotient bleibt gleich."
      },
      {
        "title": "Dividieren und prüfen",
        "formula": "48 : 6 = 8",
        "text": "Probe: 8 · 0,6 = 4,8. Das Multiplizieren mit einer Zahl zwischen 0 und 1 verkleinert; das Dividieren durch sie vergrößert."
      }
    ],
    "rule": "Bei + und −: Komma unter Komma. Bei ·: Nachkommastellen zählen. Bei : beide Zahlen gleich verschieben.",
    "error": "Nur das Komma des Divisors zu verschieben verändert das Ergebnis.",
    "quiz": {
      "question": "Berechne 2,4 : 0,3.",
      "answer": 8,
      "solution": "Beide Zahlen mal 10: 24 : 3 = 8."
    },
    "prerequisite": ""
  },
  {
    "id": "6-06",
    "grade": 6,
    "category": "Zahlen & Algebra",
    "title": "Ganze Zahlen und Zahlengerade",
    "description": "Negative Zahlen, Gegenzahlen und Abstände.",
    "visual": {
      "type": "numberline",
      "start": -5,
      "end": 5,
      "value": -3
    },
    "steps": [
      {
        "title": "Zahlen unter null",
        "formula": "…, −3, −2, −1, 0, 1, 2, 3, …",
        "text": "Negative ganze Zahlen beschreiben etwa Temperaturen unter null oder Schulden."
      },
      {
        "title": "Anordnen",
        "formula": "−4 < −1 < 0 < 3",
        "text": "Auf der Zahlengeraden werden die Zahlen nach rechts größer. −4 ist kleiner als −1, obwohl 4 größer als 1 ist."
      },
      {
        "title": "Gegenzahl",
        "formula": "Gegenzahl von −3: +3",
        "text": "Eine Zahl und ihre Gegenzahl liegen gleich weit von null entfernt, auf entgegengesetzten Seiten."
      },
      {
        "title": "Betrag",
        "formula": "|−3| = 3",
        "text": "Der Betrag ist der Abstand zur null und deshalb nie negativ."
      },
      {
        "title": "Veränderung beschreiben",
        "formula": "−3 °C + 5 °C = 2 °C",
        "text": "Eine Erwärmung um 5 Grad bedeutet fünf Schritte nach rechts. Zustand und Veränderung sind verschiedene Dinge."
      }
    ],
    "rule": "Weiter rechts bedeutet größer; der Betrag ist der Abstand zu null.",
    "error": "−5 ist kleiner als −2.",
    "quiz": {
      "question": "Wie groß ist der Betrag von −8?",
      "answer": 8,
      "solution": "Der Abstand von −8 zur 0 beträgt 8 Einheiten."
    },
    "prerequisite": ""
  },
  {
    "id": "6-07",
    "grade": 6,
    "category": "Funktionen",
    "title": "Maßstab und Zuordnungen",
    "description": "Wirklichkeit und Zeichnung in Beziehung setzen.",
    "visual": {
      "type": "table",
      "rows": [
        [
          "Plan (cm)",
          "1",
          "2",
          "3"
        ],
        [
          "Real (m)",
          "2",
          "4",
          "6"
        ]
      ]
    },
    "steps": [
      {
        "title": "Maßstab verstehen",
        "formula": "1 : 200",
        "text": "Eine Längeneinheit auf dem Plan entspricht 200 gleichen Längeneinheiten in Wirklichkeit."
      },
      {
        "title": "Einheiten angleichen",
        "formula": "1 cm im Plan = 200 cm = 2 m real",
        "text": "Maßstäbe vergleichen immer dieselbe Einheit. Bei einer Verkleinerung ist die Zeichnung kleiner."
      },
      {
        "title": "Reale Länge bestimmen",
        "formula": "3 cm · 200 = 600 cm = 6 m",
        "text": "Vom Plan zur Wirklichkeit multiplizierst du mit der Maßstabszahl."
      },
      {
        "title": "Zeichnungslänge bestimmen",
        "formula": "10 m = 1000 cm; 1000 : 200 = 5 cm",
        "text": "In die andere Richtung dividierst du. Eine Tabelle zeigt passende Wertepaare."
      },
      {
        "title": "Zuordnung darstellen",
        "formula": "x → 2x",
        "text": "Bei diesem Plan gehören zu x Zentimetern 2x Meter. Dieselbe Beziehung kann als Text, Tabelle und Graph dargestellt werden."
      }
    ],
    "rule": "Maßstab = Zeichnungslänge : wirkliche Länge bei gleicher Einheit.",
    "error": "Ein Maßstab für Längen gilt nicht unverändert für Flächen.",
    "quiz": {
      "question": "Ein Plan hat Maßstab 1:100. Wie viele Meter sind 4 cm in Wirklichkeit?",
      "answer": 4,
      "solution": "4 · 100 = 400 cm = 4 m."
    },
    "prerequisite": ""
  },
  {
    "id": "6-08",
    "grade": 6,
    "category": "Geometrie",
    "title": "Winkel messen und zeichnen",
    "description": "Winkelarten und Umgang mit dem Geodreieck.",
    "visual": {
      "type": "angle",
      "degrees": 65
    },
    "steps": [
      {
        "title": "Winkel als Drehung",
        "formula": "α = 65°",
        "text": "Ein Winkel entsteht zwischen zwei Strahlen mit gemeinsamem Scheitel. Eine volle Drehung umfasst 360°."
      },
      {
        "title": "Geodreieck anlegen",
        "formula": "Nullpunkt auf Scheitel, Grundlinie auf Schenkel",
        "text": "Lege den Mittelpunkt der Messskala auf den Scheitel. Eine Nullrichtung muss auf dem ersten Schenkel liegen."
      },
      {
        "title": "Passende Skala lesen",
        "formula": "α = 65°",
        "text": "Lies die Skala ab, die am angelegten Schenkel bei 0° beginnt. Kontrolliere, ob das Ergebnis zur Form passt."
      },
      {
        "title": "Winkelarten",
        "formula": "spitz < 90°; recht = 90°; stumpf zwischen 90° und 180°",
        "text": "Ein gestreckter Winkel beträgt 180°. Überstumpfe Winkel liegen zwischen 180° und 360°."
      },
      {
        "title": "Zeichnen",
        "formula": "Grundstrahl → 65° markieren → zweiten Strahl ziehen",
        "text": "Für überstumpfe Winkel kannst du den Rest zur vollen Drehung verwenden. Ein 300°-Winkel ergänzt einen 60°-Winkel zu 360°."
      }
    ],
    "rule": "Erst grob schätzen, dann messen und mit der Schätzung vergleichen.",
    "error": "65° und 115° stehen oft auf zwei verschiedenen Skalen am selben Strich.",
    "quiz": {
      "question": "Ein Winkel misst 120°. Wie viel fehlt zu 180°?",
      "answer": 60,
      "solution": "180° − 120° = 60°."
    },
    "prerequisite": ""
  },
  {
    "id": "6-09",
    "grade": 6,
    "category": "Geometrie",
    "title": "Dreiecke und Vierecke",
    "description": "Figuren nach Seiten, Winkeln und Symmetrie einordnen.",
    "visual": {
      "type": "triangle",
      "a": 5,
      "b": 4,
      "c": 3
    },
    "steps": [
      {
        "title": "Dreiecke nach Seiten",
        "formula": "gleichseitig · gleichschenklig · ungleichseitig",
        "text": "Gleichseitig: drei gleich lange Seiten. Gleichschenklig: mindestens zwei. Gleich lange Seiten liegen gleichen Winkeln gegenüber."
      },
      {
        "title": "Dreiecke nach Winkeln",
        "formula": "spitzwinklig · rechtwinklig · stumpfwinklig",
        "text": "Ein rechtwinkliges Dreieck hat genau einen 90°-Winkel. Ein Dreieck kann nicht zwei rechte Winkel haben."
      },
      {
        "title": "Vierecke ordnen",
        "formula": "Quadrat ⊂ Rechteck ⊂ Parallelogramm",
        "text": "Ein Quadrat ist ein besonderes Rechteck. Ein Rechteck hat vier rechte Winkel, ein Parallelogramm zwei Paare paralleler Gegenseiten."
      },
      {
        "title": "Raute, Drachen, Trapez",
        "formula": "Raute: vier gleich lange Seiten",
        "text": "Ein Drachen hat zwei Paare benachbarter gleich langer Seiten. Hier nennen wir ein Viereck mit mindestens einem parallelen Seitenpaar Trapez."
      },
      {
        "title": "Umfang und rechtwinklige Dreiecksfläche",
        "formula": "U = a + b + c; A = a · b / 2",
        "text": "Bei der Flächenformel sind a und b die senkrechten Katheten. Ein solches Dreieck ist ein halbes Rechteck."
      }
    ],
    "rule": "Eigenschaften besonderer Figuren bauen aufeinander auf.",
    "error": "Nicht jedes gleichschenklige Dreieck ist gleichseitig.",
    "quiz": {
      "question": "Ein rechtwinkliges Dreieck hat Katheten 6 cm und 4 cm. Fläche in cm²?",
      "answer": 12,
      "solution": "Ein halbes Rechteck: 6 · 4 : 2 = 12 cm²."
    },
    "prerequisite": ""
  },
  {
    "id": "6-10",
    "grade": 6,
    "category": "Geometrie",
    "title": "Quader: Volumen und Oberfläche",
    "description": "Einheitswürfel zählen und Flächenpaare addieren.",
    "visual": {
      "type": "box",
      "a": 4,
      "b": 3,
      "h": 2
    },
    "steps": [
      {
        "title": "Volumen als Rauminhalt",
        "formula": "a = 4 cm; b = 3 cm; h = 2 cm",
        "text": "Das Volumen misst den Platz im Körper. Ein Einheitswürfel mit Kantenlänge 1 cm hat 1 cm³."
      },
      {
        "title": "Eine Schicht",
        "formula": "a · b = 4 · 3 = 12",
        "text": "Auf den Boden passen zwölf Einheitswürfel. In die Höhe passen zwei Schichten."
      },
      {
        "title": "Volumen",
        "formula": "V = a · b · h = 4 · 3 · 2 = 24 cm³",
        "text": "Beim Würfel sind alle Kanten gleich: V = a³."
      },
      {
        "title": "Oberfläche",
        "formula": "O = 2ab + 2ah + 2bh = 24 + 16 + 12 = 52 cm²",
        "text": "Addiere die sechs Außenflächen. Gegenüberliegende Flächen sind gleich groß."
      },
      {
        "title": "Einheiten",
        "formula": "1 dm³ = 1 l; 1 cm³ = 1 ml",
        "text": "1 m³ = 1000 dm³. Bei Raumeinheiten ist jeder benachbarte metrische Schritt ein Faktor 1000."
      }
    ],
    "rule": "Quader: V = abh und O = 2(ab + ah + bh).",
    "error": "Oberfläche wird in Quadrateinheiten, Volumen in Kubikeinheiten angegeben.",
    "quiz": {
      "question": "Ein Würfel hat Kantenlänge 3 cm. Volumen in cm³?",
      "answer": 27,
      "solution": "V = 3 · 3 · 3 = 27 cm³."
    },
    "prerequisite": ""
  },
  {
    "id": "6-11",
    "grade": 6,
    "category": "Geometrie",
    "title": "Zusammengesetzte Flächen",
    "description": "Zerlegen, ergänzen und fehlende Längen finden.",
    "visual": {
      "type": "composite"
    },
    "steps": [
      {
        "title": "Figur in Teile zerlegen",
        "formula": "L-Form = großes Rechteck − Ausschnitt",
        "text": "Suche bekannte Figuren: Rechtecke und rechtwinklige Dreiecke. Mehrere Zerlegungen können richtig sein."
      },
      {
        "title": "Gesamtfläche",
        "formula": "A₁ = 8 · 6 = 48 cm²",
        "text": "Ergänze die L-Form zu einem vollständigen Rechteck mit Länge 8 cm und Höhe 6 cm."
      },
      {
        "title": "Ausschnitt",
        "formula": "A₂ = 3 · 2 = 6 cm²",
        "text": "Der fehlende Ausschnitt rechts oben ist ein Rechteck. Seine Seiten musst du aus Angaben oder Differenzen bestimmen."
      },
      {
        "title": "Abziehen",
        "formula": "A = 48 − 6 = 42 cm²",
        "text": "Subtrahiere nur den fehlenden Teil. Alternativ kannst du die verbleibenden Teilflächen addieren."
      },
      {
        "title": "Umfang getrennt bestimmen",
        "formula": "U = 8 + 4 + 3 + 2 + 5 + 6 = 28 cm",
        "text": "Gehe einmal um den äußeren Rand, einschließlich der Einbuchtung. Innere Hilfslinien zählen nicht."
      }
    ],
    "rule": "Flächen kannst du addieren oder ergänzen und abziehen; der Umfang folgt dem Rand.",
    "error": "Umfänge von Teilfiguren einfach zu addieren zählt gemeinsame Innenkanten doppelt.",
    "quiz": {
      "question": "Ein Rechteck mit 50 cm² hat einen Ausschnitt von 12 cm². Restfläche in cm²?",
      "answer": 38,
      "solution": "50 − 12 = 38 cm²."
    },
    "prerequisite": ""
  },
  {
    "id": "6-12",
    "grade": 6,
    "category": "Daten & Zufall",
    "title": "Mittelwert, Median und Spannweite",
    "description": "Daten mit passenden Kennzahlen beschreiben.",
    "visual": {
      "type": "data",
      "values": [
        2,
        3,
        3,
        4,
        8
      ]
    },
    "steps": [
      {
        "title": "Daten sortieren",
        "formula": "2, 3, 3, 4, 8",
        "text": "Sortieren ist für Median, Minimum und Maximum wichtig. Hier gibt es fünf Werte."
      },
      {
        "title": "Arithmetisches Mittel",
        "formula": "(2 + 3 + 3 + 4 + 8) : 5 = 4",
        "text": "Addiere alle Werte und teile durch ihre Anzahl. So entsteht ein rechnerischer Ausgleich."
      },
      {
        "title": "Median",
        "formula": "2, 3, [3], 4, 8 → Median = 3",
        "text": "Der Median ist der mittlere Wert der sortierten Liste. Bei gerader Anzahl nimmt man den Mittelwert der beiden mittleren Werte."
      },
      {
        "title": "Minimum, Maximum, Spannweite",
        "formula": "min = 2; max = 8; Spannweite = 8 − 2 = 6",
        "text": "Die Spannweite zeigt den Abstand zwischen kleinstem und größtem Wert."
      },
      {
        "title": "Ausreißer vergleichen",
        "formula": "2, 3, 3, 4, 80 → Mittel = 18,4; Median = 3",
        "text": "Ein extremer Wert verändert das Mittel stark. Der Median bleibt in diesem Beispiel gleich. Welche Kennzahl sinnvoll ist, hängt von der Frage ab."
      }
    ],
    "rule": "Mittelwert = Summe : Anzahl; Median = Mitte der sortierten Daten.",
    "error": "Der Median ist nicht automatisch der Mittelwert von Minimum und Maximum.",
    "quiz": {
      "question": "Bestimme den Median von 2, 5, 7, 10.",
      "answer": 6,
      "solution": "Die mittleren Werte sind 5 und 7. (5 + 7) : 2 = 6."
    },
    "prerequisite": ""
  },
  {
    "id": "6-13",
    "grade": 6,
    "category": "Daten & Zufall",
    "title": "Relative Häufigkeit und Kreisdiagramme",
    "description": "Anzahlen als Bruch, Prozent und Kreisausschnitt.",
    "visual": {
      "type": "fraction",
      "n": 3,
      "d": 10
    },
    "steps": [
      {
        "title": "Anzahl und Anteil",
        "formula": "3 von 10 Kindern wählen Fußball",
        "text": "Die absolute Häufigkeit ist 3. Für den Anteil brauchst du außerdem die Gesamtzahl 10."
      },
      {
        "title": "Relative Häufigkeit",
        "formula": "h = 3/10 = 0,3",
        "text": "Teile die absolute Häufigkeit durch die Gesamtzahl. Alle relativen Häufigkeiten zusammen ergeben 1."
      },
      {
        "title": "Prozente",
        "formula": "0,3 = 30 %",
        "text": "Prozent bedeutet von hundert. 3 von 10 entspricht 30 von 100."
      },
      {
        "title": "Kreiswinkel",
        "formula": "α = 0,3 · 360° = 108°",
        "text": "Ein ganzer Kreis steht für alle Befragten. Der Winkel des Ausschnitts ist proportional zum Anteil."
      },
      {
        "title": "Darstellung wählen",
        "formula": "30 % + 70 % = 100 %",
        "text": "Kreisdiagramme zeigen Teile eines Ganzen. Säulendiagramme eignen sich oft besser zum genauen Vergleichen mehrerer kleiner Unterschiede."
      }
    ],
    "rule": "Relative Häufigkeit = absolute Häufigkeit : Gesamtzahl.",
    "error": "30 % von 10 sind 3, nicht 30 Kinder.",
    "quiz": {
      "question": "6 von 24 Kindern fahren Rad. Wie viel Prozent sind das?",
      "answer": 25,
      "solution": "6 : 24 = 0,25 = 25 %."
    },
    "prerequisite": ""
  },
  {
    "id": "7-01",
    "grade": 7,
    "category": "Zahlen & Algebra",
    "title": "Brüche multiplizieren und dividieren",
    "description": "Anteile von Anteilen und der Kehrwert.",
    "visual": {
      "type": "fractionProduct",
      "n": 2,
      "d": 3,
      "m": 3,
      "e": 4
    },
    "steps": [
      {
        "title": "Anteil eines Anteils",
        "formula": "2/3 von 3/4",
        "text": "Teile ein Rechteck zuerst in vier Spalten und markiere drei. Von diesem Bereich nimmst du zwei von drei Reihen."
      },
      {
        "title": "Zähler mal Zähler",
        "formula": "2/3 · 3/4 = 6/12 = 1/2",
        "text": "Das Gitter hat zwölf gleich große Felder; sechs gehören zum gemeinsamen Anteil. Multipliziere beide Zähler und beide Nenner."
      },
      {
        "title": "Vorher kürzen",
        "formula": "2/3 · 3/4 = 1/1 · 1/2 = 1/2",
        "text": "Gemeinsame Faktoren im gesamten Produkt dürfen vor dem Multiplizieren gekürzt werden."
      },
      {
        "title": "Dividieren als Aufteilen",
        "formula": "3/4 : 1/8 = 6",
        "text": "Wie oft passt ein Achtel in drei Viertel? Drei Viertel sind sechs Achtel."
      },
      {
        "title": "Kehrwertregel",
        "formula": "a/b : c/d = a/b · d/c",
        "text": "Durch einen Bruch dividieren heißt mit seinem Kehrwert multiplizieren. Der Divisor darf nicht null sein. Gemischte Zahlen zuerst in unechte Brüche umwandeln."
      }
    ],
    "rule": "Brüche multiplizieren: Zähler mal Zähler, Nenner mal Nenner; dividieren: mal Kehrwert.",
    "error": "Beim Dividieren nur den zweiten Bruch umdrehen.",
    "quiz": {
      "question": "Berechne 2/3 : 4/5. Gekürzter Bruch?",
      "answer": "5/6",
      "solution": "2/3 · 5/4 = 10/12 = 5/6."
    },
    "prerequisite": "Brüche verstehen"
  },
  {
    "id": "7-02",
    "grade": 7,
    "category": "Zahlen & Algebra",
    "title": "Rationale Zahlen addieren und subtrahieren",
    "description": "Vorzeichen als Bewegung auf der Zahlengeraden.",
    "visual": {
      "type": "numberline",
      "start": -6,
      "end": 6,
      "value": -3,
      "to": 2
    },
    "steps": [
      {
        "title": "Rationale Zahlen",
        "formula": "−3; 2,5; −1/2; 0",
        "text": "Alle Zahlen, die als Bruch ganzer Zahlen mit Nenner ungleich null darstellbar sind, heißen rational."
      },
      {
        "title": "Addieren heißt verschieben",
        "formula": "−3 + 5 = 2",
        "text": "Starte bei −3. Eine positive Zahl bewegt nach rechts, eine negative nach links."
      },
      {
        "title": "Gleiche Vorzeichen",
        "formula": "−3 + (−5) = −8",
        "text": "Addiere die Beträge und behalte das gemeinsame Vorzeichen."
      },
      {
        "title": "Verschiedene Vorzeichen",
        "formula": "−7 + 4 = −3",
        "text": "Subtrahiere den kleineren Betrag vom größeren. Das Ergebnis hat das Vorzeichen der Zahl mit dem größeren Betrag."
      },
      {
        "title": "Subtraktion umwandeln",
        "formula": "2 − (−3) = 2 + 3 = 5",
        "text": "Eine Zahl zu subtrahieren bedeutet, ihre Gegenzahl zu addieren. Klammern helfen, Rechenzeichen und Vorzeichen auseinanderzuhalten."
      }
    ],
    "rule": "a − b = a + (−b).",
    "error": "Zwei Minuszeichen bedeuten nur beim Subtrahieren einer negativen Zahl hier ein Plus.",
    "quiz": {
      "question": "Berechne −4 − (−9).",
      "answer": 5,
      "solution": "Die Gegenzahl von −9 ist +9: −4 + 9 = 5."
    },
    "prerequisite": ""
  },
  {
    "id": "7-03",
    "grade": 7,
    "category": "Zahlen & Algebra",
    "title": "Rationale Zahlen multiplizieren und dividieren",
    "description": "Vorzeichenregeln begründen und anwenden.",
    "visual": {
      "type": "equation"
    },
    "steps": [
      {
        "title": "Positiver Faktor",
        "formula": "3 · (−4) = −12",
        "text": "Drei Schuldenbeträge von je 4 ergeben insgesamt −12. Verschiedene Vorzeichen ergeben ein negatives Produkt."
      },
      {
        "title": "Warum minus mal minus plus?",
        "formula": "0 = (−3) · (4 + (−4))",
        "text": "Verteile: 0 = −12 + (−3) · (−4). Damit die Summe null ist, muss das zweite Produkt +12 sein."
      },
      {
        "title": "Vorzeichenregel",
        "formula": "(+) · (+) = (+); (−) · (−) = (+)",
        "text": "Gleiche Vorzeichen ergeben plus; verschiedene ergeben minus. Dieselben Regeln gelten für die Division."
      },
      {
        "title": "Mehrere Faktoren",
        "formula": "(−2) · (−3) · (−4) = −24",
        "text": "Eine gerade Anzahl negativer Faktoren ergibt ein positives Produkt, eine ungerade ein negatives. Ein Nullfaktor macht das ganze Produkt null."
      },
      {
        "title": "Potenzen und Klammern",
        "formula": "(−3)² = 9; −3² = −9",
        "text": "Bei (−3)² gehört das Minus zur Basis. Ohne Klammer wird erst 3² berechnet und dann das Minus angewendet."
      }
    ],
    "rule": "Bei Produkten und Quotienten: gleiche Vorzeichen plus, verschiedene minus.",
    "error": "Durch 0 darfst du nicht teilen. 0 : 5 ist hingegen 0.",
    "quiz": {
      "question": "Berechne (−6) · (−4).",
      "answer": 24,
      "solution": "Zwei negative Faktoren ergeben ein positives Produkt: 6 · 4 = 24."
    },
    "prerequisite": ""
  },
  {
    "id": "7-04",
    "grade": 7,
    "category": "Funktionen",
    "title": "Proportionale Zuordnungen und Dreisatz",
    "description": "Gleicher Quotient, gleiche Verhältnisse.",
    "visual": {
      "type": "graph",
      "kind": "linear",
      "m": 2,
      "b": 0
    },
    "steps": [
      {
        "title": "Eine proportionale Situation",
        "formula": "1 Heft: 2 €; 3 Hefte: 6 €",
        "text": "Bei gleichem Stückpreis bedeutet die doppelte Menge den doppelten Preis."
      },
      {
        "title": "Konstanter Quotient",
        "formula": "y/x = 2",
        "text": "Preis geteilt durch Anzahl ist immer 2, solange x ungleich null. Dieser Quotient heißt Proportionalitätsfaktor k."
      },
      {
        "title": "Term und Graph",
        "formula": "y = 2x",
        "text": "Der Graph ist eine Gerade durch den Ursprung. Jedem x-Wert wird genau ein y-Wert zugeordnet."
      },
      {
        "title": "Dreisatz",
        "formula": "3 Hefte → 6 €; 1 Heft → 2 €; 5 Hefte → 10 €",
        "text": "Teile zunächst auf eine Einheit zurück und multipliziere dann auf die gesuchte Menge."
      },
      {
        "title": "Proportionalität prüfen",
        "formula": "Taxi: 4 € Grundpreis + 2 € je km",
        "text": "Eine Grundgebühr zerstört die Proportionalität: Bei null Kilometern kostet es schon 4 €. Nicht jede steigende Zuordnung ist proportional."
      }
    ],
    "rule": "Proportional: y = kx, also y/x = k; der Graph geht durch (0|0).",
    "error": "Doppelt so viel führt nur bei proportionaler Zuordnung zum doppelten Ergebnis.",
    "quiz": {
      "question": "4 kg kosten 12 €. Wie viel kosten 7 kg beim gleichen Kilopreis?",
      "answer": 21,
      "solution": "1 kg kostet 12 : 4 = 3 €. 7 · 3 = 21 €."
    },
    "prerequisite": ""
  },
  {
    "id": "7-05",
    "grade": 7,
    "category": "Funktionen",
    "title": "Antiproportionale Zuordnungen",
    "description": "Gleiches Produkt und der umgekehrte Dreisatz.",
    "visual": {
      "type": "graph",
      "kind": "inverse",
      "k": 12
    },
    "steps": [
      {
        "title": "Feste Arbeit",
        "formula": "2 Pumpen brauchen 6 Stunden",
        "text": "Gleich leistungsfähige Pumpen teilen sich dieselbe Arbeit. Voraussetzung: Sie können wirklich gleichzeitig arbeiten."
      },
      {
        "title": "Doppelte Zahl, halbe Zeit",
        "formula": "4 Pumpen brauchen 3 Stunden",
        "text": "Wird eine Größe verdoppelt, halbiert sich die andere. Nicht die Differenz, sondern das Produkt bleibt gleich."
      },
      {
        "title": "Konstantes Produkt",
        "formula": "x · y = 12; y = 12/x",
        "text": "Pumpenanzahl mal Stunden ergibt 12 Pumpenstunden. x darf nicht null sein."
      },
      {
        "title": "Dreisatz",
        "formula": "2 → 6 h; 1 → 12 h; 3 → 4 h",
        "text": "Weniger Pumpen brauchen mehr Zeit. Beim Zurückrechnen auf 1 wird die Zeit mit 2 multipliziert."
      },
      {
        "title": "Graph und Grenzen",
        "formula": "Hyperbel für x > 0",
        "text": "Der Graph ist keine Gerade. In Wirklichkeit sind Pumpen ganzzahlig, und Engpässe können die Modellannahme ungültig machen."
      }
    ],
    "rule": "Antiproportional: xy = k; mehr von der einen Größe bedeutet entsprechend weniger von der anderen.",
    "error": "Nicht jede fallende Zuordnung ist antiproportional. Prüfe das Produkt.",
    "quiz": {
      "question": "3 gleich schnelle Arbeiter brauchen 8 Stunden. Wie lange brauchen 6 Arbeiter?",
      "answer": 4,
      "solution": "Die Arbeit beträgt 3 · 8 = 24 Arbeiterstunden. 24 : 6 = 4 Stunden."
    },
    "prerequisite": ""
  },
  {
    "id": "7-06",
    "grade": 7,
    "category": "Funktionen",
    "title": "Prozentrechnung: G, W und p",
    "description": "Grundwert, Prozentwert und Prozentsatz bestimmen.",
    "visual": {
      "type": "percent",
      "n": 30
    },
    "steps": [
      {
        "title": "Begriffe unterscheiden",
        "formula": "30 % von 80 €",
        "text": "80 € ist das Ganze, also Grundwert G. 30 % ist der Prozentsatz p %. Der gesuchte Anteil heißt Prozentwert W."
      },
      {
        "title": "Prozent als Bruch",
        "formula": "30 % = 30/100 = 0,30",
        "text": "Von hundert hilft beim Übersetzen in eine Multiplikation."
      },
      {
        "title": "Prozentwert",
        "formula": "W = G · p/100 = 80 · 0,30 = 24 €",
        "text": "Multipliziere den Grundwert mit dem Dezimalfaktor."
      },
      {
        "title": "Prozentsatz",
        "formula": "p = 100 · W/G = 100 · 24/80 = 30",
        "text": "Wenn Teil und Ganzes bekannt sind, teilst du den Teil durch das Ganze und wandelst in Prozent um."
      },
      {
        "title": "Grundwert",
        "formula": "G = W : (p/100) = 24 : 0,30 = 80 €",
        "text": "Ist der Anteil gegeben, kehrst du die Multiplikation um. Benenne vor jeder Rechnung, welche Größe gesucht ist."
      }
    ],
    "rule": "W = G · p/100; p = 100W/G; G = W : (p/100).",
    "error": "Der Grundwert ist das Bezugs-Ganze und nicht automatisch die größere der genannten Zahlen.",
    "quiz": {
      "question": "Wie viel sind 15 % von 200?",
      "answer": 30,
      "solution": "200 · 15/100 = 30."
    },
    "prerequisite": ""
  },
  {
    "id": "7-07",
    "grade": 7,
    "category": "Funktionen",
    "title": "Rabatt, Erhöhung und Prozentpunkte",
    "description": "Prozentuale Veränderungen mit Faktoren rechnen.",
    "visual": {
      "type": "percent",
      "n": 20
    },
    "steps": [
      {
        "title": "Rabatt",
        "formula": "80 € mit 20 % Rabatt",
        "text": "20 % werden abgezogen. Es bleiben 100 % − 20 % = 80 % des ursprünglichen Preises."
      },
      {
        "title": "Verminderungsfaktor",
        "formula": "80 · 0,80 = 64 €",
        "text": "Der Faktor lautet 1 − p/100. Hier ist 64 € der neue Preis."
      },
      {
        "title": "Erhöhung",
        "formula": "80 · 1,20 = 96 €",
        "text": "Bei einer Erhöhung um 20 % ist der Faktor 1 + 20/100 = 1,20."
      },
      {
        "title": "Rückwärts rechnen",
        "formula": "64 : 0,80 = 80 €",
        "text": "Um aus dem reduzierten Preis den alten Preis zu ermitteln, teile durch den Änderungsfaktor."
      },
      {
        "title": "Mehrere Änderungen",
        "formula": "1,20 · 0,80 = 0,96",
        "text": "Erst +20 %, dann −20 % ergibt insgesamt −4 %, weil sich der zweite Prozentsatz auf einen anderen Grundwert bezieht."
      },
      {
        "title": "Prozentpunkte",
        "formula": "von 20 % auf 30 %: +10 Prozentpunkte",
        "text": "Der relative Anstieg beträgt 10/20 = 50 %. Prozentpunkte messen die Differenz zweier Prozentsätze."
      }
    ],
    "rule": "Neuer Wert = alter Wert · (1 ± p/100).",
    "error": "20 % Rabatt wird nicht durch 20 % Aufschlag rückgängig gemacht.",
    "quiz": {
      "question": "100 € werden erst um 10 % erhöht und dann um 10 % gesenkt. Neuer Preis?",
      "answer": 99,
      "solution": "100 · 1,10 · 0,90 = 99 €."
    },
    "prerequisite": ""
  },
  {
    "id": "7-08",
    "grade": 7,
    "category": "Zahlen & Algebra",
    "title": "Terme und Variablen",
    "description": "Rechenvorschriften aufstellen und zusammenfassen.",
    "visual": {
      "type": "algebraTiles"
    },
    "steps": [
      {
        "title": "Variable als Platzhalter",
        "formula": "3x + 2",
        "text": "x kann verschiedene Zahlen annehmen. 3x bedeutet dreimal x. Ein Term ist ein Rechenausdruck ohne Gleichheitsbehauptung."
      },
      {
        "title": "Aus Text wird Term",
        "formula": "3 Hefte zu x € plus 2 € Versand: 3x + 2",
        "text": "Benenne die Bedeutung und Einheit der Variablen. Einsetzen liefert den Gesamtpreis."
      },
      {
        "title": "Gleichartige Terme",
        "formula": "3x + 2x = 5x",
        "text": "Drei x-Pakete und zwei x-Pakete sind fünf x-Pakete. Die Koeffizienten werden addiert."
      },
      {
        "title": "Nicht gleichartig",
        "formula": "3x + 2 ≠ 5x",
        "text": "x-Terme und reine Zahlen sind verschiedene Bausteine und können nicht zu einem einzigen x-Term addiert werden."
      },
      {
        "title": "Einsetzen und prüfen",
        "formula": "x = 4: 3x + 2 = 3 · 4 + 2 = 14",
        "text": "Setze bei negativen Zahlen Klammern. Zwei äquivalente Terme haben für alle zulässigen eingesetzten Werte denselben Wert."
      }
    ],
    "rule": "Nur gleichartige Terme lassen sich durch Addition ihrer Koeffizienten zusammenfassen.",
    "error": "x · x = x², aber x + x = 2x.",
    "quiz": {
      "question": "Wie groß ist 5x − 2 für x = 3?",
      "answer": 13,
      "solution": "5 · 3 − 2 = 15 − 2 = 13."
    },
    "prerequisite": ""
  },
  {
    "id": "7-09",
    "grade": 7,
    "category": "Zahlen & Algebra",
    "title": "Lineare Gleichungen",
    "description": "Auf beiden Seiten dasselbe tun und die Probe machen.",
    "visual": {
      "type": "balance"
    },
    "steps": [
      {
        "title": "Gleichheit als Waage",
        "formula": "3x + 5 = 20",
        "text": "Die linke und rechte Seite haben denselben Wert. Gesucht ist eine Zahl, die die Aussage wahr macht."
      },
      {
        "title": "Auf beiden Seiten minus 5",
        "formula": "3x + 5 − 5 = 20 − 5",
        "text": "Dieselbe Umkehroperation erhält die Gleichheit. Schreibe die Veränderung für beide Seiten."
      },
      {
        "title": "Vereinfachen",
        "formula": "3x = 15",
        "text": "Nun stehen links nur noch drei gleiche x-Pakete."
      },
      {
        "title": "Beide Seiten durch 3",
        "formula": "x = 15 : 3 = 5",
        "text": "Teilen ist eine Äquivalenzumformung, wenn der Divisor nicht null ist."
      },
      {
        "title": "Probe in der Ausgangsgleichung",
        "formula": "3 · 5 + 5 = 20 ✓",
        "text": "Links ergibt sich 20, rechts steht 20. Die Lösungsmenge lautet L = {5}."
      },
      {
        "title": "Sonderfälle",
        "formula": "x + 2 = x + 3 → 2 = 3",
        "text": "Eine falsche Aussage ergibt keine Lösung. Bei x + 2 = x + 2 ist jede reelle Zahl eine Lösung."
      }
    ],
    "rule": "Eine Gleichung bleibt gleichwertig, wenn du beide Seiten passend gleich veränderst.",
    "error": "Ein Vorzeichenwechsel entsteht durch eine Operation, nicht durch magisches Verschieben.",
    "quiz": {
      "question": "Löse 4x + 3 = 19. x = ?",
      "answer": 4,
      "solution": "Beide Seiten −3: 4x = 16. Beide Seiten :4: x = 4. Probe: 16 + 3 = 19."
    },
    "prerequisite": ""
  },
  {
    "id": "7-10",
    "grade": 7,
    "category": "Geometrie",
    "title": "Winkelsätze und Innenwinkelsumme",
    "description": "Unbekannte Winkel mit begründeten Beziehungen finden.",
    "visual": {
      "type": "angles"
    },
    "steps": [
      {
        "title": "Nebenwinkel",
        "formula": "α + β = 180°",
        "text": "Zwei aneinanderliegende Winkel an einer Geraden ergänzen sich zu einem gestreckten Winkel."
      },
      {
        "title": "Scheitelwinkel",
        "formula": "α = γ",
        "text": "Gegenüberliegende Winkel an zwei sich schneidenden Geraden sind gleich groß. Das folgt zweimal aus der Nebenwinkelbeziehung."
      },
      {
        "title": "Parallelen schneiden",
        "formula": "Stufenwinkel gleich; Wechselwinkel gleich",
        "text": "Diese Gleichheiten gelten, wenn die beiden geschnittenen Geraden parallel sind."
      },
      {
        "title": "Dreiecksbeweis",
        "formula": "α + β + γ = 180°",
        "text": "Zeichne durch einen Eckpunkt eine Parallele zur Gegenseite. Wechselwinkel bringen die drei Innenwinkel nebeneinander an eine Gerade."
      },
      {
        "title": "Anwenden",
        "formula": "α = 55°, β = 65° → γ = 60°",
        "text": "180° − 55° − 65° = 60°. Ein Viereck lässt sich durch eine Diagonale in zwei Dreiecke zerlegen und hat 360° Innenwinkelsumme."
      }
    ],
    "rule": "Dreieck: 180°; Viereck: 360°; Winkelbeziehungen immer begründen.",
    "error": "Stufen- und Wechselwinkel sind nur bei parallelen Geraden zwangsläufig gleich.",
    "quiz": {
      "question": "Ein Dreieck hat Winkel 40° und 65°. Dritter Winkel?",
      "answer": 75,
      "solution": "180° − 40° − 65° = 75°."
    },
    "prerequisite": ""
  },
  {
    "id": "7-11",
    "grade": 7,
    "category": "Geometrie",
    "title": "Dreiecke konstruieren und Kongruenz",
    "description": "SSS, SWS, WSW und der besondere SsW-Fall.",
    "visual": {
      "type": "construction"
    },
    "steps": [
      {
        "title": "Kongruenz",
        "formula": "Deckungsgleiche Dreiecke",
        "text": "Zwei Dreiecke sind kongruent, wenn entsprechende Seiten und Winkel übereinstimmen. Spiegelbilder zählen als kongruent."
      },
      {
        "title": "SSS konstruieren",
        "formula": "a = 4 cm, b = 5 cm, c = 6 cm",
        "text": "Zeichne AB = 6 cm. Zeichne um A einen Kreis mit Radius 5 cm und um B einen mit Radius 4 cm. Ihr Schnitt liefert C."
      },
      {
        "title": "Dreiecksungleichung",
        "formula": "4 + 5 > 6",
        "text": "Jede Seite muss kürzer als die Summe der beiden anderen sein. Sonst schneiden sich die Kreise nicht passend oder das Dreieck ist entartet."
      },
      {
        "title": "SWS und WSW",
        "formula": "zwei Seiten und eingeschlossener Winkel",
        "text": "SWS liefert Eindeutigkeit. Bei WSW sind eine Seite und ihre beiden anliegenden Winkel gegeben; der dritte Winkel folgt aus 180°."
      },
      {
        "title": "SsW richtig unterscheiden",
        "formula": "Winkel gegenüber der längeren gegebenen Seite",
        "text": "Dieser SsW-Fall ist eindeutig. Liegt der Winkel der kürzeren Seite gegenüber, können zwei verschiedene Dreiecke entstehen."
      }
    ],
    "rule": "SSS, SWS, WSW und SsW mit Winkel gegenüber der längeren Seite sichern Kongruenz.",
    "error": "Zwei Seiten und irgendein Winkel reichen nicht immer für Eindeutigkeit.",
    "quiz": {
      "question": "Zwei Winkel eines Dreiecks sind 50° und 70°. Dritter Winkel?",
      "answer": 60,
      "solution": "180° − 50° − 70° = 60°. Die Winkel allein bestimmen die Größe des Dreiecks noch nicht."
    },
    "prerequisite": ""
  },
  {
    "id": "7-12",
    "grade": 7,
    "category": "Geometrie",
    "title": "Dreieck, Parallelogramm und Trapez",
    "description": "Flächenformeln durch Zerlegen herleiten.",
    "visual": {
      "type": "triangleArea"
    },
    "steps": [
      {
        "title": "Parallelogramm umlegen",
        "formula": "A = g · h",
        "text": "Schneide das seitliche Dreieck ab und schiebe es auf die andere Seite. Es entsteht ein Rechteck mit Grundseite g und senkrechter Höhe h."
      },
      {
        "title": "Dreieck verdoppeln",
        "formula": "2A = g · h",
        "text": "Ein zweites, gedrehtes Dreieck ergänzt das erste zu einem Parallelogramm."
      },
      {
        "title": "Dreiecksfläche",
        "formula": "A = g · h / 2",
        "text": "Die Höhe steht senkrecht auf der Grundseite oder ihrer Verlängerung. Sie kann außerhalb des Dreiecks liegen."
      },
      {
        "title": "Trapez verdoppeln",
        "formula": "2A = (a + c) · h",
        "text": "Zwei passende Trapeze bilden ein Parallelogramm. a und c sind die parallelen Seiten."
      },
      {
        "title": "Trapezformel anwenden",
        "formula": "A = (a + c) · h / 2",
        "text": "Bei a = 8 cm, c = 4 cm und h = 3 cm ergibt sich A = 12 · 3 : 2 = 18 cm². Beim Umfang addierst du hingegen alle vier Seiten."
      }
    ],
    "rule": "Parallelogramm gh; Dreieck gh/2; Trapez (a + c)h/2.",
    "error": "Die Höhe ist keine beliebige schräge Seitenlänge.",
    "quiz": {
      "question": "Dreieck: g = 9 cm, h = 4 cm. Fläche in cm²?",
      "answer": 18,
      "solution": "9 · 4 : 2 = 18 cm²."
    },
    "prerequisite": ""
  },
  {
    "id": "7-13",
    "grade": 7,
    "category": "Daten & Zufall",
    "title": "Zufall und Laplace-Wahrscheinlichkeit",
    "description": "Ergebnis, Ereignis und günstige Möglichkeiten.",
    "visual": {
      "type": "dice"
    },
    "steps": [
      {
        "title": "Ergebnisse sammeln",
        "formula": "Ω = {1,2,3,4,5,6}",
        "text": "Bei einem Würfelwurf ist eine einzelne Augenzahl ein Ergebnis. Ω ist die Menge aller möglichen Ergebnisse."
      },
      {
        "title": "Ereignis bilden",
        "formula": "A = gerade Zahl = {2,4,6}",
        "text": "Ein Ereignis enthält ein oder mehrere Ergebnisse. Es tritt ein, wenn das gewürfelte Ergebnis dazu gehört."
      },
      {
        "title": "Gleich wahrscheinlich?",
        "formula": "Fairer Würfel: jedes Ergebnis 1/6",
        "text": "Nur wenn alle elementaren Ergebnisse gleich wahrscheinlich sind, gilt die Laplace-Regel."
      },
      {
        "title": "Laplace-Regel",
        "formula": "P(A) = 3/6 = 1/2",
        "text": "Zähle günstige und alle möglichen gleich wahrscheinlichen Ergebnisse."
      },
      {
        "title": "Gegenereignis",
        "formula": "P(nicht A) = 1 − P(A) = 1/2",
        "text": "Sicheres Ereignis: Wahrscheinlichkeit 1. Unmögliches Ereignis: 0. Ein gezinkter Würfel ist kein Laplace-Modell."
      }
    ],
    "rule": "Bei Laplace: P(A) = günstige Ergebnisse / alle möglichen Ergebnisse.",
    "error": "Wahrscheinlichkeit ist eine Modellangabe, keine Vorhersage des nächsten einzelnen Wurfs.",
    "quiz": {
      "question": "Ein fairer Würfel: Wie groß ist P(Zahl größer als 4)? Bruch?",
      "answer": "1/3",
      "solution": "Günstig sind 5 und 6: 2/6 = 1/3."
    },
    "prerequisite": ""
  },
  {
    "id": "8-01",
    "grade": 8,
    "category": "Zahlen & Algebra",
    "title": "Klammern auflösen und ausklammern",
    "description": "Distributivgesetz für Terme und negative Faktoren.",
    "visual": {
      "type": "algebraTiles"
    },
    "steps": [
      {
        "title": "Ausmultiplizieren",
        "formula": "3(x + 4) = 3x + 12",
        "text": "Der Faktor vor der Klammer wird mit jedem Summanden in der Klammer multipliziert."
      },
      {
        "title": "Minusklammer",
        "formula": "−(2x − 5) = −2x + 5",
        "text": "Die unsichtbare −1 verändert beide Vorzeichen."
      },
      {
        "title": "Zwei Klammern",
        "formula": "(x + 2)(x + 3) = x² + 3x + 2x + 6",
        "text": "Jeder Summand der ersten Klammer multipliziert jeden der zweiten."
      },
      {
        "title": "Zusammenfassen",
        "formula": "x² + 3x + 2x + 6 = x² + 5x + 6",
        "text": "Addiere nur gleichartige Terme. x² und x bleiben verschieden."
      },
      {
        "title": "Ausklammern",
        "formula": "6x + 9 = 3(2x + 3)",
        "text": "Der gemeinsame Faktor wird vor die Klammer gezogen. Durch erneutes Ausmultiplizieren kannst du prüfen."
      }
    ],
    "rule": "Jeder Faktor wird auf alle Summanden verteilt. Ausklammern kehrt dies um.",
    "error": "−(a − b) = −a + b, nicht −a − b.",
    "quiz": {
      "question": "Berechne 3(x + 2) für x = 4.",
      "answer": 18,
      "solution": "3(4 + 2) = 3 · 6 = 18. Auch 3 · 4 + 6 = 18."
    },
    "prerequisite": ""
  },
  {
    "id": "8-02",
    "grade": 8,
    "category": "Zahlen & Algebra",
    "title": "Die drei binomischen Formeln",
    "description": "Quadrate von Summen und Differenzen herleiten.",
    "visual": {
      "type": "binomial"
    },
    "steps": [
      {
        "title": "Ein Quadrat zerlegen",
        "formula": "(a + b)²",
        "text": "Ein Quadrat mit Seitenlänge a + b zerfällt in ein a²-Quadrat, zwei ab-Rechtecke und ein b²-Quadrat."
      },
      {
        "title": "Erste binomische Formel",
        "formula": "(a + b)² = a² + 2ab + b²",
        "text": "Der mittlere Term kommt zweimal vor, weil beide gemischten Produkte entstehen."
      },
      {
        "title": "Zweite binomische Formel",
        "formula": "(a − b)² = a² − 2ab + b²",
        "text": "Setze −b in die erste Formel ein. Das Quadrat von −b ist positiv."
      },
      {
        "title": "Dritte binomische Formel",
        "formula": "(a + b)(a − b) = a² − b²",
        "text": "Beim Ausmultiplizieren heben sich +ab und −ab auf."
      },
      {
        "title": "Beispiel und Rückweg",
        "formula": "(x + 3)² = x² + 6x + 9",
        "text": "Umgekehrt kannst du x² + 6x + 9 als (x + 3)² erkennen. Das ist später für quadratische Gleichungen nützlich."
      }
    ],
    "rule": "(a ± b)² = a² ± 2ab + b²; (a+b)(a−b) = a²−b².",
    "error": "(a + b)² ist nicht a² + b²: der doppelte Mischterm fehlt.",
    "quiz": {
      "question": "Berechne (10 + 2)².",
      "answer": 144,
      "solution": "100 + 2 · 10 · 2 + 4 = 100 + 40 + 4 = 144."
    },
    "prerequisite": ""
  },
  {
    "id": "8-03",
    "grade": 8,
    "category": "Zahlen & Algebra",
    "title": "Gleichungen mit Klammern und Brüchen",
    "description": "Eine vollständige Strategie für lineare Gleichungen.",
    "visual": {
      "type": "balance"
    },
    "steps": [
      {
        "title": "Aufgabe ordnen",
        "formula": "2(x − 3) + 4 = x + 9",
        "text": "Löse zuerst die Klammern auf, bevor du x-Terme und Zahlen sammelst."
      },
      {
        "title": "Ausmultiplizieren",
        "formula": "2x − 6 + 4 = x + 9 → 2x − 2 = x + 9",
        "text": "Fasse auf jeder Seite gleichartige Terme zusammen."
      },
      {
        "title": "Unbekannte sammeln",
        "formula": "2x − x − 2 = 9 → x − 2 = 9",
        "text": "Subtrahiere x auf beiden Seiten."
      },
      {
        "title": "Lösen und Probe",
        "formula": "x = 11; 2(11 − 3) + 4 = 20 = 11 + 9",
        "text": "Addiere 2 auf beiden Seiten und prüfe in der ursprünglichen Gleichung."
      },
      {
        "title": "Brüche beseitigen",
        "formula": "x/3 + 1 = 5 → x + 3 = 15 → x = 12",
        "text": "Multipliziere die ganze Gleichung mit dem Hauptnenner 3, also jeden Term beider Seiten. Bei Variablen im Nenner müssen ausgeschlossene Werte vorher feststehen."
      }
    ],
    "rule": "Klammern auflösen → zusammenfassen → x isolieren → Probe.",
    "error": "Beim Multiplizieren mit dem Hauptnenner keinen Summanden vergessen.",
    "quiz": {
      "question": "Löse x/4 + 2 = 5. x = ?",
      "answer": 12,
      "solution": "Beide Seiten −2: x/4 = 3. Beide Seiten ·4: x = 12."
    },
    "prerequisite": ""
  },
  {
    "id": "8-04",
    "grade": 8,
    "category": "Funktionen",
    "title": "Lineare Funktionen und Steigung",
    "description": "y = mx + b in Tabelle und Graph verstehen.",
    "visual": {
      "type": "graph",
      "kind": "linear",
      "m": 2,
      "b": 1
    },
    "steps": [
      {
        "title": "Eindeutige Zuordnung",
        "formula": "f(x) = 2x + 1",
        "text": "Zu jedem zulässigen x gehört genau ein Funktionswert. f(x) ist eine andere Schreibweise für y."
      },
      {
        "title": "y-Achsenabschnitt",
        "formula": "b = 1 → (0|1)",
        "text": "Setze x = 0. Der Graph schneidet die y-Achse bei 1."
      },
      {
        "title": "Steigung",
        "formula": "m = Δy/Δx = 2/1 = 2",
        "text": "Gehe vom Startpunkt eine Einheit nach rechts und zwei nach oben. Eine negative Steigung führt nach unten."
      },
      {
        "title": "Gerade zeichnen",
        "formula": "(0|1), (1|3), (2|5)",
        "text": "Berechne mindestens zwei Punkte, trage sie ein und verbinde sie zu einer Geraden. Ein dritter Punkt dient der Kontrolle."
      },
      {
        "title": "Nullstelle und Bedeutung",
        "formula": "0 = 2x + 1 → x = −0,5",
        "text": "Die Nullstelle liegt am Schnitt mit der x-Achse. Bei einem Sachmodell beschreibt b den Anfangswert und m die Änderung pro x-Einheit."
      }
    ],
    "rule": "y = mx + b; m = Höhenänderung / Rechtsänderung.",
    "error": "b ist nicht die Nullstelle, sondern der y-Achsenabschnitt.",
    "quiz": {
      "question": "f(x) = 3x − 2. Wie groß ist f(4)?",
      "answer": 10,
      "solution": "3 · 4 − 2 = 12 − 2 = 10."
    },
    "prerequisite": ""
  },
  {
    "id": "8-05",
    "grade": 8,
    "category": "Funktionen",
    "title": "Geradengleichung aus zwei Punkten",
    "description": "Steigung und Achsenabschnitt berechnen.",
    "visual": {
      "type": "graph",
      "kind": "linear",
      "m": 2,
      "b": 1
    },
    "steps": [
      {
        "title": "Zwei Punkte",
        "formula": "A(1|3), B(3|7)",
        "text": "Zwei Punkte mit verschiedenen x-Koordinaten bestimmen genau eine Gerade y = mx + b."
      },
      {
        "title": "Differenzen",
        "formula": "Δy = 7 − 3 = 4; Δx = 3 − 1 = 2",
        "text": "Halte bei beiden Differenzen dieselbe Reihenfolge ein."
      },
      {
        "title": "Steigung",
        "formula": "m = 4/2 = 2",
        "text": "Pro Einheit nach rechts steigt die Gerade um zwei Einheiten."
      },
      {
        "title": "b bestimmen",
        "formula": "3 = 2 · 1 + b → b = 1",
        "text": "Setze einen der Punkte und die Steigung in y = mx + b ein. Löse nach b."
      },
      {
        "title": "Ergebnis prüfen",
        "formula": "y = 2x + 1; 7 = 2 · 3 + 1 ✓",
        "text": "Prüfe auch den zweiten Punkt. Haben beide Punkte dieselbe x-Koordinate, ergibt sich eine senkrechte Gerade x = c, kein Graph einer Funktion y = f(x)."
      }
    ],
    "rule": "m = (y₂ − y₁)/(x₂ − x₁); b durch Einsetzen eines Punktes.",
    "error": "Die Reihenfolge der Punkte darf nicht nur in einem der beiden Unterschiede vertauscht werden.",
    "quiz": {
      "question": "A(1|4), B(3|10): Wie groß ist die Steigung?",
      "answer": 3,
      "solution": "m = (10 − 4)/(3 − 1) = 6/2 = 3."
    },
    "prerequisite": ""
  },
  {
    "id": "8-06",
    "grade": 8,
    "category": "Funktionen",
    "title": "Zinsen und Zinseszinsen",
    "description": "Kapitalentwicklung und Zeitanteile verstehen.",
    "visual": {
      "type": "graph",
      "kind": "exponential",
      "a": 1,
      "q": 1.25
    },
    "steps": [
      {
        "title": "Zinsen sind Prozentrechnung",
        "formula": "K = 1000 €; p = 3 % pro Jahr",
        "text": "Kapital K ist der Grundwert, Jahreszinsen Z der Prozentwert. Beachte immer den Zeitraum."
      },
      {
        "title": "Ein Jahr",
        "formula": "Z = 1000 · 3/100 = 30 €",
        "text": "Nach einem Jahr ohne Gebühren oder Steuern beträgt das Kapital 1030 €."
      },
      {
        "title": "Zeitanteilige Zinsen",
        "formula": "Z = K · p/100 · t/12",
        "text": "Für t Monate mit einfacher Verzinsung gilt der entsprechende Jahresanteil. Für Tage kann je nach Aufgabe ein 360- oder 365-Tage-Modell gelten."
      },
      {
        "title": "Zinseszins",
        "formula": "K₂ = 1000 · 1,03 · 1,03 = 1060,90 €",
        "text": "Wenn Zinsen auf dem Konto bleiben, werden sie im nächsten Zeitraum mitverzinst."
      },
      {
        "title": "Allgemein und Laufzeit",
        "formula": "Kₙ = K₀ · (1 + p/100)ⁿ",
        "text": "Für eine gesuchte ganze Jahreszahl kann man n schrittweise testen oder eine Tabelle anlegen. Zinssatz, Zahlungszeitpunkte und Rundung müssen zum Modell passen."
      }
    ],
    "rule": "Z = Kp/100 pro Jahr; mit Zinseszins Kₙ = K₀qⁿ.",
    "error": "Bei Zinseszins wachsen die jährlichen Zinsen mit dem Kapital.",
    "quiz": {
      "question": "500 € werden für ein Jahr mit 4 % verzinst. Zinsen in Euro?",
      "answer": 20,
      "solution": "Z = 500 · 4/100 = 20 €."
    },
    "prerequisite": ""
  },
  {
    "id": "8-07",
    "grade": 8,
    "category": "Geometrie",
    "title": "Mittelsenkrechte und Thaleskreis",
    "description": "Geometrische Orte mit Zirkel und Lineal konstruieren.",
    "visual": {
      "type": "thales"
    },
    "steps": [
      {
        "title": "Gleicher Abstand von A und B",
        "formula": "PA = PB",
        "text": "Alle Punkte mit gleichem Abstand zu zwei Punkten liegen auf der Mittelsenkrechten ihrer Verbindungsstrecke."
      },
      {
        "title": "Mittelsenkrechte konstruieren",
        "formula": "Zwei gleich große Kreise um A und B",
        "text": "Der Radius muss größer als die halbe Strecke AB sein. Verbinde die beiden Kreisschnittpunkte: Die Gerade halbiert AB senkrecht."
      },
      {
        "title": "Der Thaleskreis",
        "formula": "AB ist ein Kreisdurchmesser",
        "text": "Zeichne den Kreis über der Strecke AB. Jeder Punkt C auf dem Halbkreis außer A und B bildet mit A und B ein rechtwinkliges Dreieck."
      },
      {
        "title": "Warum 90°?",
        "formula": "2α + 2β = 180° → α + β = 90°",
        "text": "Die Radien MA, MB und MC sind gleich lang. Zwei gleichschenklige Teildreiecke liefern am Punkt C die Summe α + β."
      },
      {
        "title": "Anwenden",
        "formula": "C auf Thaleskreis → ∠ACB = 90°",
        "text": "Um ein rechtwinkliges Dreieck mit vorgegebener Hypotenuse zu konstruieren, wähle den dritten Punkt auf diesem Kreis. Zusätzliche Angaben schränken die Auswahl ein."
      }
    ],
    "rule": "Mittelsenkrechte: gleicher Abstand zu A und B. Thaleskreis: rechter Winkel gegenüber dem Durchmesser.",
    "error": "Der rechte Winkel liegt bei C auf dem Kreis, nicht am Mittelpunkt.",
    "quiz": {
      "question": "Wie groß ist der Winkel ACB, wenn AB Durchmesser und C auf dem Thaleskreis ist?",
      "answer": 90,
      "solution": "Nach dem Satz des Thales ist der Winkel über einem Durchmesser ein rechter Winkel."
    },
    "prerequisite": ""
  },
  {
    "id": "8-08",
    "grade": 8,
    "category": "Geometrie",
    "title": "Prismen: Volumen und Oberfläche",
    "description": "Grundfläche, Mantel und Höhe auseinanderhalten.",
    "visual": {
      "type": "prism"
    },
    "steps": [
      {
        "title": "Prisma erkennen",
        "formula": "Zwei parallele, deckungsgleiche Grundflächen",
        "text": "Ein gerades Prisma entsteht, wenn eine ebene Vielecksfläche senkrecht verschoben wird. Die Seitenflächen sind Rechtecke."
      },
      {
        "title": "Grundfläche berechnen",
        "formula": "Dreieck: G = 3 · 4 / 2 = 6 cm²",
        "text": "Hier ist die Grundfläche ein rechtwinkliges Dreieck mit Seiten 3, 4 und 5 cm. Die Körperhöhe beträgt 7 cm."
      },
      {
        "title": "Volumen",
        "formula": "V = G · h = 6 · 7 = 42 cm³",
        "text": "Stapele die Grundfläche entlang der Körperhöhe."
      },
      {
        "title": "Mantelfläche",
        "formula": "M = U_G · h = (3 + 4 + 5) · 7 = 84 cm²",
        "text": "Beim geraden Prisma rollt sich der Mantel zu einem Rechteck mit Breite U_G und Höhe h auf."
      },
      {
        "title": "Oberfläche",
        "formula": "O = 2G + M = 12 + 84 = 96 cm²",
        "text": "Es gibt zwei Grundflächen plus Mantel. Bei zusammengesetzten Körpern sind verdeckte Kontaktflächen keine Außenfläche."
      }
    ],
    "rule": "Gerades Prisma: V = Gh; M = U_Gh; O = 2G + M.",
    "error": "Die Dreieckshöhe der Grundfläche ist nicht die Körperhöhe.",
    "quiz": {
      "question": "Prisma: G = 12 cm², Körperhöhe 5 cm. Volumen in cm³?",
      "answer": 60,
      "solution": "V = G · h = 12 · 5 = 60 cm³."
    },
    "prerequisite": ""
  },
  {
    "id": "8-09",
    "grade": 8,
    "category": "Daten & Zufall",
    "title": "Quartile und Boxplots",
    "description": "Verteilungen über fünf Kennzahlen vergleichen.",
    "visual": {
      "type": "boxplot"
    },
    "steps": [
      {
        "title": "Sortieren",
        "formula": "1, 2, 3, 4, 6, 7, 8, 9",
        "text": "Für einen Boxplot brauchst du Minimum, unteres Quartil, Median, oberes Quartil und Maximum."
      },
      {
        "title": "Median",
        "formula": "Q₂ = (4 + 6)/2 = 5",
        "text": "Die beiden mittleren Werte bestimmen bei gerader Anzahl den Median."
      },
      {
        "title": "Quartile",
        "formula": "Q₁ = (2 + 3)/2 = 2,5; Q₃ = (7 + 8)/2 = 7,5",
        "text": "Hier verwenden wir die Mediane der unteren und oberen Datenhälfte. Bei ungerader Anzahl lassen wir den Gesamtmedian für die Hälften weg. Software kann andere Konventionen verwenden."
      },
      {
        "title": "Boxplot zeichnen",
        "formula": "min 1 | Q₁ 2,5 | Median 5 | Q₃ 7,5 | max 9",
        "text": "Die Box reicht vom unteren zum oberen Quartil. Ein Strich zeigt den Median; die Antennen reichen hier zu Minimum und Maximum."
      },
      {
        "title": "Deuten",
        "formula": "IQR = Q₃ − Q₁ = 5",
        "text": "Die Box zeigt den Bereich der mittleren ungefähr 50 % der Daten. Breitere Bereiche bedeuten größere Streuung, nicht automatisch mehr Werte."
      }
    ],
    "rule": "Ein Boxplot beschreibt Lage und Streuung durch fünf Kennzahlen.",
    "error": "Ein Boxplot zeigt nicht jeden einzelnen Wert oder den Mittelwert.",
    "quiz": {
      "question": "Q₁ = 4, Q₃ = 11. Wie groß ist der Quartilsabstand?",
      "answer": 7,
      "solution": "IQR = 11 − 4 = 7."
    },
    "prerequisite": ""
  },
  {
    "id": "8-10",
    "grade": 8,
    "category": "Daten & Zufall",
    "title": "Zufall simulieren und große Zahlen",
    "description": "Relative Häufigkeit und Wahrscheinlichkeit unterscheiden.",
    "visual": {
      "type": "simulation"
    },
    "steps": [
      {
        "title": "Modell festlegen",
        "formula": "Faire Münze: P(Kopf) = 1/2",
        "text": "Eine Simulation benötigt klar definierte Ergebnisse und passende Wahrscheinlichkeiten."
      },
      {
        "title": "Wenige Versuche",
        "formula": "z. B. 7-mal Kopf bei 10 Würfen → h = 0,7",
        "text": "Eine kleine Stichprobe kann stark vom Modellwert abweichen. Das widerlegt eine faire Münze noch nicht."
      },
      {
        "title": "Viele Versuche",
        "formula": "hₙ = Anzahl Kopf / Anzahl Würfe",
        "text": "Bei vielen unabhängigen Würfen stabilisiert sich die relative Häufigkeit meist in der Nähe von 0,5."
      },
      {
        "title": "Gesetz der großen Zahlen",
        "formula": "hₙ nähert sich typischerweise P(Kopf)",
        "text": "Die Annäherung ist nicht zwingend gleichmäßig. Zwischendurch kann die Abweichung wieder wachsen."
      },
      {
        "title": "Kein Gedächtnis",
        "formula": "P(Kopf nach 5-mal Zahl) = 1/2",
        "text": "Unabhängige Würfe gleichen vergangene Ergebnisse nicht absichtlich aus. Eine Simulation kann Vermutungen stützen, ersetzt aber keinen allgemeinen Beweis."
      }
    ],
    "rule": "Relative Häufigkeit wird beobachtet; Wahrscheinlichkeit gehört zum Modell.",
    "error": "Nach vielen Zahl-Würfen ist Kopf bei einer fairen, unabhängigen Münze nicht plötzlich wahrscheinlicher.",
    "quiz": {
      "question": "30-mal Kopf in 50 Würfen: relative Häufigkeit in Prozent?",
      "answer": 60,
      "solution": "30/50 = 0,6 = 60 %."
    },
    "prerequisite": ""
  },
  {
    "id": "8-11",
    "grade": 8,
    "category": "Funktionen",
    "title": "Tabellenkalkulation für Mathematik",
    "description": "Formeln, Diagramme und absolute Zellbezüge.",
    "visual": {
      "type": "table",
      "rows": [
        [
          "A",
          "B",
          "C"
        ],
        [
          "Preis",
          "Rabatt",
          "Endpreis"
        ],
        [
          "80",
          "20 %",
          "=A3*(1-B3)"
        ]
      ]
    },
    "steps": [
      {
        "title": "Zellen und Formeln",
        "formula": "A2 = 80; B2 = 20 %",
        "text": "Eine Tabelle ordnet Daten in Zeilen und Spalten. Formeln beginnen mit einem Gleichheitszeichen."
      },
      {
        "title": "Mit Bezügen rechnen",
        "formula": "C2: =A2*(1-B2)",
        "text": "Die Formel bezieht sich auf den Preis und Rabatt derselben Zeile. Bei 80 € und 20 % entstehen 64 €."
      },
      {
        "title": "Relative Bezüge",
        "formula": "C3: =A3*(1-B3)",
        "text": "Beim Herunterkopieren wandern relative Zellbezüge mit. So lässt sich dieselbe Rechnung für viele Datensätze ausführen."
      },
      {
        "title": "Absolute Bezüge",
        "formula": "=$E$1*A2",
        "text": "Dollarzeichen fixieren Spalte und Zeile. Ein einheitlicher Steuersatz in E1 bleibt beim Kopieren unverändert."
      },
      {
        "title": "Diagramm und Kontrolle",
        "formula": "x-Spalte + y-Spalte → Punktdiagramm",
        "text": "Für Funktionswerte eignet sich ein XY-Diagramm. Prüfe Einheiten und Skalen und rechne einen Datensatz von Hand nach."
      }
    ],
    "rule": "Relative Bezüge wandern; $A$1 bleibt beim Kopieren fest.",
    "error": "20 % muss als 0,2 oder Prozentwert erfasst sein, nicht als 20 ohne Anpassung.",
    "quiz": {
      "question": "A2 ist 50, B2 ist 10 %. Welchen Wert liefert =A2*(1-B2)?",
      "answer": 45,
      "solution": "50 · (1 − 0,10) = 45."
    },
    "prerequisite": ""
  },
  {
    "id": "9-01",
    "grade": 9,
    "category": "Zahlen & Algebra",
    "title": "Potenzen und Potenzgesetze",
    "description": "Wiederholte Multiplikation sicher vereinfachen.",
    "visual": {
      "type": "power"
    },
    "steps": [
      {
        "title": "Basis und Exponent",
        "formula": "2⁴ = 2 · 2 · 2 · 2 = 16",
        "text": "Die Basis 2 wird viermal als Faktor verwendet. Der Exponent zählt die Faktoren, nicht eine Multiplikation mit der Basis."
      },
      {
        "title": "Gleiche Basis multiplizieren",
        "formula": "aᵐ · aⁿ = aᵐ⁺ⁿ",
        "text": "Die Faktorlisten werden aneinandergehängt. Zum Beispiel 2³ · 2² = 2⁵ = 32."
      },
      {
        "title": "Dividieren",
        "formula": "aᵐ : aⁿ = aᵐ⁻ⁿ, a ≠ 0",
        "text": "Gemeinsame Faktoren kürzen sich. Daraus folgen a⁰ = 1 und a⁻ⁿ = 1/aⁿ für a ungleich null."
      },
      {
        "title": "Potenz potenzieren",
        "formula": "(aᵐ)ⁿ = aᵐⁿ",
        "text": "Zum Beispiel (2³)² = 2⁶ = 64. Die Exponenten werden multipliziert."
      },
      {
        "title": "Produkte potenzieren",
        "formula": "(ab)ⁿ = aⁿbⁿ",
        "text": "Das gilt entsprechend für Quotienten mit Nenner ungleich null. Für Summen gibt es keine solche Verteilung: (a+b)² enthält den Mischterm."
      }
    ],
    "rule": "Gleiche Basis: beim Multiplizieren Exponenten addieren, beim Dividieren subtrahieren.",
    "error": "2³ · 2² = 2⁵, nicht 4⁵.",
    "quiz": {
      "question": "Berechne 3² · 3³.",
      "answer": 243,
      "solution": "3² · 3³ = 3⁵ = 243."
    },
    "prerequisite": ""
  },
  {
    "id": "9-02",
    "grade": 9,
    "category": "Zahlen & Algebra",
    "title": "Zehnerpotenzen und wissenschaftliche Schreibweise",
    "description": "Sehr große und sehr kleine Zahlen darstellen.",
    "visual": {
      "type": "place",
      "digits": "0,00042"
    },
    "steps": [
      {
        "title": "Zehnerpotenzen",
        "formula": "10³ = 1000; 10⁻³ = 0,001",
        "text": "Ein positiver Exponent beschreibt Zehnerfaktoren, ein negativer deren Kehrwert."
      },
      {
        "title": "Wissenschaftliche Form",
        "formula": "a · 10ⁿ mit 1 ≤ |a| < 10",
        "text": "Für Zahlen ungleich null steht genau eine von null verschiedene Ziffer vor dem Komma."
      },
      {
        "title": "Große Zahl",
        "formula": "4 200 000 = 4,2 · 10⁶",
        "text": "Das Komma wird sechs Stellen nach links verschoben; 10⁶ gleicht diese Verkleinerung wieder aus."
      },
      {
        "title": "Kleine Zahl",
        "formula": "0,00042 = 4,2 · 10⁻⁴",
        "text": "Das Komma wird vier Stellen nach rechts verschoben. Der negative Exponent gleicht die Vergrößerung aus."
      },
      {
        "title": "Rechnen",
        "formula": "(3 · 10⁵)(2 · 10⁻²) = 6 · 10³",
        "text": "Multipliziere die Vorfaktoren und addiere die Exponenten. Normalisiere das Ergebnis bei Bedarf wieder."
      }
    ],
    "rule": "Wissenschaftliche Schreibweise: ein Faktor zwischen 1 und 10 mal eine Zehnerpotenz.",
    "error": "Bei kleinen positiven Zahlen ist der Exponent meist negativ, die Zahl selbst bleibt positiv.",
    "quiz": {
      "question": "Schreibe 4,5 · 10³ als gewöhnliche Zahl.",
      "answer": 4500,
      "solution": "10³ = 1000. 4,5 · 1000 = 4500."
    },
    "prerequisite": ""
  },
  {
    "id": "9-03",
    "grade": 9,
    "category": "Zahlen & Algebra",
    "title": "Wurzeln und reelle Zahlen",
    "description": "Quadratwurzel, irrationale Zahlen und Wurzelregeln.",
    "visual": {
      "type": "area",
      "w": 4,
      "h": 4
    },
    "steps": [
      {
        "title": "Quadratwurzel verstehen",
        "formula": "√16 = 4",
        "text": "Die Quadratwurzel ist die nichtnegative Zahl, deren Quadrat 16 ist. Sie ist die Seitenlänge eines Quadrats mit Fläche 16."
      },
      {
        "title": "Gleichung unterscheiden",
        "formula": "x² = 16 → x = 4 oder x = −4",
        "text": "Das Wurzelzeichen selbst bedeutet nur +4. Die Gleichung hat zwei Lösungen, weil auch (−4)² = 16 ist."
      },
      {
        "title": "Irrationale Zahlen",
        "formula": "√2 = 1,414213…",
        "text": "√2 lässt sich nicht als Bruch ganzer Zahlen schreiben. Rationale und irrationale Zahlen bilden zusammen die reellen Zahlen."
      },
      {
        "title": "Wurzelregeln",
        "formula": "√(ab) = √a · √b für a,b ≥ 0",
        "text": "Auch √(a/b) = √a/√b für a ≥ 0, b > 0. Daraus folgt √50 = √(25 · 2) = 5√2."
      },
      {
        "title": "Grenzen",
        "formula": "√(9 + 16) = 5 ≠ 3 + 4",
        "text": "Wurzeln lassen sich nicht über Summen verteilen. Für reelle Zahlen ist √(−1) nicht definiert. Außerdem gilt √(x²) = |x|."
      }
    ],
    "rule": "√a ist nichtnegativ; √(x²) = |x|.",
    "error": "√25 = 5, nicht ±5; x² = 25 hat dagegen zwei Lösungen.",
    "quiz": {
      "question": "Berechne √144.",
      "answer": 12,
      "solution": "12² = 144 und 12 ist nichtnegativ."
    },
    "prerequisite": ""
  },
  {
    "id": "9-04",
    "grade": 9,
    "category": "Zahlen & Algebra",
    "title": "Quadratwurzeln näherungsweise bestimmen",
    "description": "Eingrenzen und das Heron-Verfahren anwenden.",
    "visual": {
      "type": "equation"
    },
    "steps": [
      {
        "title": "Eingrenzen",
        "formula": "1² < 2 < 2² → 1 < √2 < 2",
        "text": "Suche benachbarte Quadratzahlen. So erhältst du einen ersten Bereich."
      },
      {
        "title": "Dezimalstellen prüfen",
        "formula": "1,4² = 1,96; 1,5² = 2,25",
        "text": "Also liegt √2 zwischen 1,4 und 1,5. Weitere Stellen können durch systematisches Eingrenzen gefunden werden."
      },
      {
        "title": "Heron-Idee",
        "formula": "Rechteck mit Fläche 2: Seiten x und 2/x",
        "text": "Sind die Seiten gleich, ist das Rechteck ein Quadrat. Ersetze die Seitenlänge durch den Mittelwert beider Seiten."
      },
      {
        "title": "Iteration",
        "formula": "xₙ₊₁ = (xₙ + 2/xₙ)/2",
        "text": "Starte beispielsweise mit x₀ = 1,5. Daraus folgt x₁ ≈ 1,416667."
      },
      {
        "title": "Verfeinern und prüfen",
        "formula": "x₂ ≈ 1,414216; x₃ ≈ 1,414214",
        "text": "Wiederhole, bis die gewünschte Genauigkeit erreicht ist. Die Probe durch Quadrieren muss nahe 2 ergeben. Runde erst am Ende."
      }
    ],
    "rule": "Für √a: x_neu = (x_alt + a/x_alt)/2 mit positivem Startwert.",
    "error": "Eine Näherung ist kein exakter Wert. Benutze ≈.",
    "quiz": {
      "question": "Zwischen welchen aufeinanderfolgenden ganzen Zahlen liegt √30? Gib die kleinere ein.",
      "answer": 5,
      "solution": "5² = 25 und 6² = 36, deshalb 5 < √30 < 6."
    },
    "prerequisite": ""
  },
  {
    "id": "9-05",
    "grade": 9,
    "category": "Zahlen & Algebra",
    "title": "Lineare Gleichungssysteme",
    "description": "Zwei Bedingungen, ein gemeinsames Wertepaar.",
    "visual": {
      "type": "graph",
      "kind": "system"
    },
    "steps": [
      {
        "title": "Zwei Gleichungen",
        "formula": "I: y = 2x + 1; II: y = −x + 7",
        "text": "Ein Lösungspaar muss beide Gleichungen gleichzeitig erfüllen."
      },
      {
        "title": "Graphische Lösung",
        "formula": "Schnittpunkt zweier Geraden",
        "text": "Zeichne beide Graphen. Der Schnittpunkt ist hier S(2|5). Ablesen ist häufig nur näherungsweise möglich."
      },
      {
        "title": "Gleichsetzungsverfahren",
        "formula": "2x + 1 = −x + 7",
        "text": "Beide Terme sind gleich y, also auch gleich einander. Daraus folgt 3x = 6 und x = 2."
      },
      {
        "title": "Einsetzungsverfahren",
        "formula": "y = 2 · 2 + 1 = 5",
        "text": "Setze die gefundene x-Koordinate ein. Allgemein kannst du eine nach einer Variablen aufgelöste Gleichung in die andere einsetzen."
      },
      {
        "title": "Additionsverfahren",
        "formula": "x + y = 7; x − y = −3 → 2x = 4",
        "text": "Addiere beide Gleichungen, sodass eine Variable verschwindet. Bei Bedarf multiplizierst du vorher ganze Gleichungen."
      },
      {
        "title": "Probe und Sonderfälle",
        "formula": "(2|5); parallel: keine; identisch: unendlich viele",
        "text": "Prüfe das Paar in beiden Ausgangsgleichungen. Zwei verschiedene parallele Geraden schneiden sich nicht; identische Geraden haben unendlich viele gemeinsame Punkte."
      }
    ],
    "rule": "Ein Lösungspaar muss beide Gleichungen erfüllen. Wähle das Verfahren passend zur Form.",
    "error": "Nach dem Finden von x muss auch y berechnet werden.",
    "quiz": {
      "question": "Löse x + y = 10 und x − y = 2. Wie groß ist x?",
      "answer": 6,
      "solution": "Addieren: 2x = 12, also x = 6. Dann y = 4."
    },
    "prerequisite": ""
  },
  {
    "id": "9-06",
    "grade": 9,
    "category": "Geometrie",
    "title": "Satz des Pythagoras",
    "description": "Quadratflächen verbinden und Seiten berechnen.",
    "visual": {
      "type": "pythagoras"
    },
    "steps": [
      {
        "title": "Rechtwinkliges Dreieck",
        "formula": "a = 3; b = 4; c gesucht",
        "text": "a und b sind Katheten. Die Seite gegenüber dem rechten Winkel heißt Hypotenuse c und ist die längste Seite."
      },
      {
        "title": "Quadrate über den Seiten",
        "formula": "a² + b² = c²",
        "text": "Die Summe der beiden Kathetenquadrate entspricht dem Hypotenusenquadrat."
      },
      {
        "title": "Flächenbeweis",
        "formula": "(a+b)² = 4 · ab/2 + c²",
        "text": "Vier gleiche rechtwinklige Dreiecke lassen in einem großen Quadrat ein c²-Quadrat frei. Nach Abzug von 2ab bleibt a²+b²=c²."
      },
      {
        "title": "Hypotenuse berechnen",
        "formula": "c = √(3² + 4²) = √25 = 5",
        "text": "Erst quadrieren, dann addieren, dann die Wurzel ziehen. Längen sind nichtnegativ."
      },
      {
        "title": "Kathete berechnen",
        "formula": "a = √(c² − b²)",
        "text": "Ist die Hypotenuse bekannt, wird subtrahiert. Die Umkehrung prüft rechte Winkel: Nur wenn die Quadratsumme stimmt, ist das Dreieck rechtwinklig."
      }
    ],
    "rule": "Nur im rechtwinkligen Dreieck: a²+b²=c²; c liegt gegenüber dem rechten Winkel.",
    "error": "a + b = c ist falsch. Die Quadrate sind entscheidend.",
    "quiz": {
      "question": "Katheten: 6 cm und 8 cm. Hypotenuse in cm?",
      "answer": 10,
      "solution": "c = √(36 + 64) = √100 = 10 cm."
    },
    "prerequisite": ""
  },
  {
    "id": "9-07",
    "grade": 9,
    "category": "Geometrie",
    "title": "Ähnlichkeit und Strahlensätze",
    "description": "Verhältnisse von Längen, Flächen und Volumen.",
    "visual": {
      "type": "similar"
    },
    "steps": [
      {
        "title": "Ähnliche Figuren",
        "formula": "gleiche entsprechende Winkel",
        "text": "Ähnliche Figuren haben dieselbe Form. Entsprechende Seiten stehen in demselben Verhältnis."
      },
      {
        "title": "Streckfaktor",
        "formula": "k = Bildlänge / Originallänge",
        "text": "Bei 3 cm → 6 cm ist k = 2. Alle entsprechenden Längen werden verdoppelt."
      },
      {
        "title": "Fehlende Seite",
        "formula": "3/6 = 4/x → x = 8",
        "text": "Ordne entsprechende Seiten richtig zu. Verwende dieselbe Richtung bei allen Verhältnissen."
      },
      {
        "title": "Strahlensätze",
        "formula": "SA/SB = SA′/SB′ bei AA′ ∥ BB′",
        "text": "Zwei Strahlen werden durch parallele Strecken geschnitten. Dadurch entstehen ähnliche Dreiecke. Es gilt auch AA′/BB′ = SA/SB."
      },
      {
        "title": "Flächen und Körper",
        "formula": "A′ = k²A; V′ = k³V",
        "text": "Bei k = 2 werden Flächen viermal und Volumen achtmal so groß. Eine zentrale Streckung bildet jeden Punkt auf demselben Strahl vom Zentrum ab."
      }
    ],
    "rule": "Ähnlich: Längenfaktor k, Flächenfaktor k², Volumenfaktor k³.",
    "error": "Doppelte Seitenlänge bedeutet vierfache Fläche.",
    "quiz": {
      "question": "Eine Figur wird mit k = 3 vergrößert. Um welchen Faktor wächst die Fläche?",
      "answer": 9,
      "solution": "Flächen skalieren mit k² = 3² = 9."
    },
    "prerequisite": ""
  },
  {
    "id": "9-08",
    "grade": 9,
    "category": "Geometrie",
    "title": "Kreis: Umfang und Fläche",
    "description": "π, Radius und Durchmesser verstehen.",
    "visual": {
      "type": "circle",
      "r": 3
    },
    "steps": [
      {
        "title": "Radius und Durchmesser",
        "formula": "d = 2r",
        "text": "Der Radius führt vom Mittelpunkt zum Kreisrand. Der Durchmesser verläuft durch den Mittelpunkt von Rand zu Rand."
      },
      {
        "title": "Umfang und π",
        "formula": "π = U/d ≈ 3,14159",
        "text": "Bei jedem Kreis ist das Verhältnis von Umfang zu Durchmesser gleich."
      },
      {
        "title": "Umfang berechnen",
        "formula": "U = 2πr = 6π ≈ 18,85 cm",
        "text": "Für r = 3 cm setzt du den Radius in die Formel ein. Lass π bis zur letzten Rechnung stehen."
      },
      {
        "title": "Fläche herleiten",
        "formula": "Kreissektoren → angenähertes Rechteck",
        "text": "Viele schmale, wechselweise angeordnete Sektoren bilden näherungsweise ein Rechteck mit Höhe r und Grundseite πr."
      },
      {
        "title": "Flächenformel",
        "formula": "A = πr² = 9π ≈ 28,27 cm²",
        "text": "Bei doppeltem Radius verdoppelt sich der Umfang und vervierfacht sich die Fläche."
      }
    ],
    "rule": "Kreis: U = 2πr = πd; A = πr².",
    "error": "Wenn der Durchmesser gegeben ist, vor der Flächenrechnung halbieren.",
    "quiz": {
      "question": "Ein Kreis hat Durchmesser 10 cm. Radius in cm?",
      "answer": 5,
      "solution": "r = d/2 = 10/2 = 5 cm."
    },
    "prerequisite": ""
  },
  {
    "id": "9-09",
    "grade": 9,
    "category": "Geometrie",
    "title": "Kreisbogen und Kreissektor",
    "description": "Anteile des Vollkreises berechnen.",
    "visual": {
      "type": "sector",
      "degrees": 120,
      "r": 3
    },
    "steps": [
      {
        "title": "Anteil am Kreis",
        "formula": "α = 120° → 120/360 = 1/3",
        "text": "Ein Mittelpunktswinkel bestimmt den Anteil am vollständigen Kreis."
      },
      {
        "title": "Bogenlänge",
        "formula": "b = α/360° · 2πr",
        "text": "Beim Radius 3 cm und Winkel 120° ist b = (1/3) · 6π = 2π ≈ 6,28 cm."
      },
      {
        "title": "Sektorfläche",
        "formula": "A_S = α/360° · πr²",
        "text": "Hier: (1/3) · 9π = 3π ≈ 9,42 cm²."
      },
      {
        "title": "Sektorumfang",
        "formula": "U_S = b + 2r",
        "text": "Zum gebogenen Rand kommen zwei Radien. Hier etwa 6,28 + 6 = 12,28 cm."
      },
      {
        "title": "Kreisring",
        "formula": "A_R = πR² − πr²",
        "text": "Bei einem äußeren und inneren Kreis subtrahierst du die Flächen. Das ist nicht π(R − r)²."
      }
    ],
    "rule": "Bogen und Sektor sind der Winkelanteil α/360° von Umfang und Fläche.",
    "error": "Bogenlänge und Sektorumfang sind unterschiedliche Größen.",
    "quiz": {
      "question": "Welcher Bruchteil des Vollkreises gehört zu 90°?",
      "answer": "1/4",
      "solution": "90/360 = 1/4."
    },
    "prerequisite": ""
  },
  {
    "id": "9-10",
    "grade": 9,
    "category": "Geometrie",
    "title": "Zylinder",
    "description": "Kreisgrundfläche, Mantel und Rauminhalt.",
    "visual": {
      "type": "cylinder"
    },
    "steps": [
      {
        "title": "Zylinder erkennen",
        "formula": "r = 3 cm; h = 5 cm",
        "text": "Zwei gleich große Kreisflächen bilden Grund- und Deckfläche. Die Körperhöhe steht senkrecht dazu."
      },
      {
        "title": "Grundfläche",
        "formula": "G = πr² = 9π cm²",
        "text": "Für das Volumen wird diese Fläche über die Höhe gestapelt."
      },
      {
        "title": "Volumen",
        "formula": "V = πr²h = 45π ≈ 141,37 cm³",
        "text": "Alle Längen müssen vorher dieselbe Einheit besitzen."
      },
      {
        "title": "Mantel abrollen",
        "formula": "M = 2πr · h = 30π cm²",
        "text": "Der Mantel ist ausgerollt ein Rechteck: Seine Breite ist der Kreisumfang."
      },
      {
        "title": "Oberfläche",
        "formula": "O = 2πr² + 2πrh = 48π ≈ 150,80 cm²",
        "text": "Bei offenen Behältern fällt eine Deckfläche weg. Lies die Aufgabenbeschreibung genau."
      }
    ],
    "rule": "Zylinder: V = πr²h; O = 2πr² + 2πrh.",
    "error": "Der Radius wird quadriert, die Körperhöhe nicht.",
    "quiz": {
      "question": "Ein Zylinder hat r = 2 und h = 5. Wie groß ist V/π?",
      "answer": 20,
      "solution": "V = π · 2² · 5 = 20π. Also V/π = 20."
    },
    "prerequisite": ""
  },
  {
    "id": "9-11",
    "grade": 9,
    "category": "Daten & Zufall",
    "title": "Baumdiagramme und Pfadregeln",
    "description": "Mehrstufige Experimente systematisch berechnen.",
    "visual": {
      "type": "tree",
      "replace": true
    },
    "steps": [
      {
        "title": "Zwei Münzwürfe",
        "formula": "KK, KZ, ZK, ZZ",
        "text": "Jede Verzweigung beschreibt einen Wurf. Jeder vollständige Pfad ist ein zusammengesetztes Ergebnis."
      },
      {
        "title": "Zweige beschriften",
        "formula": "P(K) = P(Z) = 1/2",
        "text": "Von jedem Knoten summieren sich die ausgehenden Wahrscheinlichkeiten zu 1."
      },
      {
        "title": "Produktregel",
        "formula": "P(KK) = 1/2 · 1/2 = 1/4",
        "text": "Entlang eines Pfades werden Wahrscheinlichkeiten multipliziert."
      },
      {
        "title": "Summenregel",
        "formula": "P(genau einmal K) = P(KZ) + P(ZK) = 1/2",
        "text": "Addiere die Wahrscheinlichkeiten der getrennten Pfade, die zum Ereignis gehören."
      },
      {
        "title": "Gegenereignis nutzen",
        "formula": "P(mindestens einmal K) = 1 − P(ZZ) = 3/4",
        "text": "Mindestens einmal ist oft leichter über keinmal zu rechnen. Bei Würfen zweier Würfel gibt es 36 geordnete Paare; die Summen 2 bis 12 sind nicht gleich wahrscheinlich."
      }
    ],
    "rule": "Entlang eines Pfades multiplizieren; passende verschiedene Pfade addieren.",
    "error": "Genau einmal und mindestens einmal sind unterschiedliche Ereignisse.",
    "quiz": {
      "question": "Zwei faire Münzwürfe: Wahrscheinlichkeit für zweimal Kopf? Bruch?",
      "answer": "1/4",
      "solution": "1/2 · 1/2 = 1/4."
    },
    "prerequisite": ""
  },
  {
    "id": "9-12",
    "grade": 9,
    "category": "Daten & Zufall",
    "title": "Ziehen mit und ohne Zurücklegen",
    "description": "Veränderte Wahrscheinlichkeiten im Baum verfolgen.",
    "visual": {
      "type": "urn"
    },
    "steps": [
      {
        "title": "Urne",
        "formula": "3 rote, 2 blaue Kugeln",
        "text": "Insgesamt gibt es fünf Kugeln. Vor dem ersten Zug ist P(R) = 3/5."
      },
      {
        "title": "Mit Zurücklegen",
        "formula": "P(RR) = 3/5 · 3/5 = 9/25",
        "text": "Nach dem Zurücklegen ist die Zusammensetzung wieder dieselbe. Die beiden Ziehungen sind im Modell unabhängig."
      },
      {
        "title": "Ohne Zurücklegen",
        "formula": "P(R nach R) = 2/4",
        "text": "Nach einer roten Kugel liegen nur noch zwei rote und zwei blaue in der Urne."
      },
      {
        "title": "Zwei rote Kugeln",
        "formula": "P(RR) = 3/5 · 2/4 = 3/10",
        "text": "Der zweite Nenner und gegebenenfalls der Zähler ändern sich."
      },
      {
        "title": "Gemischte Farben",
        "formula": "P(RB oder BR) = 3/5 · 2/4 + 2/5 · 3/4 = 3/5",
        "text": "Beide Reihenfolgen gehören zum Ereignis. Ein Baum macht sichtbar, welche Restmengen nach jedem Zug gelten."
      }
    ],
    "rule": "Ohne Zurücklegen ändern sich Bestand und Gesamtzahl nach jedem Zug.",
    "error": "Die zweite Wahrscheinlichkeit darf nicht unverändert vom ersten Zug übernommen werden.",
    "quiz": {
      "question": "3 rote, 2 blaue Kugeln. Nach einer roten ohne Zurücklegen: P(nochmals rot)?",
      "answer": "1/2",
      "solution": "Es bleiben 2 rote unter 4 Kugeln: 2/4 = 1/2."
    },
    "prerequisite": ""
  },
  {
    "id": "10-01",
    "grade": 10,
    "category": "Funktionen",
    "title": "Quadratische Funktionen und Parabeln",
    "description": "Normalparabel, Scheitelpunkt und Parameter.",
    "visual": {
      "type": "graph",
      "kind": "quadratic",
      "a": 1,
      "h": 1,
      "k": -2
    },
    "steps": [
      {
        "title": "Normalparabel",
        "formula": "f(x) = x²",
        "text": "Die Werte bei −2, −1, 0, 1, 2 sind 4, 1, 0, 1, 4. Der Graph ist zur y-Achse symmetrisch und hat den Scheitel (0|0)."
      },
      {
        "title": "Scheitelpunktform",
        "formula": "f(x) = a(x − h)² + k",
        "text": "Der Scheitel liegt bei S(h|k). Die Symmetrieachse ist x = h."
      },
      {
        "title": "Verschieben",
        "formula": "f(x) = (x − 1)² − 2 → S(1|−2)",
        "text": "Die Parabel wird um 1 nach rechts und um 2 nach unten verschoben. Das Minus in der Klammer führt nach rechts."
      },
      {
        "title": "Öffnung und Streckung",
        "formula": "a > 0: oben; a < 0: unten",
        "text": "Bei |a| > 1 wird die Parabel enger, bei 0 < |a| < 1 breiter. Bei a = 0 ist es keine quadratische Funktion."
      },
      {
        "title": "Normalform",
        "formula": "(x − 1)² − 2 = x² − 2x − 1",
        "text": "In ax² + bx + c ist c der y-Achsenabschnitt. Je nach Fragestellung ist eine andere Form günstiger: Scheitelpunktform für den Scheitel, Produktform für Nullstellen."
      }
    ],
    "rule": "Scheitelpunktform a(x−h)²+k hat den Scheitel S(h|k).",
    "error": "(x − 3)² verschiebt die Normalparabel nach rechts, nicht links.",
    "quiz": {
      "question": "f(x) = (x − 4)² + 2. x-Koordinate des Scheitels?",
      "answer": 4,
      "solution": "Aus (x−h)²+k liest du S(h|k) ab: S(4|2)."
    },
    "prerequisite": ""
  },
  {
    "id": "10-02",
    "grade": 10,
    "category": "Zahlen & Algebra",
    "title": "Quadratische Gleichungen: einfache Verfahren",
    "description": "Wurzelziehen, Ausklammern und Nullprodukt.",
    "visual": {
      "type": "equation"
    },
    "steps": [
      {
        "title": "Quadratische Gleichung",
        "formula": "ax² + bx + c = 0; a ≠ 0",
        "text": "Die höchste Potenz der Unbekannten ist 2. Je nach Form gibt es besonders kurze Lösungswege."
      },
      {
        "title": "Wurzelziehen",
        "formula": "x² = 25 → x = ±5",
        "text": "Bei einem positiven rechten Wert gibt es zwei reelle Lösungen. x² = 0 hat eine, x² = −1 keine reelle Lösung."
      },
      {
        "title": "Verschobenes Quadrat",
        "formula": "(x − 2)² = 9 → x − 2 = ±3",
        "text": "Beide Fälle weiterlösen: x = 5 oder x = −1."
      },
      {
        "title": "Ausklammern",
        "formula": "x² − 5x = x(x − 5) = 0",
        "text": "Ein Produkt ist null, wenn mindestens ein Faktor null ist. Also x = 0 oder x = 5."
      },
      {
        "title": "Faktorisieren und Probe",
        "formula": "x² − 5x + 6 = (x − 2)(x − 3)",
        "text": "Die Lösungen sind 2 und 3. Setze beide in die Ausgangsgleichung ein. Teile nicht durch x, bevor du x = 0 als mögliche Lösung geprüft hast."
      }
    ],
    "rule": "Bei einem Nullprodukt jeden Faktor getrennt null setzen.",
    "error": "Beim Wurzelziehen aus x² = a das ± nicht vergessen.",
    "quiz": {
      "question": "x² = 49. Wie groß ist die positive Lösung?",
      "answer": 7,
      "solution": "Die Lösungen sind −7 und +7. Gesucht ist die positive: 7."
    },
    "prerequisite": ""
  },
  {
    "id": "10-03",
    "grade": 10,
    "category": "Zahlen & Algebra",
    "title": "Quadratische Ergänzung und p-q-Formel",
    "description": "Allgemeine quadratische Gleichungen vollständig lösen.",
    "visual": {
      "type": "equation"
    },
    "steps": [
      {
        "title": "Normalisieren",
        "formula": "2x² − 8x + 6 = 0 → x² − 4x + 3 = 0",
        "text": "Teile alle Terme durch den Koeffizienten vor x². Erst dann hat die Gleichung die Form x² + px + q = 0."
      },
      {
        "title": "Quadratisch ergänzen",
        "formula": "x² − 4x = −3 → x² − 4x + 4 = 1",
        "text": "Die Hälfte von −4 ist −2; ihr Quadrat ist 4. Addiere diesen Wert auf beiden Seiten."
      },
      {
        "title": "Binom erkennen",
        "formula": "(x − 2)² = 1",
        "text": "Wurzelziehen ergibt x − 2 = ±1. Also x₁ = 1 und x₂ = 3."
      },
      {
        "title": "p-q-Formel",
        "formula": "x = −p/2 ± √((p/2)² − q)",
        "text": "Diese Formel fasst die Ergänzung zusammen. Hier: 2 ± √(4 − 3) = 2 ± 1."
      },
      {
        "title": "Diskriminante",
        "formula": "D = (p/2)² − q",
        "text": "D > 0: zwei reelle Lösungen; D = 0: eine doppelte; D < 0: keine reelle Lösung."
      },
      {
        "title": "Probe und Sachkontext",
        "formula": "2 · 1² − 8 · 1 + 6 = 0; 2 · 3² − 8 · 3 + 6 = 0",
        "text": "Beide stimmen. In Sachaufgaben können negative Längen oder Zeiten dennoch ausgeschlossen sein."
      }
    ],
    "rule": "Für x²+px+q=0: x = −p/2 ± √((p/2)²−q).",
    "error": "Bei ax²+bx+c=0 zuerst durch a teilen. Die Vorzeichen von p und q exakt übernehmen.",
    "quiz": {
      "question": "Löse x² − 6x + 8 = 0. Gib die kleinere Lösung ein.",
      "answer": 2,
      "solution": "p = −6, q = 8. x = 3 ± √(9−8) = 3 ± 1. Lösungen: 2 und 4."
    },
    "prerequisite": ""
  },
  {
    "id": "10-04",
    "grade": 10,
    "category": "Funktionen",
    "title": "Nullstellen und quadratische Modelle",
    "description": "Parabeln für Flächen, Höhe und Schnittpunkte nutzen.",
    "visual": {
      "type": "graph",
      "kind": "quadratic",
      "a": -1,
      "h": 3,
      "k": 4
    },
    "steps": [
      {
        "title": "Flugkurve modellieren",
        "formula": "h(t) = −(t − 3)² + 4",
        "text": "Ein vereinfachtes Modell beschreibt Höhe h in Metern abhängig von Zeit t in Sekunden. Der gültige Zeitbereich muss zum Kontext passen."
      },
      {
        "title": "Maximum am Scheitel",
        "formula": "S(3|4)",
        "text": "Weil a negativ ist, ist der Scheitel ein Maximum. Nach 3 Sekunden beträgt die Höhe 4 m."
      },
      {
        "title": "Nullstellen",
        "formula": "0 = −(t − 3)² + 4",
        "text": "Umformen ergibt (t − 3)² = 4."
      },
      {
        "title": "Beide Lösungen",
        "formula": "t = 3 ± 2 → t = 1 oder t = 5",
        "text": "Die beiden Bodenpunkte begrenzen hier den betrachteten Flugabschnitt 1 ≤ t ≤ 5."
      },
      {
        "title": "Andere Schnittpunkte",
        "formula": "−(t − 3)² + 4 = 3",
        "text": "Für die Höhe 3 m ergibt sich (t − 3)² = 1, also t = 2 oder t = 4. Für Schnittpunkte zweier Graphen setzt du ihre Terme gleich."
      },
      {
        "title": "Modell bewerten",
        "formula": "t = 6 → h = −5 m",
        "text": "Eine negative Höhe zeigt, dass das Modell außerhalb seines gewählten Anwendungsbereichs keine passende Flugbeschreibung mehr liefert."
      }
    ],
    "rule": "Nullstellen: f(x)=0; Schnittpunkte: f(x)=g(x); Extremwert aus dem Scheitel.",
    "error": "Eine mathematische Lösung muss im Sachkontext sinnvoll sein.",
    "quiz": {
      "question": "f(x) = −(x − 2)² + 9. Wie groß ist der maximale Funktionswert?",
      "answer": 9,
      "solution": "Die Parabel öffnet nach unten und hat Scheitel S(2|9). Der größte Wert ist 9."
    },
    "prerequisite": ""
  },
  {
    "id": "10-05",
    "grade": 10,
    "category": "Funktionen",
    "title": "Exponentielles Wachstum und Zerfall",
    "description": "Konstanter Faktor statt konstanter Differenz.",
    "visual": {
      "type": "graph",
      "kind": "exponential",
      "a": 1,
      "q": 1.5
    },
    "steps": [
      {
        "title": "Wiederholter Faktor",
        "formula": "100 → 150 → 225 → 337,5",
        "text": "Jeder Schritt multipliziert mit 1,5. Die absoluten Zuwächse werden größer."
      },
      {
        "title": "Funktionsgleichung",
        "formula": "f(t) = a · qᵗ",
        "text": "a ist der Anfangswert bei t = 0. q ist der Faktor pro Zeiteinheit. Im üblichen Wachstumsmodell gilt a > 0 und q > 0."
      },
      {
        "title": "Wachstumsrate",
        "formula": "q = 1 + p/100",
        "text": "50 % Zuwachs bedeutet q = 1,5. Bei 20 % Abnahme ist q = 0,8."
      },
      {
        "title": "Wert berechnen",
        "formula": "f(3) = 100 · 1,5³ = 337,5",
        "text": "Die Einheit des Exponenten muss zur Periode des Faktors passen."
      },
      {
        "title": "Wachstum vergleichen",
        "formula": "linear: +c; exponentiell: ·q; quadratisch: zweite Differenz konstant",
        "text": "Bei gleichen x-Abständen prüfen konstante Differenzen ein lineares und konstante Quotienten ein exponentielles Modell."
      },
      {
        "title": "Langfristige Entwicklung",
        "formula": "q > 1: Wachstum; 0 < q < 1: Annäherung an 0",
        "text": "Ein Modell kann nicht jede reale Begrenzung abbilden. Ressourcen, Kapazitäten oder äußere Änderungen können das Wachstum bremsen."
      }
    ],
    "rule": "Exponentiell bedeutet gleicher Faktor je gleichem Zeitschritt.",
    "error": "Ein Faktor von 1,05 bedeutet 5 % Wachstum, nicht 105 % Zuwachs.",
    "quiz": {
      "question": "100 Bakterien verdoppeln sich dreimal. Wie viele sind es danach?",
      "answer": 800,
      "solution": "100 · 2³ = 100 · 8 = 800."
    },
    "prerequisite": ""
  },
  {
    "id": "10-06",
    "grade": 10,
    "category": "Zahlen & Algebra",
    "title": "Exponentialgleichungen und Logarithmus",
    "description": "Zeit, Verdopplung und Halbwertszeit bestimmen.",
    "visual": {
      "type": "equation"
    },
    "steps": [
      {
        "title": "Unbekannter Exponent",
        "formula": "100 · 2ᵗ = 800",
        "text": "Hier ist nicht die Basis, sondern die Zeit t gesucht."
      },
      {
        "title": "Potenz isolieren",
        "formula": "2ᵗ = 8",
        "text": "Teile beide Seiten durch 100."
      },
      {
        "title": "Probieren oder Tabelle",
        "formula": "2¹ = 2; 2² = 4; 2³ = 8",
        "text": "Daraus folgt t = 3. Bei nicht ganzzahligen Lösungen kannst du zuerst ein Intervall finden."
      },
      {
        "title": "Logarithmus als Umkehrung",
        "formula": "t = log₂(8) = 3",
        "text": "Der Logarithmus beantwortet: Welcher Exponent macht aus der Basis 2 die Zahl 8? Allgemein bˣ = c → x = log(c)/log(b), b > 0, b ≠ 1, c > 0."
      },
      {
        "title": "Halbwertszeit",
        "formula": "0,8ᵗ = 0,5 → t ≈ 3,11",
        "text": "Ein Zerfall auf die Hälfte bei Faktor 0,8 pro Jahr dauert log(0,5)/log(0,8) ≈ 3,11 Jahre. Ganze Messzeitpunkte und kontinuierliche Modellzeit sind zu unterscheiden."
      }
    ],
    "rule": "Unbekannten Exponenten durch Potenzvergleich, systematisches Probieren oder Logarithmus bestimmen.",
    "error": "log(a+b) ist nicht log(a)+log(b).",
    "quiz": {
      "question": "2ˣ = 32. x = ?",
      "answer": 5,
      "solution": "2⁵ = 32. Also x = 5."
    },
    "prerequisite": ""
  },
  {
    "id": "10-07",
    "grade": 10,
    "category": "Geometrie",
    "title": "Sinus, Kosinus und Tangens",
    "description": "Seitenverhältnisse im rechtwinkligen Dreieck.",
    "visual": {
      "type": "trig"
    },
    "steps": [
      {
        "title": "Bezug zum Winkel",
        "formula": "Hypotenuse c; Winkel α",
        "text": "Die Hypotenuse liegt gegenüber dem rechten Winkel. Gegenkathete und Ankathete werden immer relativ zum gewählten spitzen Winkel benannt."
      },
      {
        "title": "Sinus",
        "formula": "sin(α) = Gegenkathete / Hypotenuse",
        "text": "Bei α = 30° und c = 10 cm folgt Gegenkathete = 10 · sin(30°) = 5 cm."
      },
      {
        "title": "Kosinus",
        "formula": "cos(α) = Ankathete / Hypotenuse",
        "text": "Die Ankathete ist die an α anliegende Kathete, hier 10 · cos(30°) ≈ 8,66 cm."
      },
      {
        "title": "Tangens",
        "formula": "tan(α) = Gegenkathete / Ankathete",
        "text": "Der Tangens braucht die Hypotenuse nicht. Er entspricht dem Verhältnis von Höhe zu waagerechter Entfernung."
      },
      {
        "title": "Winkel bestimmen",
        "formula": "α = arcsin(5/10) = 30°",
        "text": "Nutze die Umkehrfunktion sin⁻¹ am Taschenrechner. Für Winkel in Grad muss DEG eingestellt sein; sin⁻¹ bedeutet hier nicht 1/sin."
      },
      {
        "title": "Strategie",
        "formula": "Skizze → Seiten benennen → Verhältnis wählen → umstellen",
        "text": "Bei nicht rechtwinkligen Figuren ergänze zuerst passende rechtwinklige Teildreiecke. Runde erst am Schluss."
      }
    ],
    "rule": "sin = G/H; cos = A/H; tan = G/A im rechtwinkligen Dreieck.",
    "error": "Gegen- und Ankathete hängen vom betrachteten Winkel ab.",
    "quiz": {
      "question": "Hypotenuse 10 cm, α = 30°. Gegenkathete in cm?",
      "answer": 5,
      "solution": "G = H · sin(30°) = 10 · 0,5 = 5 cm."
    },
    "prerequisite": ""
  },
  {
    "id": "10-08",
    "grade": 10,
    "category": "Funktionen",
    "title": "Sinusfunktion und periodische Vorgänge",
    "description": "Amplitude und Periodenlänge visualisieren.",
    "visual": {
      "type": "graph",
      "kind": "sine",
      "a": 2,
      "b": 1
    },
    "steps": [
      {
        "title": "Wiederholung",
        "formula": "f(x) = sin(x)",
        "text": "Sinus beschreibt regelmäßige Schwingungen. Im Bogenmaß wiederholt sich der Verlauf nach 2π."
      },
      {
        "title": "Amplitude",
        "formula": "f(x) = 2 sin(x)",
        "text": "Die Werte liegen zwischen −2 und +2. Die Amplitude ist |a| für f(x) = a sin(bx)."
      },
      {
        "title": "Periodenlänge",
        "formula": "T = 2π/|b|",
        "text": "Bei b = 2 wird die Schwingung horizontal gestaucht und die Periode halbiert. b muss ungleich null sein."
      },
      {
        "title": "Grad und Bogenmaß",
        "formula": "2π rad = 360°",
        "text": "Bei Gradmaß gilt T = 360°/|b|. Die eingestellte Einheit muss zur Funktionsbeschreibung passen."
      },
      {
        "title": "Modellieren",
        "formula": "Auslenkung y = 2 sin(πt)",
        "text": "Die Amplitude beträgt 2 Längeneinheiten, die Periode 2 Zeiteinheiten. Lies Maxima, Minima und Wiederholungen aus dem Graphen ab."
      }
    ],
    "rule": "Bei f(x)=a sin(bx) im Bogenmaß: Amplitude |a|, Periode 2π/|b|.",
    "error": "Amplitude und der Abstand zwischen Minimum und Maximum sind nicht gleich: Letzterer ist 2|a|.",
    "quiz": {
      "question": "Wie groß ist die Amplitude von f(x) = 3 sin(2x)?",
      "answer": 3,
      "solution": "Die Amplitude ist der Betrag des Vorfaktors: |3| = 3."
    },
    "prerequisite": ""
  },
  {
    "id": "10-09",
    "grade": 10,
    "category": "Geometrie",
    "title": "Pyramide und Kegel",
    "description": "Ein Drittel des passenden Prismas oder Zylinders.",
    "visual": {
      "type": "cone"
    },
    "steps": [
      {
        "title": "Gemeinsames Prinzip",
        "formula": "V = G · h / 3",
        "text": "Pyramide und Kegel haben ein Drittel des Volumens eines Prismas bzw. Zylinders mit gleicher Grundfläche und senkrechter Höhe."
      },
      {
        "title": "Pyramide",
        "formula": "Quadratische Grundfläche: G = a²",
        "text": "Für a = 6 cm und h = 4 cm ergibt sich V = 36 · 4 : 3 = 48 cm³."
      },
      {
        "title": "Seitenhöhe einer geraden quadratischen Pyramide",
        "formula": "h_s = √(h² + (a/2)²) = 5 cm",
        "text": "Die senkrechte Körperhöhe ist nicht die Höhe der Seitenfläche. Pythagoras verbindet beide."
      },
      {
        "title": "Pyramidenoberfläche",
        "formula": "O = a² + 4 · a · h_s / 2 = 96 cm²",
        "text": "Addiere Grundfläche und die vier dreieckigen Seitenflächen."
      },
      {
        "title": "Kegel",
        "formula": "V = πr²h/3; s = √(r²+h²)",
        "text": "s ist die Mantellinie des geraden Kegels. Die abgewickelte Mantelfläche ist ein Kreissektor."
      },
      {
        "title": "Kegeloberfläche",
        "formula": "M = πrs; O = πr² + πrs",
        "text": "Verwende für das Volumen h, für die Mantelfläche s. Bei r = 3, h = 4 ist s = 5 und O = 24π."
      }
    ],
    "rule": "Volumen: Gh/3. Die Mantelfläche benötigt Seitenhöhe bzw. Mantellinie.",
    "error": "Senkrechte Höhe und schräge Seitenhöhe nicht verwechseln.",
    "quiz": {
      "question": "Eine Pyramide hat G = 30 cm² und h = 6 cm. Volumen in cm³?",
      "answer": 60,
      "solution": "V = 30 · 6 : 3 = 60 cm³."
    },
    "prerequisite": ""
  },
  {
    "id": "10-10",
    "grade": 10,
    "category": "Geometrie",
    "title": "Kugel und zusammengesetzte Körper",
    "description": "Rauminhalt und sichtbare Oberfläche berechnen.",
    "visual": {
      "type": "sphere"
    },
    "steps": [
      {
        "title": "Kugel verstehen",
        "formula": "Radius r",
        "text": "Alle Punkte der Kugeloberfläche haben denselben Abstand r vom Mittelpunkt. Der Durchmesser ist 2r."
      },
      {
        "title": "Volumen",
        "formula": "V = 4πr³/3",
        "text": "Für r = 3 cm: V = 4π · 27/3 = 36π ≈ 113,10 cm³."
      },
      {
        "title": "Oberfläche",
        "formula": "O = 4πr²",
        "text": "Für r = 3 cm: O = 36π ≈ 113,10 cm². Dass hier die Maßzahlen gleich sind, ist ein Zufall dieses Radius und bedeutet keine gleiche Größe."
      },
      {
        "title": "Halbkugel",
        "formula": "V_H = 2πr³/3",
        "text": "Die halbe Kugel hat die halbe Kugeloberfläche als gekrümmten Mantel. Für einen geschlossenen Körper kommt die Kreisgrundfläche hinzu: O_H = 3πr²."
      },
      {
        "title": "Körper zusammensetzen",
        "formula": "V_gesamt = V_Zylinder + V_Halbkugel",
        "text": "Volumen der Teile addieren oder Aussparungen abziehen. Bei der Oberfläche zählen nur außenliegende Flächen; Kontaktflächen fallen weg."
      },
      {
        "title": "Einheiten prüfen",
        "formula": "1 l = 1000 cm³",
        "text": "Wandle Längen zuerst in eine gemeinsame Einheit um und übersetze danach das Volumen in die gewünschte Einheit."
      }
    ],
    "rule": "Kugel: V=4πr³/3, O=4πr². Kontaktflächen zusammengesetzter Körper sind innen.",
    "error": "Eine geschlossene Halbkugel hat mehr als die halbe Kugeloberfläche, weil die Kreisfläche dazugehört.",
    "quiz": {
      "question": "Ein Kugelradius wird verdoppelt. Um welchen Faktor wächst das Volumen?",
      "answer": 8,
      "solution": "Das Volumen ist proportional zu r³: 2³ = 8."
    },
    "prerequisite": ""
  },
  {
    "id": "10-11",
    "grade": 10,
    "category": "Daten & Zufall",
    "title": "Vierfeldertafel und bedingte Wahrscheinlichkeit",
    "description": "Gemeinsame Anteile und veränderte Bezugsgruppen.",
    "visual": {
      "type": "fourfield"
    },
    "steps": [
      {
        "title": "Zwei Merkmale",
        "formula": "100 Kinder: 40 Radfahrer; 60 mit Helm",
        "text": "Von den 40 Radfahrern tragen 30 einen Helm. Eine Vierfeldertafel ordnet die Merkmale Rad ja/nein und Helm ja/nein."
      },
      {
        "title": "Innere Felder",
        "formula": "Rad und Helm: 30; Rad ohne Helm: 10",
        "text": "Insgesamt tragen 60 einen Helm, also haben 30 Nicht-Radfahrer einen Helm. Das letzte Feld enthält 30."
      },
      {
        "title": "Randhäufigkeiten",
        "formula": "Zeilen: 40 und 60; Spalten: 60 und 40",
        "text": "Die vier inneren Felder summieren sich zu 100. Alle Randwerte müssen zusammenpassen."
      },
      {
        "title": "Gemeinsame Wahrscheinlichkeit",
        "formula": "P(R ∩ H) = 30/100 = 0,30",
        "text": "Hier bezieht sich die Zahl auf alle Kinder."
      },
      {
        "title": "Bedingte Wahrscheinlichkeit",
        "formula": "P(H|R) = 30/40 = 0,75",
        "text": "Unter der Bedingung Radfahrer ist die Bezugsgruppe nur noch 40 Kinder groß."
      },
      {
        "title": "Richtung und Unabhängigkeit",
        "formula": "P(R|H) = 30/60 = 0,50",
        "text": "Die umgekehrte Bedingung ergibt einen anderen Wert. Unabhängigkeit würde P(H|R) = P(H) erfordern; hier gilt 0,75 ≠ 0,60."
      }
    ],
    "rule": "P(A|B) = P(A∩B)/P(B), sofern P(B)>0.",
    "error": "Bei bedingter Wahrscheinlichkeit wird die Bezugsgruppe eingeschränkt. P(A|B) ist meist nicht P(B|A).",
    "quiz": {
      "question": "Von 20 Radfahrern tragen 15 einen Helm. Anteil mit Helm unter Radfahrern in Prozent?",
      "answer": 75,
      "solution": "Die Bezugsgruppe sind 20 Radfahrer: 15/20 = 0,75 = 75 %."
    },
    "prerequisite": ""
  },
  {
    "id": "10-12",
    "grade": 10,
    "category": "Daten & Zufall",
    "title": "Kombinatorik: Möglichkeiten zählen",
    "description": "Reihenfolge und Wiederholung systematisch prüfen.",
    "visual": {
      "type": "combinations"
    },
    "steps": [
      {
        "title": "Produktprinzip",
        "formula": "3 Oberteile · 2 Hosen = 6 Kombinationen",
        "text": "Für jede erste Wahl gibt es dieselben Möglichkeiten bei der zweiten. Multipliziere die Anzahlen."
      },
      {
        "title": "Mit Wiederholung, Reihenfolge wichtig",
        "formula": "Vierstellige PIN: 10⁴ = 10 000",
        "text": "Für jede Position sind die zehn Ziffern erlaubt; auch eine führende 0 ist bei einer PIN möglich."
      },
      {
        "title": "Ohne Wiederholung, Reihenfolge wichtig",
        "formula": "3 Plätze aus 5 Personen: 5 · 4 · 3 = 60",
        "text": "Nach jeder Auswahl bleibt eine Person weniger übrig."
      },
      {
        "title": "Alle anordnen",
        "formula": "5! = 5 · 4 · 3 · 2 · 1 = 120",
        "text": "Das Ausrufezeichen heißt Fakultät. Es zählt die Anordnungen von fünf verschiedenen Objekten."
      },
      {
        "title": "Ohne Reihenfolge",
        "formula": "2er-Team aus 5: 5 · 4 / 2 = 10",
        "text": "AB und BA sind dasselbe Team. Jede Auswahl wurde zweimal gezählt, deshalb wird durch 2 geteilt."
      },
      {
        "title": "Systematisch prüfen",
        "formula": "Baumdiagramm oder Liste",
        "text": "Bei kleinen Aufgaben kannst du alle Fälle aufschreiben. Kläre immer: Darf etwas erneut gewählt werden? Spielt die Reihenfolge eine Rolle?"
      }
    ],
    "rule": "Möglichkeiten multiplizieren; ungewollte Mehrfachzählungen korrigieren.",
    "error": "Eine Teamwahl ist keine geordnete Platzvergabe.",
    "quiz": {
      "question": "3 Getränke und 4 Gerichte stehen zur Wahl. Wie viele Kombinationen aus je einem gibt es?",
      "answer": 12,
      "solution": "Für jedes der 3 Getränke gibt es 4 Gerichte: 3 · 4 = 12."
    },
    "prerequisite": ""
  },
  {
    "id": "10-13",
    "grade": 10,
    "category": "Daten & Zufall",
    "title": "Statistik kritisch lesen",
    "description": "Stichprobe, Diagrammtricks und Aussagen beurteilen.",
    "visual": {
      "type": "bars",
      "values": [
        48,
        50,
        52
      ],
      "labels": [
        "A",
        "B",
        "C"
      ]
    },
    "steps": [
      {
        "title": "Wer wurde befragt?",
        "formula": "100 Antworten sind nicht automatisch repräsentativ",
        "text": "Eine freiwillige Online-Umfrage erreicht andere Menschen als eine Zufallsauswahl. Auswahl und Nichtantworten können das Ergebnis verzerren."
      },
      {
        "title": "Achsen prüfen",
        "formula": "48, 50, 52",
        "text": "Beginnt die y-Achse bei 47, wirken die Unterschiede riesig. Bei einer Skala ab null erscheinen sie angemessen klein. Prüfe auch gleiche Intervalle."
      },
      {
        "title": "Flächen und Bilder",
        "formula": "doppelte Seitenlänge → vierfache Bildfläche",
        "text": "Wenn Bilder über die Höhe und Breite vergrößert werden, übertreiben sie Größenunterschiede."
      },
      {
        "title": "Kennzahlen hinterfragen",
        "formula": "Mittelwert oder Median?",
        "text": "Einzelne sehr hohe Einkommen können den Mittelwert stark erhöhen. Ohne Streuung und Stichprobengröße bleibt die Aussage unvollständig."
      },
      {
        "title": "Zusammenhang ist keine Ursache",
        "formula": "Eisverkauf und Sonnenbrand steigen im Sommer",
        "text": "Eine dritte Größe, hier sonniges Wetter, kann beide erklären. Korrelation allein beweist keine Kausalität."
      },
      {
        "title": "Fazit begründen",
        "formula": "Quelle + Erhebung + Darstellung + Kontext",
        "text": "Nenne, was die Daten stützen, was unsicher bleibt und welche zusätzlichen Informationen gebraucht werden."
      }
    ],
    "rule": "Vor Schlussfolgerungen Quelle, Stichprobe, Skalen und Bezugsgrößen prüfen.",
    "error": "Eine große Stichprobe behebt keine systematisch einseitige Auswahl.",
    "quiz": {
      "question": "Ein Wert steigt von 50 auf 60. Relativer Anstieg in Prozent?",
      "answer": 20,
      "solution": "Anstieg 10 bezogen auf den Ausgangswert 50: 10/50 · 100 = 20 %."
    },
    "prerequisite": ""
  },
  {
    "id": "10-14",
    "grade": 10,
    "category": "Zahlen & Algebra",
    "title": "Sachaufgaben und Prüfungsstrategie",
    "description": "Modelle wählen, sauber rechnen und Ergebnisse begründen.",
    "visual": {
      "type": "equation"
    },
    "steps": [
      {
        "title": "Verstehen",
        "formula": "Was ist gegeben? Was wird gesucht?",
        "text": "Schreibe Größen mit Einheiten auf. Markiere Bedingungen. Eine Skizze oder Tabelle hilft beim Übersetzen."
      },
      {
        "title": "Modell wählen",
        "formula": "Taxi A: 4 + 2x; Taxi B: 10 + 1,5x",
        "text": "x ist die Strecke in Kilometern. Beide Tarife bestehen aus Grundgebühr und Preis pro Kilometer."
      },
      {
        "title": "Gleichsetzen",
        "formula": "4 + 2x = 10 + 1,5x",
        "text": "Gesucht ist die Strecke, bei der beide gleich teuer sind. Subtrahiere 1,5x und 4 auf beiden Seiten."
      },
      {
        "title": "Rechnen",
        "formula": "0,5x = 6 → x = 12",
        "text": "Bei 12 km kosten beide 28 €. Darunter ist A günstiger, darüber B."
      },
      {
        "title": "Antwort und Kontrolle",
        "formula": "4 + 2 · 12 = 28; 10 + 1,5 · 12 = 28",
        "text": "Formuliere einen Antwortsatz mit Einheiten. Prüfe Größenordnung und Gültigkeitsbereich."
      },
      {
        "title": "Übertragen",
        "formula": "Begründen statt nur Ergebnis nennen",
        "text": "Erkläre deine Modellwahl und jeden entscheidenden Schritt. Für Geometrie helfen Skizzen, für Wachstum Tabellen und für Zufall Bäume. Lasse dir bei unbekannten Aufgaben Teilpunkte durch nachvollziehbare Ansätze offen."
      }
    ],
    "rule": "Verstehen → modellieren → rechnen → prüfen → Antwort mit Einheit.",
    "error": "Ein korrekt gelöstes Modell kann ungeeignet sein, wenn wichtige Bedingungen fehlen.",
    "quiz": {
      "question": "Taxi kostet 5 € Grundgebühr plus 2 € pro km. Preis für 8 km?",
      "answer": 21,
      "solution": "5 + 2 · 8 = 21 €. Die Grundgebühr wird nur einmal berechnet."
    },
    "prerequisite": ""
  }
];
