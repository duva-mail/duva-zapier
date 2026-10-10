// Sends the API key on every request.
const addAuthorization = (request, z, bundle) => {
  if (bundle.authData && bundle.authData.apiKey) {
    request.headers.Authorization = `Bearer ${bundle.authData.apiKey}`;
  }
  request.headers.Accept = 'application/json';
  // Zapier would turn EVERY 429 into "try again later" (and EVERY error status into its own error).
  // Only a rate limit clears by itself, a quota does not: `handleErrors` below decides.
  request.skipThrowForStatus = true;
  request.throwForThrottlingEarly = false;
  return request;
};

// Duva errors are `{"error": {"code": "...", "message": "...", "fields": [...]}}`. The message is
// already written for the person, so it is shown as is; fields that failed validation are added.
const handleErrors = (response, z) => {
  if (response.status < 400) {
    return response;
  }

  const error = (response.data && response.data.error) || {};
  const fields = Array.isArray(error.fields)
    ? error.fields.map((f) => `${f.field}: ${f.message}`).join('; ')
    : '';
  const message = [error.message || `Duva answered HTTP ${response.status}`, fields]
    .filter(Boolean)
    .join(' ');

  // A rate limit clears by itself: let Zapier try again later. A quota (`quota_exceeded`) does
  // not, and neither do the other 4xx.
  if (response.status === 429 && error.code === 'rate_limited') {
    const retryAfter = parseInt(response.headers.get('retry-after'), 10);
    throw new z.errors.ThrottledError(message, Number.isFinite(retryAfter) ? retryAfter : 60);
  }
  if (response.status === 401 || response.status === 404) {
    // Unknown, wrong, revoked or expired key, or a key for another domain: Duva answers the same
    // 404 on purpose.
    throw new z.errors.Error(
      'Duva did not accept this API key for this domain. Check the key and the domain in the connection.',
      error.code || 'authentication',
      response.status,
    );
  }
  if (response.status >= 500) {
    response.throwForStatus(); // Zapier retries a server error on a trigger, reports it on an action
  }
  throw new z.errors.Error(message, error.code || 'error', response.status);
};

module.exports = { addAuthorization, handleErrors };
