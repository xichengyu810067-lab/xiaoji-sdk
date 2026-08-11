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
  persistence inspect [directory]   Inspect conventional local persistence paths.
  evidence validate <file>          Validate an evidence-v1 JSON document.
`;

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function requirePath(value, label) {
  if (!value) throw new Error(`${label} path is required`);
  return value;
}

function main(argv = process.argv.slice(2)) {
  if (!argv.length || argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(USAGE);
    return 0;
  }
  const [area, action, target] = argv;
  if (action !== 'inspect' && !(area === 'evidence' && action === 'validate')) {
    throw new Error('unsupported command; run with --help');
  }
  if (area === 'repo') print(sdk.inspectRepository(target || process.cwd()));
  else if (area === 'render') print(sdk.inspectRenderBlueprint(requirePath(target, 'blueprint')));
  else if (area === 'lavalink') print(sdk.inspectLavalinkConfig(requirePath(target, 'configuration')));
  else if (area === 'persistence') print(sdk.inspectPersistencePaths(target || process.cwd()));
  else if (area === 'evidence') {
    const file = path.resolve(requirePath(target, 'evidence'));
    const result = sdk.validateEvidence(JSON.parse(fs.readFileSync(file, 'utf8')));
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

