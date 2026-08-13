'use strict';

const fs = require('node:fs');
const path = require('node:path');
const major = Number(process.versions.node.split('.')[0]);

if (!Number.isInteger(major) || major < 18) {
  console.error('xiaoji-sdk requires Node.js 18 or newer.');
  process.exitCode = 1;
} else {
  console.log(`Node.js ${process.versions.node} satisfies the >=18 contract.`);
}

const requiredExports = [
  'inspectRepository', 'inspectRenderBlueprint', 'inspectLavalinkConfig',
  'normalizeTrackUserData', 'replyWithReferenceFallback', 'inspectPersistencePaths',
  'createJsonFileStore', 'redact', 'createEvidence', 'validateEvidence',
  'inspectYouTubeClientPolicy', 'classifyLavalinkV4LoadResult',
  'validateFiveTrackPlaybackEvidence', 'validateControlTimeline',
  'validateYouTubeRuntimeEvidence'
];
const entrypoint = path.join(__dirname, '..', 'src', 'index.js');
if (!fs.existsSync(entrypoint)) {
  console.error('CommonJS entrypoint is missing.');
  process.exitCode = 1;
} else {
  const sdk = require(entrypoint);
  const missing = requiredExports.filter((name) => typeof sdk[name] !== 'function');
  if (missing.length) {
    console.error(`Missing public API exports: ${missing.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log(`Public API contract exports ${requiredExports.length} functions.`);
  }
}
