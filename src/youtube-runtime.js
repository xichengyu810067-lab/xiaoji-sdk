'use strict';

const ALLOWED_YOUTUBE_CLIENT = 'TVHTML5_SIMPLY';
const REQUIRED_CONTROL_NAMES = ['queue', 'pause', 'resume', 'skip', 'stop'];
const FORBIDDEN_YOUTUBE_KEY = /^(?:oauth(?:2)?|potoken|cookie|token|visitordata|refreshtoken)$/i;

function inspectYouTubeClientPolicy(config) {
  const clients = collectClientValues(config);
  const forbiddenKeys = [];
  visitKeys(config, '', (key, path) => {
    if (FORBIDDEN_YOUTUBE_KEY.test(normalizeKey(key))) forbiddenKeys.push(path);
  });
  const errors = [];
  if (clients.length !== 1 || clients[0] !== ALLOWED_YOUTUBE_CLIENT) {
    errors.push(`youtube clients must be exactly ${ALLOWED_YOUTUBE_CLIENT}`);
  }
  if (forbiddenKeys.length) errors.push('youtube credential keys are prohibited');
  return {
    valid: errors.length === 0,
    allowedClient: ALLOWED_YOUTUBE_CLIENT,
    clients,
    forbiddenKeys,
    errors
  };
}

function classifyLavalinkV4LoadResult(result) {
  const loadType = result && typeof result.loadType === 'string' ? result.loadType.toLowerCase() : null;
  const data = result && result.data;
  if (loadType === 'error') return { loadType: 'error', category: 'error', playable: false, itemCount: 0 };
  if (loadType === 'empty') return { loadType: 'empty', category: 'empty', playable: false, itemCount: 0 };
  if (loadType === 'track') return { loadType: 'track', category: 'track', playable: isObject(data), itemCount: isObject(data) ? 1 : 0 };
  if (loadType === 'search') return { loadType: 'search', category: 'search', playable: Array.isArray(data) && data.length > 0, itemCount: Array.isArray(data) ? data.length : 0 };
  if (loadType === 'playlist') {
    const tracks = isObject(data) && Array.isArray(data.tracks) ? data.tracks : [];
    return { loadType: 'playlist', category: 'playlist', playable: tracks.length > 0, itemCount: tracks.length };
  }
  return { loadType, category: 'unknown', playable: false, itemCount: 0 };
}

function validateFiveTrackPlaybackEvidence(evidence) {
  const errors = [];
  const tracks = evidence && Array.isArray(evidence.tracks) ? evidence.tracks : null;
  if (!tracks || tracks.length !== 5) return { valid: false, status: 'partial', errors: ['exactly five tracks are required'] };
  const ids = new Set();
  tracks.forEach((track, index) => {
    const location = `tracks[${index}]`;
    if (!isObject(track) || typeof track.id !== 'string' || !track.id) {
      errors.push(`${location}.id is required`);
      return;
    }
    if (ids.has(track.id)) errors.push(`${location}.id must be unique`);
    ids.add(track.id);
    const events = Array.isArray(track.events) ? track.events : [];
    if (!events.some((event) => isActualEvent(event, 'trackstart'))) errors.push(`${location} requires an actual TrackStart event`);
    if (!events.some((event) => isActualEvent(event, 'nowplaying'))) errors.push(`${location} requires an actual now-playing event`);
  });
  return { valid: errors.length === 0, status: errors.length === 0 ? 'passed' : 'partial', errors };
}

function validateControlTimeline(timeline) {
  const events = Array.isArray(timeline) ? timeline : [];
  const errors = [];
  for (const control of REQUIRED_CONTROL_NAMES) {
    const completed = events.some((event) => isObject(event)
      && event.control === control
      && event.status === 'passed'
      && isRfc3339DateTime(event.observedAt));
    if (!completed) errors.push(`controls.${control} lacks an actual passed event`);
  }
  return { valid: errors.length === 0, status: errors.length === 0 ? 'passed' : 'partial', errors };
}

function validateYouTubeRuntimeEvidence(evidence) {
  const policy = inspectYouTubeClientPolicy(evidence && evidence.youtubePolicy);
  const playback = validateFiveTrackPlaybackEvidence(evidence && evidence.playback);
  const controls = validateControlTimeline(evidence && evidence.controls);
  const errors = [...policy.errors, ...playback.errors, ...controls.errors];
  return {
    valid: errors.length === 0,
    status: errors.length === 0 ? 'passed' : 'partial',
    policy,
    playback,
    controls,
    errors
  };
}

function collectClientValues(config) {
  const clients = [];
  visitKeys(config, '', (key, path, value) => {
    if (normalizeKey(key) !== 'clients') return;
    const values = Array.isArray(value) ? value : typeof value === 'string' ? value.replace(/^\[|\]$/g, '').split(',') : [];
    for (const client of values) {
      const normalized = String(client).trim().replace(/^['"]|['"]$/g, '');
      if (normalized) clients.push(normalized);
    }
  });
  return clients;
}

function visitKeys(value, prefix, visitor) {
  if (!isObject(value) && !Array.isArray(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    visitor(key, path, child);
    visitKeys(child, path, visitor);
  }
}

function isActualEvent(event, expectedType) {
  return isObject(event)
    && normalizeKey(event.type) === expectedType
    && event.observation === 'actual'
    && isRfc3339DateTime(event.observedAt);
}

function normalizeKey(value) {
  return String(value || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isRfc3339DateTime(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && !Number.isNaN(Date.parse(value));
}

module.exports = {
  ALLOWED_YOUTUBE_CLIENT,
  REQUIRED_CONTROL_NAMES,
  inspectYouTubeClientPolicy,
  classifyLavalinkV4LoadResult,
  validateFiveTrackPlaybackEvidence,
  validateControlTimeline,
  validateYouTubeRuntimeEvidence
};

