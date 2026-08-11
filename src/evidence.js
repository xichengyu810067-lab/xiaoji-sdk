'use strict';

const { redact } = require('./redaction');

const EVIDENCE_SCHEMA = 'evidence-v1';

function createEvidence(input = {}) {
  const createdAt = input.createdAt || new Date().toISOString();
  return {
    schema: EVIDENCE_SCHEMA,
    createdAt,
    kind: String(input.kind || 'inspection'),
    subject: redact(input.subject || {}),
    findings: redact(Array.isArray(input.findings) ? input.findings : []),
    metadata: redact(input.metadata || {})
  };
}

function validateEvidence(value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, errors: ['evidence must be an object'] };
  }
  if (value.schema !== EVIDENCE_SCHEMA) errors.push('schema must equal evidence-v1');
  if (typeof value.createdAt !== 'string' || Number.isNaN(Date.parse(value.createdAt))) {
    errors.push('createdAt must be an ISO-8601 date string');
  }
  if (typeof value.kind !== 'string' || value.kind.length === 0) errors.push('kind must be a non-empty string');
  if (!value.subject || typeof value.subject !== 'object' || Array.isArray(value.subject)) {
    errors.push('subject must be an object');
  }
  if (!Array.isArray(value.findings)) errors.push('findings must be an array');
  if (!value.metadata || typeof value.metadata !== 'object' || Array.isArray(value.metadata)) {
    errors.push('metadata must be an object');
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { EVIDENCE_SCHEMA, createEvidence, validateEvidence };

