'use strict';

const { inspectRepository } = require('./repository');
const { inspectRenderBlueprint } = require('./render');
const { inspectLavalinkConfig } = require('./lavalink');
const { normalizeTrackUserData } = require('./track-user-data');
const { replyWithReferenceFallback } = require('./reply');
const { inspectPersistencePaths, createJsonFileStore } = require('./persistence');
const { redact } = require('./redaction');
const { createEvidence, validateEvidence } = require('./evidence');
const {
  inspectYouTubeClientPolicy,
  classifyLavalinkV4LoadResult,
  validateFiveTrackPlaybackEvidence,
  validateControlTimeline,
  validateYouTubeRuntimeEvidence
} = require('./youtube-runtime');

module.exports = {
  inspectRepository,
  inspectRenderBlueprint,
  inspectLavalinkConfig,
  normalizeTrackUserData,
  replyWithReferenceFallback,
  inspectPersistencePaths,
  createJsonFileStore,
  redact,
  createEvidence,
  validateEvidence,
  inspectYouTubeClientPolicy,
  classifyLavalinkV4LoadResult,
  validateFiveTrackPlaybackEvidence,
  validateControlTimeline,
  validateYouTubeRuntimeEvidence
};
