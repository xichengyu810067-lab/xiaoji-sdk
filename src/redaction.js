'use strict';

const SENSITIVE_KEY = /(?:token|secret|password|authorization|cookie|api[-_]?key|webhook|host|hostname|(?:^|[_-])id)$/i;
const URL_PATTERN = /\b(?:https?|wss?):\/\/[^\s"']+/gi;
const BEARER_PATTERN = /\bBearer\s+[^\s"']+/gi;

function redactString(value) {
  return value
    .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
    .replace(URL_PATTERN, '[REDACTED_URL]');
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

