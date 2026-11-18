/* Deutsch – Hauptsprache und Fallback für alle anderen Sprachen. */
(window.BIO_I18N = window.BIO_I18N || {}).de = {
  name: 'Deutsch', dir: 'ltr',
  ui: {
    appName: 'Genetik verstehen', tagline: 'Lernen für die Kursarbeit', home: 'Start', chapters: 'Kapitel', cards: 'Karteikarten', lab: 'Übungslabor', exam: 'Probearbeit',
    glossary: 'Lexikon', legal: 'Impressum & Datenschutz', settings: 'Einstellungen', menu: 'Menü', language: 'Sprache', theme: 'Hell/Dunkel', skip: 'Zum Inhalt springen',
    footer: 'Kostenlos · ohne Werbung · ohne Cookies · ohne Tracking', badge: 'Biologie · Genetik · Kursarbeit Nr. 1',
    heroTitle: 'Genetik verstehen – Schritt für Schritt zur 1',
    heroText: 'Vom Zellkern über Chromosomen und DNA bis zur Proteinbiosynthese: alle Begriffe deiner Kursarbeit, erklärt mit Animationen, Quiz, Karteikarten und einer Probearbeit mit Musterlösungen.',
    continue: 'Weiterlernen', start: 'Jetzt starten', progress: 'Dein Fortschritt',
    memoryNote: 'Dein Fortschritt wird automatisch nur auf diesem Gerät gespeichert.',
    howTitle: 'So lernst du am besten', cardsDue: 'heute fällig', labShort: 'Unendlich viele Übungsaufgaben', best: 'Bestes Ergebnis', examShort: 'Teste dich wie in der echten Arbeit',
    chaptersIntro: 'Arbeite die Kapitel der Reihe nach durch. Jedes Kapitel hat Erklärungen, Animationen, Fachbegriffe, Prüfungsaufgaben und ein Quiz.',
    chapter: 'Kapitel', read: 'Verstanden', markRead: 'Als verstanden markieren', keyTerms: 'Fachbegriffe in diesem Kapitel',
    examTasks: 'Typische Aufgaben aus Kursarbeiten', examTasksIntro: 'Beantworte die Aufgabe erst selbst (am besten schriftlich), dann vergleiche mit der Musterlösung.',
    showSolution: 'Musterlösung zeigen', prev: 'Zurück', next: 'Weiter', quizStart: 'Quiz starten', question: 'Frage',
    correct: 'Richtig!', wrong: 'Leider falsch.', result: 'Ergebnis', gradeApprox: 'ungefähre Note',
    praise1: 'Hervorragend! Du bist bereit für die Arbeit.', praise2: 'Gut gemacht! Wiederhole die falschen Fragen noch einmal.', praise3: 'Lies das Kapitel noch einmal und versuche es dann erneut – du schaffst das!',
    reviewWrong: 'Das solltest du wiederholen', retry: 'Nochmal', quiz: 'Quiz',
    allDone: 'Alle Karten für heute geschafft! Komm morgen wieder – dann wiederholst du genau die richtigen Karten.', practiceAll: 'Trotzdem alle üben',
    cardsLeft: 'Noch', flip: 'Karte umdrehen', tapFlip: 'Tippen zum Umdrehen', dontKnow: 'Wusste ich nicht', know: 'Wusste ich',
    cardsIntro: 'Karteikarten mit Lernboxen: Was du weißt, kommt später wieder, was du nicht weißt, gleich nochmal. So bleibt alles im Langzeitgedächtnis.',
    box: 'Box', dirDefTerm: 'Erklärung → Begriff', dirTermDef: 'Begriff → Erklärung', termsCount: 'Fachbegriffe', search: 'Begriff suchen …',
    labComp: 'Komplementärstrang', labTrans: 'Transkription', labTransl: 'Translation', labCount: 'Chromosomen zählen',
    labIntro: 'Hier gibt es unendlich viele neue Aufgaben – genau die Rechen- und Übersetzungsaufgaben, die in Arbeiten drankommen.',
    codeSun: 'Code-Sonne', yourAnswer: 'Deine Antwort', check: 'Prüfen', newTask: 'Neue Aufgabe', solution: 'Lösung',
    examPart2: 'Teil 2: Anwenden', examPart3: 'Teil 3: Erklären', examPart3Intro: 'Schreibe deine Antwort auf, öffne dann die Musterlösung und hake ehrlich ab, ob du die wichtigen Punkte hattest.',
    iGotIt: 'Ich hatte die wichtigsten Punkte', examIntro: 'Die Probearbeit mischt Aufgaben aus allen Kapiteln – wie in einer echten Kursarbeit:',
    examP1: 'Teil 1: 21 Multiple-Choice-Fragen', examP2: 'Teil 2: Komplementärstrang, Transkription und Translation mit der Code-Sonne', examP3: 'Teil 3: offene Fragen mit Musterlösung',
    last: 'Letztes Mal', examStart: 'Probearbeit starten', checklist: 'Checkliste: Kann ich das?',
    memory: 'Gespeicherter Fortschritt', memoryText: 'Gelesene Abschnitte, Quiz-Ergebnisse, Karteikarten und Einstellungen werden nur lokal in deinem Browser (localStorage) gespeichert. Nichts wird an einen Server geschickt. Du kannst deinen Fortschritt sichern, auf ein anderes Gerät übertragen oder löschen.',
    export: 'Sichern (Datei)', import: 'Laden (Datei)', imported: 'Fortschritt geladen', reset: 'Alles löschen', resetConfirm: 'Wirklich den gesamten Fortschritt löschen?', resetDone: 'Fortschritt gelöscht',
    tComp: 'Ergänze den komplementären DNA-Strang.', tCompX: 'Regel: A paart mit T, G paart mit C. Der Gegenstrang läuft in Gegenrichtung (3\' → 5\').',
    tTrans: 'Transkription: Schreibe die mRNA, die an diesem codogenen DNA-Strang gebildet wird.', tTransX: 'Komplementär ablesen, aber in der RNA gibt es Uracil statt Thymin: A→U, T→A, G→C, C→G.',
    tTransl: 'Translation: Übersetze die mRNA mit der Code-Sonne in Aminosäuren (z. B. Met-Ala-Gly).', tTranslX: 'Ab dem Startcodon AUG in Dreiergruppen (Codons) lesen, in der Code-Sonne von innen nach außen. Beim Stoppcodon endet die Kette.',
    tCount0: 'Körperzellen von {sp} haben 2n = {n} Chromosomen. Wie viele Chromosomen hat eine Keimzelle (Ei- oder Spermienzelle)?',
    tCount1: 'Körperzellen von {sp} haben 2n = {n} Chromosomen. Wie viele Chromosomen hat die Zygote?',
    tCount2: 'Körperzellen von {sp} haben 2n = {n} Chromosomen. Wie viele Chromatiden hat eine Körperzelle in der Metaphase der Mitose?',
    tCount3: 'Körperzellen von {sp} haben 2n = {n} Chromosomen. Wie viele Paare homologer Chromosomen sind das?',
    tCountX: 'Keimzellen sind haploid (n = halbe Zahl). Die Zygote ist wieder diploid (2n). In der Metaphase besteht jedes Chromosom aus 2 Chromatiden.'
  },
  lab: {
    play: 'Abspielen', pause: 'Pause', back: 'Zurück', next: 'Weiter', progress: 'Fortschritt',
    tapPart: 'Tippe auf einen Teil der Zelle, um zu sehen, was er macht.',
    c_cellmem: 'Zellmembran', c_cyto: 'Zellplasma (Cytoplasma)', c_ribo: 'Ribosomen', c_nuc: 'Zellkern mit Kernmembran', c_pore: 'Kernpore', c_nucleolus: 'Kernkörperchen', c_chromatin: 'Chromatin(fäden)',
    cd_cellmem: 'Grenzt die Zelle nach außen ab und kontrolliert, welche Stoffe hinein und hinaus gelangen.',
    cd_cyto: 'Flüssiger Innenraum der Zelle. Hier liegen die Zellorganellen, z. B. die Ribosomen.',
    cd_ribo: 'Die „Eiweißfabriken“ der Zelle: Hier werden bei der Translation Aminosäuren zu Proteinen verknüpft.',
    cd_nuc: 'Der Zellkern ist die Steuerzentrale und enthält die Erbinformation (DNA). Die Kernmembran ist eine Doppelmembran, die den Kern vom Zellplasma trennt.',
    cd_pore: 'Öffnungen in der Kernmembran. Durch sie wandern Stoffe zwischen Kern und Zellplasma, z. B. die mRNA nach draußen zu den Ribosomen.',
    cd_nucleolus: 'Das Kernkörperchen (Nucleolus) ist ein dichter Bereich im Kern. Hier werden die Bausteine der Ribosomen hergestellt.',
    cd_chromatin: 'Chromatin = lange, dünne, entspiralisierte Fäden aus DNA und Proteinen. So liegt die DNA vor, wenn die Zelle nicht teilt (Arbeitsform).',
    workForm: 'Arbeitsform: Chromatin', transportForm: 'Transportform: Chromosom', condensing: 'spiralisiert sich',
    condCap0: 'Arbeitsform: Die DNA liegt als lange, lockere Chromatinfäden vor. So kann die Zelle die Gene ablesen.',
    condCap1: 'Vor der Kernteilung spiralisiert (verdichtet) sich das Chromatin immer stärker – wie ein Telefonkabel, das sich aufrollt.',
    condCap2: 'Transportform: kurze, dicke Chromosomen. So kann die DNA bei der Mitose sicher verteilt werden, ohne sich zu verheddern.',
    shortArm: 'kurzer Chromosomenarm', longArm: 'langer Chromosomenarm', centromere: 'Centromer', chromatid: 'Chromatid',
    chd_chromatid: 'Eine Chromatide ist eine „Hälfte“ eines 2-Chromatid-Chromosoms. Sie enthält ein komplettes DNA-Molekül. Beide Chromatiden sind identisch (Schwesterchromatiden).',
    chd_centromere: 'Die Einschnürungsstelle, an der die beiden Chromatiden zusammenhängen. Hier setzen bei der Mitose die Spindelfasern an.',
    chd_short: 'Der Teil des Chromosoms auf der einen Seite des Centromers. Weil das Centromer meist nicht genau in der Mitte liegt, gibt es einen kurzen …',
    chd_long: '… und einen langen Chromosomenarm.',
    oneChromatid: '1-Chromatid-Chromosom', twoChromatid: '2-Chromatid-Chromosom',
    oneChromatidD: 'Besteht aus einem DNA-Molekül. So liegen Chromosomen nach der Mitose (und in G1) vor.',
    twoChromatidD: 'Nach der Replikation verdoppelt: zwei identische Chromatiden, am Centromer verbunden. So sieht man Chromosomen in der Metaphase.',
    haploid: 'haploid', diploid: 'diploid', male: 'Mann', female: 'Frau', chromosomes: 'Chromosomen', gonosomes: 'Gonosomen (Geschlechtschromosomen)',
    gonoD: 'Das 23. Paar bestimmt das Geschlecht: Frau XX, Mann XY. Das Y-Chromosom ist viel kleiner als das X-Chromosom.',
    pair: 'Paar', autosomes: 'Autosom', hapPairD: 'In einer haploiden Keimzelle gibt es von jedem Paar nur ein Chromosom (n = 23).',
    homologD: 'Die zwei Chromosomen eines Paares sind homolog: gleich groß, gleiche Form, gleiche Gene an gleichen Stellen. Eins stammt von der Mutter, eins vom Vater.',
    fromMother: 'von der Mutter', fromFather: 'vom Vater', tapPair: 'Tippe auf ein Chromosomenpaar.',
    doubleHelix: 'DNA-Doppelhelix', phosphate: 'Phosphat', sugar: 'Desoxyribose (Zucker)', sugarShort: 'Zucker', hbond: 'Wasserstoffbrücken', base: 'Base', nucleotide: 'Nucleotid',
    baseA: 'Adenin', baseT: 'Thymin', baseG: 'Guanin', baseC: 'Cytosin', twist: 'Verdrillung',
    twistHint: 'Schiebe den Regler nach links: Die Doppelhelix wird zur „Strickleiter“ entdreht.',
    strand1: 'Vorgegebener Strang', strand2: 'Dein komplementärer Strang', pairDone: 'Perfekt! Der Strang ist komplett.', pairWrong: 'Nicht ganz – denk an A–T und G–C.', pairHint: 'Tippe die passende Base für das markierte Feld.', newStrandBtn: 'Neuer Strang',
    helicase: 'Helicase', polymerase: 'DNA-Polymerase', oldStrand: 'alter (Eltern-)Strang', newStrand: 'neuer Strang',
    repCap: ['Ausgangssituation: ein DNA-Doppelstrang.', 'Das Enzym Helicase entspiralisiert die DNA und trennt die Basenpaare wie einen Reißverschluss (die Wasserstoffbrücken lösen sich).', 'Die DNA-Polymerase lagert freie Nucleotide komplementär an (A–T, G–C) und verknüpft sie zu einem neuen Strang.', 'Ergebnis: zwei identische DNA-Moleküle. Jedes besteht aus einem alten und einem neuen Strang (semikonservativ).'],
    cellCycle: 'Zellzyklus', interphase: 'Interphase', tapPhase: 'Tippe auf eine Phase.',
    cy_G1: 'G1-Phase', cy_S: 'S-Phase (Synthese)', cy_G2: 'G2-Phase', cy_M: 'M-Phase (Mitose + Zellteilung)',
    cyd_G1: 'Die Tochterzelle wächst, bildet Zellorganellen und Proteine. Chromosomen bestehen aus 1 Chromatide.',
    cyd_S: 'Replikation: Die DNA wird verdoppelt. Danach bestehen alle Chromosomen aus 2 identischen Chromatiden.',
    cyd_G2: 'Die Zelle bereitet sich auf die Teilung vor (z. B. Bildung von Teilungsproteinen).',
    cyd_M: 'Kernteilung (Mitose: Pro-, Meta-, Ana-, Telophase) und anschließend Teilung des Zellplasmas.',
    equator: 'Äquatorialebene',
    mitPh: ['Interphase', 'Prophase', 'Metaphase', 'Anaphase', 'Telophase', 'Zellteilung'],
    mitCap: [
      'Die DNA ist bereits verdoppelt (S-Phase). Sie liegt als Chromatin vor; Kernmembran und Kernkörperchen sind sichtbar.',
      'Die Chromosomen spiralisieren sich und werden sichtbar (2 Chromatiden). Kernmembran und Kernkörperchen lösen sich auf. Die Teilungskörperchen wandern zu den Polen, der Spindelapparat entsteht.',
      'Die Chromosomen ordnen sich in der Äquatorialebene an. Spindelfasern von beiden Polen setzen an den Centromeren an.',
      'Die Centromere teilen sich. Die Spindelfasern verkürzen sich und ziehen die Chromatiden (Schwesterchromatiden) zu den entgegengesetzten Polen.',
      'An jedem Pol liegt ein vollständiger Satz 1-Chromatid-Chromosomen. Sie entspiralisieren sich, Kernmembran und Kernkörperchen bilden sich neu, der Spindelapparat verschwindet.',
      'Das Zellplasma wird geteilt: zwei genetisch identische Tochterzellen mit derselben Chromosomenzahl wie die Mutterzelle.'
    ],
    rnaPol: 'RNA-Polymerase', codingStrand: 'codierender Strang', codogenic: 'codogener Strang (Matrize)',
    trCap: ['Im Zellkern: Ein Gen auf der DNA soll abgelesen werden.', 'Die RNA-Polymerase entspiralisiert die DNA an diesem Gen und trennt die beiden Stränge.', 'Sie liest den codogenen Strang ab und baut komplementär eine mRNA (A→U, T→A, G→C, C→G). Hinter ihr schließt sich die DNA wieder.', 'Die fertige mRNA löst sich und verlässt den Zellkern durch eine Kernpore – zu den Ribosomen.'],
    codon: 'Codon', ribosome: 'Ribosom',
    tlCap: ['Start: Das Ribosom bindet an die mRNA. Am Startcodon AUG legt sich eine tRNA mit dem passenden Anticodon (UAC) an – sie bringt Methionin.', 'Die nächste tRNA bringt die passende Aminosäure (Anticodon passt komplementär zum Codon). Die Aminosäuren werden verknüpft, das Ribosom rückt ein Triplett weiter.', 'Stopp: Für das Stoppcodon gibt es keine tRNA. Die fertige Aminosäurekette (Protein) wird freigesetzt.'],
    codonInput: 'Codon eingeben:', stopInfo: 'Stoppcodon: Hier endet die Translation.', startInfo: 'Startcodon: Hier beginnt die Translation.', readOrder: 'Lesen von innen nach außen', inner: 'innen', outer: 'außen',
    sp_human: 'Menschen', sp_dog: 'Hunden', sp_chimp: 'Schimpansen', sp_potato: 'Kartoffeln', sp_fly: 'Fruchtfliegen', sp_horse: 'Pferden', sp_cat: 'Katzen', sp_maize: 'Mais'
  },
  how: [
    ['Kapitel lesen', 'Lies jeden Abschnitt, spiele die Animation ab und markiere ihn als verstanden.'],
    ['Quiz machen', 'Am Ende jedes Kapitels prüfst du dich. Ziel: mindestens 90 %.'],
    ['Karteikarten', 'Jeden Tag ein paar Minuten – die Lernboxen merken sich, was du noch üben musst.'],
    ['Probearbeit', 'Kurz vor der Kursarbeit: Probearbeit schreiben und die Checkliste abhaken.']
  ],
  checklist: [
    'Ich kann den Bau des Zellkerns beschreiben (Kernmembran, Kernporen, Kernkörperchen, Chromatin) und die Funktionen nennen.',
    'Ich kann den Unterschied zwischen Arbeitsform (Chromatin) und Transportform (Chromosom) erklären.',
    'Ich kann ein 2-Chromatid-Chromosom zeichnen und beschriften (Chromatid, Centromer, Chromosomenarme).',
    'Ich kann Gen, Genom, Chromosomensatz und artspezifisch erklären.',
    'Ich kann ein Karyogramm beschreiben und Autosomen, Gonosomen, homolog, haploid und diploid erklären.',
    'Ich kann den Bau der DNA (Doppelhelix, Nucleotid aus Phosphat, Desoxyribose und Base) beschreiben und weiß, wer das Modell entdeckt hat.',
    'Ich kann zu einem DNA-Strang den komplementären Strang aufschreiben (A–T, G–C).',
    'Ich kann den Ablauf der Replikation mit den Enzymen Helicase und DNA-Polymerase erklären.',
    'Ich kann den Zellzyklus mit Interphase (G1, S, G2) und Mitose beschreiben.',
    'Ich kann die vier Phasen der Mitose in der richtigen Reihenfolge beschreiben und zeichnen.',
    'Ich kann DNA und RNA vergleichen (Zucker, Basen, Stränge).',
    'Ich kann Transkription und Translation erklären (Ort, Ablauf, mRNA, tRNA, Ribosomen).',
    'Ich kann mit der Code-Sonne eine mRNA in eine Aminosäurekette übersetzen.',
    'Ich kann erklären, was „der genetische Code ist universell“ bedeutet und warum das wichtig ist.'
  ],
  chapters: [
    {
      id: 'zellkern', title: 'Genetik & Zellkern', sub: 'Genetik, Zellkern, Kernmembran, Kernporen, Kernkörperchen, Chromatin',
      sections: [
        { h: 'Was ist Genetik?', html: '<p><span class="term">Genetik</span> ist die <b>Vererbungslehre</b>. Sie untersucht, wie Merkmale (z. B. Augenfarbe, Blutgruppe) von Eltern an Nachkommen weitergegeben werden und wie die Erbinformation in den Zellen gespeichert, kopiert und benutzt wird.</p><p>Die Erbinformation steckt in einem Molekül namens <b>DNA</b>. Bei Pflanzen, Tieren und Menschen liegt die DNA hauptsächlich im <b>Zellkern</b>.</p><div class="key"><b>Merke:</b> Genetik = Vererbungslehre. Die Erbinformation (DNA) liegt im Zellkern.</div>' },
        { h: 'Der Zellkern – die Steuerzentrale', html: '<p>Der <span class="term">Zellkern</span> (Nucleus) steuert alle Lebensvorgänge der Zelle, denn er enthält die Baupläne für alle Proteine. Schau dir den Aufbau an und tippe auf die Teile:</p><div data-anim="cell"></div><table class="t"><tr><th>Bestandteil</th><th>Bau</th><th>Aufgabe</th></tr><tr><td><b>Kernmembran</b> (Kernhülle)</td><td>Doppelmembran (zwei Schichten)</td><td>trennt den Kerninhalt vom Zellplasma</td></tr><tr><td><b>Kernporen</b></td><td>Öffnungen in der Kernmembran</td><td>Stoffaustausch zwischen Kern und Zellplasma, z. B. verlässt die mRNA den Kern; Nucleotide und Enzyme gelangen hinein</td></tr><tr><td><b>Kernkörperchen</b> (Nucleolus)</td><td>dichter, dunkler Bereich im Kern</td><td>Bildung der Bausteine der Ribosomen</td></tr><tr><td><b>Chromatin</b> (Chromatinfäden)</td><td>lange, dünne Fäden aus DNA und Proteinen</td><td>enthält die Erbinformation (Gene)</td></tr><tr><td><b>Kernplasma</b></td><td>Flüssigkeit im Kern</td><td>füllt den Kern aus</td></tr></table>' },
        { h: 'Chromatin – die Arbeitsform der DNA', html: '<p>Wenn sich eine Zelle <b>nicht</b> teilt, liegt die DNA als <span class="term">Chromatin</span> vor: lange, dünne, <b>entspiralisierte</b> Fäden, die wie ein Wollknäuel im Kern verteilt sind. Unter dem Lichtmikroskop sieht man sie nur als feine, körnige Struktur.</p><p>Man nennt das die <span class="term">Arbeitsform</span> (Arbeitsphase), weil die Zelle die Gene in diesem lockeren Zustand <b>ablesen</b> kann, um Proteine herzustellen.</p><div class="tip"><b>Eselsbrücke:</b> Ein Kochbuch kann man nur lesen, wenn es aufgeschlagen ist – nicht, wenn es fest zugeklebt im Umzugskarton liegt. Chromatin = aufgeschlagenes Buch.</div>' }
      ],
      terms: [
        ['Genetik', 'Vererbungslehre: Wissenschaft von der Vererbung von Merkmalen und von der Erbinformation.'],
        ['Zellkern', 'Steuerzentrale der Zelle; enthält die Erbinformation (DNA).'],
        ['Kernmembran', 'Doppelmembran, die den Zellkern vom Zellplasma abgrenzt.'],
        ['Kernporen', 'Öffnungen in der Kernmembran für den Stoffaustausch (z. B. mRNA nach draußen).'],
        ['Kernkörperchen', 'Nucleolus; dichter Bereich im Kern, in dem die Bausteine der Ribosomen gebildet werden.'],
        ['Chromatin(fäden)', 'Lange, dünne, entspiralisierte Fäden aus DNA und Proteinen; Arbeitsform der Erbinformation.']
      ],
      quiz: [
        { q: 'Was bedeutet „Genetik“?', o: ['Vererbungslehre', 'Zelllehre', 'Lehre von den Krankheiten', 'Lehre von den Organen'], c: 0, e: 'Genetik ist die Vererbungslehre.' },
        { q: 'Welche Aufgabe haben die Kernporen?', o: ['Stoffaustausch zwischen Zellkern und Zellplasma', 'Bildung von Ribosomen', 'Energiegewinnung', 'Verdopplung der DNA'], c: 0, e: 'Durch die Kernporen gelangt z. B. die mRNA aus dem Kern heraus.' },
        { q: 'Was wird im Kernkörperchen (Nucleolus) gebildet?', o: ['Bausteine der Ribosomen', 'DNA', 'Chromosomen', 'Zellmembran'], c: 0, e: 'Das Kernkörperchen stellt die Bausteine (Untereinheiten) der Ribosomen her.' },
        { q: 'Woraus besteht die Kernmembran?', o: ['Aus einer Doppelmembran', 'Aus einer Zellwand aus Cellulose', 'Aus DNA', 'Aus einer einzigen dünnen Schicht Eiweiß'], c: 0, e: 'Die Kernmembran (Kernhülle) ist eine Doppelmembran mit Poren.' },
        { q: 'Was ist Chromatin?', o: ['Entspiralisierte Fäden aus DNA und Proteinen', 'Stark verdichtete Chromosomen', 'Der Zucker der DNA', 'Ein Enzym'], c: 0, e: 'Chromatin ist die lockere Arbeitsform der DNA.' },
        { q: 'Warum heißt Chromatin „Arbeitsform“?', o: ['Weil die Gene in diesem lockeren Zustand abgelesen werden können', 'Weil die Zelle sich dann gerade teilt', 'Weil es Energie herstellt', 'Weil es nur in Muskelzellen vorkommt'], c: 0, e: 'Nur wenn die DNA entspiralisiert ist, kann die Information abgelesen werden.' },
        { q: 'Wo liegt die Erbinformation bei Tieren und Pflanzen hauptsächlich?', o: ['Im Zellkern', 'In der Zellmembran', 'In den Ribosomen', 'Im Zellplasma'], c: 0, e: 'Die DNA liegt im Zellkern.' }
      ],
      tasks: [
        { q: 'Beschreibe den Bau des Zellkerns und nenne die Aufgaben der Bestandteile.', a: '<ul><li><b>Kernmembran:</b> Doppelmembran, grenzt den Kern vom Zellplasma ab.</li><li><b>Kernporen:</b> Öffnungen in der Kernmembran; Stoffaustausch (z. B. mRNA hinaus).</li><li><b>Kernkörperchen:</b> Bildung der Ribosomen-Bausteine.</li><li><b>Chromatin:</b> DNA + Proteine; enthält die Erbinformation.</li></ul>Funktion insgesamt: Steuerzentrale der Zelle.' },
        { q: 'Erkläre, warum man den Zellkern als „Steuerzentrale“ der Zelle bezeichnet.', a: 'Der Zellkern enthält die DNA mit den Genen. Gene sind Baupläne für Proteine. Proteine (z. B. Enzyme) steuern fast alle Vorgänge in der Zelle. Wer die Baupläne hat, steuert also die Zelle.' }
      ]
    },
    {
      id: 'chromosomen', title: 'Chromosomen', sub: 'Chromosom, Chromosomenarm, Chromatid, Centromer, Arbeits- und Transportform, Gen, Genom',
      sections: [
        { h: 'Vom Chromatin zum Chromosom', html: '<p>Bevor sich eine Zelle teilt, <b>spiralisiert</b> (verdichtet) sich das Chromatin immer stärker. Die langen Fäden werden zu kurzen, dicken <span class="term">Chromosomen</span>, die man im Lichtmikroskop gut sehen und anfärben kann („chroma“ = Farbe, „soma“ = Körper).</p><div data-anim="condense"></div><table class="t"><tr><th></th><th>Arbeitsform</th><th>Transportform</th></tr><tr><td>Name</td><td>Chromatin</td><td>Chromosom</td></tr><tr><td>Zustand</td><td>entspiralisiert, lang, dünn</td><td>stark spiralisiert, kurz, dick</td></tr><tr><td>Wann?</td><td>Interphase (keine Teilung)</td><td>während der Kernteilung (Mitose)</td></tr><tr><td>Wozu?</td><td>Gene ablesen (Proteine herstellen)</td><td>DNA sicher auf Tochterzellen verteilen</td></tr></table><div class="tip"><b>Vergleich:</b> 2 m DNA pro Zelle müssen in einen Kern von ca. 0,006 mm passen. Zum Umziehen packt man Wolle zu festen Knäueln – so wie die DNA zum Chromosom.</div>' },
        { h: 'Bau eines Chromosoms', html: '<p>Nach der Verdopplung der DNA (Replikation) besteht ein Chromosom aus <b>zwei identischen Hälften</b>, den <span class="term">Chromatiden</span> (Schwesterchromatiden). Sie hängen an einer Einschnürung zusammen, dem <span class="term">Centromer</span>. Das Centromer teilt das Chromosom in zwei <span class="term">Chromosomenarme</span> (meist einen kurzen und einen langen).</p><div data-anim="chromosome"></div><ul><li><b>1-Chromatid-Chromosom:</b> ein DNA-Doppelstrang (nach der Mitose, in der G1-Phase).</li><li><b>2-Chromatid-Chromosom:</b> zwei identische DNA-Doppelstränge (nach der Replikation, in Pro- und Metaphase). Typische „X-Form“.</li></ul><div class="warn"><b>Achtung Falle:</b> Ein 2-Chromatid-Chromosom ist <b>ein</b> Chromosom (nicht zwei)! Man zählt Chromosomen an den Centromeren.</div>' },
        { h: 'Gen und Genom', html: '<p>Ein <span class="term">Gen</span> ist ein <b>Abschnitt der DNA</b>, der die Information für ein bestimmtes Protein (und damit oft für ein Merkmal) enthält. Ein Chromosom trägt viele hundert bis tausend Gene hintereinander – wie Sätze in einem Buch.</p><p>Das <span class="term">Genom</span> ist die <b>Gesamtheit aller Erbinformationen</b> (der gesamten DNA) eines Lebewesens. Das menschliche Genom besteht aus ca. 3,2 Milliarden Basenpaaren und enthält etwa 20 000 Gene.</p><div class="key"><b>Merke – vom Großen zum Kleinen:</b> Genom → Chromosomen → DNA → Gene → Basen (Buchstaben).</div><div class="tip"><b>Bild:</b> Genom = ganze Bibliothek, Chromosom = ein Buch, Gen = ein Rezept/Satz, Base = ein Buchstabe.</div>' }
      ],
      terms: [
        ['Chromosomen', 'Stark spiralisierte, kurze und dicke DNA-Protein-Strukturen; Transportform der DNA während der Kernteilung.'],
        ['Chromosomenarm', 'Teil des Chromosoms links bzw. rechts vom Centromer (kurzer und langer Arm).'],
        ['Chromatid', 'Eine von zwei identischen Hälften eines 2-Chromatid-Chromosoms; enthält ein DNA-Molekül.'],
        ['Centromer', 'Einschnürungsstelle, an der die Chromatiden zusammenhängen; Ansatzstelle der Spindelfasern.'],
        ['Arbeitsform', 'Entspiralisierte DNA (Chromatin) in der Interphase; Gene können abgelesen werden.'],
        ['Transportform', 'Stark spiralisierte DNA (Chromosom) bei der Kernteilung; DNA wird sicher verteilt.'],
        ['Gen', 'Abschnitt der DNA mit der Information für ein Protein (bzw. ein Merkmal).'],
        ['Genom', 'Gesamtheit der Erbinformation (gesamte DNA) eines Lebewesens.']
      ],
      quiz: [
        { q: 'Was ist ein Centromer?', o: ['Die Einschnürung, an der die beiden Chromatiden zusammenhängen', 'Das Ende eines Chromosoms', 'Ein Zellorganell im Zellplasma', 'Ein anderer Name für Gen'], c: 0, e: 'Am Centromer hängen die Schwesterchromatiden zusammen; dort setzen die Spindelfasern an.' },
        { q: 'Woraus besteht ein 2-Chromatid-Chromosom?', o: ['Aus zwei identischen Chromatiden', 'Aus zwei homologen Chromosomen von Vater und Mutter', 'Aus zwei Genen', 'Aus RNA und DNA'], c: 0, e: 'Die zwei Chromatiden sind identische Kopien (nach der Replikation).' },
        { q: 'Wann liegt die DNA in der Transportform vor?', o: ['Während der Kernteilung (Mitose)', 'In der G1-Phase', 'Während der Transkription', 'Immer'], c: 0, e: 'Zur Teilung wird die DNA kompakt verpackt.' },
        { q: 'Was ist ein Gen?', o: ['Ein Abschnitt der DNA mit der Information für ein Protein', 'Die gesamte DNA eines Lebewesens', 'Ein ganzes Chromosom', 'Eine Aminosäure'], c: 0, e: 'Gen = DNA-Abschnitt, Genom = gesamte Erbinformation.' },
        { q: 'Was bezeichnet man als Genom?', o: ['Die Gesamtheit der Erbinformation eines Lebewesens', 'Ein einzelnes Gen', 'Den Zellkern', 'Die Chromosomen eines Paares'], c: 0, e: 'Das Genom ist die komplette DNA.' },
        { q: 'Warum spiralisiert sich die DNA vor der Teilung?', o: ['Damit sie sicher und ohne Verheddern auf die Tochterzellen verteilt werden kann', 'Damit sie besser abgelesen werden kann', 'Damit sie sich verdoppelt', 'Damit sie den Kern verlassen kann'], c: 0, e: 'Kompakte Chromosomen lassen sich gut transportieren.' },
        { q: 'Wie viele DNA-Moleküle enthält eine Chromatide?', o: ['Eins', 'Zwei', '46', 'Keins'], c: 0, e: 'Jede Chromatide enthält genau ein DNA-Molekül (einen Doppelstrang).' },
        { q: 'Was teilt ein Chromosom in einen kurzen und einen langen Arm?', o: ['Das Centromer', 'Die Kernpore', 'Das Kernkörperchen', 'Das Ribosom'], c: 0, e: 'Das Centromer liegt meist nicht in der Mitte → kurzer und langer Chromosomenarm.' }
      ],
      tasks: [
        { q: 'Zeichne ein 2-Chromatid-Chromosom und beschrifte es.', a: 'X-förmige Zeichnung mit: <b>Chromatid</b> (2×, identisch), <b>Centromer</b> (Einschnürung in der Mitte), <b>kurzer</b> und <b>langer Chromosomenarm</b>. Tipp: Nutze die Animation im Kapitel als Vorlage.' },
        { q: 'Vergleiche Arbeitsform und Transportform der DNA.', a: '<b>Arbeitsform (Chromatin):</b> entspiralisiert, lange dünne Fäden, in der Interphase, Gene werden abgelesen.<br><b>Transportform (Chromosom):</b> stark spiralisiert, kurz und dick, während der Mitose, sicherer Transport auf die Tochterzellen.' },
        { q: 'Erkläre den Unterschied zwischen Gen und Genom.', a: 'Ein <b>Gen</b> ist ein einzelner DNA-Abschnitt mit der Information für ein Protein. Das <b>Genom</b> ist die gesamte Erbinformation eines Lebewesens, also alle Gene (und die restliche DNA) zusammen.' }
      ]
    },
    {
      id: 'karyogramm', title: 'Chromosomensatz & Karyogramm', sub: 'Chromosomensatz, artspezifisch, Zygote, Karyogramm, Autosomen, Gonosomen, homolog, haploid, diploid',
      sections: [
        { h: 'Der Chromosomensatz ist artspezifisch', html: '<p>Der <span class="term">Chromosomensatz</span> ist die Gesamtheit aller Chromosomen in einer Zelle. Jede Art hat eine ganz bestimmte, gleichbleibende Chromosomenzahl – sie ist <span class="term">artspezifisch</span>.</p><table class="t"><tr><th>Lebewesen</th><th>Chromosomen in Körperzellen (2n)</th></tr><tr><td>Mensch</td><td>46</td></tr><tr><td>Schimpanse</td><td>48</td></tr><tr><td>Kartoffel</td><td>48</td></tr><tr><td>Hund</td><td>78</td></tr><tr><td>Pferd</td><td>64</td></tr><tr><td>Katze</td><td>38</td></tr><tr><td>Fruchtfliege</td><td>8</td></tr></table><div class="warn"><b>Achtung:</b> Die Anzahl der Chromosomen sagt <b>nichts</b> darüber aus, wie „hoch entwickelt“ ein Lebewesen ist (Kartoffel = Schimpanse = 48!).</div>' },
        { h: 'Das Karyogramm', html: '<p>Ein <span class="term">Karyogramm</span> ist eine <b>geordnete Darstellung</b> aller Chromosomen einer Zelle. Dazu fotografiert man Chromosomen in der Metaphase (dann sind sie am stärksten verdichtet) und sortiert sie nach <b>Größe</b>, <b>Lage des Centromers</b> und <b>Bandenmuster</b>.</p><div data-anim="karyo"></div><ul><li><span class="term">Autosomen</span>: die Chromosomenpaare 1 bis 22. Sie sind bei Mann und Frau gleich.</li><li><span class="term">Gonosomen</span> (Geschlechtschromosomen): das 23. Paar. <b>Frau: XX</b>, <b>Mann: XY</b>.</li></ul><p>Mit einem Karyogramm kann man das Geschlecht bestimmen und Veränderungen der Chromosomenzahl erkennen (z. B. Trisomie 21: das Chromosom 21 ist dreimal vorhanden).</p>' },
        { h: 'Homolog, diploid und haploid', html: '<p>In unseren Körperzellen gibt es jedes Chromosom <b>zweimal</b>: eins haben wir von der Mutter, eins vom Vater bekommen. Die beiden Chromosomen eines Paares heißen <span class="term">homolog</span>: Sie sind gleich groß, haben das Centromer an der gleichen Stelle und tragen die <b>gleichen Gene an den gleichen Orten</b> (die Ausprägung kann aber verschieden sein, z. B. Augenfarbe blau/braun).</p><ul><li><span class="term">diploid (2n)</span>: doppelter Chromosomensatz. Alle Körperzellen des Menschen: <b>2n = 46</b> (23 Paare).</li><li><span class="term">haploid (n)</span>: einfacher Chromosomensatz, von jedem Paar nur ein Chromosom. Keimzellen (Eizelle, Spermienzelle): <b>n = 23</b>.</li></ul><div class="key"><b>Merke:</b> di = zwei, haplo = einfach. Körperzellen diploid, Keimzellen haploid.</div>' },
        { h: 'Die Zygote', html: '<p>Bei der Befruchtung verschmelzen eine haploide Eizelle (n = 23) und eine haploide Spermienzelle (n = 23). Es entsteht die <span class="term">Zygote</span> (befruchtete Eizelle). Sie ist wieder <b>diploid</b>: 23 + 23 = <b>46</b> Chromosomen.</p><p>Aus der Zygote entstehen durch viele <b>Mitosen</b> alle Billionen Körperzellen. Deshalb haben alle Körperzellen dieselbe Erbinformation.</p><div class="tip">Ei (n) + Spermium (n) → Zygote (2n) → Mitosen → Körperzellen (2n)</div><p class="muted">Warum ist es wichtig, dass Keimzellen haploid sind? Sonst würde sich die Chromosomenzahl in jeder Generation verdoppeln (46 → 92 → 184 …).</p>' }
      ],
      terms: [
        ['Chromosomensatz', 'Gesamtheit der Chromosomen in einer Zelle.'],
        ['artspezifisch', 'Typisch und gleichbleibend für eine Art (z. B. Chromosomenzahl: Mensch 46).'],
        ['Zygote', 'Befruchtete Eizelle; entsteht aus Ei- und Spermienzelle, ist diploid.'],
        ['Karyogramm', 'Geordnete Darstellung aller Chromosomen einer Zelle nach Größe, Centromerlage und Bandenmuster.'],
        ['Autosomen', 'Chromosomen, die nicht das Geschlecht bestimmen (beim Menschen Paare 1–22).'],
        ['Gonosomen', 'Geschlechtschromosomen X und Y (Frau XX, Mann XY).'],
        ['homolog', 'Zwei Chromosomen eines Paares (je eins von Mutter und Vater) mit gleicher Größe, Form und gleichen Genorten.'],
        ['haploid', 'Einfacher Chromosomensatz (n); z. B. Keimzellen des Menschen: 23.'],
        ['diploid', 'Doppelter Chromosomensatz (2n); z. B. Körperzellen des Menschen: 46.']
      ],
      quiz: [
        { q: 'Wie viele Chromosomen hat eine menschliche Körperzelle?', o: ['46', '23', '48', '92'], c: 0, e: '2n = 46, also 23 Paare.' },
        { q: 'Wie viele Chromosomen hat eine menschliche Eizelle?', o: ['23', '46', '22', '44'], c: 0, e: 'Keimzellen sind haploid: n = 23.' },
        { q: 'Was bedeutet „homolog“?', o: ['Zwei Chromosomen eines Paares mit gleichen Genorten – eins von der Mutter, eins vom Vater', 'Zwei identische Chromatiden eines Chromosoms', 'Die Geschlechtschromosomen', 'Chromosomen mit unterschiedlicher Größe'], c: 0, e: 'Homologe Chromosomen stammen von verschiedenen Eltern, die Schwesterchromatiden sind dagegen identische Kopien.' },
        { q: 'Welche Gonosomen hat ein Mann?', o: ['XY', 'XX', 'YY', 'X0'], c: 0, e: 'Frau XX, Mann XY.' },
        { q: 'Was sind Autosomen?', o: ['Die Chromosomen 1–22, die nicht das Geschlecht bestimmen', 'Geschlechtschromosomen', 'Chromosomen in Bakterien', 'Chromosomen, die nur in Keimzellen vorkommen'], c: 0, e: '22 Autosomenpaare + 1 Gonosomenpaar = 23 Paare.' },
        { q: 'Was ist eine Zygote?', o: ['Die befruchtete Eizelle', 'Eine unbefruchtete Eizelle', 'Eine Spermienzelle', 'Ein Zellorganell'], c: 0, e: 'Die Zygote ist diploid und entsteht bei der Befruchtung.' },
        { q: 'Was bedeutet „artspezifisch“ bei der Chromosomenzahl?', o: ['Jede Art hat eine bestimmte, gleichbleibende Chromosomenzahl', 'Je mehr Chromosomen, desto höher entwickelt', 'Alle Arten haben 46 Chromosomen', 'Die Zahl ändert sich mit dem Alter'], c: 0, e: 'Z. B. Mensch 46, Hund 78, Fruchtfliege 8.' },
        { q: 'Wonach werden die Chromosomen im Karyogramm geordnet?', o: ['Nach Größe, Lage des Centromers und Bandenmuster', 'Nach Farbe des Zellkerns', 'Nach Alphabet', 'Zufällig'], c: 0, e: 'Größe, Centromerlage und Bandenmuster.' },
        { q: 'Eine Kartoffel und ein Schimpanse haben beide 48 Chromosomen. Was folgt daraus?', o: ['Die Chromosomenzahl sagt nichts über die Entwicklungshöhe aus', 'Kartoffeln sind mit Schimpansen eng verwandt', 'Beide haben dieselben Gene', 'Das ist ein Messfehler'], c: 0, e: 'Wichtig ist der Inhalt (die Gene), nicht die Anzahl der Chromosomen.' }
      ],
      tasks: [
        { q: 'Erkläre die Begriffe haploid und diploid und nenne je ein Beispiel beim Menschen.', a: '<b>Diploid (2n):</b> doppelter Chromosomensatz, jedes Chromosom liegt als homologes Paar vor – Körperzellen (46).<br><b>Haploid (n):</b> einfacher Chromosomensatz – Keimzellen (Ei- und Spermienzelle, 23).' },
        { q: 'Beschreibe, was ein Karyogramm ist und welche Informationen man daraus ablesen kann.', a: 'Geordnete Darstellung der Chromosomen einer Zelle (in der Metaphase fotografiert), sortiert nach Größe, Centromerlage und Bandenmuster in 22 Autosomenpaare und die Gonosomen. Man kann das <b>Geschlecht</b> (XX/XY) und <b>Abweichungen der Chromosomenzahl</b> (z. B. Trisomie 21) erkennen.' },
        { q: 'Erkläre, warum die Zygote 46 Chromosomen hat.', a: 'Eizelle und Spermienzelle sind haploid (je 23). Bei der Befruchtung verschmelzen ihre Kerne: 23 + 23 = 46. Die Zygote ist also diploid; von jedem homologen Paar stammt ein Chromosom von der Mutter und eins vom Vater.' }
      ]
    },
    {
      id: 'dna', title: 'Bau der DNA', sub: 'Watson/Crick, Doppelhelix, Desoxyribonukleinsäure, Nucleotid, Phosphat, Desoxyribose, Basen, komplementär, Basensequenz',
      sections: [
        { h: 'DNA = DNS = Desoxyribonukleinsäure', html: '<p>Die Erbsubstanz heißt <span class="term">Desoxyribonukleinsäure</span>. Abgekürzt: <b>DNS</b> (deutsch) oder <b>DNA</b> (englisch: <i>deoxyribonucleic acid</i>). Beide Abkürzungen bedeuten dasselbe.</p><p>Den Bau der DNA entschlüsselten <span class="term">James Watson und Francis Crick</span> im Jahr <b>1953</b>. Sie nutzten dafür Röntgenaufnahmen von <b>Rosalind Franklin</b>. Ihr Modell: die <span class="term">Doppelhelix</span> – zwei Stränge, die schraubenförmig umeinander gewunden sind wie eine verdrehte Strickleiter. 1962 bekamen Watson, Crick und Wilkins dafür den Nobelpreis.</p><div data-anim="helix"></div>' },
        { h: 'Das Nucleotid – der Grundbaustein', html: '<p>Die DNA ist eine lange Kette aus vielen Bausteinen, den <span class="term">Nucleotiden</span>. Jedes Nucleotid besteht aus <b>drei Teilen</b>:</p><div data-anim="nucleotide"></div><ol><li><b>Phosphat</b> (Phosphorsäurerest)</li><li><b>Desoxyribose</b> – ein Zucker (mit 5 Kohlenstoff-Atomen)</li><li>einer <b>Base</b>: <b style="color:var(--A)">Adenin (A)</b>, <b style="color:var(--T)">Thymin (T)</b>, <b style="color:var(--G)">Guanin (G)</b> oder <b style="color:var(--C)">Cytosin (C)</b></li></ol><p><b>Strickleitermodell:</b> Die <b>Holme</b> (Seiten) der Leiter bestehen abwechselnd aus Zucker und Phosphat. Die <b>Sprossen</b> sind jeweils zwei Basen, die in der Mitte durch <b>Wasserstoffbrücken</b> verbunden sind.</p>' },
        { h: 'Komplementäre Basenpaarung', html: '<p>Die Basen passen nur auf eine Art zusammen – wie Schlüssel und Schloss. Man sagt, sie sind <span class="term">komplementär</span> (= ergänzend):</p><div class="key" style="font-size:1.15rem"><b>A – T</b> (2 Wasserstoffbrücken) &nbsp;&nbsp;|&nbsp;&nbsp; <b>G – C</b> (3 Wasserstoffbrücken)</div><p>Kennt man also einen Strang, kennt man automatisch auch den anderen! Probier es aus:</p><div data-anim="pairing"></div><div class="tip"><b>Eselsbrücke:</b> <b>A</b>pfel–<b>T</b>omate und <b>G</b>urke–<b>C</b>hili. Oder: „<b>AT</b>men“ und „<b>GC</b>“ wie „Gute Chemie“.</div><p class="muted">Die beiden Stränge laufen gegenläufig (antiparallel): einer von 5\' nach 3\', der andere von 3\' nach 5\'.</p>' },
        { h: 'Die Basensequenz ist die Information', html: '<p>Die <span class="term">Basensequenz</span> ist die <b>Reihenfolge der Basen</b> auf einem DNA-Strang, z. B. <span class="mono">ATG GCA TTC</span>. In ihr ist die Erbinformation gespeichert – so wie in der Reihenfolge der Buchstaben die Bedeutung eines Satzes steckt.</p><p>Mit nur 4 „Buchstaben“ (A, T, G, C) kann man unendlich viele Informationen schreiben, weil die DNA so lang ist (beim Menschen ca. 3,2 Milliarden Basenpaare).</p><div class="key"><b>Merke:</b> Die Information liegt in der Reihenfolge (Sequenz) der Basen. Je drei Basen bilden ein „Wort“ (Basentriplett) – mehr dazu im Kapitel Proteinbiosynthese.</div>' }
      ],
      terms: [
        ['Watson/Crick', 'James Watson und Francis Crick entwickelten 1953 das Doppelhelix-Modell der DNA (mit Daten von Rosalind Franklin).'],
        ['Doppelhelix', 'Form der DNA: zwei Stränge, schraubenförmig umeinander gewunden (verdrehte Strickleiter).'],
        ['Desoxyribonukleinsäure (DNA/DNS)', 'Erbsubstanz aller Lebewesen; DNS deutsch, DNA englisch.'],
        ['Nucleotid', 'Baustein der DNA aus Phosphat, Zucker (Desoxyribose) und einer Base.'],
        ['Phosphat', 'Teil des Nucleotids; bildet mit dem Zucker die Holme (das Rückgrat) der DNA.'],
        ['Desoxyribose', 'Zucker in der DNA (5 C-Atome); Teil jedes Nucleotids.'],
        ['Adenin, Thymin, Guanin, Cytosin', 'Die vier Basen der DNA (A, T, G, C). A paart mit T, G mit C.'],
        ['komplementär', 'Zueinander passend/ergänzend: A–T und G–C.'],
        ['Basensequenz', 'Reihenfolge der Basen auf der DNA; enthält die Erbinformation.']
      ],
      quiz: [
        { q: 'Wer entwickelte 1953 das Doppelhelix-Modell der DNA?', o: ['Watson und Crick', 'Mendel und Darwin', 'Hooke und Leeuwenhoek', 'Koch und Pasteur'], c: 0, e: 'James Watson und Francis Crick (mit Röntgendaten von Rosalind Franklin).' },
        { q: 'Woraus besteht ein Nucleotid?', o: ['Phosphat, Desoxyribose und einer Base', 'Aminosäure, Zucker und Fett', 'Ribose, Uracil und Eiweiß', 'Nur aus Basen'], c: 0, e: 'Phosphat + Zucker (Desoxyribose) + Base.' },
        { q: 'Welche Base paart mit Adenin in der DNA?', o: ['Thymin', 'Guanin', 'Cytosin', 'Uracil'], c: 0, e: 'A–T, G–C.' },
        { q: 'Welche Base paart mit Guanin?', o: ['Cytosin', 'Thymin', 'Adenin', 'Uracil'], c: 0, e: 'G–C (3 Wasserstoffbrücken).' },
        { q: 'Was bilden im Strickleitermodell die Holme (Seiten)?', o: ['Zucker und Phosphat im Wechsel', 'Die Basenpaare', 'Aminosäuren', 'Wasserstoffbrücken'], c: 0, e: 'Die Sprossen sind die Basenpaare, die Holme das Zucker-Phosphat-Rückgrat.' },
        { q: 'Welcher Strang ist komplementär zu 5\'-ATTGCA-3\'?', o: ['3\'-TAACGT-5\'', '3\'-ATTGCA-5\'', '3\'-UAACGU-5\'', '3\'-GCCATG-5\''], c: 0, e: 'A→T, T→A, G→C, C→G.' },
        { q: 'Wo ist die Erbinformation in der DNA gespeichert?', o: ['In der Reihenfolge der Basen (Basensequenz)', 'Im Phosphat', 'In der Länge der Helix', 'In der Anzahl der Zucker'], c: 0, e: 'Die Basensequenz ist die Information.' },
        { q: 'Wodurch werden die Basenpaare zusammengehalten?', o: ['Durch Wasserstoffbrücken', 'Durch Phosphat', 'Durch Ribosomen', 'Durch Kernporen'], c: 0, e: 'A–T: 2, G–C: 3 Wasserstoffbrücken.' },
        { q: 'Wofür steht DNS?', o: ['Desoxyribonukleinsäure', 'Doppelte Nukleinsäure', 'Desoxy-Nukleotid-Strang', 'Dynamische Nukleinsubstanz'], c: 0, e: 'DNS (deutsch) = DNA (englisch) = Desoxyribonukleinsäure.' }
      ],
      tasks: [
        { q: 'Beschreibe den Bau der DNA (Strickleitermodell) mit den Fachbegriffen.', a: 'Die DNA ist eine <b>Doppelhelix</b> aus zwei Strängen. Jeder Strang ist eine Kette aus <b>Nucleotiden</b> (Phosphat + Desoxyribose + Base). Zucker und Phosphat bilden im Wechsel die <b>Holme</b>; die <b>Basen</b> zeigen nach innen und bilden die <b>Sprossen</b>. Die Basen sind <b>komplementär</b> gepaart (A–T, G–C) und durch <b>Wasserstoffbrücken</b> verbunden. Modell von <b>Watson und Crick</b> (1953).' },
        { q: 'Ermittle den komplementären Strang zu 5\'-ATG CCT AGG TTA-3\'.', a: '<span class="mono">3\'-TAC GGA TCC AAT-5\'</span> (Regel: A–T, G–C)' },
        { q: 'Ein DNA-Abschnitt enthält 30 % Adenin. Wie viel Prozent Thymin, Guanin und Cytosin enthält er?', a: 'A paart mit T → <b>T = 30 %</b>. Zusammen 60 %, Rest 40 % für G und C, die ebenfalls gleich häufig sind → <b>G = 20 %, C = 20 %</b>.' }
      ]
    },
    {
      id: 'replikation', title: 'Replikation', sub: 'Replikation, entspiralisieren, Enzym, Helicase, DNA-Polymerase, semikonservativ',
      sections: [
        { h: 'Warum muss die DNA verdoppelt werden?', html: '<p>Bei jeder Zellteilung soll jede Tochterzelle die <b>vollständige</b> Erbinformation bekommen. Deshalb muss die DNA <b>vorher</b> exakt kopiert werden. Diese identische Verdopplung heißt <span class="term">Replikation</span>. Sie findet in der <b>S-Phase der Interphase</b> statt.</p><p>Danach besteht jedes Chromosom aus <b>zwei identischen Chromatiden</b> (2-Chromatid-Chromosom).</p>' },
        { h: 'Enzyme – die Werkzeuge der Zelle', html: '<p>Ein <span class="term">Enzym</span> ist ein <b>Protein</b>, das als <b>Biokatalysator</b> eine bestimmte chemische Reaktion ermöglicht und beschleunigt, ohne dabei selbst verbraucht zu werden. Jedes Enzym ist auf eine Aufgabe spezialisiert (Schlüssel-Schloss-Prinzip). Enzymnamen enden meist auf <b>-ase</b>.</p><table class="t"><tr><th>Enzym</th><th>Aufgabe bei der Replikation</th></tr><tr><td><b>Helicase</b></td><td>entspiralisiert die DNA und trennt die beiden Stränge (löst die Wasserstoffbrücken) – wie ein Reißverschluss</td></tr><tr><td><b>DNA-Polymerase</b></td><td>lagert freie Nucleotide komplementär an den alten Strang an und verknüpft sie zum neuen Strang</td></tr></table>' },
        { h: 'Ablauf der Replikation', html: '<div data-anim="replication"></div><ol><li><b>Entspiralisieren:</b> Die Doppelhelix wird aufgedreht.</li><li><b>Trennen:</b> Die Helicase trennt die beiden Stränge wie einen Reißverschluss (Wasserstoffbrücken zwischen den Basen werden gelöst). Jeder alte Strang dient als <b>Vorlage (Matrize)</b>.</li><li><b>Anlagern:</b> Freie Nucleotide aus dem Kernplasma lagern sich nach der Regel <b>A–T, G–C</b> komplementär an.</li><li><b>Verknüpfen:</b> Die DNA-Polymerase verknüpft die Nucleotide zu einem neuen Strang.</li><li><b>Ergebnis:</b> Zwei <b>identische</b> DNA-Doppelstränge.</li></ol><div class="key"><b>Semikonservativ</b> („halb-bewahrend“): Jedes neue DNA-Molekül besteht aus <b>einem alten</b> und <b>einem neuen</b> Strang.</div><p class="muted">(Vereinfachte Darstellung – in Wirklichkeit arbeitet die DNA-Polymerase an beiden Strängen in Gegenrichtung.)</p>' }
      ],
      terms: [
        ['Replikation', 'Identische Verdopplung der DNA vor der Zellteilung (S-Phase).'],
        ['entspiralisieren', 'Aufdrehen/Auflockern der spiralisierten DNA, z. B. bei Replikation und Transkription.'],
        ['Enzym', 'Protein, das als Biokatalysator eine bestimmte Reaktion beschleunigt; Name endet meist auf -ase.'],
        ['Helicase', 'Enzym, das die DNA-Doppelhelix entspiralisiert und die Stränge trennt.'],
        ['DNA-Polymerase', 'Enzym, das komplementäre Nucleotide anlagert und zu einem neuen DNA-Strang verknüpft.'],
        ['semikonservativ', 'Jede neue DNA besteht aus einem alten und einem neuen Strang.']
      ],
      quiz: [
        { q: 'Was ist Replikation?', o: ['Die identische Verdopplung der DNA', 'Die Teilung des Zellkerns', 'Die Herstellung von Proteinen', 'Das Ablesen eines Gens'], c: 0, e: 'Replikation = DNA-Verdopplung.' },
        { q: 'Wann findet die Replikation statt?', o: ['In der S-Phase der Interphase', 'In der Metaphase', 'In der Anaphase', 'Nach der Telophase'], c: 0, e: 'S = Synthese der DNA.' },
        { q: 'Welches Enzym trennt die beiden DNA-Stränge?', o: ['Helicase', 'DNA-Polymerase', 'RNA-Polymerase', 'Amylase'], c: 0, e: 'Die Helicase öffnet die DNA wie einen Reißverschluss.' },
        { q: 'Was macht die DNA-Polymerase?', o: ['Sie verknüpft komplementäre Nucleotide zu einem neuen Strang', 'Sie trennt die Stränge', 'Sie baut Proteine', 'Sie zerstört alte DNA'], c: 0, e: 'Polymerase = „Kettenbauer“.' },
        { q: 'Was bedeutet „semikonservativ“?', o: ['Jede neue DNA besteht aus einem alten und einem neuen Strang', 'Beide Stränge sind neu', 'Beide Stränge sind alt', 'Nur die Hälfte der DNA wird kopiert'], c: 0, e: 'semi = halb, konservativ = bewahrend.' },
        { q: 'Was ist ein Enzym?', o: ['Ein Protein, das als Biokatalysator Reaktionen beschleunigt', 'Ein Zucker der DNA', 'Eine Base', 'Ein Teil der Zellmembran'], c: 0, e: 'Enzyme sind Biokatalysatoren und werden nicht verbraucht.' },
        { q: 'Ein alter Strang lautet 5\'-GATC-3\'. Welcher neue Strang wird gebildet?', o: ['3\'-CTAG-5\'', '3\'-GATC-5\'', '3\'-CUAG-5\'', '3\'-TCGA-5\''], c: 0, e: 'G→C, A→T, T→A, C→G.' },
        { q: 'Warum sind die beiden neuen DNA-Moleküle identisch?', o: ['Weil die Basenpaarung komplementär ist und jeder alte Strang als Vorlage dient', 'Weil die Zelle sie danach vergleicht', 'Weil nur ein Strang kopiert wird', 'Zufall'], c: 0, e: 'Komplementäre Basenpaarung garantiert die exakte Kopie.' }
      ],
      tasks: [
        { q: 'Beschreibe den Ablauf der Replikation. Verwende die Begriffe Helicase, DNA-Polymerase, komplementär und semikonservativ.', a: '1. Die DNA wird <b>entspiralisiert</b>. 2. Die <b>Helicase</b> trennt die beiden Stränge (Wasserstoffbrücken lösen sich). 3. Jeder Einzelstrang dient als Vorlage: freie Nucleotide lagern sich <b>komplementär</b> an (A–T, G–C). 4. Die <b>DNA-Polymerase</b> verknüpft sie zu einem neuen Strang. 5. Es entstehen zwei identische DNA-Moleküle aus je einem alten und einem neuen Strang (<b>semikonservativ</b>).' },
        { q: 'Erkläre, warum die Replikation vor der Mitose stattfinden muss.', a: 'Bei der Mitose wird jedes Chromosom auf zwei Tochterzellen aufgeteilt (je eine Chromatide). Damit beide Tochterzellen die vollständige, identische Erbinformation bekommen, muss die DNA vorher verdoppelt werden (2-Chromatid-Chromosomen).' }
      ]
    },
    {
      id: 'mitose', title: 'Zellzyklus & Mitose', sub: 'Kernteilung, Mitose, Zellzyklus, Interphase, Pro-, Meta-, Ana-, Telophase, Teilungskörperchen, Äquatorialebene, Spindelapparat',
      sections: [
        { h: 'Der Zellzyklus', html: '<p>Zellen wachsen und teilen sich immer wieder. Diesen Kreislauf nennt man <span class="term">Zellzyklus</span>. Er besteht aus der <span class="term">Interphase</span> (Zeit zwischen zwei Teilungen) und der <b>M-Phase</b> (<span class="term">Mitose</span> = Kernteilung, danach Zellteilung).</p><div data-anim="cycle"></div><ul><li><b>G1-Phase:</b> Wachstum, Bildung von Zellbestandteilen (Chromosomen mit 1 Chromatide)</li><li><b>S-Phase:</b> Replikation der DNA (danach 2 Chromatiden)</li><li><b>G2-Phase:</b> Vorbereitung auf die Teilung</li><li><b>M-Phase:</b> Mitose + Teilung des Zellplasmas</li></ul><div class="tip">Die Interphase ist die längste Phase. Die DNA liegt dort als Chromatin (Arbeitsform) vor. Zellen, die sich nicht mehr teilen (z. B. Nervenzellen), bleiben in einer Ruhephase (G0).</div>' },
        { h: 'Die Mitose – Kernteilung in 4 Phasen', html: '<p>Bei der <span class="term">Mitose</span> (<span class="term">Kernteilung</span>) entstehen aus einem Zellkern zwei Zellkerne mit <b>identischer</b> Erbinformation und <b>gleicher Chromosomenzahl</b>. Sie dient dem <b>Wachstum</b>, der <b>Erneuerung</b> von Zellen (z. B. Haut) und der <b>Wundheilung</b>.</p><div data-anim="mitosis"></div><div class="key"><b>Reihenfolge merken: P – M – A – T</b><br>„<b>P</b>apa <b>M</b>acht <b>A</b>lles <b>T</b>oll“ → <b>P</b>rophase, <b>M</b>etaphase, <b>A</b>naphase, <b>T</b>elophase</div>' },
        { h: 'Die Phasen im Detail', html: '<table class="t"><tr><th>Phase</th><th>Was passiert?</th></tr><tr><td><b>Prophase</b><br>(pro = vor)</td><td>Chromosomen <b>spiralisieren</b> sich und werden sichtbar (2 Chromatiden). <b>Kernmembran</b> und <b>Kernkörperchen</b> lösen sich auf. Die <b>Teilungskörperchen</b> (Zentriolen) wandern zu den entgegengesetzten <b>Zellpolen</b>. Der <b>Spindelapparat</b> bildet sich.</td></tr><tr><td><b>Metaphase</b><br>(meta = mitten)</td><td>Chromosomen ordnen sich in der <b>Äquatorialebene</b> (Mitte der Zelle) an. <b>Spindelfasern</b> von beiden Polen heften sich an die <b>Centromere</b>. Chromosomen sind jetzt am besten zu sehen (→ Karyogramm).</td></tr><tr><td><b>Anaphase</b><br>(ana = auseinander)</td><td>Die Centromere teilen sich. Die Spindelfasern <b>verkürzen</b> sich und ziehen die <b>Chromatiden</b> zu den entgegengesetzten Polen. Aus jedem 2-Chromatid-Chromosom werden zwei 1-Chromatid-Chromosomen.</td></tr><tr><td><b>Telophase</b><br>(telos = Ende)</td><td>An jedem Pol liegt ein vollständiger Chromosomensatz. Die Chromosomen <b>entspiralisieren</b> sich (wieder Chromatin). <b>Kernmembran</b> und <b>Kernkörperchen</b> bilden sich neu, der Spindelapparat löst sich auf. Anschließend wird das Zellplasma geteilt (Zellteilung).</td></tr></table><ul><li><span class="term">Teilungskörperchen</span> (Zentriolen): kleine Körperchen in tierischen Zellen, die zu den Polen wandern und von denen der Spindelapparat ausgeht.</li><li><span class="term">Spindelapparat / Spindelfasern</span>: Fasern aus Proteinen, die sich zwischen den Polen bilden, an den Centromeren ansetzen und die Chromatiden auseinanderziehen.</li><li><span class="term">Äquatorialebene</span>: gedachte Ebene in der Mitte der Zelle zwischen den Polen.</li></ul>' },
        { h: 'Ergebnis der Mitose', html: '<p>Aus einer Mutterzelle entstehen <b>zwei genetisch identische Tochterzellen</b>. Beim Menschen hat jede wieder <b>46 Chromosomen</b> (diploid), die zunächst aus <b>einer Chromatide</b> bestehen. In der nächsten S-Phase werden sie wieder verdoppelt.</p><table class="t"><tr><th>Zeitpunkt</th><th>Chromosomen</th><th>Chromatiden</th></tr><tr><td>G1-Phase</td><td>46</td><td>46</td></tr><tr><td>nach S-Phase / Metaphase</td><td>46</td><td>92</td></tr><tr><td>Tochterzelle nach der Mitose</td><td>46</td><td>46</td></tr></table><div class="warn"><b>Typischer Fehler:</b> Die Chromosomenzahl halbiert sich bei der Mitose <b>nicht</b>! (Das passiert nur bei der Meiose, der Bildung der Keimzellen.)</div>' }
      ],
      terms: [
        ['Kernteilung', 'Teilung des Zellkerns; bei Körperzellen durch Mitose.'],
        ['Mitose', 'Kernteilung, bei der zwei Kerne mit identischer Erbinformation und gleicher Chromosomenzahl entstehen.'],
        ['Zellzyklus', 'Kreislauf aus Interphase (G1, S, G2) und Mitose mit Zellteilung.'],
        ['Interphase', 'Phase zwischen zwei Teilungen: Wachstum (G1), Replikation (S), Vorbereitung (G2).'],
        ['Prophase', 'Chromosomen verdichten sich, Kernmembran und Kernkörperchen lösen sich auf, Spindelapparat entsteht.'],
        ['Metaphase', 'Chromosomen liegen in der Äquatorialebene; Spindelfasern setzen an den Centromeren an.'],
        ['Anaphase', 'Chromatiden werden durch die Spindelfasern zu den entgegengesetzten Polen gezogen.'],
        ['Telophase', 'Chromosomen entspiralisieren sich, neue Kernmembranen entstehen; danach Zellteilung.'],
        ['Teilungskörperchen', 'Zentriolen; wandern zu den Zellpolen und bilden den Spindelapparat (tierische Zellen).'],
        ['Äquatorialebene', 'Mittelebene der Zelle, in der sich die Chromosomen in der Metaphase anordnen.'],
        ['Spindelapparat/Spindelfasern', 'Proteinfasern zwischen den Polen, die die Chromatiden auseinanderziehen.']
      ],
      quiz: [
        { q: 'Was ist die richtige Reihenfolge der Mitose-Phasen?', o: ['Prophase – Metaphase – Anaphase – Telophase', 'Metaphase – Prophase – Telophase – Anaphase', 'Anaphase – Prophase – Metaphase – Telophase', 'Prophase – Anaphase – Metaphase – Telophase'], c: 0, e: 'P-M-A-T: „Papa Macht Alles Toll“.' },
        { q: 'In welcher Phase liegen die Chromosomen in der Äquatorialebene?', o: ['Metaphase', 'Prophase', 'Anaphase', 'Telophase'], c: 0, e: 'Meta = Mitte.' },
        { q: 'In welcher Phase werden die Chromatiden zu den Polen gezogen?', o: ['Anaphase', 'Metaphase', 'Prophase', 'Interphase'], c: 0, e: 'Ana = auseinander.' },
        { q: 'In welcher Phase lösen sich Kernmembran und Kernkörperchen auf?', o: ['Prophase', 'Telophase', 'Anaphase', 'G1-Phase'], c: 0, e: 'In der Telophase bilden sie sich dann neu.' },
        { q: 'Was passiert in der Telophase?', o: ['Chromosomen entspiralisieren sich, neue Kernmembranen bilden sich', 'Die DNA wird verdoppelt', 'Chromosomen ordnen sich in der Mitte an', 'Die Chromatiden werden getrennt'], c: 0, e: 'Telos = Ende: zwei neue Kerne entstehen.' },
        { q: 'Wie viele Chromosomen hat eine menschliche Tochterzelle nach der Mitose?', o: ['46', '23', '92', '48'], c: 0, e: 'Die Chromosomenzahl bleibt gleich.' },
        { q: 'In welcher Phase des Zellzyklus wird die DNA verdoppelt?', o: ['S-Phase', 'G1-Phase', 'G2-Phase', 'M-Phase'], c: 0, e: 'S = Synthese.' },
        { q: 'Wo setzen die Spindelfasern am Chromosom an?', o: ['Am Centromer', 'An den Enden der Arme', 'Am Kernkörperchen', 'An den Kernporen'], c: 0, e: 'Am Centromer.' },
        { q: 'Was sind die Teilungskörperchen?', o: ['Zentriolen, die zu den Polen wandern und den Spindelapparat bilden', 'Die Tochterzellen', 'Die Chromatiden', 'Ribosomen'], c: 0, e: 'Teilungskörperchen = Zentriolen.' },
        { q: 'Wozu dient die Mitose?', o: ['Wachstum, Zellerneuerung und Wundheilung', 'Bildung von Keimzellen mit halbem Chromosomensatz', 'Herstellung von Proteinen', 'Verdopplung der DNA'], c: 0, e: 'Keimzellen entstehen durch Meiose, nicht durch Mitose.' }
      ],
      tasks: [
        { q: 'Beschreibe die vier Phasen der Mitose.', a: '<b>Prophase:</b> Chromosomen spiralisieren sich (2 Chromatiden sichtbar), Kernmembran und Kernkörperchen lösen sich auf, Teilungskörperchen wandern zu den Polen, Spindelapparat entsteht.<br><b>Metaphase:</b> Chromosomen in der Äquatorialebene, Spindelfasern an den Centromeren.<br><b>Anaphase:</b> Centromere teilen sich, Chromatiden werden zu den entgegengesetzten Polen gezogen.<br><b>Telophase:</b> Chromosomen entspiralisieren sich, Kernmembran und Kernkörperchen bilden sich neu, Spindel verschwindet; Zellplasma wird geteilt.' },
        { q: 'Beschreibe den Zellzyklus.', a: 'Der Zellzyklus besteht aus <b>Interphase</b> und <b>Mitose</b>. Interphase: <b>G1</b> (Wachstum), <b>S</b> (Replikation, danach 2-Chromatid-Chromosomen), <b>G2</b> (Vorbereitung). Dann <b>Mitose</b> (Pro-, Meta-, Ana-, Telophase) und Zellteilung → zwei identische Tochterzellen, die wieder in G1 beginnen.' },
        { q: 'Erkläre, warum die Tochterzellen nach der Mitose genetisch identisch sind.', a: 'In der S-Phase wird die DNA identisch verdoppelt (Replikation). In der Anaphase wird von jedem Chromosom genau eine der beiden identischen Chromatiden zu jedem Pol gezogen. So bekommt jede Tochterzelle eine vollständige, identische Kopie aller Chromosomen.' }
      ]
    },
    {
      id: 'proteinbiosynthese', title: 'Proteinbiosynthese', sub: 'Transkription, Translation, RNA, Ribose, Uracil, mRNA, tRNA, Basentriplett, Ribosomen, Aminosäure, Code-Sonne, genetischer Code',
      sections: [
        { h: 'Vom Gen zum Protein – der Überblick', html: '<p>Gene sind Baupläne für <b>Proteine</b> (Eiweiße). Proteine bestimmen unsere Merkmale: z. B. Enzyme, Hormone wie Insulin, Muskelfasern, Haarfarbstoff. Die Herstellung eines Proteins nach dem Bauplan eines Gens heißt <span class="term">Proteinbiosynthese</span>. Sie läuft in zwei Schritten ab:</p><table class="t"><tr><th></th><th>1. Transkription</th><th>2. Translation</th></tr><tr><td>Bedeutung</td><td>„Abschreiben“</td><td>„Übersetzen“</td></tr><tr><td>Ort</td><td>Zellkern</td><td>Ribosomen im Zellplasma</td></tr><tr><td>Was passiert?</td><td>DNA (Gen) → mRNA</td><td>mRNA → Aminosäurekette (Protein)</td></tr></table><div class="tip"><b>Bild:</b> Die DNA ist das wertvolle Kochbuch, das die Bibliothek (Zellkern) nie verlassen darf. Man macht eine Kopie eines Rezepts (mRNA), nimmt sie mit in die Küche (Ribosom) und kocht danach das Gericht (Protein).</div><p>DNA → (Transkription) → mRNA → (Translation) → Protein</p>' },
        { h: 'RNA – die Kopie der DNA', html: '<p>Für die Proteinbiosynthese braucht die Zelle <span class="term">Ribonukleinsäure</span> (<b>RNA</b>, deutsch RNS). Sie ist ähnlich gebaut wie die DNA, aber mit drei Unterschieden:</p><table class="t"><tr><th></th><th>DNA</th><th>RNA</th></tr><tr><td>Zucker</td><td>Desoxyribose</td><td><b>Ribose</b></td></tr><tr><td>Basen</td><td>A, T, G, C</td><td>A, <b>U (Uracil)</b>, G, C</td></tr><tr><td>Stränge</td><td>Doppelstrang</td><td><b>Einzelstrang</b></td></tr><tr><td>Länge</td><td>sehr lang (ganzes Chromosom)</td><td>kurz (ein Gen)</td></tr></table><p><span class="term">Uracil</span> ersetzt Thymin und paart mit Adenin: <b>A – U</b>.</p><ul><li><span class="term">mRNA</span> (<b>messenger-RNA</b>, Boten-RNA): Kopie eines Gens; bringt die Information aus dem Zellkern zu den Ribosomen.</li><li><span class="term">tRNA</span> (<b>transfer-RNA</b>, Transport-RNA): kleines, kleeblattförmiges Molekül. Sie trägt an einem Ende eine bestimmte <b>Aminosäure</b> und am anderen Ende ein <b>Anticodon</b> (3 Basen), das zum Codon der mRNA passt.</li></ul>' },
        { h: 'Schritt 1: Transkription (im Zellkern)', html: '<div data-anim="transcription"></div><ol><li>Die DNA wird im Bereich eines Gens <b>entspiralisiert</b> und die beiden Stränge werden getrennt.</li><li>Das Enzym <b>RNA-Polymerase</b> liest einen der beiden Stränge ab – den <b>codogenen Strang</b> (Matrizenstrang).</li><li>Freie RNA-Nucleotide lagern sich <b>komplementär</b> an: <b>A→U, T→A, G→C, C→G</b>. Die RNA-Polymerase verknüpft sie zur mRNA.</li><li>Die fertige <b>mRNA</b> löst sich ab, die DNA schließt sich wieder. Die mRNA verlässt den Zellkern durch die <b>Kernporen</b>.</li></ol><div class="key"><b>Beispiel:</b> codogener DNA-Strang <span class="mono">3\'-TAC CGA AAG-5\'</span> → mRNA <span class="mono">5\'-AUG GCU UUC-3\'</span></div>' },
        { h: 'Der genetische Code: Basentripletts', html: '<p>Proteine bestehen aus <span class="term">Aminosäuren</span> – davon gibt es <b>20 verschiedene</b>. Wie kann man mit nur 4 Basen 20 Aminosäuren codieren? Mit <b>Dreiergruppen</b>!</p><ul><li>Je <b>3 Basen</b> der mRNA bilden ein <span class="term">Basentriplett</span> (= <b>Codon</b>). Ein Triplett codiert eine Aminosäure.</li><li>4 × 4 × 4 = <b>64</b> mögliche Tripletts – mehr als genug für 20 Aminosäuren. Viele Aminosäuren haben deshalb mehrere Codons.</li><li><b>Startcodon:</b> AUG (Methionin) – hier beginnt die Translation.</li><li><b>Stoppcodons:</b> UAA, UAG, UGA – hier endet sie (keine Aminosäure).</li></ul><h3>Die Code-Sonne</h3><p>Mit der <span class="term">Code-Sonne</span> übersetzt man ein mRNA-Codon in eine Aminosäure. Man liest sie <b>von innen nach außen</b>: 1. Base innen, 2. Base im mittleren Ring, 3. Base im äußeren Ring – ganz außen steht die Aminosäure. Tippe ein Codon ein:</p><div data-anim="codesun"></div><div class="warn"><b>Wichtig:</b> Die Code-Sonne gilt für die <b>mRNA</b> (mit U, nicht T)! Wenn ein DNA-Strang gegeben ist, erst transkribieren.</div>' },
        { h: 'Schritt 2: Translation (an den Ribosomen)', html: '<div data-anim="translation"></div><ol><li>Die mRNA bindet im Zellplasma an ein <span class="term">Ribosom</span>.</li><li>Das Ribosom sucht das <b>Startcodon AUG</b>.</li><li>Eine <b>tRNA</b> mit dem passenden, <b>komplementären Anticodon</b> (UAC) lagert sich an und bringt ihre Aminosäure (Methionin).</li><li>Die nächste tRNA bringt die nächste Aminosäure. Die Aminosäuren werden miteinander verknüpft (Peptidbindung). Die leere tRNA wird freigesetzt und kann neu beladen werden.</li><li>Das Ribosom wandert Triplett für Triplett weiter; die <b>Aminosäurekette</b> wächst.</li><li>Beim <b>Stoppcodon</b> zerfällt der Komplex, die fertige Aminosäurekette (Protein) wird freigesetzt und faltet sich.</li></ol><div class="key"><b>Merke:</b> Die Reihenfolge der Basen (DNA) bestimmt die Reihenfolge der Codons (mRNA), und diese bestimmt die Reihenfolge der Aminosäuren (Protein).</div>' },
        { h: 'Der genetische Code ist universell', html: '<p>Der <span class="term">genetische Code</span> ist die Regel, nach der Basentripletts in Aminosäuren übersetzt werden (z. B. GCU = Alanin). Er ist <span class="term">universell</span>: <b>Fast alle Lebewesen</b> – Bakterien, Pflanzen, Tiere und Menschen – benutzen <b>denselben Code</b>.</p><ul><li>Das ist ein Hinweis darauf, dass alle Lebewesen <b>gemeinsame Vorfahren</b> haben (Evolution).</li><li>Es ermöglicht die <b>Gentechnik</b>: Man kann z. B. das menschliche Insulin-Gen in Bakterien einbauen. Die Bakterien lesen es mit demselben Code und stellen menschliches Insulin für Menschen mit Diabetes her.</li></ul><p>Weitere Eigenschaften: Der Code ist ein <b>Triplett-Code</b>, <b>eindeutig</b> (ein Codon = genau eine Aminosäure) und <b>redundant/degeneriert</b> (eine Aminosäure kann mehrere Codons haben).</p>' }
      ],
      terms: [
        ['Proteinbiosynthese', 'Herstellung von Proteinen nach dem Bauplan der Gene: Transkription + Translation.'],
        ['Transkription', 'Erster Schritt im Zellkern: Ein Gen der DNA wird in mRNA umgeschrieben.'],
        ['Translation', 'Zweiter Schritt an den Ribosomen: Die mRNA wird in eine Aminosäurekette übersetzt.'],
        ['Ribonukleinsäure (RNA)', 'Einzelsträngige Nukleinsäure mit Ribose und Uracil; z. B. mRNA und tRNA.'],
        ['Ribose', 'Zucker der RNA (statt Desoxyribose).'],
        ['Uracil', 'Base der RNA, ersetzt Thymin; paart mit Adenin (A–U).'],
        ['m-RNA (messenger-RNA)', 'Boten-RNA: Kopie eines Gens, bringt die Information vom Zellkern zu den Ribosomen.'],
        ['t-RNA (transfer-RNA)', 'Transport-RNA: bringt eine bestimmte Aminosäure zum Ribosom; hat ein Anticodon.'],
        ['Basentriplett', 'Drei aufeinanderfolgende Basen (Codon), die eine Aminosäure codieren.'],
        ['Ribosomen', 'Zellorganellen im Zellplasma, an denen die Translation stattfindet („Eiweißfabriken“).'],
        ['Aminosäure', 'Baustein der Proteine; es gibt 20 verschiedene.'],
        ['Code-Sonne', 'Kreisförmige Tabelle zum Übersetzen von mRNA-Codons in Aminosäuren; Lesen von innen nach außen.'],
        ['genetischer Code', 'Regel, nach der Basentripletts in Aminosäuren übersetzt werden.'],
        ['universell', 'Der genetische Code gilt für (fast) alle Lebewesen gleich.']
      ],
      quiz: [
        { q: 'Wo findet die Transkription statt?', o: ['Im Zellkern', 'An den Ribosomen', 'In der Zellmembran', 'Im Kernkörperchen außerhalb des Kerns'], c: 0, e: 'Transkription im Kern, Translation an den Ribosomen.' },
        { q: 'Wo findet die Translation statt?', o: ['An den Ribosomen im Zellplasma', 'Im Zellkern', 'An den Kernporen', 'In den Chromosomen'], c: 0, e: 'Ribosomen = Eiweißfabriken.' },
        { q: 'Welche Base hat die RNA statt Thymin?', o: ['Uracil', 'Adenin', 'Cytosin', 'Guanin'], c: 0, e: 'U ersetzt T; A paart mit U.' },
        { q: 'Welcher Zucker kommt in der RNA vor?', o: ['Ribose', 'Desoxyribose', 'Glucose', 'Stärke'], c: 0, e: 'RNA = Ribonukleinsäure → Ribose.' },
        { q: 'Was ist ein Basentriplett (Codon)?', o: ['Drei Basen, die eine Aminosäure codieren', 'Drei Gene auf einem Chromosom', 'Drei Aminosäuren', 'Drei Chromosomen'], c: 0, e: '3 Basen = 1 Aminosäure.' },
        { q: 'Welche Aufgabe hat die tRNA?', o: ['Sie bringt passende Aminosäuren zum Ribosom', 'Sie trägt die Information aus dem Kern', 'Sie trennt die DNA-Stränge', 'Sie verdoppelt die DNA'], c: 0, e: 'transfer = übertragen/transportieren.' },
        { q: 'Welche Aufgabe hat die mRNA?', o: ['Sie bringt die Kopie eines Gens vom Kern zu den Ribosomen', 'Sie transportiert Aminosäuren', 'Sie bildet die Kernmembran', 'Sie ist ein Enzym der Replikation'], c: 0, e: 'messenger = Bote.' },
        { q: 'Welche mRNA entsteht am codogenen DNA-Strang 3\'-TACGGT-5\'?', o: ['5\'-AUGCCA-3\'', '5\'-ATGCCA-3\'', '5\'-TACGGT-3\'', '5\'-UACGGU-3\''], c: 0, e: 'T→A, A→U, C→G, G→C.' },
        { q: 'Für welche Aminosäure steht das Codon AUG?', o: ['Methionin (Start)', 'Stopp', 'Alanin', 'Glycin'], c: 0, e: 'AUG ist das Startcodon.' },
        { q: 'Was bedeutet „der genetische Code ist universell“?', o: ['Fast alle Lebewesen verwenden denselben Code', 'Jedes Lebewesen hat einen eigenen Code', 'Der Code gilt nur für Menschen', 'Jede Zelle hat einen anderen Code'], c: 0, e: 'Deshalb können Bakterien menschliches Insulin herstellen.' },
        { q: 'Wie viele verschiedene Basentripletts gibt es?', o: ['64', '20', '4', '3'], c: 0, e: '4³ = 64.' },
        { q: 'Was passiert beim Stoppcodon?', o: ['Die Translation endet, die Aminosäurekette wird freigesetzt', 'Es wird Methionin eingebaut', 'Die DNA wird verdoppelt', 'Die mRNA wird verlängert'], c: 0, e: 'UAA, UAG, UGA – keine tRNA passt.' },
        { q: 'Wie liest man die Code-Sonne?', o: ['Von innen nach außen', 'Von außen nach innen', 'Im Uhrzeigersinn ab 12 Uhr', 'Beliebig'], c: 0, e: '1. Base innen → 2. Base → 3. Base → Aminosäure außen.' }
      ],
      tasks: [
        { q: 'Vergleiche DNA und RNA in einer Tabelle (mindestens 3 Unterschiede).', a: '<table class="t"><tr><th></th><th>DNA</th><th>RNA</th></tr><tr><td>Zucker</td><td>Desoxyribose</td><td>Ribose</td></tr><tr><td>Basen</td><td>A, T, G, C</td><td>A, U, G, C</td></tr><tr><td>Aufbau</td><td>Doppelstrang (Doppelhelix)</td><td>Einzelstrang</td></tr><tr><td>Länge/Ort</td><td>sehr lang, bleibt im Kern</td><td>kurz, verlässt den Kern (mRNA)</td></tr></table>' },
        { q: 'Beschreibe den Ablauf der Proteinbiosynthese (Transkription und Translation).', a: '<b>Transkription (Zellkern):</b> DNA wird am Gen entspiralisiert und getrennt; RNA-Polymerase bildet am codogenen Strang komplementär die mRNA (A→U, T→A, G→C, C→G); mRNA verlässt den Kern durch die Kernporen.<br><b>Translation (Ribosomen):</b> mRNA bindet an ein Ribosom; ab dem Startcodon AUG bringen tRNAs mit passendem Anticodon die Aminosäuren; diese werden verknüpft; das Ribosom wandert Triplett für Triplett; beim Stoppcodon wird die fertige Aminosäurekette freigesetzt.' },
        { q: 'Gegeben ist der codogene DNA-Strang 3\'-TAC CGA AAG TTT ACT-5\'. Ermittle die mRNA und die Aminosäuresequenz.', a: 'mRNA: <span class="mono">5\'-AUG GCU UUC AAA UGA-3\'</span><br>Aminosäuren (Code-Sonne): <b>Met – Ala – Phe – Lys – Stopp</b>' },
        { q: 'Erkläre, warum Bakterien menschliches Insulin herstellen können.', a: 'Der genetische Code ist <b>universell</b>: Bakterien übersetzen dieselben Basentripletts in dieselben Aminosäuren wie menschliche Zellen. Baut man das menschliche Insulin-Gen in Bakterien ein, stellen sie bei der Proteinbiosynthese genau das menschliche Insulin her (Gentechnik).' }
      ]
    }
  ],
  legal: '<h2 style="margin-top:0">Über diese Seite (Anbieterangaben)</h2><p>„Genetik verstehen“ ist ein <b>privates, nicht-kommerzielles Lernprojekt</b> zur Vorbereitung auf eine Biologie-Kursarbeit. Es gibt <b>keine Werbung, keine Bezahlung, keine Anmeldung</b> und keine Einnahmen. Kontakt: über die Issues-Funktion des GitHub-Repositorys, in dem der Quellcode dieser Seite liegt.</p>' +
    '<h2>Datenschutzerklärung</h2><p><b>Kurz gesagt: Diese Seite sammelt keine personenbezogenen Daten.</b></p><ul><li><b>Keine Cookies, kein Tracking, keine Analyse-Tools, keine Werbung.</b></li><li><b>Keine externen Inhalte:</b> Es werden keine Schriften, Skripte, Bilder oder Videos von fremden Servern (z. B. Google Fonts, CDNs, YouTube) geladen. Eine Content-Security-Policy verhindert technisch jede Verbindung zu anderen Servern.</li><li><b>Lernfortschritt nur auf deinem Gerät:</b> Gelesene Abschnitte, Quiz-Ergebnisse, Karteikarten, Sprache und Design werden im <i>localStorage</i> deines Browsers gespeichert. Diese Daten verlassen dein Gerät nie und werden nicht an uns übertragen. Die Speicherung ist für die von dir gewünschte Funktion „Fortschritt merken“ erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Du kannst sie jederzeit unter „Einstellungen → Alles löschen“ oder über deine Browsereinstellungen löschen.</li><li><b>Hosting:</b> Die Seite wird als statische Webseite bei einem Hosting-Anbieter (GitHub Pages der GitHub, Inc., USA, bzw. Netlify, Inc., USA) bereitgestellt. Wie bei jedem Webseitenaufruf verarbeitet der Hosting-Anbieter technisch notwendige Daten (z. B. IP-Adresse, Zeitpunkt, aufgerufene Datei) in Server-Logfiles, um die Seite auszuliefern und vor Angriffen zu schützen (Art. 6 Abs. 1 lit. f DSGVO). Darauf haben wir keinen Zugriff. Details: Datenschutzerklärungen von <span class="mono">docs.github.com/site-policy/privacy-policies</span> bzw. <span class="mono">netlify.com/privacy</span>.</li><li><b>Deine Rechte:</b> Du hast nach der DSGVO u. a. das Recht auf Auskunft, Berichtigung, Löschung und Beschwerde bei einer Datenschutz-Aufsichtsbehörde. Da wir selbst keine Daten über dich speichern, gibt es bei uns nichts zu beauskunften.</li></ul>' +
    '<h2>Haftungsausschluss</h2><p>Die Inhalte wurden sorgfältig erstellt und entsprechen dem Schulstoff der Sekundarstufe I. Trotzdem kann keine Gewähr für Richtigkeit, Vollständigkeit oder ein bestimmtes Prüfungsergebnis übernommen werden. Die Seite ersetzt nicht den Unterricht. Maßgeblich sind die Inhalte und Vorgaben deiner Lehrkraft. Angaben wie „ungefähre Note“ sind nur eine grobe Orientierung.</p>' +
    '<h2>Urheberrecht</h2><p>Alle Texte, Grafiken, Animationen und der Programmcode wurden eigens für diese Seite erstellt. Es werden <b>keine fremden Bilder, Arbeitsblätter oder Schulbuchinhalte</b> verwendet. Fachbegriffe und wissenschaftliche Fakten (z. B. der genetische Code) sind allgemeines Wissen. Der Quellcode steht unter der MIT-Lizenz.</p>' +
    '<h2>Barrierefreiheit</h2><p>Die Seite funktioniert auf Handy, Tablet und Computer, mit Tastatur, im Dunkelmodus und respektiert die Systemeinstellung „Bewegung reduzieren“.</p>'
};
