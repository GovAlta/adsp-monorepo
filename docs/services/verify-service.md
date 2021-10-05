---
layout: page
title: Verify service
nav_order: 9
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

