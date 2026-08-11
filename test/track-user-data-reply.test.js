'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTrackUserData } = require('../src/track-user-data');
const { replyWithReferenceFallback } = require('../src/reply');

test('normalizeTrackUserData accepts common requester shapes', () => {
  assert.deepEqual(normalizeTrackUserData({
    requester: { id: 'synthetic-user-01', displayName: 'Synthetic User' },
    requestChannelId: 'synthetic-channel-01'
  }), {
    requesterId: 'synthetic-user-01',
    requesterName: 'Synthetic User',
    channelId: 'synthetic-channel-01',
    messageId: null
  });
});

test('replyWithReferenceFallback retries plain reply when a reference fails', async () => {
  const calls = [];
  const target = {
    async reply(payload) {
      calls.push(payload);
      if (payload.reply) throw new Error('reference is unavailable');
      return 'sent';
    }
  };
  const result = await replyWithReferenceFallback(target, { content: 'synthetic reply' }, 'synthetic-message-01');
  assert.equal(result.response, 'sent');
  assert.equal(result.usedReference, false);
  assert.ok(result.referenceError instanceof Error);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].reply, undefined);
});

