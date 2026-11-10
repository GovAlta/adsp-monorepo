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

- **Which tenant is used.** Tenant users and service accounts generate and verify codes in the tenant of their token, and need the role in that tenant. Core (platform) users with the role in the core realm use a separate core namespace. Verify service doesn't support the `tenantId` query parameter.
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
