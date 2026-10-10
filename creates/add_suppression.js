const { domainUrl } = require('../constants');

const perform = async (z, bundle) => {
  const response = await z.request({
    url: domainUrl(bundle, '/suppressions'),
    method: 'POST',
    body: { email: bundle.inputData.email },
  });
  return response.data;
};

module.exports = {
  key: 'add_suppression',
  noun: 'Suppressed Address',
  display: {
    label: 'Add Address to Suppression List',
    description:
      'Stops all email from this domain to an address. Use it for an unsubscribe or an address you know is wrong.',
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'email',
        label: 'Email Address',
        type: 'string',
        required: true,
        helpText: 'The address to stop sending to.',
      },
    ],
    sample: {
      email: 'client@example.org',
      reason: 'manual',
      created_at: '2026-09-19T14:03:25.310Z',
    },
    outputFields: [
      { key: 'email', label: 'Email Address' },
      { key: 'reason', label: 'Reason' },
      { key: 'created_at', label: 'Added At', type: 'datetime' },
    ],
  },
};
