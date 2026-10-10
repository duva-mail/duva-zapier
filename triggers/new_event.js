const { domainUrl } = require('../constants');

const EVENT_TYPES = {
  delivered: 'Delivered',
  bounced: 'Bounced',
  deferred: 'Deferred',
  expired: 'Expired',
  complained: 'Complained',
  opened: 'Opened',
  clicked: 'Clicked',
};

// Polling: Zapier calls this every few minutes and shows the events it has not seen. Duva returns
// the newest first, which is the order Zapier expects; the `id` of each event removes duplicates.
const perform = async (z, bundle) => {
  const params = { limit: 100 };
  if (bundle.inputData.type) {
    params.type = bundle.inputData.type;
  }
  if (bundle.inputData.recipient) {
    params.recipient = bundle.inputData.recipient;
  }
  const response = await z.request({ url: domainUrl(bundle, '/events'), params });
  return response.data.data;
};

module.exports = {
  key: 'new_event',
  noun: 'Event',
  display: {
    label: 'New Delivery Event',
    description:
      'Triggers when Duva records a new delivery event for the domain: an email delivered, bounced, deferred, expired, reported as spam, opened or clicked.',
  },
  operation: {
    type: 'polling',
    perform,
    inputFields: [
      {
        key: 'type',
        label: 'Event Type',
        choices: EVENT_TYPES,
        required: false,
        helpText: 'Only trigger for this type of event. Leave empty for every type.',
      },
      {
        key: 'recipient',
        label: 'Recipient',
        type: 'string',
        required: false,
        helpText: 'Only trigger for events about this email address.',
      },
    ],
    sample: {
      id: 'evt_0b1c2d3e4f5a46b78c9d0e1f2a3b4c5d',
      type: 'bounced',
      message_id: 'msg_9f1c2d3e4a5b46c78d9e0f1a2b3c4d5e',
      recipient: 'b@example.com',
      occurred_at: '2026-09-19T14:03:25.310Z',
      detail: {
        code: 550,
        enhanced_code: '5.1.1',
        message: 'user unknown',
        classification: 'InvalidRecipient',
        attempts: 0,
      },
      metadata: { order_id: 'A-1042' },
    },
    outputFields: [
      { key: 'id', label: 'Event ID' },
      { key: 'type', label: 'Event Type' },
      { key: 'message_id', label: 'Message ID' },
      { key: 'recipient', label: 'Recipient' },
      { key: 'occurred_at', label: 'Occurred At', type: 'datetime' },
      { key: 'detail__code', label: 'Detail: SMTP Code', type: 'integer' },
      { key: 'detail__enhanced_code', label: 'Detail: Enhanced Code' },
      { key: 'detail__message', label: 'Detail: Message' },
      { key: 'detail__classification', label: 'Detail: Classification' },
    ],
  },
};
