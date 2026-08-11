'use strict';

const fs = require('node:fs');
const path = require('node:path');

function inspectLavalinkConfig(input) {
  let config = input;
  let sourcePath = null;
  if (typeof input === 'string') {
    sourcePath = path.resolve(input);
    if (!fs.existsSync(sourcePath)) return { path: sourcePath, exists: false, valid: false, errors: ['configuration does not exist'] };
    config = parseSimpleYaml(fs.readFileSync(sourcePath, 'utf8'));
  }
  if (!config || typeof config !== 'object') return { valid: false, errors: ['configuration must be an object or YAML file'] };

  const server = config.server || {};
  const lavalinkServer = (config.lavalink && config.lavalink.server) || {};
  const port = Number(server.port);
  const errors = [];
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push('server.port must be an integer from 1 to 65535');
  if (!lavalinkServer.password) errors.push('lavalink.server.password is not configured');
  return {
    ...(sourcePath ? { path: sourcePath, exists: true } : {}),
    valid: errors.length === 0,
    server: { port: Number.isInteger(port) ? port : null, addressConfigured: Boolean(server.address) },
    lavalink: { passwordConfigured: Boolean(lavalinkServer.password) },
    errors
  };
}

function parseSimpleYaml(source) {
  const result = {};
  const stack = [{ indent: -1, value: result }];
  for (const rawLine of source.split(/\r?\n/)) {
    if (!rawLine.trim() || /^\s*#/.test(rawLine)) continue;
    const match = rawLine.match(/^(\s*)([\w.-]+):\s*(.*?)\s*$/);
    if (!match) continue;
    const indent = match[1].length;
    const key = match[2];
    const rawValue = match[3].replace(/\s+#.*$/, '');
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].value;
    if (rawValue === '') {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
    } else {
      parent[key] = /^\d+$/.test(rawValue) ? Number(rawValue) : rawValue.replace(/^['"]|['"]$/g, '');
    }
  }
  return result;
}

module.exports = { inspectLavalinkConfig, parseSimpleYaml };

