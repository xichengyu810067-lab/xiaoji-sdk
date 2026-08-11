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
    return {
      response: await target.reply(payload),
      usedReference: false,
      referenceError
    };
  }
}

module.exports = { replyWithReferenceFallback };

