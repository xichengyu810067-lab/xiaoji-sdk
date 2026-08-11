'use strict';

const fs = require('node:fs');
const path = require('node:path');

function inspectRenderBlueprint(input) {
  let source = input;
  let sourcePath = null;
  if (typeof input === 'string') {
    sourcePath = path.resolve(input);
    if (!fs.existsSync(sourcePath)) return { path: sourcePath, exists: false, valid: false, errors: ['blueprint does not exist'] };
    source = fs.readFileSync(sourcePath, 'utf8');
  }

  if (source && typeof source === 'object') return inspectBlueprintObject(source, sourcePath);
  if (typeof source !== 'string') return { path: sourcePath, exists: true, valid: false, errors: ['blueprint must be an object or YAML/JSON file'] };

  try {
    if (sourcePath && sourcePath.toLowerCase().endsWith('.json')) {
      return inspectBlueprintObject(JSON.parse(source), sourcePath);
    }
  } catch (error) {
    return { path: sourcePath, exists: true, valid: false, errors: [`invalid JSON: ${error.message}`] };
  }

  const services = [];
  let current = null;
  let inEnvVars = false;
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, '');
    const type = line.match(/^\s*-?\s*type:\s*([^\s]+)/);
    if (type) {
      current = { type: type[1], name: null, envVarKeys: [] };
      services.push(current);
      inEnvVars = false;
      continue;
    }
    if (!current) continue;
    if (/^\s*envVars:\s*$/.test(line)) {
      inEnvVars = true;
      continue;
    }
    const name = line.match(/^\s*name:\s*([^\s#]+)/);
    if (name && !current.name) current.name = name[1];
    const key = inEnvVars && line.match(/^\s*(?:-\s*)?key:\s*([^\s#]+)/);
    if (key) current.envVarKeys.push(key[1]);
    if (/^\S/.test(line)) inEnvVars = false;
  }
  return finalizeBlueprint(services, sourcePath);
}

function inspectBlueprintObject(blueprint, sourcePath) {
  const rawServices = Array.isArray(blueprint.services) ? blueprint.services : [];
  const services = rawServices.map((service) => ({
    type: typeof service.type === 'string' ? service.type : null,
    name: typeof service.name === 'string' ? service.name : null,
    envVarKeys: Array.isArray(service.envVars)
      ? service.envVars.map((item) => item && item.key).filter((key) => typeof key === 'string')
      : []
  }));
  return finalizeBlueprint(services, sourcePath);
}

function finalizeBlueprint(services, sourcePath) {
  const errors = services.length ? [] : ['no services found'];
  for (const service of services) {
    if (!service.type) errors.push('service type is required');
  }
  return {
    ...(sourcePath ? { path: sourcePath, exists: true } : {}),
    valid: errors.length === 0,
    serviceCount: services.length,
    services,
    errors
  };
}

module.exports = { inspectRenderBlueprint };

