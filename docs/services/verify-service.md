---
layout: page
title: Verify service
parent: Services
---

# Verify service

Verify service provides time limited random codes that can be used for validation purposes. For example, generated codes can be sent to a user by email and requested from an application to verify user access to the email inbox.

## Client roles

client `urn:ads:platform:verify-service`

| name           | description                                                                                                 |
| :------------- | :---------------------------------------------------------------------------------------------------------- |
| code-generator | Code generator role for verify service. This role allows a service account to generate a new code at a key. |
| code-verifier  | Code verifier role for verify service. This role allows a service account to verify a code against a key.   |

## Tenancy

- **Which tenant is used.** Tenant users and service accounts generate and verify codes in the tenant of their token, and need the role in that tenant. Core (platform) users with the role in the core realm use a separate core namespace. Core users can set the `tenantId` query parameter to the tenant that the [audit records](#audit-actions) of the operation are attributed to, for example the tenant of the subscriber that notification service verifies; it doesn't change the core namespace of the code. Tenant users can't set it; their records are attributed to the tenant of their token.
- **Isolation.** Keys are unique within a tenant, so two tenants can use the same key without conflict. A code generated in one tenant can't be verified from another tenant; the verification responds 200 with `verified: false`, as it does for a key that has no code.

## API overview

All endpoints are under `https://verify-service.adsp.alberta.ca/verify/v1`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Endpoint                      | Purpose                                        | Required role    |
| :---------------------------- | :--------------------------------------------- | :--------------- |
| `POST /verify/v1/codes/{key}` | Generate a new code at a key (no `code` sent). | `code-generator` |
| `POST /verify/v1/codes/{key}` | Verify a code at a key (`code` in the body).   | `code-verifier`  |

## Concepts

### Key

A key identifies what a code verifies, for example an email address or SMS number of a user. Keys are 1 to 50 characters and unique within a tenant. Generating a code at a key replaces any existing code at that key.

### Code

A code is a random 6 character string of characters that are easy to tell apart. A code is valid for 10 minutes by default; set the `expireIn` query parameter to the number of minutes it should be valid for. Each failed verification is counted, and the code is cleared after 10 failed verifications. After a code expires or is cleared, verifications respond with `verified: false` until a new code is generated at the key.

## Events

Verify service does not send or consume domain events.

## Audit actions

Verify service records audit events in the `verify-service` namespace of the [audit service](audit-service.md). The actor is the user or service account that calls the API, for example the notification service account; never the person the code was sent to. The key is the resource (`{ type: 'verify-code', id: <key> }`) and is included as `codeKey` in the metadata. The code value is never recorded. Keys are recorded as given, so prefer keys without personal data, such as a generated ID; notification service uses a random UUID. All actions are version 1, in the `security` category and retention class.

| action                         | category | severity | retention class | recorded when                                                                                                                                                       |
| :----------------------------- | :------- | :------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| code.generated                 | security | info     | security        | A new code is generated at a key, with its `expiresAt` in the metadata.                                                                                             |
| code.verified                  | security | info     | security        | A submitted code matches the code at the key (`verified: true`).                                                                                                    |
| code.rejected                  | security | warning  | security        | A submitted code fails verification (`verified: false`, status `failure`), with `reason` of `mismatch`, or `not-found` when the code expired, was cleared or never existed. |
| code.attempts-exceeded-cleared | security | warning  | security        | The code at a key is cleared after 10 failed verifications (`maxFailedVerifications` in the metadata), in addition to the `code.rejected` of the last attempt.      |

Multiple `code.rejected` records and a `code.attempts-exceeded-cleared` on the same key in a short window can indicate a brute-force attempt.

Expired codes are removed by Redis without verify service being involved, so expiry isn't recorded on its own. A verification after expiry is recorded as `code.rejected` with `reason: 'not-found'`. Requests rejected for validation or missing roles aren't recorded.

Records are written to the tenant of the caller's token. Core users set the tenant with the `tenantId` query parameter; operations of core users without it have no tenant to be recorded to and aren't recorded. Audit failures are logged by the SDK and do not fail the operation. The verify service account requires the `audit-writer` role of `urn:ads:platform:audit-service`.

Audit recording is on by default. Set the environment variable `VERIFY_AUDIT_ENABLED=false` on verify service to turn it off, or `true` to turn it on regardless of the SDK `AUDIT_ENABLED` variable, which applies when `VERIFY_AUDIT_ENABLED` is not set. The action catalog is still registered while recording is off, so turning it back on needs only a restart.

## Code examples

### Generate a code

Generate a time limited code at a particular key with an optional valid duration query parameter.

```typescript
const response = await fetch(
  `https://verify-service.adsp.alberta.ca/verify/v1/codes/${codeKey}?expireIn=${validMinutes}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
);

const { key, code, expiresAt } = await response.json();
```

### Verify a code

Post the code to the API to verify that it is valid. Note that multiple failed verifications will cause a code to be cleared. In that case a new code should be generated at the same key to continue attempts.

```typescript
const response = await fetch(`https://verify-service.adsp.alberta.ca/verify/v1/codes/${codeKey}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: codeToVerify,
  }),
});

const { verified } = await response.json();
```
