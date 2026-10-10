const { domainUrl } = require('./constants');

// One API key per domain (Duva dashboard > API keys). The key only opens that domain.
// A domain name only: people often paste `https://example.com` or a path.
const DOMAIN_NAME = /^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$/;

const test = async (z, bundle) => {
  if (!DOMAIN_NAME.test(bundle.authData.domain || '')) {
    throw new z.errors.Error(
      'Enter the domain name only, for example example.com (no https:// and no path).',
      'invalid_domain',
      400,
    );
  }
  // Reads one suppression entry: needs a valid key for exactly this domain, changes nothing.
  const response = await z.request({
    url: domainUrl(bundle, '/suppressions'),
    params: { limit: 1 },
  });
  return response.data;
};

module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      type: 'password',
      required: true,
      helpText:
        'Create it in the Duva dashboard, under **API keys**. A key only works for the domain it was created for. [How authentication works](https://duva.ca/en/docs#authentication)',
    },
    {
      key: 'domain',
      label: 'Domain',
      type: 'string',
      required: true,
      helpText:
        'The sending domain the API key belongs to, for example `example.com`. Emails are sent from an address on this domain. [About Duva domains](https://duva.ca/en/docs#authentication)',
    },
  ],
  test,
  connectionLabel: '{{bundle.authData.domain}}',
};
