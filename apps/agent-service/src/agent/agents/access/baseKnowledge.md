# Access Service Base Knowledge

This is baseline guidance compiled from repository documentation, not live infrastructure state. The facts documented below are real and should be shared directly; only their current live availability/uptime is unconfirmed, not their existence or identity.

## Service and realm model

- ADSP Access Service is a Keycloak deployment and IAM solution.
- Each ADSP tenant has a tenant realm that provides tenant-controlled user access management. The core realm provides platform identity for microservice requests made outside a single tenant context.
- Core-realm service identities and broker clients support platform-level operations across tenant realms. This does not grant automatic access to tenant data or replace explicit tenant scoping.
- Tenant realm provisioning is handled by `tenant-management-api` using its configured realm-creation service account. Keep tenant-realm and core-realm behavior distinct.
- The documented default identity-provider alias is `goa-ad`. It is a cross-tenant IdP linked in the core realm (not an IdP configured per tenant realm), used for ADSP cross-tenant management. It is maintained by the ADSP team.
- The core realm's `goa-ad` IdP is linked to each tenant's IdP via a tenant-dedicated client in the core realm — one such client per tenant, rather than the IdP itself being duplicated into each tenant realm.
- `goa-ad` (GoA SSO) is provided by the ADSP team and is for internal government staff users only, not citizens or businesses.
- The GoA UIAM (Unified IAM) team provides two separate identity-provider integrations for external users: one for citizens and one for businesses. These are distinct from `goa-ad` and are not managed by the ADSP team.

## Documented environment references

These hostnames are documented and real; only their current live availability/uptime is unconfirmed, not their existence or identity. Reproduce this table as-is, without paraphrasing it into prose or omitting rows:

| Environment | Access Service base URL             | Keycloak Version | Use                                                                               |
| ----------- | ----------------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| Dev         | `https://access.adsp-dev.gov.ab.ca` | 24.0.5           | For ADSP team internal usage (ADSP platform development and testing).             |
| UAT         | `https://access-uat.alberta.ca`     | 24.0.5           | For other teams' Dev or UAT environments. The ADSP CLI labels this preset `test`. |
| Production  | `https://access.alberta.ca`         | 24.0.5           | Isolated for Production-to-Production use only.                                   |

The `24.0.5` version is a user-provided reference for Dev, UAT, and Production alike. Repository dependencies pin Keycloak JavaScript client packages to `24.0.5` but do not independently verify deployed server versions.

The deployment guide describes separate OpenShift projects for `dev`, `uat`, and `prod`, with environment values supplied through ConfigMaps and Secrets and managed templates applied by the delivery workflow. This describes the real deployment pattern used; it is separate from disaster-recovery configuration (see the architect agent for that topic) — it does not change the three documented environments/hostnames above, which should still be answered directly and in full.

## Responsibility and contact

**The ADSP/tenant relationship:** ADSP operates one shared Keycloak deployment that hosts a separate, isolated realm per tenant plus a core realm for platform-level identity. ADSP owns and maintains the underlying platform (the Keycloak deployment, ARO infrastructure, and core realm/broker configuration) that every tenant realm runs on top of. Each tenant then owns and configures its own realm's content (its clients, roles, users) within that platform — ADSP does not manage tenant-specific configuration, and tenants do not manage the shared platform.

- **ADSP team** is responsible for core and basic infrastructure maintenance: the Keycloak deployment itself, ARO infrastructure (instance count, autoscaling, high-availability design), and the core realm/broker configuration shared across tenants.
- **Tenant** is responsible for tenant-level configuration: their own tenant realm's clients, roles, users, and tenant-specific identity-provider settings.
- **Tenant admin** is responsible for tenant-level security — managing who has access within their tenant realm (user accounts, role assignments, identity-provider trust). The ADSP team provides consultation on tenant-level security rather than managing it directly.
- **The underlying database** (backup, retention, RTO/RPO) is owned by the Government of Alberta Dev/Ops team, separate from the ADSP team — see the architect agent for the documented split of responsibilities.
- No specific named contact, email, or escalation channel for the ADSP team is documented in this repository — do not invent one. Direct the user to their usual ADSP team contact point.

## How to add a tenant admin

- Tenant realms commonly contain `urn:ads:platform:tenant-admin-app`, platform bearer-only clients named `urn:ads:platform:{service}`, and `api-app-client` for API documentation authorization-code sign-in.
- Public clients need appropriate Valid Redirect URIs and Web Origins. Confidential clients have secrets; never request or repeat them.
- Platform API permissions are generally client roles on service clients. Platform services validate token issuer and audience; role assignment alone does not prove that the required audience is present.
- `tenant-admin` is a managed composite client role on `urn:ads:platform:tenant-service`. Do not recommend modifying its composite definition.
- `platform-service` on `urn:ads:platform:tenant-service` is for trusted backend services that read tenant information; it is not a human administrator role.
