'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { redact } = require('../src/redaction');

test('redact removes non-HTTP connection strings and sensitive connection keys', () => {
  const output = redact({
    serverAddress: 'private-db.internal',
    credentials: 'synthetic-credential',
    connection: 'postgresql://user:password@private-db.internal:5432/synthetic',
    socket: 'wss://private-service.local/socket',
    database: 'sqlite:///private/store.db',
    note: 'host=private-db.internal password=synthetic'
  });
  assert.equal(output.serverAddress, '[REDACTED]');
  assert.equal(output.credentials, '[REDACTED]');
  assert.equal(output.connection, '[REDACTED]');
  assert.equal(output.socket, '[REDACTED_CONNECTION]');
  assert.equal(output.database, '[REDACTED_CONNECTION]');
  assert.equal(output.note, 'host=[REDACTED] password=[REDACTED]');
});

test('redact masks private hostnames and IP addresses in free text', () => {
  const output = redact('private-db.internal connects to 127.0.0.1');
  assert.equal(output, '[REDACTED_HOST] connects to [REDACTED_HOST]');
});

test('redact fail-closes arbitrary URI schemes that contain userinfo', () => {
  const output = redact('redis://u:synthetic-password@cache.internal/0');
  assert.equal(output, '[REDACTED_CREDENTIAL_URI]');
  assert.doesNotMatch(output, /synthetic-password|cache\.internal/);
});
