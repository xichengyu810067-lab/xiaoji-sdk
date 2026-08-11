'use strict';

const SENSITIVE_KEY = /(?:token|secret|password|authorization|cookie|api[-_]?key|webhook|host|hostname|address|credentials?|connection|dsn|uri|url|id)$/i;
const URL_PATTERN = /\bhttps?:\/\/[^\s"']+/gi;
const CONNECTION_PATTERN = /\b(?:wss?|postgres(?:ql)?|mysql|sqlite):(?:\/\/)?[^\s"']*/gi;
const BEARER_PATTERN = /\bBearer\s+[^\s"']+/gi;
const CONNECTION_SETTING_PATTERN = /\b(password|passwd|pwd|user(?:name)?|host(?:name)?|server(?:address)?|address)\s*=\s*[^;\s,]+/gi;
const PRIVATE_HOST_PATTERN = /\b(?:localhost|(?:[a-z0-9-]+\.)+(?:local|internal|lan|corp|home|private)|(?:\d{1,3}\.){3}\d{1,3})\b/gi;

function redactString(value) {
  return value
    .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
    .replace(URL_PATTERN, '[REDACTED_URL]')
    .replace(CONNECTION_PATTERN, '[REDACTED_CONNECTION]')
    .replace(CONNECTION_SETTING_PATTERN, '$1=[REDACTED]')
    .replace(PRIVATE_HOST_PATTERN, '[REDACTED_HOST]');
}

function redact(value, options = {}) {
  const replacement = options.replacement || '[REDACTED]';
  const sensitiveKey = options.sensitiveKey || SENSITIVE_KEY;
  const seen = new WeakMap();

  function visit(current, key) {
    if (key && sensitiveKey.test(key)) return replacement;
    if (typeof current === 'string') return redactString(current);
    if (current === null || typeof current !== 'object') return current;
    if (seen.has(current)) return '[CIRCULAR]';

    const copy = Array.isArray(current) ? [] : {};
    seen.set(current, copy);
    for (const [childKey, childValue] of Object.entries(current)) {
      copy[childKey] = visit(childValue, childKey);
    }
    return copy;
  }

  return visit(value, '');
}

module.exports = { redact, SENSITIVE_KEY };
