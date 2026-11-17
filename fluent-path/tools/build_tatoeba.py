"""Build concept-aligned sentence units for Fluent Path from Tatoeba exports.
Usage: python -I build_tatoeba.py <raw_dir> <site_dir> [--write]
Tatoeba sentences are CC BY 2.0 FR (https://tatoeba.org)."""
import sys, os, re, io, math, unicodedata, collections, json

RAW, SITE = sys.argv[1], sys.argv[2]
WRITE = '--write' in sys.argv
LANGS = [('en', 'eng'), ('es', 'spa'), ('fr', 'fra'), ('de', 'deu'), ('it', 'ita'), ('pt', 'por')]
TARGETS = LANGS[1:]

def fold(s):
    s = s.lower().replace('’', "'").replace('‘', "'")
    s = re.sub(r"[.,!?¿¡;:\"“”«»()…\-]", ' ', s)
    s = s.replace('ß', 'ss').replace('œ', 'oe').replace('æ', 'ae')
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', s.replace("'", '')).strip()

def words(s):
    return re.findall(r"[^\W\d_]+(?:'[^\W\d_]+)?", s)

# ---- links: eng id -> {lang: [ids]}
links = collections.defaultdict(dict)
for code, t in TARGETS:
    with io.open(os.path.join(RAW, 'eng-%s_links.tsv' % t), encoding='utf8') as f:
        for line in f:
            a, b = line.rstrip('\n').split('\t')
            links[int(a)].setdefault(code, []).append(int(b))
full = {k for k, v in links.items() if len(v) == 5}
print('english sentences translated into all 5:', len(full))

def load(t, need=None):
    out = {}
    with io.open(os.path.join(RAW, '%s_sentences.tsv' % t), encoding='utf8') as f:
        for line in f:
            p = line.rstrip('\n').split('\t')
            if len(p) < 3: continue
            i = int(p[0])
            if need is None or i in need: out[i] = p[2].strip()
    return out

# English word frequencies from the whole English corpus (lowercase forms only)
eng_all = load('eng')
freq = collections.Counter()
lower_seen = collections.Counter()
for s in eng_all.values():
    for w in words(s):
        freq[w.lower()] += 1
        if w[0].islower(): lower_seen[w.lower()] += 1
rank = {w: i + 1 for i, (w, _) in enumerate(freq.most_common())}

BLOCK = set('''kill killed killing kills murder murdered dead die died dies death suicide gun guns shoot shot bomb war
 sex sexy naked drunk beer? drugs drug cocaine weed stupid idiot idiots fool hate hated hates ugly fat damn hell god jesus
 church pray bible allah muslim christian jew jews racist rape raped prison jail police steal stole stolen thief
 sick? blood fuck shit ass bitch slave slaves cancer pregnant divorce divorced weapon knife hurt? fight fighting
 tom mary john ken jane mike bob alice jack paul lucy emily bill taro yumi mennad baya sami layla muiriel
 president government politics army soldier soldiers enemy dollars yen executed execute king queen prince princess wars dying corpse'''.replace('?', '').split())
OK_CAPS = {"I", "I'm", "I've", "I'll", "I'd"}

def eng_ok(s):
    if not re.fullmatch(r"[A-Za-z][A-Za-z ,'?!.\-]*[.?!]", s): return False
    if '  ' in s or '..' in s or '!!' in s or '?!' in s: return False
    ws = words(s)
    if not 3 <= len(ws) <= 9: return False
    if ws[0].lower() not in lower_seen or lower_seen[ws[0].lower()] < 30: return False   # first word is a name
    for w in ws[1:]:
        if w[0].isupper() and w not in OK_CAPS: return False
    if any(w.lower() in BLOCK for w in ws): return False
    return True

def tgt_ok(code, s):
    if not s or len(s) > 90 or re.search(r'[0-9|()\[\]{}<>/\\*#@%&=_~^"“”«»]', s): return False
    if not re.search(r'[.?!]$', s): return False
    ws = words(s)
    if not 2 <= len(ws) <= 13: return False
    if len(re.sub(r'[.,!?¿¡;:…]', ' ', s).split()) > 10: return False   # at most 10 tiles to build
    if code != 'de':
        for w in ws[1:]:
            if w[0].isupper(): return False
    else:
        if re.search(r'\b(Tom|Maria|Mary|John|Ken)\b', s): return False
    if code == 'pt' and re.search(r'\b(comboio|autocarro|telemóvel|pequeno-almoço|casa de banho|rapariga|frigorífico|ecrã|equipa|est(ou|ás|á|amos|ão) a [a-z]+r)\b', s.lower()):
        return False
    return True

