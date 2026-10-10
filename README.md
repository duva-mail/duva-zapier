# Duva for Zapier

The [Duva](https://duva.ca) integration for [Zapier](https://zapier.com): send transactional email from a Zap, react to
delivery events, and manage the suppression list. Duva is a transactional email API hosted in Canada.

| | |
|---|---|
| **Trigger** | **New Delivery Event**: an email was delivered, bounced, deferred, expired, reported as spam, opened or clicked (polling; filter by type or recipient) |
| **Action** | **Send Email**: From, To, Cc, Bcc, Subject, text and/or HTML body, Reply To, tags, an optional idempotency key |
| **Action** | **Add Address to Suppression List**: stop all email from the domain to an address |

Connect with a Duva **API key** (created for one domain, in the dashboard under *API keys*) and that **domain**.

Sending is asynchronous: **Send Email** returns `queued` (Duva accepted the message), not "delivered". Use the **New Delivery
Event** trigger to react to what happens next. Set an **Idempotency Key** (an order number, for example) when a step can run
twice: Duva then sends only one email for the same key.

Duva's API reference: <https://duva.ca/en/docs>.

---

## For maintainers

The integration is a [Zapier Platform CLI](https://docs.zapier.com/platform/home) app (Node.js 18.20+).

```bash
npm install
npm test               # unit tests, against a mocked API (no network)
npm run validate       # Zapier's own checks (needs network, no account)
```

### One-time setup (the maintainer's Zapier account)

1. Create a Zapier developer account and log in: `npx zapier-platform login`.
2. Register the integration (its name must be exactly `Duva`): `npx zapier-platform register "Duva"`. This writes
   `.zapierapprc`: **commit it** (it holds the integration's id, no secret).
3. For CI, store your deploy key as the GitHub secret `ZAPIER_DEPLOY_KEY`. `zapier-platform login` saves it in
   `~/.zapierrc` (`deployKey`); the CLI reads it from the `ZAPIER_DEPLOY_KEY` environment variable when it runs without a
   login, which is what the *Deploy* workflow does.

### Releasing a version

Bump `version` in `package.json` (and `CHANGELOG.md`), tag `vX.Y.Z` and push the tag: the *Deploy* workflow checks the
version, runs the tests and Zapier's validation, then runs `zapier-platform push`. That creates the version as **private**:
share it with `npx zapier-platform users:links` or `users:add`.

### Publishing to the Zapier App Directory

A pushed version is private until Zapier reviews it. The requirements are in
[Integration publishing requirements](https://docs.zapier.com/integrations/publish/integration-publishing-requirements).
In short: a Duva test account that does not expire (see below), every trigger and action tested in a real Zap with a
successful run in the Zap history, a team member with an `@duva.ca` address on the integration, English-only text, then
`npx zapier-platform promote 1.0.0` and the review form it links to.

**Test account for Zapier's reviewers.** The requirements ask for an account in the application with the email address
`integration-testing@zapier.com`, non-expiring, with the features needed to test the steps. For Duva that means a
Duva account for that address, **out of the sandbox** (so it can send to any address), with a verified domain and an API
key, and a way for Zapier to change its password.

## License

MIT.
