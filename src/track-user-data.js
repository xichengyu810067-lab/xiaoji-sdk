'use strict';

function normalizeTrackUserData(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('track user data must be an object');
  }
  const requester = value.requester || value.user || value.requestedBy || {};
  const requesterId = value.requesterId ?? requester.id ?? (typeof requester === 'string' ? requester : null);
  const requesterName = value.requesterName ?? requester.username ?? requester.displayName ?? null;
  const channelId = value.channelId ?? value.requestChannelId ?? null;
  const messageId = value.messageId ?? value.requestMessageId ?? null;

  return {
    requesterId: requesterId == null ? null : String(requesterId),
    requesterName: requesterName == null ? null : String(requesterName),
    channelId: channelId == null ? null : String(channelId),
    messageId: messageId == null ? null : String(messageId)
  };
}

module.exports = { normalizeTrackUserData };