cand = [i for i in full if i in eng_all and eng_ok(eng_all[i])]
print('after english filter:', len(cand))
need = set()
for i in cand:
    for code, _ in TARGETS: need.update(links[i][code])
tgt = {}
for code, t in TARGETS:
    tgt[code] = load(t, need)
    print('loaded', code, len(tgt[code]))

# ---- existing library texts (to avoid repeats)
existing = collections.defaultdict(set)
for code, _ in LANGS:
    src = io.open(os.path.join(SITE, 'data', code + '.js'), encoding='utf8').read()
    for m in re.findall(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"", src):
        txt = (m[0] or m[1]).replace("\\'", "'")
        for a in txt.split('|'): existing[code].add(fold(re.sub(r'\s*\([^)]*\)', '', a)))

items = []
for i in cand:
    row = {'en': [eng_all[i]], 'ids': {'en': i}}
    good = True
    for code, _ in TARGETS:
        alts, seen = [], set()
        for j in sorted(links[i][code]):
            s = tgt[code].get(j)
            if s and tgt_ok(code, s) and fold(s) not in seen:
                seen.add(fold(s)); alts.append((j, s))
        if not alts: good = False; break
        row[code] = [a[1] for a in alts[:3]]
        row['ids'][code] = alts[0][0]
    if not good: continue
    if any(fold(row[c][0]) in existing[c] for c, _ in LANGS): continue
    ws = [w.lower() for w in words(row['en'][0])]
    rk = [rank.get(w, 10**6) for w in ws]
    row['score'] = len(ws) + 2.5 * sum(1 for r in rk if r > 1500) + 1.5 * sum(1 for r in rk if r > 5000)
    row['ws'] = set(ws)
    items.append(row)
print('aligned in all six languages:', len(items))

# ---- de-duplicate: each language text must be unique; collapse contraction variants
def ekey(s):
    s = s.lower()
    for a, b in [("i'm", 'i am'), ("don't", 'do not'), ("it's", 'it is'), ("can't", 'cannot'), ("isn't", 'is not'),
                 ("you're", 'you are'), ("he's", 'he is'), ("she's", 'she is'), ("we're", 'we are'), ("they're", 'they are'),
                 ("doesn't", 'does not'), ("didn't", 'did not'), ("won't", 'will not'), ("that's", 'that is'), ("i'll", 'i will')]:
        s = s.replace(a, b)
    return fold(s)
items.sort(key=lambda r: (r['score'], r['ids']['en']))
used = {c: set() for c, _ in LANGS}
uniq = []
for r in items:
    keys = {c: fold(r[c][0]) for c, _ in LANGS}
    keys['en'] = ekey(r['en'][0])
    if any(keys[c] in used[c] for c, _ in LANGS): continue
    # alternates must not collide with another item's main text either
    for c, _ in LANGS: used[c].add(keys[c])
    uniq.append(r)
print('unique:', len(uniq))

