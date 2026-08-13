'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  inspectYouTubeClientPolicy,
  classifyLavalinkV4LoadResult,
  validateFiveTrackPlaybackEvidence,
  validateControlTimeline,
  validateYouTubeRuntimeEvidence
} = require('../src/youtube-runtime');

function actualEvents() {
  return [
    { type: 'TrackStart', observation: 'actual', observedAt: '2026-08-13T01:02:03Z' },
    { type: 'now-playing', observation: 'actual', observedAt: '2026-08-13T01:02:04Z' }
  ];
}

function fiveTracks() {
  return Array.from({ length: 5 }, (_, index) => ({ id: `synthetic-track-${index + 1}`, events: actualEvents() }));
}

test('YouTube policy permits only TVHTML5_SIMPLY and prohibits credential keys', () => {
  assert.equal(inspectYouTubeClientPolicy({ youtube: { clients: ['TVHTML5_SIMPLY'] } }).valid, true);
  const denied = inspectYouTubeClientPolicy({ youtube: { clients: ['TVHTML5_SIMPLY', 'WEB'], poToken: 'synthetic-value', refreshToken: 'synthetic-value' } });
  assert.equal(denied.valid, false);
  assert.deepEqual(denied.forbiddenKeys, ['youtube.poToken', 'youtube.refreshToken']);
  assert.doesNotMatch(JSON.stringify(denied), /synthetic-value/);
});

test('classifyLavalinkV4LoadResult handles each v4 loadType fail-closed', () => {
  assert.deepEqual(classifyLavalinkV4LoadResult({ loadType: 'error', data: { message: 'synthetic error' } }), { loadType: 'error', category: 'error', playable: false, itemCount: 0 });
  assert.deepEqual(classifyLavalinkV4LoadResult({ loadType: 'empty', data: {} }), { loadType: 'empty', category: 'empty', playable: false, itemCount: 0 });
  assert.equal(classifyLavalinkV4LoadResult({ loadType: 'track', data: {} }).playable, true);
  assert.deepEqual(classifyLavalinkV4LoadResult({ loadType: 'search', data: [] }), { loadType: 'search', category: 'search', playable: false, itemCount: 0 });
  assert.deepEqual(classifyLavalinkV4LoadResult({ loadType: 'playlist', data: { tracks: [{}, {}] } }), { loadType: 'playlist', category: 'playlist', playable: true, itemCount: 2 });
  assert.equal(classifyLavalinkV4LoadResult({ loadType: 'unexpected' }).category, 'unknown');
});

test('five-track gate requires actual TrackStart and now-playing observations, not parsing alone', () => {
  assert.deepEqual(validateFiveTrackPlaybackEvidence({ tracks: fiveTracks() }), { valid: true, status: 'passed', errors: [] });
  const parsedOnly = fiveTracks();
  parsedOnly[0] = { id: 'synthetic-track-1', parsed: true, events: [] };
  const result = validateFiveTrackPlaybackEvidence({ tracks: parsedOnly });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('TrackStart')));
  assert.ok(result.errors.some((error) => error.includes('now-playing')));
});

test('control timeline fails closed until every control has an actual passed event', () => {
  const partial = validateControlTimeline([{ control: 'queue', status: 'passed', observedAt: '2026-08-13T01:02:03Z' }]);
  assert.equal(partial.valid, false);
  assert.equal(partial.status, 'partial');
  const complete = ['queue', 'pause', 'resume', 'skip', 'stop'].map((control) => ({ control, status: 'passed', observedAt: '2026-08-13T01:02:03Z' }));
  assert.deepEqual(validateControlTimeline(complete), { valid: true, status: 'passed', errors: [] });
});

test('runtime evidence composes policy, actual playback, and fail-closed controls', () => {
  const result = validateYouTubeRuntimeEvidence({
    youtubePolicy: { clients: ['TVHTML5_SIMPLY'] },
    playback: { tracks: fiveTracks() },
    controls: []
  });
  assert.equal(result.valid, false);
  assert.equal(result.status, 'partial');
  assert.equal(result.playback.status, 'passed');
  assert.equal(result.controls.status, 'partial');
});

