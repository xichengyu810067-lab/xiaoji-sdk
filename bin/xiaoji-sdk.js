#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const sdk = require('../src');

const USAGE = `Usage: xiaoji-sdk <area> <action> [path]

Areas:
  repo inspect [directory]          Inspect a local Git repository read-only.
  render inspect <blueprint>        Inspect a Render YAML or JSON blueprint.
  lavalink inspect <config>         Inspect a Lavalink YAML configuration.
  lavalink classify <result>        Classify a Lavalink v4 JSON load result.
  persistence inspect [directory]   Inspect conventional local persistence paths.
  evidence validate <file>          Validate an evidence-v1 JSON document.
  youtube inspect <config>          Validate TVHTML5_SIMPLY-only client policy.
  youtube evidence <file>           Validate runtime playback and control evidence.
`;

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function requirePath(value, label) {
  if (!value) throw new Error(`${label} path is required`);
  return value;
}

function readConfig(file) {
  const sourcePath = path.resolve(requirePath(file, 'configuration'));
  const source = fs.readFileSync(sourcePath, 'utf8');
  if (sourcePath.toLowerCase().endsWith('.json')) return JSON.parse(source);
  return require('../src/lavalink').parseSimpleYaml(source);
}

function main(argv = process.argv.slice(2)) {
  if (!argv.length || argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(USAGE);
    return 0;
  }
  const [area, action, target] = argv;
  if (area === 'repo' && action === 'inspect') print(sdk.inspectRepository(target || process.cwd()));
  else if (area === 'render' && action === 'inspect') print(sdk.inspectRenderBlueprint(requirePath(target, 'blueprint')));
  else if (area === 'lavalink' && action === 'inspect') print(sdk.inspectLavalinkConfig(requirePath(target, 'configuration')));
  else if (area === 'lavalink' && action === 'classify') print(sdk.classifyLavalinkV4LoadResult(readConfig(target)));
  else if (area === 'persistence' && action === 'inspect') print(sdk.inspectPersistencePaths(target || process.cwd()));
  else if (area === 'evidence' && action === 'validate') {
    const file = path.resolve(requirePath(target, 'evidence'));
    const result = sdk.validateEvidence(JSON.parse(fs.readFileSync(file, 'utf8')));
    print(result);
    return result.valid ? 0 : 1;
  } else if (area === 'youtube' && action === 'inspect') print(sdk.inspectYouTubeClientPolicy(readConfig(target)));
  else if (area === 'youtube' && action === 'evidence') {
    const file = path.resolve(requirePath(target, 'evidence'));
    const result = sdk.validateYouTubeRuntimeEvidence(JSON.parse(fs.readFileSync(file, 'utf8')));
    print(result);
    return result.valid ? 0 : 1;
  } else throw new Error('unsupported area; run with --help');
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    process.stderr.write(`xiaoji-sdk: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { main, USAGE };
