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

The service registers the **Client secret rotation** notification type. It sends an email for these events: `client-secret-rotation-due` (before the secret expires, by the realm's notice period), `client-secret-rotated` (a new secret is in place), `client-secret-revoked` (the previous secret stopped working), and `client-secret-rotation-enabled` / `client-secret-rotation-disabled` (a tenant admin turned rotation on or off for the client). Each email names the client and links to the client in Keycloak and, when the `CLIENT_SECRET_ROTATION_RUNBOOK_URL` setting is configured, to the rotation runbook. Emails never contain the secret; read the new secret from the client's Credentials tab in Keycloak.

A scheduled job also sends the time-based notices. On its schedule (daily by default) it checks each realm where rotation is on and sends `client-secret-rotation-due` when a client enters the realm's notice period, and `client-secret-revoked` when the previous secret has stopped working. Client contacts get an email per client. Realm admins get one summary email per realm per run (`client-secret-rotation-digest`) instead of one email per client. The job never rotates a secret; Keycloak does that. Each notice is sent once per expiry.

Subscribers need the `client-secret-admin` role, which tenant admins have. The service keeps the subscriptions up to date itself: when a tenant admin turns rotation on, changes a client's opt-in, or edits contacts, it subscribes every realm admin with an email address to all clients of the realm, and each contact to the clients they are a contact of. Contacts that are no longer listed are unsubscribed. Subscription criteria it creates are labelled "Managed by client secret rotation"; criteria added in the Notification service by other means are never changed. A tenant admin added in Keycloak is subscribed at the next of these changes.

For the manual Keycloak steps, emergency response and troubleshooting, see the [client secret rotation runbook](https://goa-dio.atlassian.net/wiki/spaces/ADSPA/pages/5230921156/Runbook+Client+secret+rotation+in+Keycloak+manual+steps). Set the `CLIENT_SECRET_ROTATION_RUNBOOK_URL` setting of the tenant service to this address to link it from the emails.

## Events

Events are sent in the tenant of the realm, and never contain a secret.

| name                                       | description                                                                                    |
| :----------------------------------------- | :--------------------------------------------------------------------------------------------- |
| client-secret-rotation-due                 | A client secret will expire within the notice window. It is not rotated automatically.         |
| client-secret-rotated                      | A client secret was rotated. The previous secret works until `overlapEndsAt`.                  |
| client-secret-revoked                      | The previous client secret stopped working at the end of the overlap period.                   |
| client-secret-rotation-enabled             | Secret expiry was turned on for a client.                                                      |
| client-secret-rotation-disabled            | Secret expiry was turned off for a client.                                                     |
| client-secret-rotation-failed              | A step of client secret rotation failed.                                                       |
| client-secret-rotation-digest              | Summary of expiring and revoked clients in a realm, sent to realm admins by the scheduled notifier. |
| client-secret-rotation-realm-enabled       | Client secret rotation was turned on for the realm. Audit only, no email.                      |
| client-secret-rotation-realm-disabled      | Client secret rotation was turned off for the realm. Audit only, no email.                     |
| client-secret-rotation-schedule-updated    | The realm's secret expiration, previous-secret expiration or notice period changed. Audit only. |
| client-secret-rotation-contacts-updated    | The contacts of a client changed. Only the number of contacts is recorded. Audit only.         |

Events that follow a user action carry `updatedBy`, the user who made the change.

## Operations

- The API service account needs `configuration-admin` on the configuration service, to store the tenant settings.
- No Keycloak credential is configured for the API's request handling. Grant tenant admins the realm roles listed under Tenancy.
- The scheduled notifier is off by default. See [Scheduled notifier setup](#scheduled-notifier-setup) to configure it.

## Scheduled notifier setup

Do this once per Keycloak instance (Dev, UAT, Prod, or a standalone instance). All Keycloak steps are in the `master` realm; nothing is configured in tenant realms or in `core`.

### How access works

The notifier signs in to `master` as a service account that holds the `admin` realm role, with "Full scope allowed" turned off. That means a plain token carries no roles. For each realm it asks for one optional client scope, `rotation-notice-<realm>`, which holds only `view-realm`, `view-clients`, `query-clients` and `manage-clients` on that realm's `<realm>-realm` client. Its token for a realm therefore has those four roles on that realm only, and stays small however many realms exist.

Two clients are involved:

| Client | Purpose | Roles |
| :-- | :-- | :-- |
| Notifier (default `tenant-client-secret-rotation-notifier`) | Runs the scheduled job. | `admin` realm role, Full scope allowed off. One optional scope per realm. |
| Scope admin (for example `tenant-client-secret-rotation-scope-admin`) | Creates the per-realm scopes. Used when a realm is created, and by the setup script. | Only `manage-clients` and `view-clients` on `master-realm`. |

The scope admin client is separate because the API's tenant realm admin client (`KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_ID`) has no rights on master clients, and `manage-clients` on `master-realm` can edit any master client, so that role is kept to a client that does nothing else.

### Steps

1. **Create the notifier client.** In the Keycloak admin console choose the `master` realm, then Clients, Create client.
   1. Client type OpenID Connect, Client ID `tenant-client-secret-rotation-notifier` (or your own name).
   2. Turn Client authentication On and Service accounts roles On. Leave standard flow, direct access grants and the other flows Off.
   3. Save.
2. **Remove its default scope.** Open the client, Client scopes tab, then `<client>-dedicated`, Scope tab. Turn "Full scope allowed" Off.
3. **Give it the `admin` role.** Service accounts roles tab, Assign role, filter by realm roles, select `admin`.
4. **Create the scope admin client.** Clients, Create client, Client ID for example `tenant-client-secret-rotation-scope-admin`, Client authentication On, Service accounts roles On, other flows Off. Description (max 255 characters): "Used by tenant-management-api when a new tenant realm is created. Creates its rotation-notice-<realm> scope in master and attaches it to tenant-client-secret-rotation-notifier. Only manage-clients and view-clients on master-realm."
5. **Give the scope admin client two roles.** Service accounts roles tab, Assign role, filter by clients, select `master-realm` `manage-clients` and `view-clients`. Then, in Client scopes, `<client>-dedicated`, Scope tab, turn "Full scope allowed" Off and assign the same two roles there. Without this the token has no roles and creating a scope fails with 403.
6. **Create the scopes for the existing realms.** From the repository root, as a dry run first:

   ```bash
   node tools/keycloak/setup-rotation-notice-scopes.mjs --url <keycloak-root-url> --client-id <scope-admin-client-id> --client-secret <secret>
   ```

   The URL has no `/auth`. Instead of `--client-secret` you can set `KEYCLOAK_ADMIN_CLIENT_SECRET`. The dry run lists what each realm is missing. Add `--apply` to make the changes. The script skips `master` and `core`, accepts `--realms` and `--exclude`, is safe to re-run, and reports each failing realm without stopping. Use `--notifier-client-id` or `--scope-prefix` when you changed the defaults.
7. **Configure the API.** Set these on the API deployment:

   | Setting | Description |
   | :-- | :-- |
   | `CLIENT_SECRET_ROTATION_NOTICE_JOB_ENABLED` | `true` on one instance only. Default `false`. |
   | `CLIENT_SECRET_ROTATION_NOTICE_JOB_SCHEDULE` | Cron expression in UTC. Default `0 15 * * *`. |
   | `CLIENT_SECRET_ROTATION_NOTICE_JOB_CLIENT_ID` | Notifier client id. Default `tenant-client-secret-rotation-notifier`. |
   | `CLIENT_SECRET_ROTATION_NOTICE_JOB_CLIENT_SECRET` | Notifier secret (Credentials tab). Keep it in a secret store. |
   | `CLIENT_SECRET_ROTATION_NOTICE_JOB_SCOPE_PREFIX` | Scope name prefix. Default `rotation-notice-`. Must match the script. |
   | `CLIENT_SECRET_ROTATION_SCOPE_ADMIN_CLIENT_ID` | Scope admin client id. |
   | `CLIENT_SECRET_ROTATION_SCOPE_ADMIN_CLIENT_SECRET` | Scope admin secret (Credentials tab). Keep it in a secret store. |
8. **Verify.** Run the setup script again as a dry run; every realm should report "already set up". Request a token as the notifier with `scope=rotation-notice-<realm>` and confirm it holds only the four roles on `<realm>-realm`. Then check the notifier logs after the next run for "Sent N notice(s)".

### New realms

When the API creates a realm it signs in as the scope admin client and creates `rotation-notice-<realm>`, maps the four roles, and attaches it to the notifier as an optional scope. This is best effort: a failure is logged as a warning and does not fail realm creation, and it is skipped when the scope admin settings are empty. Re-run the setup script to repair a missed realm. Realms created outside the API (for example directly in Keycloak) also need the script.

### Troubleshooting

| Symptom | Cause |
| :-- | :-- |
| Log `invalid_scope` for a realm | The realm has no `rotation-notice-<realm>` scope or it is not attached to the notifier. Run the setup script. |
| 403 when creating a scope | The scope admin client lacks `manage-clients` or `view-clients` on `master-realm`, or they are not in its dedicated scope. |
| 401 `invalid_client` | Wrong client id or secret. |
| The scope has no effect, tokens are large | The notifier's "Full scope allowed" is still On. |
| HTTP 400 from the router with many realms | The notifier token carries too many roles. Check step 2 and that no per-realm roles were assigned to the service account. |
