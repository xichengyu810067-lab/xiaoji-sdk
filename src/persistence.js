'use strict';

const fs = require('node:fs');
const path = require('node:path');

function inspectPersistencePaths(root = process.cwd(), candidates = ['data', 'storage', 'persistence', 'save']) {
  const resolvedRoot = path.resolve(root);
  const paths = candidates.map((candidate) => {
    const absolutePath = path.resolve(resolvedRoot, candidate);
    const insideRoot = absolutePath === resolvedRoot || absolutePath.startsWith(`${resolvedRoot}${path.sep}`);
    if (!insideRoot) return { candidate, path: absolutePath, exists: false, error: 'path escapes root' };
    try {
      const stat = fs.statSync(absolutePath);
      return { candidate, path: absolutePath, exists: true, type: stat.isDirectory() ? 'directory' : 'file' };
    } catch (error) {
      if (error.code === 'ENOENT') return { candidate, path: absolutePath, exists: false };
      return { candidate, path: absolutePath, exists: false, error: error.code || 'unreadable' };
    }
  });
  return { root: resolvedRoot, paths };
}

function createJsonFileStore(filePath) {
  const target = path.resolve(filePath);

  function read() {
    try {
      return JSON.parse(fs.readFileSync(target, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw new Error(`Unable to read JSON store: ${error.message}`);
    }
  }

  function write(value) {
    const serialized = JSON.stringify(value, null, 2);
    if (serialized === undefined) throw new TypeError('JSON store value must be serializable');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.${Date.now()}.tmp`);
    try {
      fs.writeFileSync(temporary, `${serialized}\n`, { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(temporary, target);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }

  return Object.freeze({ path: target, read, write });
}

module.exports = { inspectPersistencePaths, createJsonFileStore };

