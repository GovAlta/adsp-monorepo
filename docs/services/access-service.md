---
layout: page
title: Access service
parent: Services
---

# Access service

<!-- tags: [keycloak] -->
Access service is a deployment of [Keycloak](https://www.keycloak.org/). It provides _Realms_ (tenancy in Keycloak) to tenants and serves as the basis for tenant access management.

Access tokens issued by tenant realms are recognized by platform services and serve to identify the associated tenant of each request. Tenant administrators control the user and service accounts that have access to platform capabilities by adding or removing platform service client roles from accounts.

## Client roles

<!-- tags: [keycloak] -->
Access service roles are defined by Keycloak. Realm management related roles can be found under the `realm-management` client. Refer to keycloak documentation for specifics.

## Audit actions

Security-sensitive changes in a tenant realm and failed logins are recorded in the `access-service` namespace of the [audit service](audit-service.md), in the tenant of the realm. Keycloak is not modified: the `adsp-event-listener` forwards Keycloak events as `access-service` domain events, and [event service](event-service.md) records the audited ones. All actions are version 1, in the `security` category and the `security` retention class (365 days by default).

| action | severity | resource type | recorded when |
|:-|:-|:-|:-|
| user.created | info | user | A user is created. |
| user.updated | info | user | A user is updated. |
| user.deleted | critical | user | A user is deleted. |
| user.role-assigned | warning | user | Client roles are assigned to a user. |
| user.role-removed | warning | user | Client roles are removed from a user. |
| service-account.created | warning | service-account | A client is created. |
| service-account.credential-rotated | critical | service-account | The secret of a client is regenerated. |
| service-account.deleted | critical | service-account | A client is deleted. |
| realm.configuration-changed | critical | realm | The realm settings, including its event settings, are updated. |
| user.login-failed | warning | user, when known | A login attempt fails (`LOGIN_ERROR`). Recorded with `failure` status. |

Every client is recorded as a `service-account` resource, since a deleted client cannot be told apart from other clients. Resources are identified by their Keycloak ID: users are named by username and created clients by client ID when available. Realm resources use the realm ID of the event.

The actor of an admin action is the administrator's Keycloak user ID. Its metadata includes `realm`, `operationType`, `resourcePath` and `actorRealm` (the administrator's realm); role changes add the `roles` names and the `clientId` (Keycloak client ID) of the roles. The actor of a failed login is the user. When Keycloak does not know the user, the actor ID is `unknown` and the attempted username, truncated to 255 characters, is the actor name. Its metadata includes `realm`, `clientId` (also truncated to 255 characters) and the Keycloak error as `reason`.

Records never include the Keycloak representation itself, regenerated client secrets, IP addresses, or login details other than the username.

### Prerequisites

- The `adsp-event-listener` is enabled in the tenant realm, with **Save admin events** and **Include representation** turned on, and `LOGIN_ERROR` in the enabled event types.
- The Core `urn:ads:platform:event-service` service account has the `audit-writer` role of `urn:ads:platform:audit-service`.

### Limits and exclusions

Login failures are limited to 60 records per tenant per minute (event service `ACCESS_AUDIT_LOGIN_FAILURES_PER_MINUTE`). Further failures in that minute are dropped, and event service logs a warning with the number dropped. Other actions are not limited.

Successful logins, token issuance, logouts, client updates, realm role mappings, group membership, password resets and federated identity links are not recorded.

Recording is controlled by the event service `ACCESS_AUDIT_ENABLED` environment variable. When it is unset, recording follows `AUDIT_ENABLED` and is on by default. Set `ACCESS_AUDIT_ENABLED=false` (or `0`) to turn recording off, or `true` to force it on even when `AUDIT_ENABLED=false`. When recording is off, access events are still consumed and acknowledged, so the queue does not back up, but no audit records are written. The action catalog is still registered, so turning recording back on needs only a restart. See [turn audit recording off](audit-service.md#turn-audit-recording-off).

## Concepts

<!-- tags: [keycloak] -->
This captures some key concepts and their specific relevance to ADSP. For the complete documentation, refer to Keycloak documentation.

### Clients

<!-- tags: [keycloak] -->
Clients represents applications that request authentication for users or applications that verify access via bearer tokens. In ADSP, tenant realms are created with a `urn:ads:platform:tenant-admin-app` client that is used by the tenant administration application to authenticate users, as well as platform service bearer-only clients that include _client roles_.

### Clients roles

<!-- tags: [keycloak] -->
Client roles are roles associated with a specific client. For example, Keycloak realm administration console roles are client roles of a `realm-management` client. If an access token is requested for an account with a client role, the _Audience Resolve_ protocol mapper included in the _roles_ scope will include the client in the `aud` field of the returned access token.

To access to ADSP services, a few ADSP clients in the format of `urn:ads:<service-name>` are created as default. Mostly, client roles within those clients provide the fine-grained access control to a specific ADSP service. One exception is the `tenant-admin` role in the `urn:ads:platform:tenant-service` client. The `tenant-admin` is created as a composite role and contains other client roles. The `tenant-admin` shall be only assigned to the ADSP tenant admin.

The ADSP clients and related roles are maintained by the ADSP team. Please contact the ADSP team directly if they are misconfigured.

### Add team member as a tenant admin

<!-- tags: [keycloak] -->
The steps of settping up a tenant admin are described as follows:

- Request the team memeber to login to the keycloak tenant realm once.
- Add all of the roles in the `realm-management` client to the team member.
- Add the `tenant-admin` role in the `urn:ads:platform:tenant-service` client to the team member.

From keycloak point view, the tenant root admin who created the tenant is identical to other admins. However, the login URL to the tenant admin web application between the tenant root admin and other admins are different. Unlike the tenant root admin, the rest of the admins can only access to tenant admin web application through the tenant specific login URL. The login URL can be found in the right column of Dashbord page in the tenant admin webapp.

## Code examples

### Authenticate user

TODO: Add example here

See [Angular Example](https://github.com/abgov/dio-keycloak-angular-sample)

See [React Example](https://github.com/abgov/nx-tools-example/tree/actions-pipeline/apps/react-dotnet-example-app)

### Request a service account access token

Platform capabilities are often access via their API under a service account. Retrieve an access token for your client using the `client_credentials` grant.

```typescript
const response = await fetch(`https://access.alberta.ca/auth/realms/${realm}/protocol/openid-connect/token`, {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  }),
});

const { access_token, expires_in } = await response.json();
```
