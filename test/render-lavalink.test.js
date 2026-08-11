'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { inspectRenderBlueprint } = require('../src/render');
const { inspectLavalinkConfig } = require('../src/lavalink');

test('inspectRenderBlueprint summarizes synthetic service declarations', () => {
  const result = inspectRenderBlueprint(path.join(__dirname, 'fixtures', 'render.yaml'));
  assert.equal(result.valid, true);
  assert.equal(result.serviceCount, 1);
  assert.deepEqual(result.services[0].envVarKeys, ['SYNTHETIC_MODE']);
});

test('inspectLavalinkConfig reports configuration gaps without returning passwords or addresses', () => {
  const result = inspectLavalinkConfig(path.join(__dirname, 'fixtures', 'lavalink.yml'));
  assert.equal(result.valid, false);
  assert.equal(result.server.addressConfigured, true);
  assert.equal(result.lavalink.passwordConfigured, false);
  assert.equal(JSON.stringify(result).includes('127.0.0.1'), false);
});

