'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { redact } = require('../src/redaction');
const { createEvidence, validateEvidence } = require('../src/evidence');

test('redact removes secret values, identifiers, and URLs', () => {
  const output = redact({ apiToken: 'synthetic-secret', userId: 'synthetic-user', note: 'see https://example.test/a' });
  assert.deepEqual(output, { apiToken: '[REDACTED]', userId: '[REDACTED]', note: 'see [REDACTED_URL]' });
});

test('createEvidence produces valid redacted evidence-v1', () => {
  const evidence = createEvidence({
    createdAt: '2026-01-02T03:04:05.000Z',
    kind: 'repository',
    subject: { path: 'fixture', remoteHost: 'example.test' },
    findings: [{ status: 'clean' }],
    metadata: { authorization: 'Bearer synthetic' }
  });
  assert.equal(evidence.subject.remoteHost, '[REDACTED]');
  assert.equal(evidence.metadata.authorization, '[REDACTED]');
  assert.deepEqual(validateEvidence(evidence), { valid: true, errors: [] });
});

test('validateEvidence reports invalid shapes', () => {
  const result = validateEvidence({ schema: 'other' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 4);
});

test('validateEvidence enforces evidence-v1 date-time and additional-property rules', () => {
  const base = {
    schema: 'evidence-v1',
    createdAt: '2026-02-30T03:04:05Z',
    kind: 'inspection',
    subject: [],
    findings: {},
    metadata: null,
    status: 'unrecognized'
  };
  const result = validateEvidence(base);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('createdAt')));
  assert.ok(result.errors.some((error) => error.includes('status is not allowed')));
  assert.ok(result.errors.some((error) => error.includes('subject must be a object')));
  assert.ok(result.errors.some((error) => error.includes('findings must be a array')));
  assert.ok(result.errors.some((error) => error.includes('metadata must be a object')));
});

test('validateEvidence enforces RFC 3339 timezone offset bounds', () => {
  const valid = (createdAt) => validateEvidence({
    schema: 'evidence-v1', createdAt, kind: 'inspection', subject: {}, findings: [], metadata: {}
  }).valid;
  assert.equal(valid('2026-01-02T03:04:05+00:30'), true);
  assert.equal(valid('2026-01-02T03:04:05-05:30'), true);
  assert.equal(valid('2026-01-02T03:04:05+24:00'), false);
});
