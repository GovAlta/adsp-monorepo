---
layout: page
title: Verify service
nav_order: 10
parent: Services
---

# Verify service
Verify service provides time limited random codes that can be used for validation purposes. For example, generated codes can be sent to a user by email and requested from an application to verify user access to the email inbox.

## Client roles
client `urn:ads:platform:verify-service`

| name | description |
|:-|:-|
| code-generator | Code generator role for verify service. This role allows a service account to generate a new code at a key. |
| code-verifier | Code verifier role for verify service. This role allows a service account to verify a code against a key. |

## Code examples
### Generate a code
Generate a time limited code at a particular key with an optional valid duration query parameter.

```typescript
  const response = await fetch(
    `https://verify-service.adsp.alberta.ca/verify/v1/codes/${codeKey}?expireIn=${validMinutes}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  const {
    key,
    code,
    expiresAt,
  } = await response.json();
```

### Verify a code
Post the key to the API to verify that it is valid. Note that multiple failed verifications will cause a code to be cleared. In that case a new code should be generated at the same key to continue attempts.

```typescript
  const response = await fetch(
    `https://verify-service.adsp.alberta.ca/verify/v1/codes/${codeKey}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: {
        code: codeToVerify,
      },
    }
  );

  const {
    verified,
  } = await response.json();
```
