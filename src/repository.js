'use strict';

const { existsSync, statSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const READ_ONLY_GIT_ARGV = [
  ['rev-parse', '--show-toplevel'],
  ['rev-parse', '--abbrev-ref', 'HEAD'],
  ['rev-parse', 'HEAD'],
  ['status', '--porcelain=v1'],
  ['remote']
];

function runReadOnlyGit(cwd, args) {
  if (!READ_ONLY_GIT_ARGV.some((allowed) => allowed.length === args.length && allowed.every((part, index) => part === args[index]))) {
    throw new Error('Git argv is not allowlisted for inspection');
  }
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', shell: false });
  return {
    ok: result.status === 0 && !result.error,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim()
  };
}

function inspectRepository(directory = process.cwd()) {
  const path = resolve(directory);
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    return { path, isRepository: false, error: 'directory does not exist' };
  }
  const root = runReadOnlyGit(path, ['rev-parse', '--show-toplevel']);
  if (!root.ok) return { path, isRepository: false, error: 'not a Git repository' };

  const branch = runReadOnlyGit(path, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const head = runReadOnlyGit(path, ['rev-parse', 'HEAD']);
  const status = runReadOnlyGit(path, ['status', '--porcelain=v1']);
  const remotes = runReadOnlyGit(path, ['remote']);
  return {
    path,
    root: root.stdout,
    isRepository: true,
    branch: branch.ok ? branch.stdout : null,
    head: head.ok ? head.stdout : null,
    clean: status.ok ? status.stdout.length === 0 : null,
    remotes: remotes.ok && remotes.stdout ? remotes.stdout.split(/\r?\n/) : []
  };
}

module.exports = { inspectRepository, runReadOnlyGit };
