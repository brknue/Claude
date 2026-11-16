import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVideoId, parseCaptionXml, pickTrack, handleRequest } from '../lib/youtube.mjs';

test('parseVideoId reads every common link shape', () => {
  const id = 'jNQXAC9IVRw';
  for (const link of [
    id,
    `https://www.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/watch?feature=share&v=${id}&t=10s`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/live/${id}`,
    `m.youtube.com/watch?v=${id}`,
    `  https://music.youtube.com/watch?v=${id}  `,
  ]) {
    assert.equal(parseVideoId(link), id, link);
  }
});

test('parseVideoId rejects things that are not YouTube videos', () => {
  for (const bad of ['', null, 'hello', 'https://vimeo.com/12345678901', 'https://www.youtube.com/watch?v=short', 'https://www.youtube.com/@channel']) {
    assert.equal(parseVideoId(bad), null, String(bad));
  }
});

test('parseCaptionXml reads the newer <p> format, including word pieces', () => {
  const xml = `<timedtext format="3"><body>
    <p t="1200" d="2160">All right, so here we are, in front of the
elephants</p>
    <p t="5000" d="10" a="1">
</p>
    <p t="12616" d="1751">and that&amp;#39;s <s>really</s><s t="200"> cool</s> &lt;3</p>
  </body></timedtext>`;
  assert.deepEqual(parseCaptionXml(xml), [
    { start: 1.2, text: 'All right, so here we are, in front of the elephants' },
    { start: 12.616, text: "and that's really cool <3" },
  ]);
});

test('parseCaptionXml reads the older <text> format', () => {
  const xml = `<transcript><text start="0.5" dur="2">Tom &amp; Jerry</text><text start="3" dur="1">&quot;hi&quot;</text></transcript>`;
  assert.deepEqual(parseCaptionXml(xml), [
    { start: 0.5, text: 'Tom & Jerry' },
    { start: 3, text: '"hi"' },
  ]);
});

test('pickTrack prefers the requested language, then human-written English', () => {
  const tracks = [
    { languageCode: 'en', kind: 'asr' },
    { languageCode: 'de' },
    { languageCode: 'en' },
  ];
  assert.equal(pickTrack(tracks, 'de'), tracks[1]);
  assert.equal(pickTrack(tracks), tracks[2]);
  assert.equal(pickTrack(tracks, 'fr'), tracks[2]);
  assert.equal(pickTrack([tracks[0]]), tracks[0]);
});

const fakeFetch = (player, xml) => async (url) =>
  String(url).includes('/player') ? { json: async () => player } : { text: async () => xml };

test('handleRequest returns the transcript', async () => {
  const player = {
    playabilityStatus: { status: 'OK' },
    videoDetails: { title: 'Me at the zoo', author: 'jawed' },
    captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ languageCode: 'en', baseUrl: 'https://x/caps', name: { runs: [{ text: 'English' }] } }] } },
  };
  const res = await handleRequest('/api/transcript?url=jNQXAC9IVRw', fakeFetch(player, '<p t="1000" d="5">hello</p>'));
  assert.equal(res.status, 200);
  assert.equal(res.body.title, 'Me at the zoo');
  assert.deepEqual(res.body.lines, [{ start: 1, text: 'hello' }]);
  assert.deepEqual(res.body.languages, [{ code: 'en', label: 'English' }]);
});

test('handleRequest explains each failure in plain words', async () => {
  const bad = await handleRequest('/api/transcript?url=nope', fakeFetch({}, ''));
  assert.equal(bad.status, 400);

  const none = await handleRequest('/api/transcript?url=jNQXAC9IVRw', fakeFetch({ playabilityStatus: { status: 'OK' } }, ''));
  assert.equal(none.status, 404);
  assert.match(none.body.error, /no captions/);

  const blocked = await handleRequest(
    '/api/transcript?url=jNQXAC9IVRw',
    fakeFetch({ playabilityStatus: { status: 'LOGIN_REQUIRED', reason: 'Sign in to confirm you’re not a bot' } }, ''),
  );
  assert.equal(blocked.status, 502);
  assert.match(blocked.body.error, /refused/);

  const down = await handleRequest('/api/transcript?url=jNQXAC9IVRw', async () => {
    throw new Error('network');
  });
  assert.equal(down.status, 502);
});
