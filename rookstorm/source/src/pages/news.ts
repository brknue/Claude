/** "What's new": the update notes (CHANGELOG.md), the version number, and a one-time note after an update. */
import changelog from '../../CHANGELOG.md?raw';
import { h, icon, loadRaw, save, offerBar, clearOffers, btn } from '../ui';
import { t } from '../i18n';
import { go } from '../main';

interface Release { v: string; title: string; items: string[] }

/** "## 8.0 – Title" headings with "- item" lines below them */
export const RELEASES: Release[] = (() => {
  const out: Release[] = [];
  for (const raw of changelog.split(/\r?\n/)) {
    const line = raw.trim();
    const head = /^##\s+(\d+\.\d+)\s+[–-]\s+(.+)$/.exec(line);
    if (head) { out.push({ v: head[1], title: head[2], items: [] }); continue; }
    if (line.startsWith('- ') && out.length) out[out.length - 1].items.push(line.slice(2));
  }
  return out;
})();
export const VERSION = RELEASES[0]?.v || '1.0';

/** **bold** in the notes */
function rich(text: string): (string | HTMLElement)[] {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(p => (p.startsWith('**') ? h('b', null, p.slice(2, -2)) : p));
}

export function newsPage(root: HTMLElement) {
  save('seenVersion', VERSION);
  clearOffers('news');
  root.append(h('div.news', null,
    h('h1', null, t('What\'s new')),
    h('p.muted', null, t('Version {0}', VERSION) + ' · ' + t('Big updates raise the first number, small updates the second.')),
    ...RELEASES.map((r, i) => h('section.card.news-rel', { class: i === 0 ? 'latest' : '' },
      h('h2', null, h('span.news-v', null, r.v), ' ', r.title, i === 0 ? h('span.tag', null, t('Latest')) : null),
      h('ul', null, r.items.map(it => h('li', null, ...rich(it))))))));
}

/** once after an update: tell returning visitors that a new version is here (first-time visitors see nothing) */
export function announceVersion() {
  const seen = loadRaw('seenVersion', '' as string);
  if (!seen) { save('seenVersion', VERSION); return; }
  if (seen === VERSION || /^#\/(news|game|table|join)/.test(location.hash)) return;
  const r = RELEASES[0];
  offerBar('news', t('Version {0} is here: {1}', VERSION, r?.title || ''), [
    btn(h('span', null, icon('star'), t('See what\'s new')), () => { clearOffers('news'); go('news'); }, 'primary small'),
    btn(t('Close'), () => { save('seenVersion', VERSION); clearOffers('news'); }, 'small ghost')]);
}
