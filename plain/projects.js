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
    id: 'physica', name: 'Physica', entry: 'physica/index.html', open: 'physica/',
    tags: ['science'], lang: 'en', notes: [],
    desc: {
      en: 'Virtual physics lab, 23 simulations: run experiments and parameter sweeps, fit models, download all data as PDF report or CSV.',
      de: 'Virtuelles Physiklabor, 23 Simulationen: Experimente und Parameterreihen, Modellanpassung, alle Daten als PDF-Bericht oder CSV.',
      tr: 'Sanal fizik laboratuvarı, 23 simülasyon: deney ve parametre taramaları, model uydurma, tüm veriler PDF rapor veya CSV olarak.',
      es: 'Laboratorio de física virtual, 23 simulaciones: experimentos y barridos de parámetros, ajuste de modelos, datos en PDF o CSV.',
      fr: 'Labo de physique virtuel, 23 simulations : expériences et balayages de paramètres, ajustement de modèles, données en PDF ou CSV.',
      it: 'Laboratorio di fisica virtuale, 23 simulazioni: esperimenti e scansioni di parametri, fit di modelli, dati in PDF o CSV.',
      pt: 'Laboratório de física virtual, 23 simulações: experimentos e varreduras de parâmetros, ajuste de modelos, dados em PDF ou CSV.',
      nl: 'Virtueel natuurkundelab, 23 simulaties: experimenten en parameterreeksen, modelfits, alle data als PDF-rapport of CSV.',
      pl: 'Wirtualne laboratorium fizyki, 23 symulacje: eksperymenty i serie parametrów, dopasowanie modeli, dane jako raport PDF lub CSV.',
      ru: 'Виртуальная физлаборатория, 23 симуляции: эксперименты и серии параметров, подгонка моделей, все данные в PDF или CSV.',
      uk: 'Віртуальна фізлабораторія, 23 симуляції: експерименти й серії параметрів, підгонка моделей, усі дані в PDF або CSV.',
      ar: 'مختبر فيزياء افتراضي بـ 23 محاكاة: تجارب ومسح للمعاملات وملاءمة نماذج وتنزيل كل البيانات كتقرير PDF أو CSV.',
      fa: 'آزمایشگاه مجازی فیزیک با ۲۳ شبیه\u200cسازی: آزمایش و پیمایش پارامتر، برازش مدل، دریافت همه داده\u200cها به صورت PDF یا CSV.',
      hi: '23 सिमुलेशन वाली वर्चुअल भौतिकी लैब: प्रयोग और पैरामीटर स्वीप, मॉडल फिट, सारा डेटा PDF रिपोर्ट या CSV में।',
      zh: '虚拟物理实验室，23 个模拟：运行实验和参数扫描、拟合模型，并将全部数据下载为 PDF 报告或 CSV。',
      ja: '23のシミュレーションを備えた仮想物理実験室：実験とパラメータ掃引、モデルフィット、全データをPDFレポートやCSVで保存。',
      ko: '시뮬레이션 23개의 가상 물리 실험실: 실험과 매개변수 스윕, 모델 피팅, 모든 데이터를 PDF 보고서나 CSV로 저장.',
      id: 'Lab fisika virtual, 23 simulasi: eksperimen dan sapuan parameter, pencocokan model, unduh semua data sebagai PDF atau CSV.',
      vi: 'Phòng thí nghiệm vật lý ảo, 23 mô phỏng: thí nghiệm và quét tham số, khớp mô hình, tải mọi dữ liệu dạng PDF hoặc CSV.',
      sv: 'Virtuellt fysiklabb, 23 simuleringar: experiment och parametersvep, modellanpassning, all data som PDF-rapport eller CSV.'
    }
  },  {
    id: 'rookstorm', name: 'Rookstorm', entry: 'rookstorm/index.html', open: 'rookstorm/',
    tags: ['learning', 'explore'], lang: '', notes: ['external'],
    desc: {
      en: 'Chess in 20 languages: Stockfish at any Elo, every variant plus 4-player chess and kung fu chess at a table for up to 4 friends, accounts with ratings and friends, game review, puzzles; offline.',
      de: 'Schach in 20 Sprachen: Stockfish mit jeder Elo, alle Varianten plus 4-Spieler- und Kung-Fu-Schach am Tisch mit bis zu 4 Freunden, Konten mit Wertung und Freunden, Analyse, Puzzles; offline.',
      tr: '20 dilde satranç: her Elo’da Stockfish, tüm varyantlar, 4 kişilik ve kung fu satranç masası, derecelendirmeli hesaplar ve arkadaşlar, oyun incelemesi, bulmacalar; çevrimdışı.',
      es: 'Ajedrez en 20 idiomas: Stockfish con cualquier Elo, todas las variantes, ajedrez a 4 y kung fu en una mesa con amigos, cuentas con puntuación y amigos, análisis y problemas; sin conexión.',
      fr: 'Échecs en 20 langues : Stockfish à tout Elo, toutes les variantes, échecs à 4 et kung-fu à une table entre amis, comptes avec classement et amis, analyse, problèmes ; hors ligne.',
      it: 'Scacchi in 20 lingue: Stockfish a ogni Elo, tutte le varianti, scacchi a 4 e kung fu a un tavolo con amici, account con punteggio e amici, analisi, problemi; offline.',
      pt: 'Xadrez em 20 idiomas: Stockfish em qualquer Elo, todas as variantes, xadrez a 4 e kung fu numa mesa com amigos, contas com rating e amigos, análise, problemas; offline.',
      nl: 'Schaken in 20 talen: Stockfish op elke Elo, alle varianten, schaken met 4 en kungfuschaak aan tafel met vrienden, accounts met rating en vrienden, analyse, puzzels; offline.',
      pl: 'Szachy w 20 językach: Stockfish na każdym Elo, wszystkie warianty, szachy dla 4 i kung-fu przy stole ze znajomymi, konta z rankingiem i znajomymi, analiza, zadania; offline.',
      ru: 'Шахматы на 20 языках: Stockfish на любом Эло, все варианты, шахматы на четверых и кунг-фу за столом с друзьями, аккаунты с рейтингом и друзьями, разбор, задачи; офлайн.',
      uk: 'Шахи 20 мовами: Stockfish на будь-якому Ело, усі варіанти, шахи на чотирьох і кунг-фу за столом із друзями, акаунти з рейтингом і друзями, розбір, задачі; офлайн.',
      ar: 'شطرنج بعشرين لغة: Stockfish بأي تصنيف، كل الأنواع، شطرنج رباعي وكونغ فو على طاولة مع الأصدقاء، حسابات بتصنيف وأصدقاء، مراجعة وألغاز؛ دون اتصال.',
      fa: 'شطرنج به ۲۰ زبان: Stockfish در هر ریتینگ، همه انواع، شطرنج چهارنفره و کونگ‌فو سر میز با دوستان، حساب با ریتینگ و دوستان، بررسی و معما؛ آفلاین.',
      hi: '20 भाषाओं में शतरंज: किसी भी Elo पर Stockfish, सभी वेरिएंट, दोस्तों के साथ टेबल पर 4 खिलाड़ियों और कुंग फू शतरंज, रेटिंग और दोस्तों वाले खाते, समीक्षा, पहेलियाँ; ऑफ़लाइन।',
      zh: '20 种语言的国际象棋：任意等级分对战 Stockfish、所有变体、与好友同桌的四人象棋和功夫象棋、带等级分和好友的账户、复盘、谜题；可离线。',
      ja: '20言語対応のチェス：任意のレーティングでStockfish、全バリアント、友達とテーブルで遊ぶ4人チェスとカンフーチェス、レーティング付きアカウントと友達、レビュー、パズル。オフライン対応。',
      ko: '20개 언어 체스: 원하는 Elo의 Stockfish, 모든 변형, 친구와 테이블에서 즐기는 4인 체스와 쿵푸 체스, 레이팅과 친구가 있는 계정, 리뷰, 퍼즐. 오프라인 지원.',
      id: 'Catur dalam 20 bahasa: Stockfish di Elo berapa pun, semua varian, catur 4 pemain dan kung fu di meja bersama teman, akun dengan rating dan teman, tinjauan, teka-teki; offline.',
      vi: 'Cờ vua 20 ngôn ngữ: Stockfish ở mọi Elo, mọi biến thể, cờ 4 người và kung fu cùng bạn bè tại một bàn, tài khoản có xếp hạng và bạn bè, xem lại ván, câu đố; ngoại tuyến.',
      sv: 'Schack på 20 språk: Stockfish på valfri Elo, alla varianter, schack för 4 och kung fu-schack vid ett bord med vänner, konton med rating och vänner, analys, problem; offline.'
    }
  },
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
    tags: ['health', 'tools'], lang: '', notes: ['foodlookup'],
    desc: {
      en: 'Type what you ate and did today; it works out calories, macros and tomorrow’s fat and muscle change. No AI, no key: a built-in food table plus Open Food Facts for brands and barcodes. Includes thousands of products from Aldi, Lidl, Rewe, Edeka, Kaufland, dm and more.',
      de: 'Schreib, was du heute gegessen und gemacht hast; es berechnet Kalorien, Makros und die Fett- und Muskeländerung. Ohne KI und Schlüssel: eingebaute Tabelle plus Open Food Facts für Marken und Barcodes. Mit Tausenden Produkten von Aldi, Lidl, Rewe, Edeka, Kaufland, dm und mehr.',
      tr: 'Bugün ne yediğini ve ne yaptığını yaz; kaloriyi, makroları ve yağ-kas değişimini hesaplar. Yapay zekâ ve anahtar yok: yerleşik tablo ve markalar ile barkodlar için Open Food Facts. Aldi, Lidl, Rewe, Edeka, Kaufland, dm ve diğerlerinden binlerce ürün içerir.',
      es: 'Escribe qué comiste e hiciste hoy; calcula calorías, macros y el cambio de grasa y músculo. Sin IA ni clave: tabla integrada y Open Food Facts para marcas y códigos de barras. Incluye miles de productos de Aldi, Lidl, Rewe, Edeka, Kaufland, dm y más.',
      fr: 'Écrivez ce que vous avez mangé et fait ; il calcule calories, macros et évolution graisse/muscle. Sans IA ni clé : table intégrée et Open Food Facts pour les marques et codes-barres. Inclut des milliers de produits d’Aldi, Lidl, Rewe, Edeka, Kaufland, dm et plus.',
      it: 'Scrivi cosa hai mangiato e fatto oggi; calcola calorie, macro e variazione di grasso e muscoli. Senza IA né chiave: tabella integrata e Open Food Facts per marchi e codici a barre. Include migliaia di prodotti di Aldi, Lidl, Rewe, Edeka, Kaufland, dm e altri.',
      pt: 'Escreva o que comeu e fez hoje; calcula calorias, macros e a mudança de gordura e músculo. Sem IA nem chave: tabela integrada e Open Food Facts para marcas e códigos de barras. Inclui milhares de produtos de Aldi, Lidl, Rewe, Edeka, Kaufland, dm e outros.',
      nl: 'Typ wat je vandaag at en deed; het berekent calorieën, macro’s en de vet- en spierverandering. Geen AI of sleutel: ingebouwde tabel plus Open Food Facts voor merken en barcodes. Met duizenden producten van Aldi, Lidl, Rewe, Edeka, Kaufland, dm en meer.',
      pl: 'Wpisz, co dziś zjadłeś i robiłeś; liczy kalorie, makro i zmianę tłuszczu i mięśni. Bez AI i klucza: wbudowana tabela i Open Food Facts dla marek i kodów kreskowych. Zawiera tysiące produktów z Aldi, Lidl, Rewe, Edeka, Kaufland, dm i innych.',
      ru: 'Напишите, что вы ели и делали сегодня; посчитает калории, БЖУ и изменение жира и мышц. Без ИИ и ключа: встроенная таблица и Open Food Facts для брендов и штрихкодов. Тысячи товаров из Aldi, Lidl, Rewe, Edeka, Kaufland, dm и других.',
      uk: 'Напишіть, що ви їли й робили сьогодні; порахує калорії, БЖВ і зміну жиру та м’язів. Без ШІ й ключа: вбудована таблиця та Open Food Facts для брендів і штрихкодів. Тисячі товарів з Aldi, Lidl, Rewe, Edeka, Kaufland, dm та інших.',
      ar: 'اكتب ما أكلته وفعلته اليوم؛ يحسب السعرات والمغذيات وتغيّر الدهون والعضلات. بلا ذكاء اصطناعي ولا مفتاح: جدول مدمج مع Open Food Facts للعلامات التجارية والرموز الشريطية. يشمل آلاف المنتجات من Aldi وLidl وRewe وEdeka وKaufland وdm وغيرها.',
      fa: 'بنویس امروز چه خوردی و چه کردی؛ کالری، درشت‌مغذی‌ها و تغییر چربی و عضله را حساب می‌کند. بدون هوش مصنوعی و کلید: جدول داخلی به‌همراه Open Food Facts برای برندها و بارکدها. شامل هزاران محصول از Aldi، Lidl، Rewe، Edeka، Kaufland، dm و دیگران.',
      hi: 'आज क्या खाया और क्या किया लिखें; यह कैलोरी, मैक्रो और फैट-मसल बदलाव निकालता है। कोई AI या कुंजी नहीं: बिल्ट-इन टेबल और ब्रांड व बारकोड के लिए Open Food Facts। इसमें Aldi, Lidl, Rewe, Edeka, Kaufland, dm आदि के हज़ारों उत्पाद हैं।',
      zh: '输入今天吃了什么、做了什么；计算热量、营养素以及脂肪和肌肉变化。无 AI、无密钥：内置食物表，品牌和条形码则查询 Open Food Facts。包含 Aldi、Lidl、Rewe、Edeka、Kaufland、dm 等商店的数千种产品。',
      ja: '今日食べたものと活動を入力すると、カロリー・栄養素・脂肪と筋肉の変化を計算します。AI もキーも不要：内蔵の食品表と、ブランドやバーコードは Open Food Facts。Aldi、Lidl、Rewe、Edeka、Kaufland、dm などの商品数千点を収録。',
      ko: '오늘 먹은 것과 한 일을 입력하면 칼로리, 영양소, 지방·근육 변화를 계산합니다. AI·키 없음: 내장 식품표와 브랜드·바코드는 Open Food Facts. Aldi, Lidl, Rewe, Edeka, Kaufland, dm 등의 제품 수천 개 포함.',
      id: 'Tulis apa yang kamu makan dan lakukan hari ini; menghitung kalori, makro dan perubahan lemak serta otot. Tanpa AI atau kunci: tabel bawaan plus Open Food Facts untuk merek dan barcode. Berisi ribuan produk dari Aldi, Lidl, Rewe, Edeka, Kaufland, dm, dan lainnya.',
      vi: 'Nhập những gì bạn đã ăn và làm hôm nay; tính calo, dinh dưỡng và thay đổi mỡ, cơ. Không AI, không khóa: bảng tích hợp và Open Food Facts cho thương hiệu, mã vạch. Có hàng nghìn sản phẩm từ Aldi, Lidl, Rewe, Edeka, Kaufland, dm và hơn nữa.',
      sv: 'Skriv vad du åt och gjorde i dag; den räknar ut kalorier, makron och fett- och muskelförändring. Ingen AI eller nyckel: inbyggd tabell plus Open Food Facts för märken och streckkoder. Med tusentals produkter från Aldi, Lidl, Rewe, Edeka, Kaufland, dm med flera.'
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
    id: 'verity', name: 'Know', entry: 'verity/index.html', open: 'verity/',
    tags: ['tools'], lang: '', notes: ['lookup'],
    desc: {
      en: 'Paste a post, article or link: it finds the factual claims and shows matching passages from Wikipedia, with an optional on-device AI check.',
      de: 'Beitrag, Artikel oder Link einfügen: findet die Tatsachenbehauptungen und zeigt passende Stellen aus Wikipedia, optional mit KI-Prüfung auf dem Gerät.',
      tr: 'Gönderi, makale ya da bağlantı yapıştır: olgusal iddiaları bulur, Vikipedi’den eşleşen bölümleri gösterir; isteğe bağlı cihazda yapay zekâ kontrolü.',
      es: 'Pega un post, artículo o enlace: encuentra las afirmaciones y muestra pasajes de Wikipedia, con comprobación opcional por IA en el dispositivo.',
      fr: 'Collez un post, un article ou un lien : il trouve les affirmations et montre les passages Wikipédia, avec une vérification IA facultative sur l’appareil.',
      it: 'Incolla un post, un articolo o un link: trova le affermazioni e mostra i passi di Wikipedia, con verifica IA facoltativa sul dispositivo.',
      pt: 'Cole um post, artigo ou link: encontra as afirmações e mostra trechos da Wikipédia, com verificação opcional por IA no dispositivo.',
      nl: 'Plak een bericht, artikel of link: vindt de beweringen en toont passages uit Wikipedia, met optionele AI-controle op je apparaat.',
      pl: 'Wklej wpis, artykuł lub link: znajduje twierdzenia i pokazuje pasujące fragmenty z Wikipedii, z opcjonalną kontrolą AI na urządzeniu.',
      ru: 'Вставьте пост, статью или ссылку: найдёт утверждения и покажет подходящие места из Википедии, по желанию с проверкой ИИ на устройстве.',
      uk: 'Вставте допис, статтю чи посилання: знайде твердження й покаже відповідні місця з Вікіпедії, за бажанням із перевіркою ШІ на пристрої.',
      ar: 'الصق منشورًا أو مقالًا أو رابطًا: يجد الادعاءات ويعرض مقاطع مطابقة من ويكيبيديا، مع فحص اختياري بذكاء اصطناعي على الجهاز.',
      fa: 'پست، مقاله یا پیوند را بچسبان: ادعاها را پیدا می‌کند و بخش‌های مرتبط ویکی‌پدیا را نشان می‌دهد، با بررسی اختیاری هوش مصنوعی روی دستگاه.',
      hi: 'पोस्ट, लेख या लिंक डालें: यह तथ्यात्मक दावे ढूँढकर विकिपीडिया के मिलते अंश दिखाता है, डिवाइस पर वैकल्पिक AI जाँच के साथ।',
      zh: '粘贴帖子、文章或链接：找出事实性说法并显示维基百科中的对应段落，可选在设备上用 AI 核查。',
      ja: '投稿・記事・リンクを貼ると、事実の主張を見つけて Wikipedia の該当箇所を表示。端末上の AI チェックも任意で使えます。',
      ko: '게시물, 기사, 링크를 붙여넣으면 사실 주장을 찾아 위키백과의 관련 부분을 보여 줍니다. 기기 내 AI 확인은 선택.',
      id: 'Tempel postingan, artikel atau tautan: menemukan klaim fakta dan menampilkan bagian Wikipedia yang cocok, dengan cek AI di perangkat opsional.',
      vi: 'Dán bài đăng, bài báo hoặc liên kết: tìm các khẳng định và hiển thị đoạn Wikipedia phù hợp, có thể kiểm tra bằng AI trên máy.',
      sv: 'Klistra in ett inlägg, en artikel eller länk: hittar påståendena och visar matchande stycken från Wikipedia, med valfri AI-kontroll på enheten.'
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
