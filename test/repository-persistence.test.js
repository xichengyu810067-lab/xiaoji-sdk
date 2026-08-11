'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { inspectRepository, runReadOnlyGit } = require('../src/repository');
const { inspectPersistencePaths, createJsonFileStore } = require('../src/persistence');

test('inspectRepository reports this local repository without querying a remote', () => {
  const result = inspectRepository(path.join(__dirname, '..'));
  assert.equal(result.isRepository, true);
  assert.equal(typeof result.clean, 'boolean');
  assert.ok(/^[0-9a-f]{40}$/.test(result.head));
});

test('runReadOnlyGit rejects Git write argv even when its command prefix looks safe', () => {
  assert.throws(
    () => runReadOnlyGit(path.join(__dirname, '..'), ['remote', 'add', 'origin', 'https://example.invalid/repo.git']),
    /argv is not allowlisted/
  );
  assert.throws(() => runReadOnlyGit(path.join(__dirname, '..'), ['status', '--short']), /argv is not allowlisted/);
});

test('inspectPersistencePaths stays inside root', () => {
  const root = path.join(__dirname, 'fixtures');
  const result = inspectPersistencePaths(root, ['persistence/records.json', '../outside']);
  assert.equal(result.paths[0].exists, true);
  assert.equal(result.paths[0].type, 'file');
  assert.equal(result.paths[1].error, 'path escapes root');
});

test('createJsonFileStore round-trips JSON atomically', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoji-sdk-test-'));
  try {
    const store = createJsonFileStore(path.join(root, 'nested', 'store.json'));
    assert.equal(store.read(), null);
    store.write({ records: [{ name: 'synthetic' }] });
    assert.deepEqual(store.read(), { records: [{ name: 'synthetic' }] });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