TOPICS = [
    ('Food & drink', '\U0001F37D️', 'Talk about meals, food and drinks', 'eat ate eaten eating eats food drink drank drinking drinks coffee tea water milk bread breakfast lunch dinner hungry thirsty cook cooked cooking cooks apple apples meat fish rice cake wine restaurant delicious soup fruit vegetables sugar egg eggs cheese juice meal taste tastes chocolate'),
    ('Family & friends', '\U0001F46A', 'Talk about the people close to you', 'mother father mom dad brother brothers sister sisters family parents son sons daughter daughters wife husband uncle aunt children child baby friend friends grandmother grandfather married kids boyfriend girlfriend'),
    ('Home', '\U0001F3E0', 'Talk about your home and things in it', 'house home room rooms door window bed table chair apartment garden key keys wall floor clean kitchen bathroom bedroom'),
    ('Time', '\U0001F552', 'Talk about when things happen', 'today tomorrow yesterday morning evening night week weekend month year years hour hours minute minutes time late early monday tuesday wednesday thursday friday saturday sunday soon already'),
    ('Travel & places', '\U0001F9F3', 'Get around and talk about places', 'go goes going went travel traveled train bus car station airport city town country street road far near map trip hotel beach ticket drive drove walk walked village abroad'),
    ('Shopping & money', '\U0001F6D2', 'Buy things and talk about money', 'buy bought buying sell sold money price expensive cheap store shop shops pay paid cost costs rich poor'),
    ('Health & body', '\U0001FA7A', 'Say how you feel and look after yourself', 'doctor hospital head headache hurts pain medicine tired sleep sleeping slept health healthy eyes hand hands teeth feet cold fever rest'),
    ('Weather & nature', '⛅', 'Talk about the weather, animals and nature', 'rain raining rained snow snowing sun sunny weather hot warm wind windy tree trees flowers flower river sea mountain mountains sky dog dogs cat cats bird birds animals horse lake forest'),
    ('Work & school', '\U0001F393', 'Talk about work, school and learning', 'work works working worked job office boss school teacher student students study studying studied class homework learn learning learned lesson exam book books university language english french german spanish italian question answer'),
    ('Free time', '\U0001F3B5', 'Talk about hobbies and having fun', 'play plays playing played music song songs sing singing movie movies film game games sport sports football soccer tennis swim swimming dance dancing party holiday vacation fun guitar piano tv television read reading'),
    ('Feelings', '\U0001F49B', 'Say how you feel', 'happy sad angry afraid scared love loves loved worried glad lonely nervous excited bored feel feels felt sorry miss laugh cry'),
    ('Thinking & opinions', '\U0001F4AD', 'Share what you think and know', 'think thought believe know knew known idea true right wrong maybe sure agree understand understood remember forget forgot mean hope'),
]
KW = [set(t[3].split()) for t in TOPICS]
GRAMMAR = [
    ('Asking questions', '❓', 'Ask and answer everyday questions'),
    ('Talking about the past', '⏪', 'Say what happened'),
    ('Plans & the future', '⏩', 'Talk about plans and what will happen'),
    ('Can, must & should', '\U0001F6E0️', 'Say what you can, must and should do'),
    ('Requests & suggestions', '\U0001F64F', 'Ask for things and suggest ideas'),
]
NT = len(TOPICS)
TOPICS = TOPICS + GRAMMAR
OTHER = ('Everyday talk', '\U0001F4AC', 'Handle everyday conversations')
PAST = set('was were did had went said saw came made took got gave told knew thought found left felt became bought brought heard lost met paid ran sat spent stood understood wrote yesterday ago'.split())
MODAL = set("can can't cannot could couldn't must mustn't should shouldn't need needs have has".split())
REQ = set("please let's let help give tell show wait come stop look listen try don't be".split())

def topic_of(r):
    best, bi = 0, -1
    for k, kw in enumerate(KW):
        n = len(r['ws'] & kw)
        if n > best: best, bi = n, k
    if bi >= 0: return bi
    en, ws = r['en'][0], r['ws']
    first = en.split()[0].lower().strip(',!.')
    if en.endswith('?'): return NT
    if ws & PAST or any(w.endswith('ed') and len(w) > 4 for w in ws): return NT + 1
    if ws & {'will', "i'll", "we'll", "you'll", "he'll", "she'll", "won't", 'going'}: return NT + 2
    if ws & MODAL: return NT + 3
    if en.endswith('!') or first in REQ: return NT + 4
    return -1

N_MAX = int(os.environ.get('FP_MAX', '3000'))
pool = uniq[:int(len(uniq) * 0.85)]
prefix = collections.Counter()
sel, taken = [], set()
step = len(pool) / float(N_MAX * 1.15)
k = 0.0
while k < len(pool) and len(sel) < N_MAX:   # spread across the difficulty range, limiting repeated templates
    i = int(k); k += step
    p = ' '.join(pool[i]['en'][0].lower().split()[:2])
    if prefix[p] >= 18: continue
    prefix[p] += 1; sel.append(pool[i]); taken.add(i)
for i in range(len(pool)):
    if len(sel) >= N_MAX: break
    if i not in taken: sel.append(pool[i])
