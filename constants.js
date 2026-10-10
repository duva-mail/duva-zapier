// Production API only: Zapier does not publish integrations that point at a test environment.
const BASE_URL = 'https://api.duva.ca';

// `/v1/<domain>` of the domain the API key was created for. The domain is part of the path, so
// it is encoded: it comes from the user.
const domainUrl = (bundle, path) =>
  `${BASE_URL}/v1/${encodeURIComponent(bundle.authData.domain)}${path}`;

module.exports = { BASE_URL, domainUrl };
