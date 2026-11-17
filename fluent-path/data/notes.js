/* Short grammar notes (shown before the unit they belong to) and sound guides.
   Keys of `notes[lang]` are unit numbers starting at 0. Lines starting with
   "• " render as list items; "a = b" pairs render as a small table. */
(function (root) {
  var D = root.FP_DATA = root.FP_DATA || { langs: {}, notes: {}, sounds: {} };

  D.notes.es = {
    1: { title: 'To be: ser and estar', lines: ['Spanish has two verbs for “to be”.', 'ser (who or what something is) = soy, eres, es, somos, son', 'estar (where or how something is) = estoy, estás, está, estamos, están', '• The pronoun is usually dropped: “Soy Anna” = I am Anna.'] },
    3: { title: 'Gender and articles', lines: ['Every noun is masculine or feminine. Learn each noun with its article.', 'the = el (masc.), la (fem.), los / las (plural)', 'a / an = un (masc.), una (fem.)', '• Nouns ending in -o are usually masculine, in -a usually feminine.'] },
    6: { title: 'Present tense', lines: ['The verb ending shows who is acting.', 'hablar (to speak) = hablo, hablas, habla, hablamos, hablan', 'comer (to eat) = como, comes, come, comemos, comen', 'vivir (to live) = vivo, vives, vive, vivimos, viven', '• Negative: put “no” before the verb — “No entiendo.”'] },
    10: { title: 'Adjectives agree', lines: ['Adjectives usually come after the noun and match its gender and number.', 'un coche nuevo = a new car', 'una casa nueva = a new house', '• Add -s for plural: “zapatos nuevos”.'] },
    12: { title: 'Asking questions', lines: ['Questions open with ¿ and close with ?.', '• Question words carry an accent: qué, quién, cuándo, cómo, dónde.', '• A statement becomes a question just by intonation: “¿Comes carne?”'] },
    18: { title: 'Talking about the past', lines: ['For finished actions use the preterite.', 'esperar = esperé (I waited), esperaste, esperó, esperamos, esperaron', 'comer = comí (I ate), comiste, comió, comimos, comieron', '• Some common verbs are irregular: “fue” (was / went), “dijiste” (you said).'] }
  };
  D.notes.fr = {
    1: { title: 'To be: être', lines: ['être = je suis, tu es, il / elle est, nous sommes, vous êtes, ils / elles sont', '• French always needs the subject pronoun: “Je suis Anna.”', '• “tu” is informal; use “vous” with strangers and for groups.'] },
    3: { title: 'Gender and articles', lines: ['Every noun is masculine or feminine. Learn each noun with its article.', 'the = le (masc.), la (fem.), l’ (before a vowel), les (plural)', 'a / an = un (masc.), une (fem.)', '• For “some” food or drink use du / de la / de l’: “Je mange du pain.”'] },
    6: { title: 'Present tense and “not”', lines: ['parler (to speak) = je parle, tu parles, il parle, nous parlons, vous parlez, ils parlent', '• -e, -es and -ent endings are silent.', '• Negative: wrap the verb in ne … pas — “Je ne comprends pas.”'] },
    10: { title: 'Adjectives agree', lines: ['Adjectives match the noun. Feminine usually adds -e, plural adds -s.', 'un petit jardin = a small garden', 'une petite maison = a small house', '• Most adjectives follow the noun, but short common ones (petit, grand, bon, beau, nouveau, vieux) come before it.'] },
    12: { title: 'Asking questions', lines: ['Three ways, from casual to formal:', '• Intonation: “Tu manges ?”', '• Est-ce que: “Est-ce que tu manges ?”', '• Inversion: “Manges-tu ?”'] },
    18: { title: 'Talking about the past', lines: ['The passé composé uses avoir (or être) + past participle.', 'j’ai attendu = I waited', 'j’ai trouvé = I found', 'elle est arrivée = she arrived', '• Verbs of movement (arriver, partir, rester, aller, venir) use être.'] }
  };
  D.notes.de = {
    1: { title: 'To be: sein', lines: ['sein = ich bin, du bist, er / sie / es ist, wir sind, ihr seid, sie sind', '• “sie” means she (sie ist) or they (sie sind); the verb tells you which.', '• “du” is informal; use “Sie” with strangers.'] },
    3: { title: 'Three genders', lines: ['Every noun is masculine, feminine or neuter, and is written with a capital letter. Learn each noun with its article.', 'the = der (masc.), die (fem.), das (neuter), die (plural)', 'a / an = ein (masc. / neuter), eine (fem.)', '• As a direct object, masculine changes: der → den, ein → einen (“Ich trinke einen Kaffee”).'] },
    6: { title: 'Present tense and word order', lines: ['machen (to do) = ich mache, du machst, er macht, wir machen, ihr macht, sie machen', '• The verb is always the second element: “Heute arbeite ich.”', '• Negative: “nicht” for verbs, “kein” for nouns — “Ich habe kein Geld.”'] },
    10: { title: 'Adjectives', lines: ['After “to be”, adjectives never change: “Das Haus ist groß.”', 'Before a noun they take an ending:', 'ein neues Auto = a new car', 'eine neue Sprache = a new language', 'ein neuer Mantel = a new coat'] },
    12: { title: 'Asking questions', lines: ['• With a question word, the verb comes second: “Wo ist der Bahnhof?”', '• Yes / no questions start with the verb: “Hast du eine Schwester?”', '• Question words mostly start with w: was, wer, wann, warum, wie, wo.'] },
    18: { title: 'Talking about the past', lines: ['Spoken German uses haben (or sein) + past participle, which goes to the end.', 'Ich habe gewartet = I waited', 'Ich habe den Schlüssel gefunden = I found the key', 'Sie ist angekommen = she arrived', '• Verbs of movement or change (kommen, gehen, bleiben) use sein.'] }
  };
  D.notes.it = {
    1: { title: 'To be: essere', lines: ['essere = sono, sei, è, siamo, siete, sono', '• The pronoun is usually dropped: “Sono Anna” = I am Anna.', '• “lei” means she, and “Lei” is also the polite you.'] },
    3: { title: 'Gender and articles', lines: ['Every noun is masculine or feminine. Learn each noun with its article.', 'the (masc.) = il, lo (before s+consonant, z), l’ (before a vowel); plural i, gli', 'the (fem.) = la, l’ (before a vowel); plural le', 'a / an = un, uno (masc.), una, un’ (fem.)'] },
    6: { title: 'Present tense', lines: ['parlare (to speak) = parlo, parli, parla, parliamo, parlate, parlano', 'vedere (to see) = vedo, vedi, vede, vediamo, vedete, vedono', 'dormire (to sleep) = dormo, dormi, dorme, dormiamo, dormite, dormono', '• Negative: put “non” before the verb — “Non capisco.”'] },
    10: { title: 'Adjectives agree', lines: ['Adjectives usually follow the noun and match it.', 'un libro nuovo = a new book', 'una macchina nuova = a new car', '• Plural: -o → -i, -a → -e, -e → -i (“scarpe nuove”, “fiori gialli”).'] },
    12: { title: 'Asking questions', lines: ['• A statement becomes a question by intonation: “Mangi carne?”', '• “perché” means both why and because.', '• dove + è shortens to dov’è: “Dov’è il bagno?”'] },
    18: { title: 'Talking about the past', lines: ['The passato prossimo uses avere (or essere) + past participle.', 'ho aspettato = I waited', 'ho trovato = I found', 'è arrivata = she arrived', '• With essere, the participle matches the subject: “siamo rimasti”.'] }
  };
  D.notes.pt = {
    1: { title: 'To be: ser and estar', lines: ['Portuguese has two verbs for “to be”.', 'ser (who or what something is) = sou, é, somos, são', 'estar (where or how something is) = estou, está, estamos, estão', '• In Brazil “você” (you) uses the same verb form as he / she.'] },
    3: { title: 'Gender and articles', lines: ['Every noun is masculine or feminine. Learn each noun with its article.', 'the = o (masc.), a (fem.), os / as (plural)', 'a / an = um (masc.), uma (fem.)', '• Articles merge with prepositions: em + o = no, em + a = na, de + o = do.'] },
    6: { title: 'Present tense', lines: ['falar (to speak) = falo, fala, falamos, falam', 'comer (to eat) = como, come, comemos, comem', 'abrir (to open) = abro, abre, abrimos, abrem', '• Negative: put “não” before the verb — “Eu não entendo.”'] },
    10: { title: 'Adjectives agree', lines: ['Adjectives usually follow the noun and match its gender and number.', 'um carro novo = a new car', 'uma casa nova = a new house', '• Add -s for plural: “sapatos novos”.'] },
    12: { title: 'Asking questions', lines: ['• A statement becomes a question by intonation: “Você come carne?”', '• Question words: o que, quem, quando, por que, como, onde, qual.', '• “por que” starts a question; “porque” means because.'] },
    18: { title: 'Talking about the past', lines: ['For finished actions use the pretérito perfeito.', 'esperar = esperei (I waited), esperou, esperamos, esperaram', 'comer = comi (I ate), comeu, comemos, comeram', '• Some common verbs are irregular: “foi” (was / went), “disse” (said).'] }
  };
  D.notes.en = {
    1: { title: 'To be', lines: ['to be = I am, you are, he / she / it is, we are, they are', '• English always needs the subject pronoun: “I am Anna.”', '• Spoken English shortens these: I’m, you’re, he’s.'] },
    3: { title: 'Articles', lines: ['English nouns have no gender.', 'the = one specific thing', 'a / an = any one thing (“an” before a vowel sound: an apple)', '• Plurals usually add -s: friend → friends. A few are irregular: child → children.'] },
    6: { title: 'Present tense', lines: ['Only he / she / it changes the verb: add -s.', 'I work, you work, she works, we work, they work', '• Negative uses do not (don’t): “I don’t understand.”', '• “I am going” describes what is happening right now.'] },
    10: { title: 'Adjectives', lines: ['Adjectives never change and come before the noun.', 'a new car, two new cars', '• After “to be” they stand alone: “The house is big.”'] },
    12: { title: 'Asking questions', lines: ['• With “to be”, swap the order: “Are you sure?”', '• Other verbs need do / does: “Do you eat meat?”, “When does the train come?”', '• Question words: what, who, when, why, how, where, which.'] },
    18: { title: 'Talking about the past', lines: ['Regular verbs add -ed: wait → waited, arrive → arrived.', 'Common verbs are irregular: find → found, say → said, leave → left.', '• Questions and negatives use did: “What did you say?”'] }
  };

  D.sounds.es = [['h', 'always silent: hola = “ola”'], ['j, ge, gi', 'a rough h, like Scottish “loch”'], ['ll, y', 'like y in “yes”'], ['ñ', 'like ny in “canyon”'], ['rr', 'a strong rolled r'], ['z, ce, ci', '“th” in Spain, “s” in Latin America'], ['vowels', 'always short and clear: a-e-i-o-u = ah-eh-ee-oh-oo'], ['stress', 'an accent mark (á) shows the stressed syllable']];
  D.sounds.fr = [['final consonants', 'usually silent: petit = “puh-tee”'], ['ou', 'like oo in “food”'], ['u', 'say “ee” with rounded lips'], ['on, an, in', 'nasal vowels — the n is not pronounced'], ['r', 'made in the throat'], ['ch', 'like sh in “shop”'], ['oi', 'like “wa”: trois = “trwa”'], ['é / è', 'é like “ay”, è like e in “bed”'], ['liaison', 'a silent final consonant sounds before a vowel: les amis = “lay-zah-mee”']];
  D.sounds.de = [['w', 'like English v: Wasser = “vasser”'], ['v', 'usually like f: Vater = “fah-ter”'], ['z', 'like ts: zwei = “tsvai”'], ['ch', 'soft hiss after e / i (ich), throaty after a / o / u (acht)'], ['sch', 'like sh'], ['ei / ie', 'ei = “eye”, ie = “ee”'], ['ä, ö, ü', 'ä like e in “bed”; ö and ü are e / ee with rounded lips'], ['ß', 'a sharp s'], ['s before a vowel', 'like z: sieben = “zee-ben”']];
  D.sounds.it = [['c, g + e / i', 'soft: ci = “chee”, gi = “jee”'], ['ch, gh', 'hard: chi = “kee”'], ['gli', 'like lli in “million”'], ['gn', 'like ny in “canyon”'], ['double letters', 'hold the consonant longer: nonno'], ['h', 'always silent'], ['r', 'rolled with the tongue tip'], ['vowels', 'always clear: a-e-i-o-u = ah-eh-ee-oh-oo'], ['stress', 'usually the second-to-last syllable; a final accent moves it: città']];
  D.sounds.pt = [['ão, ã, õ', 'nasal vowels, said through the nose'], ['nh', 'like ny in “canyon”'], ['lh', 'like lli in “million”'], ['ç', 'like s'], ['r at the start, rr', 'like English h: rua = “hoo-a”'], ['de, di, te, ti', 'in Brazil often “jee” and “chee”: dia = “jee-a”'], ['final -o, -e', 'weaken to “oo” and “ee”'], ['x', 'often sh: caixa'], ['ch', 'like sh']];
  D.sounds.en = [['th', 'tongue between the teeth: this, three'], ['silent letters', 'common: know, write, night'], ['a, e, i, o, u', 'each has several sounds — learn words by ear'], ['-ed', 'often just “t” or “d”: waited, arrived'], ['r', 'never rolled'], ['stress', 'one syllable per word is strong; the others are weak and quick']];
})(typeof window !== 'undefined' ? window : globalThis);
