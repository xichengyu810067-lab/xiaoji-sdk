'use strict';

const { redact } = require('./redaction');
const evidenceSchema = require('../schemas/evidence-v1.schema.json');

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
  const errors = validateSchema(value, evidenceSchema);
  return { valid: errors.length === 0, errors };
}

function validateSchema(value, schema, location = 'evidence') {
  const errors = [];
  if (!matchesType(value, schema.type)) return [`${location} must be a ${schema.type}`];

  if (schema.type === 'object') {
    for (const property of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, property)) errors.push(`${location}.${property} is required`);
    }
    if (schema.additionalProperties === false) {
      for (const property of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(schema.properties || {}, property)) {
          errors.push(`${location}.${property} is not allowed`);
        }
      }
    }
    for (const [property, propertySchema] of Object.entries(schema.properties || {})) {
      if (Object.prototype.hasOwnProperty.call(value, property)) {
        errors.push(...validateSchema(value[property], propertySchema, `${location}.${property}`));
      }
    }
  }
  if (schema.const !== undefined && value !== schema.const) errors.push(`${location} must equal ${JSON.stringify(schema.const)}`);
  if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${location} must not be empty`);
  if (schema.format === 'date-time' && !isRfc3339DateTime(value)) errors.push(`${location} must be an RFC 3339 date-time`);
  return errors;
}

function matchesType(value, type) {
  if (!type) return true;
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'array') return Array.isArray(value);
  return typeof value === type;
}

function isRfc3339DateTime(value) {
  if (typeof value !== 'string') return false;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/);
  if (!match) return false;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;
  if (match[8] && (Number(match[9]) > 23 || Number(match[10]) > 59)) return false;
  return day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

module.exports = { EVIDENCE_SCHEMA, createEvidence, validateEvidence };
