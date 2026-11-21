/**
 * Translations. English text is the key: t('Your move'). Other languages live in src/locales/<code>.json
 * and are loaded on demand (and cached offline by the service worker).
 */
export const LANGS: [string, string][] = [
  ['en', 'English'], ['de', 'Deutsch'], ['tr', 'Türkçe'], ['es', 'Español'], ['fr', 'Français'], ['it', 'Italiano'],
  ['pt', 'Português'], ['nl', 'Nederlands'], ['pl', 'Polski'], ['sv', 'Svenska'], ['ru', 'Русский'], ['uk', 'Українська'],
  ['ar', 'العربية'], ['fa', 'فارسی'], ['hi', 'हिन्दी'], ['zh', '中文'], ['ja', '日本語'], ['ko', '한국어'], ['id', 'Bahasa Indonesia'], ['vi', 'Tiếng Việt'],
];
const RTL = new Set(['ar', 'fa']);
/** locales/<code>.json is a list of translations in the same order as locales/_keys.json (null = use English). */
const loaders = import.meta.glob('./locales/*.json', { import: 'default' }) as Record<string, () => Promise<any>>;

let dict: Record<string, string> = {};
export let lang = 'en';

export function t(key: string, ...args: (string | number)[]): string {
  let s = dict[key] || key;
  for (let i = 0; i < args.length; i++) s = s.split(`{${i}}`).join(String(args[i]));
  return s;
}

/** Pick the saved language, else the device language if we have it, else English. */
export function detectLang(saved: string): string {
  if (saved && LANGS.some(l => l[0] === saved)) return saved;
  for (const l of navigator.languages || [navigator.language]) {
    const c = (l || '').slice(0, 2).toLowerCase();
    if (LANGS.some(x => x[0] === c)) return c;
  }
  return 'en';
}

export async function setLang(code: string) {
  let next: Record<string, string> = {};
  if (code !== 'en') {
    const load = loaders[`./locales/${code}.json`];
    if (load) {
      try {
        const [keys, vals] = await Promise.all([loaders['./locales/_keys.json'](), load()]) as [string[], (string | null)[]];
        keys.forEach((k, i) => { if (vals[i]) next[k] = vals[i]!; });
      } catch { code = 'en'; }
    } else code = 'en';
  }
  dict = next; lang = code;
  document.documentElement.lang = code;
  document.documentElement.dir = RTL.has(code) ? 'rtl' : 'ltr';
}

/** Localised number / date helpers */
export const fmtDate = (d: Date | string | number) => new Date(d).toLocaleDateString(lang);
export const fmtNum = (n: number) => n.toLocaleString(lang);
