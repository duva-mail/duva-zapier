const { domainUrl } = require('../constants');

const perform = async (z, bundle) => {
  const input = bundle.inputData;
  const body = {
    from: input.from,
    to: input.to,
    subject: input.subject,
  };
  for (const key of ['cc', 'bcc', 'tags']) {
    if (Array.isArray(input[key]) && input[key].length) {
      body[key] = input[key];
    }
  }
  for (const key of ['html', 'text', 'reply_to']) {
    if (input[key]) {
      body[key] = input[key];
    }
  }
  if (!body.html && !body.text) {
    throw new z.errors.HaltedError('Give a text body, an HTML body, or both.');
  }

  const headers = {};
  if (input.idempotency_key) {
    headers['Idempotency-Key'] = input.idempotency_key;
  }

  const response = await z.request({
    url: domainUrl(bundle, '/messages'),
    method: 'POST',
    headers,
    body,
  });
  return response.data;
};

module.exports = {
  key: 'send_email',
  noun: 'Email',
  display: {
    label: 'Send Email',
    description:
      'Sends an email from your domain. Duva accepts it for delivery; read what happened to it with the New Delivery Event trigger.',
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'from',
        label: 'From',
        type: 'string',
        required: true,
        helpText:
          'The sender, as `address` or `Name <address>`. The address must be on your Duva domain, for example `Shop <shop@example.com>`.',
      },
      {
        key: 'to',
        label: 'To',
        type: 'string',
        list: true,
        required: true,
        helpText:
          'Recipients, as `address` or `Name <address>`. Every recipient sees the other To and Cc recipients: use Bcc to hide an address.',
      },
      { key: 'subject', label: 'Subject', type: 'string', required: true },
      {
        key: 'text',
        label: 'Text Body',
        type: 'text',
        required: false,
        helpText: 'The plain-text body. Give this, the HTML body, or both.',
      },
      {
        key: 'html',
        label: 'HTML Body',
        type: 'text',
        required: false,
        helpText: 'The HTML body. If you give only this, Duva adds a text version made from it.',
      },
      {
        key: 'cc',
        label: 'Cc',
        type: 'string',
        list: true,
        required: false,
        helpText: 'Copy recipients, shown to every recipient.',
      },
      {
        key: 'bcc',
        label: 'Bcc',
        type: 'string',
        list: true,
        required: false,
        helpText: 'Blind-copy recipients, never shown to the others.',
      },
      {
        key: 'reply_to',
        label: 'Reply To',
        type: 'string',
        required: false,
        helpText: 'Where replies go, as `address` or `Name <address>`.',
      },
      {
        key: 'tags',
        label: 'Tags',
        type: 'string',
        list: true,
        required: false,
        helpText: 'Labels to find the email later (10 at most).',
      },
      {
        key: 'idempotency_key',
        label: 'Idempotency Key',
        type: 'string',
        required: false,
        helpText:
          'A stable value (an order number, for example). Running the step twice with the same value sends only one email. Leave empty to send every time.',
      },
    ],
    sample: { id: 'msg_9f1c2d3e4a5b46c78d9e0f1a2b3c4d5e', status: 'queued' },
    outputFields: [
      { key: 'id', label: 'Message ID' },
      { key: 'status', label: 'Status' },
    ],
  },
};
