---
layout: page
title: Client secret rotation service
parent: Services
---

# Client secret rotation service

Client secret rotation service lets a tenant rotate the secrets of its confidential Keycloak clients before they expire. The API and the **Client secrets** tab of the Access page in the tenant management webapp let tenant admins turn rotation on for their realm, choose which clients rotate, rotate a client on demand, invalidate a previous secret, and set the contacts that are notified.

Rotation depends on the Keycloak client secret rotation policy, which is supported in Keycloak 26.8.2 and later. Clients keep working while the previous secret is still valid, because both the new and the previous secret are accepted.

## Client roles

client `urn:ads:platform:client-secret-rotation-service`

| name                | description                                                                           |
| :------------------ | :------------------------------------------------------------------------------------ |
| client-secret-admin | Grants permission to manage client secret rotation in a realm. Tenant admins have it. |

## Tenancy

- **Which realm is used.** The API acts on the realm of the caller's token. There is no way to name another realm.
- **Core users.** Core (platform) users are refused with 403, and the `master` realm is never reachable.
- **User token.** The API calls the Keycloak Admin API with the signed-in admin's own token, so Keycloak enforces that admin's realm-management permissions. The service holds no Keycloak credential. A tenant admin needs the Keycloak realm roles `manage-realm` (the client policy), `manage-clients`, `view-clients`, `query-clients`, `view-users`, `query-users` and `view-realm`. Grant them as one composite realm role. `manage-realm` is a broad permission, so give it only to admins who may change realm settings.
- **Isolation.** The service's own client is hidden from the list and can't be changed through the API.

## API overview

All endpoints are under `/rotation/v1`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas. No endpoint returns a client secret.

| Endpoint                                                   | Purpose                                                    |
| :--------------------------------------------------------- | :--------------------------------------------------------- |
| `GET /rotation/v1/realm`                                   | Read the rotation mode and schedule of the realm.          |
| `PUT /rotation/v1/realm`                                   | Set the realm mode and the schedule.                       |
| `GET /rotation/v1/clients`                                 | List clients with their rotation status.                   |
| `PATCH /rotation/v1/clients/{clientId}`                    | Set the contacts notified for a client.                    |
| `PUT /rotation/v1/clients/{clientId}/opt-in`               | Opt a client in or out (`selected` mode only).             |
| `POST /rotation/v1/clients/{clientId}/rotate`              | Rotate the secret now.                                     |
| `POST /rotation/v1/clients/{clientId}/invalidate-previous` | End the overlap early by invalidating the previous secret. |
| `POST /rotation/v1/clients/{clientId}/notify`              | Send the expiry notice now.                                |

All endpoints need the `client-secret-admin` role (or the tenant admin role for realms that predate it). `{clientId}` is the URL-encoded Keycloak client ID.

## Concepts

### Realm mode

Each tenant realm is either On or Off, and the realm's Keycloak client policy holds that state. Turning rotation on in the portal creates the `secret-rotation` policy and its `secret-rotation-profile` profile the first time and enables them afterwards; turning it off disables the policy. While On, only opted-in clients rotate (`selected`), or every confidential client does (`all`).

### Schedule

The schedule is set in seconds. `expirationPeriod` is the secret lifetime, and `rotatedExpirationPeriod` is how long the previous secret keeps working after a rotation. Both live in the Keycloak policy executor, so Keycloak is the source of truth. `noticePeriod` is how long before expiry contacts are notified and is stored in the tenant configuration of this service. The notice period must be shorter than the lifetime. A rotated expiration of `0` means the previous secret stops working immediately.

### Contacts

Contacts are email addresses stored with the client. Realm admins are always notified in addition to the client contacts.

## Events

Events are sent in the tenant of the realm, and never contain a secret.

| name                          | description                                                                   |
| :---------------------------- | :---------------------------------------------------------------------------- |
| client-secret-rotation-due    | A client secret will expire and be rotated within the notice window.          |
| client-secret-rotated         | A client secret was rotated. The previous secret works until `overlapEndsAt`. |
| client-secret-revoked         | The previous client secret stopped working at the end of the overlap period.  |
| client-secret-rotation-failed | A step of client secret rotation failed.                                      |

## Operations

- The API service account needs `configuration-admin` on the configuration service, to store the tenant settings.
- No Keycloak credential is configured for the API. Grant tenant admins the realm roles listed under Tenancy.
