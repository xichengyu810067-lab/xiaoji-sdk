'use strict';

function withReference(payload, reference) {
  return {
    ...payload,
    reply: {
      messageReference: reference,
      failIfNotExists: false
    }
  };
}

async function replyWithReferenceFallback(target, payload, reference) {
  if (!target || typeof target.reply !== 'function') throw new TypeError('target.reply must be a function');
  if (reference === undefined || reference === null) {
    return { response: await target.reply(payload), usedReference: false };
  }
  try {
    return { response: await target.reply(withReference(payload, reference)), usedReference: true };
  } catch (referenceError) {
    if (!isMissingMessageReferenceError(referenceError)) throw referenceError;
    return {
      response: await target.reply(payload),
      usedReference: false,
      referenceError
    };
  }
}

function isMissingMessageReferenceError(error) {
  if (!error || typeof error !== 'object') return false;
  const code = String(error.code ?? error.rawError?.code ?? '');
  if (code === '10008' || code === 'UNKNOWN_MESSAGE' || code === 'MESSAGE_REFERENCE_UNKNOWN') return true;
  const message = String(error.message ?? error.rawError?.message ?? '');
  return /\bunknown message\b|\bmessage[_\s-]?reference\b.*\b(?:unknown|not found|invalid)\b/i.test(message);
}

module.exports = { replyWithReferenceFallback };
