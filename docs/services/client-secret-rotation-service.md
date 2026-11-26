---
layout: page
title: Client secret rotation service
parent: Services
---

# Client secret rotation service

Client secret rotation service lets a tenant rotate the secrets of its confidential Keycloak clients before they expire. The API and the **Client secrets** tab of the Access page in the tenant management webapp let tenant admins turn rotation on for their realm, choose which clients rotate, rotate a client on demand, invalidate a previous secret, and set the contacts that are notified.

Rotation depends on the Keycloak client secret rotation policy, which is supported in Keycloak 26.8.2 and later. Clients keep working while the previous secret is still valid, because both the new and the previous secret are accepted.

## Client roles

client `urn:ads:platform:tenant-service`

| name                | description                                                                           |
| :------------------ | :------------------------------------------------------------------------------------ |
| client-secret-admin | Grants permission to manage client secret rotation in a realm. Tenant admins have it. |

## Tenancy

- **Which realm is used.** The API acts on the realm of the caller's token. There is no way to name another realm.
- **Core users.** Core (platform) users are refused with 403, and the `master` realm is never reachable.
- **User token.** The API calls the Keycloak Admin API with the signed-in admin's own token, so Keycloak enforces that admin's realm-management permissions. The service holds no Keycloak credential. A tenant admin needs the Keycloak realm roles `manage-realm` (the client policy), `manage-clients`, `view-clients`, `query-clients`, `view-users`, `query-users` and `view-realm`. Grant them as one composite realm role. `manage-realm` is a broad permission, so give it only to admins who may change realm settings.
- **Isolation.** The API acts only on clients of the caller's own realm.

## API overview

All endpoints are under `/api/rotation/v1`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas. No endpoint returns a client secret.

| Endpoint                                                       | Purpose                                                    |
| :------------------------------------------------------------- | :--------------------------------------------------------- |
| `GET /api/rotation/v1/realm`                                   | Read the rotation mode and schedule of the realm.          |
| `PUT /api/rotation/v1/realm`                                   | Set the realm mode and the schedule.                       |
| `GET /api/rotation/v1/clients`                                 | List clients with their rotation status.                   |
| `GET /api/rotation/v1/users?search={text}`                     | Search users (with an email), 3+ characters, for contacts. |
| `PATCH /api/rotation/v1/clients/{clientId}`                    | Set the contacts notified for a client.                    |
| `PUT /api/rotation/v1/clients/{clientId}/opt-in`               | Opt a client in or out (`selected` mode only).             |
| `POST /api/rotation/v1/clients/{clientId}/rotate`              | Rotate the secret now.                                     |
| `POST /api/rotation/v1/clients/{clientId}/invalidate-previous` | End the overlap early by invalidating the previous secret. |
| `POST /api/rotation/v1/clients/{clientId}/notify`              | Send the expiry notice now.                                |

All endpoints need the `client-secret-admin` role (or the tenant admin role for realms that predate it). `{clientId}` is the URL-encoded Keycloak client ID.

## Concepts

### Realm mode

Each tenant realm is either On or Off, and the realm's Keycloak client policy holds that state. Turning rotation on in the portal creates the `secret-rotation` policy and its `secret-rotation-profile` profile the first time and enables them afterwards; turning it off disables the policy. While On, only opted-in clients rotate.

### Schedule

The schedule is set in seconds. `expirationPeriod` is the secret lifetime, and `rotatedExpirationPeriod` is how long the previous secret keeps working after a rotation. Both live in the Keycloak policy executor, so Keycloak is the source of truth. `noticePeriod` is how long before expiry contacts are notified and is stored in the tenant configuration of this service. The notice period must be shorter than the lifetime. A rotated expiration of `0` means the previous secret stops working immediately.

### Contacts

Contacts are email addresses stored with the client. Realm admins are always notified in addition to the client contacts. Tenant admins add or edit them on the **Client secrets** tab, in the **Edit contacts** dialog of each client. The dialog shows the contacts as chips: search the realm's users by name or email and select them, or type an email address and press Enter. Select a chip to remove it.

## Notifications

The service registers the **Client secret rotation** notification type. It sends an email for these events: `client-secret-rotation-due` (before the secret expires, by the realm's notice period), `client-secret-rotated` (a new secret is in place; the subject is prefixed with "Emergency" when the rotation was out of schedule), `client-secret-revoked` (the previous secret stopped working), and `client-secret-rotation-enabled` / `client-secret-rotation-disabled` (a tenant admin turned rotation on or off for the client). Each email names the client and links to the client in Keycloak and, when the `CLIENT_SECRET_ROTATION_RUNBOOK_URL` setting is configured, to the rotation runbook. Emails never contain the secret; read the new secret from the client's Credentials tab in Keycloak.

Subscribers need the `client-secret-admin` role, which tenant admins have. The service keeps the subscriptions up to date itself: when a tenant admin turns rotation on, changes a client's opt-in, or edits contacts, it subscribes every realm admin with an email address to all clients of the realm, and each contact to the clients they are a contact of. Contacts that are no longer listed are unsubscribed. Subscription criteria it creates are labelled "Managed by client secret rotation"; criteria added in the Notification service by other means are never changed. A tenant admin added in Keycloak is subscribed at the next of these changes.

For the manual Keycloak steps, emergency response and troubleshooting, see the [client secret rotation runbook](https://goa-dio.atlassian.net/wiki/spaces/ADSPA/pages/5230921156/Runbook+Client+secret+rotation+in+Keycloak+manual+steps). Set the `CLIENT_SECRET_ROTATION_RUNBOOK_URL` setting of the tenant service to this address to link it from the emails.

## Events

Events are sent in the tenant of the realm, and never contain a secret.

| name                            | description                                                                   |
| :------------------------------ | :---------------------------------------------------------------------------- |
| client-secret-rotation-due      | A client secret will expire and be rotated within the notice window.          |
| client-secret-rotated           | A client secret was rotated. The previous secret works until `overlapEndsAt`. |
| client-secret-revoked           | The previous client secret stopped working at the end of the overlap period.  |
| client-secret-rotation-enabled  | Automatic secret rotation was turned on for a client.                         |
| client-secret-rotation-disabled | Automatic secret rotation was turned off for a client.                        |
| client-secret-rotation-failed   | A step of client secret rotation failed.                                      |

## Operations

- The API service account needs `configuration-admin` on the configuration service, to store the tenant settings.
- No Keycloak credential is configured for the API. Grant tenant admins the realm roles listed under Tenancy.
