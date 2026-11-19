/* plain — the list of projects shown on https://brknue.github.io/Claude/
 *
 * To add a project: copy one block, put it at the TOP of the list (newest first), then run
 *   node plain/build.mjs
 * which checks every entry and refreshes plain/files.js (the file list used for zip downloads).
 *
 * Fields
 *   id      folder name in the repo (also used in links: index.html#id)
 *   name    display name
 *   entry   main HTML file, relative to the repo root (used for "Download HTML")
 *   open    link for "Open in browser". Relative = hosted here on GitHub Pages. Full URL = hosted elsewhere. null = not online.
 *   tags    any of: science, language, learning, tools, health, explore
 *   lang    language of the content ("" = many / any)
 *   notes   any of: apikey, server, external, webgpu, german
 *   desc    one short sentence per language code (en is required, others fall back to en)
 */
window.PLAIN_PROJECTS = [
  {
    id: 'bio-genetik', name: 'Gene Guide', entry: 'bio-genetik/index.html', open: 'bio-genetik/',
    tags: ['science', 'learning'], lang: 'de', notes: ['german'],
    desc: {
      en: 'Genetics for school: cells, DNA, mitosis and protein synthesis with 13 animations, quizzes and a practice test.',
      de: 'Genetik für die Schule: Zelle, DNA, Mitose und Proteinbiosynthese mit 13 Animationen, Quiz und Probearbeit.',
      tr: 'Okul için genetik: hücre, DNA, mitoz ve protein sentezi; 13 animasyon, testler ve deneme sınavı.',
      es: 'Genética para el colegio: célula, ADN, mitosis y síntesis de proteínas con 13 animaciones, tests y un examen de práctica.',
      fr: 'La génétique pour l’école : cellule, ADN, mitose et synthèse des protéines, avec 13 animations, quiz et examen blanc.',
      it: 'Genetica per la scuola: cellula, DNA, mitosi e sintesi proteica con 13 animazioni, quiz e verifica di prova.',
      pt: 'Genética para a escola: célula, DNA, mitose e síntese de proteínas com 13 animações, quizzes e uma prova de treino.',
      nl: 'Genetica voor school: cel, DNA, mitose en eiwitsynthese met 13 animaties, quizzen en een oefentoets.',
      pl: 'Genetyka do szkoły: komórka, DNA, mitoza i synteza białek z 13 animacjami, quizami i próbnym sprawdzianem.',
      ru: 'Генетика для школы: клетка, ДНК, митоз и синтез белка — 13 анимаций, тесты и пробная контрольная.',
      uk: 'Генетика для школи: клітина, ДНК, мітоз і синтез білка — 13 анімацій, тести й пробна контрольна.',
      ar: 'علم الوراثة للمدرسة: الخلية والحمض النووي والانقسام وتخليق البروتين مع 13 رسمًا متحركًا واختبارات.',
      fa: 'ژنتیک برای مدرسه: سلول، DNA، میتوز و ساخت پروتئین با ۱۳ انیمیشن، آزمونک و آزمون آزمایشی.',
      hi: 'स्कूल के लिए आनुवंशिकी: कोशिका, DNA, माइटोसिस और प्रोटीन संश्लेषण, 13 एनिमेशन, क्विज़ और अभ्यास परीक्षा।',
      zh: '学校遗传学：细胞、DNA、有丝分裂和蛋白质合成，含 13 个动画、测验和模拟考试。',
      ja: '学校向けの遺伝学：細胞・DNA・有糸分裂・タンパク質合成。13のアニメーション、クイズ、模擬テスト付き。',
      ko: '학교 유전학: 세포, DNA, 유사분열, 단백질 합성 — 애니메이션 13개, 퀴즈, 모의시험.',
      id: 'Genetika untuk sekolah: sel, DNA, mitosis dan sintesis protein dengan 13 animasi, kuis dan ujian latihan.',
      vi: 'Di truyền học cho trường học: tế bào, ADN, nguyên phân và tổng hợp protein với 13 hoạt hình, câu đố và bài thi thử.',
      sv: 'Genetik för skolan: cell, DNA, mitos och proteinsyntes med 13 animationer, quiz och ett övningsprov.'
    }
  },
  {
    id: 'fuel-check', name: 'Fuel Check', entry: 'fuel-check/index.html', open: 'fuel-check/',
    tags: ['health', 'tools'], lang: '', notes: ['apikey'],
    desc: {
      en: 'Type what you ate and did today; AI estimates calories, macros and tomorrow’s fat and muscle change.',
      de: 'Schreib, was du heute gegessen und gemacht hast; eine KI schätzt Kalorien, Makros und die Fett- und Muskeländerung.',
      tr: 'Bugün ne yediğini ve ne yaptığını yaz; yapay zekâ kalori, makro ve yarınki yağ-kas değişimini tahmin eder.',
      es: 'Escribe qué comiste e hiciste hoy; una IA estima calorías, macros y el cambio de grasa y músculo de mañana.',
      fr: 'Écrivez ce que vous avez mangé et fait ; une IA estime calories, macros et l’évolution graisse/muscle.',
      it: 'Scrivi cosa hai mangiato e fatto oggi; un’IA stima calorie, macro e la variazione di grasso e muscoli.',
      pt: 'Escreva o que comeu e fez hoje; uma IA estima calorias, macros e a mudança de gordura e músculo.',
      nl: 'Typ wat je vandaag at en deed; AI schat calorieën, macro’s en de vet- en spierverandering van morgen.',
      pl: 'Wpisz, co dziś zjadłeś i robiłeś; AI szacuje kalorie, makro i jutrzejszą zmianę tłuszczu i mięśni.',
      ru: 'Напишите, что вы ели и делали сегодня; ИИ оценит калории, БЖУ и изменение жира и мышц.',
      uk: 'Напишіть, що ви їли й робили сьогодні; ШІ оцінить калорії, БЖВ і зміну жиру та м’язів.',
      ar: 'اكتب ما أكلته وفعلته اليوم؛ يقدّر الذكاء الاصطناعي السعرات والمغذيات وتغيّر الدهون والعضلات.',
      fa: 'بنویس امروز چه خوردی و چه کردی؛ هوش مصنوعی کالری، درشت‌مغذی‌ها و تغییر چربی و عضله را تخمین می‌زند.',
      hi: 'आज क्या खाया और क्या किया लिखें; AI कैलोरी, मैक्रो और कल के फैट व मसल बदलाव का अनुमान लगाता है।',
      zh: '输入今天吃了什么、做了什么；AI 估算热量、营养素以及明天的脂肪和肌肉变化。',
      ja: '今日食べたものと活動を入力すると、AIがカロリー・栄養素・明日の脂肪と筋肉の変化を推定します。',
      ko: '오늘 먹은 것과 한 일을 입력하면 AI가 칼로리, 영양소, 내일의 지방·근육 변화를 추정합니다.',
      id: 'Tulis apa yang kamu makan dan lakukan hari ini; AI memperkirakan kalori, makro dan perubahan lemak serta otot.',
      vi: 'Nhập những gì bạn đã ăn và làm hôm nay; AI ước tính calo, dinh dưỡng và thay đổi mỡ, cơ ngày mai.',
      sv: 'Skriv vad du åt och gjorde i dag; AI uppskattar kalorier, makron och morgondagens fett- och muskelförändring.'
    }
  },
  {
    id: 'plain-wiki', name: 'Plain Wiki', entry: 'plain-wiki/index.html', open: 'plain-wiki/',
    tags: ['learning', 'tools'], lang: '', notes: ['webgpu'],
    desc: {
      en: 'Paste a Wikipedia link and get the whole article rewritten so anyone can understand it, by an AI that runs in your browser.',
      de: 'Wikipedia-Link einfügen und den ganzen Artikel verständlich umgeschrieben bekommen – von einer KI in deinem Browser.',
      tr: 'Bir Vikipedi bağlantısı yapıştır, makalenin tamamı tarayıcında çalışan bir yapay zekâyla herkesin anlayacağı şekilde yazılsın.',
      es: 'Pega un enlace de Wikipedia y una IA que funciona en tu navegador reescribe el artículo para que cualquiera lo entienda.',
      fr: 'Collez un lien Wikipédia : une IA qui tourne dans votre navigateur réécrit l’article pour que tout le monde le comprenne.',
      it: 'Incolla un link di Wikipedia: un’IA nel tuo browser riscrive l’articolo in modo che chiunque lo capisca.',
      pt: 'Cole um link da Wikipédia e uma IA no seu navegador reescreve o artigo para que qualquer pessoa entenda.',
      nl: 'Plak een Wikipedia-link en een AI in je browser herschrijft het hele artikel zodat iedereen het begrijpt.',
      pl: 'Wklej link do Wikipedii, a AI w przeglądarce przepisze cały artykuł tak, by każdy go zrozumiał.',
      ru: 'Вставьте ссылку на Википедию — ИИ прямо в браузере перепишет статью так, чтобы её понял каждый.',
      uk: 'Вставте посилання на Вікіпедію — ШІ у браузері перепише статтю так, щоб її зрозумів кожен.',
      ar: 'الصق رابط ويكيبيديا ليعيد ذكاء اصطناعي يعمل في متصفحك كتابة المقالة بلغة يفهمها الجميع.',
      fa: 'پیوند ویکی‌پدیا را بچسبان تا هوش مصنوعی داخل مرورگرت مقاله را برای همه قابل‌فهم بازنویسی کند.',
      hi: 'विकिपीडिया लिंक डालें; आपके ब्राउज़र में चलने वाला AI पूरा लेख आसान भाषा में दोबारा लिखता है।',
      zh: '粘贴维基百科链接，浏览器内运行的 AI 会把整篇文章改写成人人都懂的语言。',
      ja: 'Wikipediaのリンクを貼ると、ブラウザ内で動くAIが記事全体を誰でも分かる言葉に書き直します。',
      ko: '위키백과 링크를 붙여넣으면 브라우저 안의 AI가 글 전체를 누구나 이해하게 다시 씁니다.',
      id: 'Tempel tautan Wikipedia dan AI di browsermu menulis ulang artikel agar semua orang paham.',
      vi: 'Dán liên kết Wikipedia, AI chạy trong trình duyệt sẽ viết lại cả bài cho ai cũng hiểu.',
      sv: 'Klistra in en Wikipedia-länk så skriver en AI i din webbläsare om artikeln så att alla förstår.'
    }
  },
  {
    id: 'mathe-klar', name: 'Mathe Klar', entry: 'mathe-klar/index.html', open: 'mathe-klar/',
    tags: ['learning'], lang: 'de', notes: ['german'],
    desc: {
      en: 'Visual maths course for grades 5–10: 77 animated lessons with step-by-step explanations and practice.',
      de: 'Visueller Mathekurs für Klasse 5–10: 77 animierte Lektionen mit Schritt-für-Schritt-Erklärungen und Übungen.',
      tr: '5–10. sınıflar için görsel matematik kursu: adım adım açıklamalı 77 animasyonlu ders ve alıştırma.',
      es: 'Curso visual de matemáticas para 5.º–10.º: 77 lecciones animadas con explicaciones paso a paso y práctica.',
      fr: 'Cours de maths visuel de la 5e à la 10e année : 77 leçons animées, expliquées pas à pas, avec exercices.',
      it: 'Corso di matematica visivo per le classi 5–10: 77 lezioni animate con spiegazioni passo passo ed esercizi.',
      pt: 'Curso visual de matemática do 5.º ao 10.º ano: 77 aulas animadas com explicações passo a passo e prática.',
      nl: 'Visuele wiskundecursus voor groep/klas 5–10: 77 geanimeerde lessen met stapsgewijze uitleg en oefening.',
      pl: 'Wizualny kurs matematyki dla klas 5–10: 77 animowanych lekcji z wyjaśnieniami krok po kroku i ćwiczeniami.',
      ru: 'Наглядный курс математики для 5–10 классов: 77 анимированных уроков с пошаговыми объяснениями.',
      uk: 'Наочний курс математики для 5–10 класів: 77 анімованих уроків із покроковими поясненнями.',
      ar: 'دورة رياضيات مرئية للصفوف 5–10: ‏77 درسًا متحركًا مع شرح خطوة بخطوة وتمارين.',
      fa: 'دوره تصویری ریاضی برای پایه‌های ۵ تا ۱۰: ۷۷ درس متحرک با توضیح گام‌به‌گام و تمرین.',
      hi: 'कक्षा 5–10 के लिए दृश्य गणित कोर्स: चरण-दर-चरण व्याख्या वाले 77 एनिमेटेड पाठ और अभ्यास।',
      zh: '5–10 年级可视化数学课程：77 节动画课，逐步讲解并配有练习。',
      ja: '5〜10年生向けのビジュアル数学講座：77のアニメーション授業と段階的な解説・練習。',
      ko: '5–10학년 시각 수학 강좌: 단계별 설명과 연습이 있는 애니메이션 수업 77개.',
      id: 'Kursus matematika visual kelas 5–10: 77 pelajaran animasi dengan penjelasan langkah demi langkah dan latihan.',
      vi: 'Khóa toán trực quan lớp 5–10: 77 bài học hoạt hình với giải thích từng bước và luyện tập.',
      sv: 'Visuell mattekurs för årskurs 5–10: 77 animerade lektioner med steg-för-steg-förklaringar och övningar.'
    }
  },
  {
    id: 'lingua-local', name: 'Lingua Local', entry: 'lingua-local/index.html', open: 'lingua-local/',
    tags: ['language', 'learning'], lang: '', notes: [],
    desc: {
      en: 'Offline phrasebook and flashcards for six languages, with a personal routine and spaced practice.',
      de: 'Offline-Sprachführer und Karteikarten für sechs Sprachen, mit persönlichem Lernplan und Wiederholung.',
      tr: 'Altı dil için çevrimdışı konuşma kılavuzu ve kartlar; kişisel plan ve aralıklı tekrar.',
      es: 'Guía de frases y tarjetas sin conexión para seis idiomas, con rutina personal y repaso espaciado.',
      fr: 'Guide de conversation et cartes hors ligne pour six langues, avec routine personnelle et révisions espacées.',
      it: 'Frasario e flashcard offline per sei lingue, con routine personale e ripasso distanziato.',
      pt: 'Guia de frases e cartões offline para seis idiomas, com rotina pessoal e revisão espaçada.',
      nl: 'Offline taalgids en flashcards voor zes talen, met persoonlijk schema en gespreide herhaling.',
      pl: 'Rozmówki i fiszki offline dla sześciu języków, z planem nauki i powtórkami.',
      ru: 'Офлайн-разговорник и карточки для шести языков с личным планом и интервальными повторениями.',
      uk: 'Офлайн-розмовник і картки для шести мов з особистим планом та інтервальними повтореннями.',
      ar: 'دليل عبارات وبطاقات بدون إنترنت لست لغات، مع خطة شخصية ومراجعة متباعدة.',
      fa: 'جمله‌نامه و فلش‌کارت آفلاین برای شش زبان، با برنامه شخصی و مرور فاصله‌دار.',
      hi: 'छह भाषाओं के लिए ऑफ़लाइन वाक्य-पुस्तिका और फ़्लैशकार्ड, निजी दिनचर्या और दोहराव के साथ।',
      zh: '六种语言的离线常用语手册和抽认卡，带个人计划和间隔复习。',
      ja: '6言語のオフライン会話帳と単語カード。自分用の学習計画と間隔反復付き。',
      ko: '6개 언어 오프라인 회화집과 플래시카드, 개인 학습 계획과 간격 반복.',
      id: 'Buku frasa dan kartu kata offline untuk enam bahasa, dengan rutinitas pribadi dan pengulangan berjeda.',
      vi: 'Sổ tay câu và thẻ học ngoại tuyến cho sáu ngôn ngữ, có lộ trình riêng và ôn tập giãn cách.',
      sv: 'Offline-parlör och kort för sex språk, med personligt schema och repetition.'
    }
  },
  {
    id: 'der-die-das', name: 'Der Die Das', entry: 'der-die-das/index.html', open: 'der-die-das/',
    tags: ['language', 'learning'], lang: 'de', notes: [],
    desc: {
      en: 'Learn the article of 5,000 German nouns in short rounds with spaced repetition and memory tricks.',
      de: 'Lerne den Artikel von 5.000 deutschen Nomen in kurzen Runden mit Wiederholung und Merkhilfen.',
      tr: '5.000 Almanca ismin artikelini kısa turlarda, tekrar ve hafıza ipuçlarıyla öğren.',
      es: 'Aprende el artículo de 5000 sustantivos alemanes en rondas cortas con repaso y trucos de memoria.',
      fr: 'Apprenez l’article de 5 000 noms allemands en courtes séries, avec répétition espacée et astuces.',
      it: 'Impara l’articolo di 5.000 sostantivi tedeschi in brevi round con ripasso e trucchi di memoria.',
      pt: 'Aprenda o artigo de 5.000 substantivos alemães em rodadas curtas com revisão e truques de memória.',
      nl: 'Leer het lidwoord van 5.000 Duitse zelfstandige naamwoorden in korte rondes met herhaling en ezelsbruggetjes.',
      pl: 'Naucz się rodzajników 5000 niemieckich rzeczowników w krótkich rundach z powtórkami i skojarzeniami.',
      ru: 'Учите артикли 5000 немецких существительных короткими раундами с повторениями и подсказками.',
      uk: 'Вивчайте артиклі 5000 німецьких іменників короткими раундами з повтореннями й підказками.',
      ar: 'تعلّم أداة التعريف لـ 5000 اسم ألماني في جولات قصيرة مع المراجعة وحيل التذكّر.',
      fa: 'حرف تعریف ۵۰۰۰ اسم آلمانی را در دورهای کوتاه با مرور و ترفندهای حافظه یاد بگیر.',
      hi: '5,000 जर्मन संज्ञाओं के आर्टिकल छोटे राउंड, दोहराव और याद रखने की तरकीबों से सीखें।',
      zh: '通过短轮练习、间隔复习和记忆技巧，学会 5000 个德语名词的冠词。',
      ja: 'ドイツ語名詞5,000語の冠詞を、短いラウンドと間隔反復、覚え方のコツで学びます。',
      ko: '독일어 명사 5,000개의 관사를 짧은 라운드, 간격 반복, 암기 팁으로 익힙니다.',
      id: 'Pelajari artikel 5.000 kata benda Jerman dalam ronde singkat dengan pengulangan dan trik mengingat.',
      vi: 'Học mạo từ của 5.000 danh từ tiếng Đức qua các vòng ngắn, ôn tập giãn cách và mẹo ghi nhớ.',
      sv: 'Lär dig artikeln för 5 000 tyska substantiv i korta omgångar med repetition och minnesknep.'
    }
  },
  {
    id: 'fluent-path', name: 'Fluent Path', entry: 'fluent-path/index.html', open: 'fluent-path/',
    tags: ['language', 'learning'], lang: '', notes: [],
    desc: {
      en: 'Language course with a daily plan, short lessons and spaced repetition for six languages. Works offline.',
      de: 'Sprachkurs mit Tagesplan, kurzen Lektionen und Wiederholung für sechs Sprachen. Funktioniert offline.',
      tr: 'Altı dil için günlük plan, kısa dersler ve aralıklı tekrarla dil kursu. Çevrimdışı çalışır.',
      es: 'Curso de idiomas con plan diario, lecciones cortas y repaso espaciado para seis idiomas. Funciona sin conexión.',
      fr: 'Cours de langues avec plan quotidien, leçons courtes et répétition espacée pour six langues. Fonctionne hors ligne.',
      it: 'Corso di lingue con piano giornaliero, lezioni brevi e ripasso per sei lingue. Funziona offline.',
      pt: 'Curso de idiomas com plano diário, aulas curtas e revisão espaçada para seis idiomas. Funciona offline.',
      nl: 'Taalcursus met dagplan, korte lessen en gespreide herhaling voor zes talen. Werkt offline.',
      pl: 'Kurs językowy z planem dnia, krótkimi lekcjami i powtórkami dla sześciu języków. Działa offline.',
      ru: 'Языковой курс с планом на день, короткими уроками и повторениями для шести языков. Работает офлайн.',
      uk: 'Мовний курс із планом на день, короткими уроками й повтореннями для шести мов. Працює офлайн.',
      ar: 'دورة لغات بخطة يومية ودروس قصيرة ومراجعة متباعدة لست لغات. تعمل بدون إنترنت.',
      fa: 'دوره زبان با برنامه روزانه، درس‌های کوتاه و مرور فاصله‌دار برای شش زبان. آفلاین کار می‌کند.',
      hi: 'छह भाषाओं के लिए दैनिक योजना, छोटे पाठ और दोहराव वाला भाषा कोर्स। ऑफ़लाइन चलता है।',
      zh: '六种语言课程：每日计划、短课和间隔复习，可离线使用。',
      ja: '6言語の語学コース：毎日のプラン、短いレッスン、間隔反復。オフラインで使えます。',
      ko: '6개 언어 코스: 일일 계획, 짧은 수업, 간격 반복. 오프라인에서도 작동.',
      id: 'Kursus bahasa dengan rencana harian, pelajaran singkat dan pengulangan untuk enam bahasa. Bisa offline.',
      vi: 'Khóa học ngôn ngữ với kế hoạch hằng ngày, bài ngắn và ôn tập giãn cách cho sáu ngôn ngữ. Chạy ngoại tuyến.',
      sv: 'Språkkurs med dagsplan, korta lektioner och repetition för sex språk. Fungerar offline.'
    }
  },
  {
    id: 'youtube-to-pdf', name: 'Caption to PDF', entry: 'youtube-to-pdf/public/index.html', open: 'https://youtube-text-to-pdf.netlify.app',
    tags: ['tools'], lang: '', notes: ['external'],
    desc: {
      en: 'Paste a YouTube link and save everything said in the video as a PDF, using its captions.',
      de: 'YouTube-Link einfügen und alles Gesagte im Video als PDF speichern – aus den Untertiteln.',
      tr: 'Bir YouTube bağlantısı yapıştır, videoda söylenen her şeyi altyazılardan PDF olarak kaydet.',
      es: 'Pega un enlace de YouTube y guarda en PDF todo lo que se dice en el vídeo, a partir de sus subtítulos.',
      fr: 'Collez un lien YouTube et enregistrez en PDF tout ce qui est dit dans la vidéo, grâce aux sous-titres.',
      it: 'Incolla un link YouTube e salva in PDF tutto ciò che si dice nel video, dai sottotitoli.',
      pt: 'Cole um link do YouTube e salve em PDF tudo o que é dito no vídeo, a partir das legendas.',
      nl: 'Plak een YouTube-link en bewaar alles wat in de video gezegd wordt als pdf, via de ondertitels.',
      pl: 'Wklej link do YouTube i zapisz jako PDF wszystko, co pada w filmie, na podstawie napisów.',
      ru: 'Вставьте ссылку на YouTube и сохраните в PDF всё, что сказано в видео, по субтитрам.',
      uk: 'Вставте посилання на YouTube і збережіть у PDF усе, що сказано у відео, за субтитрами.',
      ar: 'الصق رابط يوتيوب واحفظ كل ما يُقال في الفيديو كملف PDF من الترجمة المصاحبة.',
      fa: 'پیوند یوتیوب را بچسبان و همه گفته‌های ویدیو را از روی زیرنویس به PDF ذخیره کن.',
      hi: 'YouTube लिंक डालें और वीडियो में कही गई हर बात कैप्शन से PDF में सहेजें।',
      zh: '粘贴 YouTube 链接，根据字幕把视频里说的所有内容保存为 PDF。',
      ja: 'YouTubeのリンクを貼ると、字幕から動画内の発言をすべてPDFに保存します。',
      ko: 'YouTube 링크를 붙여넣으면 자막으로 영상 속 말을 모두 PDF로 저장합니다.',
      id: 'Tempel tautan YouTube dan simpan semua ucapan di video sebagai PDF dari takarirnya.',
      vi: 'Dán liên kết YouTube và lưu mọi lời nói trong video thành PDF từ phụ đề.',
      sv: 'Klistra in en YouTube-länk och spara allt som sägs i videon som PDF utifrån undertexterna.'
    }
  },
  {
    id: 'molecule-lab', name: 'Molecule Lab', entry: 'molecule-lab/index.html', open: 'molecule-lab/',
    tags: ['science'], lang: '', notes: [],
    desc: {
      en: 'Chemistry playground: build molecules from all 118 elements, search 52,000 compounds and run gas and DNA labs.',
      de: 'Chemie-Spielplatz: Moleküle aus allen 118 Elementen bauen, 52.000 Stoffe durchsuchen, Gas- und DNA-Labore.',
      tr: 'Kimya oyun alanı: 118 elementle molekül kur, 52.000 bileşik ara, gaz ve DNA laboratuvarları.',
      es: 'Laboratorio de química: construye moléculas con los 118 elementos, busca 52 000 compuestos y experimenta con gases y ADN.',
      fr: 'Terrain de jeu chimique : construisez des molécules avec les 118 éléments, cherchez 52 000 composés, labos gaz et ADN.',
      it: 'Laboratorio di chimica: costruisci molecole con tutti i 118 elementi, cerca 52.000 composti, laboratori di gas e DNA.',
      pt: 'Laboratório de química: monte moléculas com os 118 elementos, pesquise 52 mil compostos e explore gases e DNA.',
      nl: 'Scheikunde-speeltuin: bouw moleculen met alle 118 elementen, doorzoek 52.000 stoffen, gas- en DNA-labs.',
      pl: 'Plac zabaw chemii: buduj cząsteczki ze 118 pierwiastków, szukaj wśród 52 000 związków, laboratoria gazu i DNA.',
      ru: 'Химическая песочница: собирайте молекулы из 118 элементов, ищите среди 52 000 веществ, газ и ДНК.',
      uk: 'Хімічна пісочниця: збирайте молекули зі 118 елементів, шукайте серед 52 000 речовин, газ і ДНК.',
      ar: 'ملعب كيمياء: ابنِ جزيئات من 118 عنصرًا، وابحث في 52 ألف مركّب، ومختبرات للغاز والحمض النووي.',
      fa: 'زمین بازی شیمی: با ۱۱۸ عنصر مولکول بساز، میان ۵۲ هزار ترکیب جست‌وجو کن، آزمایشگاه گاز و DNA.',
      hi: 'रसायन खेल का मैदान: सभी 118 तत्वों से अणु बनाएँ, 52,000 यौगिक खोजें, गैस और DNA लैब।',
      zh: '化学游乐场：用 118 种元素搭建分子，搜索 52,000 种化合物，还有气体和 DNA 实验。',
      ja: '化学の遊び場：118元素で分子を組み立て、52,000の化合物を検索、気体とDNAの実験も。',
      ko: '화학 놀이터: 118개 원소로 분자를 만들고 52,000개 화합물 검색, 기체와 DNA 실험.',
      id: 'Taman bermain kimia: rakit molekul dari 118 unsur, cari 52.000 senyawa, lab gas dan DNA.',
      vi: 'Sân chơi hóa học: dựng phân tử từ 118 nguyên tố, tìm 52.000 hợp chất, thí nghiệm khí và ADN.',
      sv: 'Kemilekplats: bygg molekyler av alla 118 grundämnen, sök bland 52 000 ämnen, gas- och DNA-labb.'
    }
  },
  {
    id: 'physica', name: 'Physica', entry: 'physica/index.html', open: 'physica/',
    tags: ['science'], lang: 'en', notes: [],
    desc: {
      en: 'Virtual physics lab with 15 live simulations: electrons, orbits, waves, gases, optics, fluids, black holes and more.',
      de: 'Virtuelles Physiklabor mit 15 Live-Simulationen: Elektronen, Umlaufbahnen, Wellen, Gase, Optik, Schwarze Löcher …',
      tr: '15 canlı simülasyonlu sanal fizik laboratuvarı: elektronlar, yörüngeler, dalgalar, gazlar, optik, kara delikler…',
      es: 'Laboratorio de física virtual con 15 simulaciones: electrones, órbitas, ondas, gases, óptica, agujeros negros y más.',
      fr: 'Labo de physique virtuel avec 15 simulations : électrons, orbites, ondes, gaz, optique, trous noirs et plus.',
      it: 'Laboratorio di fisica virtuale con 15 simulazioni: elettroni, orbite, onde, gas, ottica, buchi neri e altro.',
      pt: 'Laboratório de física virtual com 15 simulações: elétrons, órbitas, ondas, gases, óptica, buracos negros e mais.',
      nl: 'Virtueel natuurkundelab met 15 simulaties: elektronen, banen, golven, gassen, optica, zwarte gaten en meer.',
      pl: 'Wirtualne laboratorium fizyki z 15 symulacjami: elektrony, orbity, fale, gazy, optyka, czarne dziury i więcej.',
      ru: 'Виртуальная физлаборатория с 15 симуляциями: электроны, орбиты, волны, газы, оптика, чёрные дыры и др.',
      uk: 'Віртуальна фізлабораторія з 15 симуляціями: електрони, орбіти, хвилі, гази, оптика, чорні діри тощо.',
      ar: 'مختبر فيزياء افتراضي بـ 15 محاكاة: إلكترونات ومدارات وموجات وغازات وبصريات وثقوب سوداء وغيرها.',
      fa: 'آزمایشگاه مجازی فیزیک با ۱۵ شبیه‌سازی: الکترون، مدار، موج، گاز، نور، سیاه‌چاله و بیشتر.',
      hi: '15 लाइव सिमुलेशन वाली वर्चुअल भौतिकी लैब: इलेक्ट्रॉन, कक्षाएँ, तरंगें, गैसें, प्रकाशिकी, ब्लैक होल आदि।',
      zh: '虚拟物理实验室，15 个实时模拟：电子、轨道、波、气体、光学、流体、黑洞等。',
      ja: '15のシミュレーションがある仮想物理実験室：電子、軌道、波、気体、光学、流体、ブラックホールなど。',
      ko: '실시간 시뮬레이션 15개의 가상 물리 실험실: 전자, 궤도, 파동, 기체, 광학, 블랙홀 등.',
      id: 'Lab fisika virtual dengan 15 simulasi: elektron, orbit, gelombang, gas, optik, lubang hitam dan lainnya.',
      vi: 'Phòng thí nghiệm vật lý ảo với 15 mô phỏng: electron, quỹ đạo, sóng, khí, quang học, hố đen và hơn thế.',
      sv: 'Virtuellt fysiklabb med 15 simuleringar: elektroner, banor, vågor, gaser, optik, svarta hål och mer.'
    }
  },
  {
    id: 'verity', name: 'Verity', entry: 'verity/public/index.html', open: null,
    tags: ['tools'], lang: '', notes: ['server'],
    desc: {
      en: 'Evidence-first fact checker for links, posts and recordings. Needs its own server and an OpenAI key, so it is not online yet.',
      de: 'Faktenprüfer für Links, Beiträge und Aufnahmen. Braucht einen eigenen Server und einen OpenAI-Schlüssel, daher noch nicht online.',
      tr: 'Bağlantılar, gönderiler ve kayıtlar için kanıt odaklı doğrulayıcı. Kendi sunucusu ve OpenAI anahtarı gerekir; henüz çevrimiçi değil.',
      es: 'Verificador de datos basado en pruebas. Necesita su propio servidor y una clave de OpenAI, así que aún no está en línea.',
      fr: 'Vérificateur de faits fondé sur les preuves. Il lui faut son propre serveur et une clé OpenAI : pas encore en ligne.',
      it: 'Verificatore di fatti basato sulle prove. Richiede un server proprio e una chiave OpenAI, quindi non è ancora online.',
      pt: 'Verificador de fatos baseado em evidências. Precisa de servidor próprio e chave da OpenAI, por isso ainda não está online.',
      nl: 'Factchecker op basis van bewijs. Heeft een eigen server en OpenAI-sleutel nodig, dus nog niet online.',
      pl: 'Weryfikator faktów oparty na dowodach. Wymaga własnego serwera i klucza OpenAI, więc nie jest jeszcze online.',
      ru: 'Проверка фактов по доказательствам. Нужен свой сервер и ключ OpenAI, поэтому пока не в сети.',
      uk: 'Перевірка фактів за доказами. Потрібен власний сервер і ключ OpenAI, тож поки не в мережі.',
      ar: 'مدقّق حقائق يعتمد على الأدلة. يحتاج إلى خادم خاص ومفتاح OpenAI، لذلك ليس متاحًا بعد.',
      fa: 'راستی‌آزمای مبتنی بر شواهد. به سرور اختصاصی و کلید OpenAI نیاز دارد، پس هنوز آنلاین نیست.',
      hi: 'सबूत-आधारित फ़ैक्ट-चेकर। इसे अपना सर्वर और OpenAI कुंजी चाहिए, इसलिए अभी ऑनलाइन नहीं है।',
      zh: '以证据为先的事实核查工具。需要自己的服务器和 OpenAI 密钥，因此尚未上线。',
      ja: '証拠重視のファクトチェッカー。専用サーバーとOpenAIキーが必要なため、まだ公開されていません。',
      ko: '증거 중심 팩트체커. 별도 서버와 OpenAI 키가 필요해 아직 온라인이 아닙니다.',
      id: 'Pemeriksa fakta berbasis bukti. Butuh server sendiri dan kunci OpenAI, jadi belum online.',
      vi: 'Công cụ kiểm chứng dựa trên bằng chứng. Cần máy chủ riêng và khóa OpenAI nên chưa trực tuyến.',
      sv: 'Faktagranskare som utgår från bevis. Kräver egen server och OpenAI-nyckel, så den är inte online än.'
    }
  },
  {
    id: 'gamepulse', name: 'GamePulse', entry: 'gamepulse/index.html', open: 'gamepulse/',
    tags: ['explore'], lang: 'en', notes: [],
    desc: {
      en: 'A small game finder: featured games for console, PC, mobile and Roblox, with quick search links for any other game.',
      de: 'Kleiner Spiele-Finder: ausgewählte Spiele für Konsole, PC, Handy und Roblox, mit Suchlinks für jedes andere Spiel.',
      tr: 'Küçük oyun bulucu: konsol, PC, mobil ve Roblox için öne çıkan oyunlar ve diğerleri için arama bağlantıları.',
      es: 'Buscador de juegos: destacados de consola, PC, móvil y Roblox, con enlaces de búsqueda para cualquier otro.',
      fr: 'Petit chercheur de jeux : sélection console, PC, mobile et Roblox, avec liens de recherche pour tout autre jeu.',
      it: 'Piccolo cercagiochi: giochi in evidenza per console, PC, mobile e Roblox, con link di ricerca per qualsiasi altro.',
      pt: 'Pequeno buscador de jogos: destaques de console, PC, celular e Roblox, com links de busca para qualquer outro.',
      nl: 'Kleine gamezoeker: uitgelichte games voor console, pc, mobiel en Roblox, met zoeklinks voor elke andere game.',
      pl: 'Mała wyszukiwarka gier: polecane gry na konsole, PC, telefon i Roblox oraz linki do szukania innych.',
      ru: 'Небольшой поиск игр: избранное для консолей, ПК, телефонов и Roblox и ссылки для поиска любой другой игры.',
      uk: 'Невеликий пошук ігор: добірка для консолей, ПК, телефонів і Roblox та посилання для пошуку будь-якої іншої.',
      ar: 'باحث ألعاب صغير: ألعاب مختارة للأجهزة والحاسوب والجوال وروبلوكس، مع روابط بحث لأي لعبة أخرى.',
      fa: 'یابنده کوچک بازی: بازی‌های برگزیده کنسول، رایانه، موبایل و روبلاکس با پیوند جست‌وجو برای هر بازی دیگر.',
      hi: 'छोटा गेम फ़ाइंडर: कंसोल, PC, मोबाइल और Roblox के चुनिंदा गेम, किसी भी अन्य गेम के लिए खोज लिंक।',
      zh: '小型游戏查找器：主机、PC、手机和 Roblox 精选游戏，并可快速搜索其他任何游戏。',
      ja: '小さなゲーム検索：家庭用機・PC・スマホ・Robloxのおすすめと、他のゲームを探す検索リンク。',
      ko: '작은 게임 찾기: 콘솔, PC, 모바일, Roblox 추천 게임과 다른 게임 검색 링크.',
      id: 'Pencari game kecil: game pilihan untuk konsol, PC, ponsel dan Roblox, plus tautan cari untuk game lain.',
      vi: 'Công cụ tìm game nhỏ: game nổi bật cho console, PC, di động và Roblox, kèm liên kết tìm game khác.',
      sv: 'Liten spelhittare: utvalda spel för konsol, pc, mobil och Roblox, med söklänkar för alla andra spel.'
    }
  },
  {
    id: 'citypulse', name: 'CityPulse', entry: 'citypulse/index.html', open: 'citypulse/',
    tags: ['explore'], lang: 'en', notes: [],
    desc: {
      en: 'Beautiful small towns from every continent, with map and encyclopedia links for any place on Earth.',
      de: 'Schöne Kleinstädte von allen Kontinenten, mit Karten- und Lexikonlinks für jeden Ort der Welt.',
      tr: 'Her kıtadan güzel küçük kasabalar; dünyadaki her yer için harita ve ansiklopedi bağlantıları.',
      es: 'Pueblos bonitos de todos los continentes, con enlaces a mapas y enciclopedia para cualquier lugar.',
      fr: 'De belles petites villes de tous les continents, avec liens carte et encyclopédie pour n’importe quel lieu.',
      it: 'Piccole città bellissime di ogni continente, con link a mappe ed enciclopedia per qualsiasi luogo.',
      pt: 'Pequenas cidades lindas de todos os continentes, com links de mapa e enciclopédia para qualquer lugar.',
      nl: 'Mooie kleine stadjes van elk continent, met kaart- en encyclopedielinks voor elke plek op aarde.',
      pl: 'Piękne miasteczka z każdego kontynentu oraz linki do map i encyklopedii dla każdego miejsca.',
      ru: 'Красивые маленькие города со всех континентов и ссылки на карты и энциклопедию для любого места.',
      uk: 'Гарні маленькі містечка з усіх континентів і посилання на мапи й енциклопедію для будь-якого місця.',
      ar: 'بلدات صغيرة جميلة من كل القارات، مع روابط خرائط وموسوعة لأي مكان في العالم.',
      fa: 'شهرک‌های زیبای کوچک از همه قاره‌ها، با پیوند نقشه و دانشنامه برای هر جای جهان.',
      hi: 'हर महाद्वीप के सुंदर छोटे कस्बे, धरती की किसी भी जगह के लिए नक्शा और विश्वकोश लिंक।',
      zh: '各大洲的美丽小镇，并提供地球上任何地方的地图和百科链接。',
      ja: '各大陸の美しい小さな町。世界中どこでも地図と百科事典のリンクで調べられます。',
      ko: '모든 대륙의 아름다운 작은 마을, 지구상 어느 곳이든 지도·백과사전 링크.',
      id: 'Kota kecil indah dari tiap benua, dengan tautan peta dan ensiklopedia untuk tempat mana pun.',
      vi: 'Những thị trấn nhỏ đẹp ở mọi châu lục, kèm liên kết bản đồ và bách khoa cho mọi nơi.',
      sv: 'Vackra småstäder från alla kontinenter, med kart- och uppslagsverkslänkar för alla platser.'
    }
  }
];
