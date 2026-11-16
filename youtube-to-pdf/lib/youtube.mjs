// Fetches a YouTube video's captions. No dependencies; needs Node 18+ (global fetch).

const ANDROID_VERSION = '20.10.38';
const USER_AGENT = `com.google.android.youtube/${ANDROID_VERSION} (Linux; U; Android 14)`;

export class TranscriptError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Accepts a watch/short/embed/live/youtu.be link or a bare 11-character id. */
export function parseVideoId(input) {
  const raw = String(input ?? '').trim();
  if (/^[\w-]{11}$/.test(raw)) return raw;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let id = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const m = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?]+)/);
      if (m) id = m[1];
    }
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, code) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
    }
    return NAMED[code.toLowerCase()] ?? whole;
  });
}

function clean(inner) {
  return decodeEntities(decodeEntities(inner.replace(/<[^>]+>/g, '')))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parses both YouTube caption formats into [{ start: seconds, text }]. */
export function parseCaptionXml(xml) {
  const lines = [];
  const add = (start, inner) => {
    const text = clean(inner);
    if (text) lines.push({ start, text });
  };
  // Newer format: <p t="milliseconds" d="...">text or <s>word</s> pieces</p>
  for (const m of xml.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)) {
    const t = m[1].match(/\bt="(\d+)"/);
    add(t ? Number(t[1]) / 1000 : 0, m[2]);
  }
  if (lines.length) return lines;
  // Older format: <text start="seconds" dur="...">text</text>
  for (const m of xml.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const t = m[1].match(/\bstart="([\d.]+)"/);
    add(t ? Number(t[1]) : 0, m[2]);
  }
  return lines;
}

function trackLabel(t) {
  const name = t.name?.simpleText ?? t.name?.runs?.map((r) => r.text).join('') ?? t.languageCode;
  return name;
}

/** Picks the asked-for language, else a human-written track, else whatever exists. */
export function pickTrack(tracks, lang) {
  if (lang) {
    const exact = tracks.find((t) => t.languageCode === lang && t.kind !== 'asr') ?? tracks.find((t) => t.languageCode === lang);
    if (exact) return exact;
  }
  return (
    tracks.find((t) => t.kind !== 'asr' && t.languageCode?.startsWith('en')) ??
    tracks.find((t) => t.kind !== 'asr') ??
    tracks.find((t) => t.languageCode?.startsWith('en')) ??
    tracks[0]
  );
}

export async function getTranscript(input, lang, fetchImpl = fetch) {
  const videoId = parseVideoId(input);
  if (!videoId) throw new TranscriptError("That doesn't look like a YouTube link.");

  let player;
  try {
    const res = await fetchImpl('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': USER_AGENT },
      body: JSON.stringify({
        context: { client: { clientName: 'ANDROID', clientVersion: ANDROID_VERSION, androidSdkVersion: 34, hl: 'en' } },
        videoId,
      }),
    });
    player = await res.json();
  } catch {
    throw new TranscriptError("Couldn't reach YouTube. Try again in a moment.", 502);
  }

  const status = player?.playabilityStatus?.status;
  if (status !== 'OK') {
    const reason = player?.playabilityStatus?.reason ?? 'The video is unavailable.';
    if (status === 'LOGIN_REQUIRED') {
      throw new TranscriptError(`YouTube refused this request from the server ("${reason}"). This happens on hosted sites; running the app on your own computer avoids it.`, 502);
    }
    throw new TranscriptError(`YouTube says: ${reason}`, 404);
  }

  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (!tracks.length) throw new TranscriptError('This video has no captions, so there is no text to extract.', 404);

  const track = pickTrack(tracks, lang);
  let xml;
  try {
    const res = await fetchImpl(track.baseUrl, { headers: { 'user-agent': USER_AGENT } });
    xml = await res.text();
  } catch {
    throw new TranscriptError("Couldn't download the captions. Try again in a moment.", 502);
  }
  const lines = parseCaptionXml(xml);
  if (!lines.length) throw new TranscriptError('YouTube returned empty captions for this video.', 502);

  return {
    videoId,
    title: player.videoDetails?.title ?? 'YouTube video',
    author: player.videoDetails?.author ?? '',
    language: track.languageCode,
    // One entry per language; pickTrack already prefers the human-written track.
    languages: [...new Set(tracks.map((t) => t.languageCode))].map((code) => {
      const t = pickTrack(tracks, code);
      return { code, label: trackLabel(t) + (t.kind === 'asr' && !/auto/i.test(trackLabel(t)) ? ' (auto-generated)' : '') };
    }),
    lines,
  };
}

/** Shared by the Netlify function and the local server. */
export async function handleRequest(requestUrl, fetchImpl = fetch) {
  const params = new URL(requestUrl, 'http://localhost').searchParams;
  try {
    const data = await getTranscript(params.get('url'), params.get('lang') || undefined, fetchImpl);
    return { status: 200, body: data };
  } catch (err) {
    if (err instanceof TranscriptError) return { status: err.status, body: { error: err.message } };
    return { status: 500, body: { error: 'Something went wrong while reading the video.' } };
  }
}
