'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('CommonJS require exposes the public contract', () => {
  const sdk = require('../src');
  assert.equal(typeof sdk.inspectRepository, 'function');
  assert.equal(typeof sdk.validateEvidence, 'function');
  assert.equal(typeof sdk.inspectYouTubeClientPolicy, 'function');
  assert.equal(typeof sdk.classifyLavalinkV4LoadResult, 'function');
  assert.equal(typeof sdk.validateYouTubeRuntimeEvidence, 'function');
  assert.equal(Object.keys(sdk).length, 15);
});

test('ESM import can consume the CommonJS default export', () => {
  const entry = path.resolve(__dirname, '..', 'src', 'index.js').replace(/\\/g, '/');
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', `import sdk from ${JSON.stringify(`file:///${entry}`)}; if (typeof sdk.redact !== 'function') process.exit(1);`], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('CLI help and repository inspection work on Windows and Linux shells', () => {
  const cli = path.join(__dirname, '..', 'bin', 'xiaoji-sdk.js');
  const help = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /repo inspect/);
  const repo = spawnSync(process.execPath, [cli, 'repo', 'inspect', path.join(__dirname, '..')], { encoding: 'utf8' });
  assert.equal(repo.status, 0, repo.stderr);
  assert.equal(JSON.parse(repo.stdout).isRepository, true);
  const classify = spawnSync(process.execPath, [cli, 'lavalink', 'classify', path.join(__dirname, 'fixtures', 'lavalink-v4-track.json')], { encoding: 'utf8' });
  assert.equal(classify.status, 0, classify.stderr);
  assert.equal(JSON.parse(classify.stdout).category, 'track');
  const policy = spawnSync(process.execPath, [cli, 'youtube', 'inspect', path.join(__dirname, 'fixtures', 'youtube-policy.json')], { encoding: 'utf8' });
  assert.equal(policy.status, 0, policy.stderr);
  assert.equal(JSON.parse(policy.stdout).valid, true);
  const evidence = spawnSync(process.execPath, [cli, 'youtube', 'evidence', path.join(__dirname, 'fixtures', 'youtube-runtime-partial.json')], { encoding: 'utf8' });
  assert.equal(evidence.status, 1);
  assert.equal(JSON.parse(evidence.stdout).status, 'partial');
  const invalidRoute = spawnSync(process.execPath, [cli, 'repo', 'classify', path.join(__dirname, '..')], { encoding: 'utf8' });
  assert.equal(invalidRoute.status, 1);
  assert.match(invalidRoute.stderr, /unsupported area/);
});