sel.sort(key=lambda r: r['score'])
BANDS = [('Level 1', 'short, common sentences'), ('Level 2', 'longer everyday sentences'), ('Level 3', 'richer, more varied sentences')]
nb = len(sel)
units, meta = [], []
counter = collections.Counter()
SIZE = 20
for b, (bname, bdesc) in enumerate(BANDS):
    band = sel[b * nb // 3:(b + 1) * nb // 3]
    by = collections.defaultdict(list)
    for r in band: by[topic_of(r)].append(r)
    left = []
    band_units = []
    for k in list(range(len(TOPICS))) + [-1]:
        rs = by.get(k, [])
        if k == -1: rs = rs + left; left = []
        n_units = int(round(len(rs) / float(SIZE)))
        if k != -1 and n_units == 0:
            left += rs; continue
        if k == -1: n_units = max(1, n_units) if rs else 0
        for u in range(n_units):
            chunk = rs[u * len(rs) // n_units:(u + 1) * len(rs) // n_units]
            chunk.sort(key=lambda r: r['score'])
            band_units.append((k, u, chunk, TOPICS[k] if k >= 0 else OTHER))
    # interleave themes so the same one does not come many times in a row
    band_units.sort(key=lambda x: (x[1], x[0] if x[0] >= 0 else 99))
    for k, u, chunk, t in band_units:
        counter[t[0]] += 1
        units.append(chunk)
        meta.append({'title': t[0] + ' ' + str(counter[t[0]]), 'icon': t[1], 'goal': t[2], 'band': b})
print('units:', len(units), 'sentences:', sum(len(u) for u in units))
for b in range(3): print(' band', b + 1, sum(1 for m in meta if m['band'] == b), 'units')
print(collections.Counter(m['title'].rsplit(' ', 1)[0] for m in meta))
for m, u in list(zip(meta, units))[::12]: print(' ', m['title'], '|', u[0]['en'][0], '|', u[-1]['en'][0])

if WRITE:
    out = os.path.join(SITE, 'data', 'tatoeba')
    os.makedirs(out, exist_ok=True)
    head = '/* Fluent Path — sentence library from Tatoeba (https://tatoeba.org), CC BY 2.0 FR.\n   Generated by build_tatoeba.py; sentence ids for every item are in data/tatoeba/SOURCES.tsv. */\n'
    for code, _ in LANGS:
        rows = [{'w': [], 's': ['|'.join(r[code]) for r in u]} for u in units]
        js = head + '(function (root) {\n  var u = root.FP_DATA.langs.' + code + '.units;\n' + \
            ''.join('  u.push(' + json.dumps(x, ensure_ascii=False) + ');\n' for x in rows) + '})(typeof window !== \'undefined\' ? window : globalThis);\n'
        io.open(os.path.join(out, code + '.js'), 'w', encoding='utf8', newline='\n').write(js)
    js = head + '(function (root) {\n  var D = root.FP_DATA;\n' + \
        ''.join('  D.units.push(' + json.dumps({'title': m['title'], 'icon': m['icon'], 'goal': m['goal'], 'src': 'tatoeba', 'level': m['band'] + 1}, ensure_ascii=False) + ');\n' for m in meta) + \
        '  D.credits = D.credits || [];\n  D.credits.push({ name: "Tatoeba", url: "https://tatoeba.org", license: "CC BY 2.0 FR", licenseUrl: "https://creativecommons.org/licenses/by/2.0/fr/", items: ' + str(sum(len(u) for u in units)) + ' });\n' + \
        '})(typeof window !== \'undefined\' ? window : globalThis);\n'
    io.open(os.path.join(out, 'units.js'), 'w', encoding='utf8', newline='\n').write(js)
    with io.open(os.path.join(out, 'SOURCES.tsv'), 'w', encoding='utf8', newline='\n') as f:
        f.write('unit\titem\t' + '\t'.join('tatoeba_' + t for _, t in LANGS) + '\n')
        for ui, u in enumerate(units):
            for si, r in enumerate(u):
                f.write('%d\ts%d_%d\t%s\n' % (ui + 21, ui + 20, si, '\t'.join(str(r['ids'][c]) for c, _ in LANGS)))
    print('written to', out)
