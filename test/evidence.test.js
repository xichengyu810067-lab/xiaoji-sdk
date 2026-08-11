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

