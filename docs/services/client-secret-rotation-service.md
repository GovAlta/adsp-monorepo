---
layout: page
title: Client secret rotation service
parent: Services
---

# Client secret rotation service

Client secret rotation service lets a tenant rotate the secrets of its confidential Keycloak clients before they expire. A scheduled job rotates opted-in clients, notifies their contacts, and revokes the previous secret at the end of an overlap period. The API and the **Client secrets** tab of the Access page in the tenant management webapp let tenant admins choose which clients rotate, rotate a client on demand, and set the contacts that are notified.

Rotation depends on the Keycloak client secret rotation policy, which is supported in Keycloak 26.8.2 and later. Clients keep working during the overlap period because both the new and the previous secret are valid.

## Client roles

client `urn:ads:platform:client-secret-rotation-service`

| name                | description                                                                           |
| :------------------ | :------------------------------------------------------------------------------------ |
| client-secret-admin | Grants permission to manage client secret rotation in a realm. Tenant admins have it. |

## Tenancy

- **Which realm is used.** Tenant users and service accounts manage the realm of their token. A `realm` query parameter that names another realm is refused with 403.
- **Core users.** Core (platform) users with the role must set the `realm` query parameter to the realm to manage. The `master` realm is never available.
- **Isolation.** The rotation job's own client is hidden from the list and can't be changed through the API.

## API overview

All endpoints are under `/rotation/v1`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas. No endpoint returns a client secret.

| Endpoint                                                   | Purpose                                                    |
| :--------------------------------------------------------- | :--------------------------------------------------------- |
| `GET /rotation/v1/realm`                                   | Read the rotation settings of the realm.                   |
| `PUT /rotation/v1/realm`                                   | Set the realm mode and the schedule overrides.             |
| `GET /rotation/v1/clients`                                 | List clients with their rotation status.                   |
| `PATCH /rotation/v1/clients/{clientId}`                    | Set the contacts notified for a client.                    |
| `PUT /rotation/v1/clients/{clientId}/opt-in`               | Opt a client in or out (`selected` mode only).             |
| `POST /rotation/v1/clients/{clientId}/rotate`              | Rotate the secret now.                                     |
| `POST /rotation/v1/clients/{clientId}/invalidate-previous` | End the overlap early by invalidating the previous secret. |
| `POST /rotation/v1/clients/{clientId}/notify`              | Send the expiry notice now.                                |

All endpoints need the `client-secret-admin` role. `{clientId}` is the URL-encoded Keycloak client ID.

## Concepts

### Realm mode

Each tenant realm is either On or Off, and the realm's Keycloak client policy holds that state. Turning rotation on in the portal creates the `secret-rotation` policy and its `secret-rotation-profile` profile the first time and enables them afterwards; turning it off disables the policy. The job only follows the policy: it rotates nothing in a realm whose policy is missing or disabled (it only clears leftover expiry attributes), and never creates or re-enables one. While On, only opted-in clients rotate (`selected`); `all` (every confidential client) is for the core realm only. Turning rotation on needs at least one realm admin with an email address, so there is someone to notify.

### Schedule

`expiryDays` is the secret lifetime, `noticeWindowDays` is how long before expiry contacts are notified, and `rotatedSecretOverlapDays` is how long the previous secret keeps working after a rotation. The notice window must be shorter than the lifetime. Defaults come from the service configuration; a realm can override them.

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

- The API service account needs `configuration-admin` on the configuration service, to store the realm settings.
- The scheduled job and the API need the Keycloak grants described in the design for the realm's master client; `createRealm` in tenant management API grants them for new realms.
- Register the API in the directory as `urn:ads:platform:client-secret-rotation-service` so the Access page can find it.
