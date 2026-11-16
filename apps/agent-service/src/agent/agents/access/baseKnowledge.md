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

These hostnames are documented and real; only their current live availability is not confirmed here.

- **Dev** — `https://access.adsp-dev.gov.ab.ca`, Keycloak `25.0.6`. For ADSP team internal usage (ADSP platform development and testing).
- **UAT** — `https://access-uat.alberta.ca`, Keycloak `24.0.5`. For other teams' Dev or UAT environments.
- **Production** — `https://access.alberta.ca`, Keycloak `24.0.5`. Isolated for Production-to-Production use only.

The Dev version `25.0.6` was read from the Dev server on 2026-11-06. The UAT and Production `24.0.5` versions are user-provided references that have not been verified against those servers. Repository dependencies pin Keycloak JavaScript client packages to `24.0.5` but do not independently verify deployed server versions.

The deployment guide describes separate OpenShift projects for `dev`, `uat`, and `prod`, with environment values supplied through ConfigMaps and Secrets and managed templates applied by the delivery workflow. This is the real deployment pattern; disaster-recovery configuration is described separately, under Access Service disaster recovery.

## Responsibility and contact

**The ADSP/tenant relationship:** ADSP operates one shared Keycloak deployment that hosts a separate, isolated realm per tenant plus a core realm for platform-level identity. ADSP owns and maintains the underlying platform (the Keycloak deployment, ARO infrastructure, and core realm/broker configuration) that every tenant realm runs on top of. Each tenant then owns and configures its own realm's content (its clients, roles, users) within that platform — ADSP does not manage tenant-specific configuration, and tenants do not manage the shared platform.

- **ADSP team** is responsible for core and basic infrastructure maintenance: the Keycloak deployment itself, ARO infrastructure (instance count, autoscaling, high-availability design), and the core realm/broker configuration shared across tenants.
- **Tenant** is responsible for tenant-level configuration: their own tenant realm's clients, roles, users, and tenant-specific identity-provider settings.
- **Tenant admin** is responsible for tenant-level security — managing who has access within their tenant realm (user accounts, role assignments, identity-provider trust). The ADSP team provides consultation on tenant-level security rather than managing it directly.
- **The underlying database** (backup, retention, RTO/RPO) is owned by the Government of Alberta Dev/Ops team, separate from the ADSP team; see Operational responsibilities for the documented split.
- No specific named contact, email, or escalation channel for the ADSP team is documented here; use your usual ADSP team contact point.

## How to add a tenant admin

- Tenant realms commonly contain `urn:ads:platform:tenant-admin-app`, platform bearer-only clients named `urn:ads:platform:{service}`, and `api-app-client` for API documentation authorization-code sign-in.
- Public clients need appropriate Valid Redirect URIs and Web Origins. Confidential clients have secrets; never request or repeat them.
- Platform API permissions are generally client roles on service clients. Platform services validate token issuer and audience; role assignment alone does not prove that the required audience is present.
- `tenant-admin` is a managed composite client role on `urn:ads:platform:tenant-service`. Do not recommend modifying its composite definition.
- `platform-service` on `urn:ads:platform:tenant-service` is for trusted backend services that read tenant information; it is not a human administrator role.

## Plain-language glossary

Use the everyday words first when talking to someone new to Keycloak, with the Keycloak term once in brackets.

| Keycloak term | Everyday words |
| --- | --- |
| Realm | Your tenant's own sign-in space: its people, apps, and roles |
| Client | An app or service that people sign in to, or that calls other services |
| Public client | A browser or mobile app; it has no secret |
| Confidential client | A server app or backend service; it has a secret |
| Bearer-only client | An API that only accepts tokens and never signs anyone in |
| Service account | An app's own identity for calling other services without a person |
| Realm role | A tenant-wide role |
| Client role | An app role: a permission one app or service defines, such as `form-admin` on `urn:ads:platform:form-service` |
| Composite role | A role bundle: holding it gives every role inside it, as `tenant-admin` does |
| Group | A set of people who all get the group's roles |
| Redirect URI | The address Keycloak sends people back to after signing in |
| Web origin | A website address allowed to call Keycloak from the browser (CORS) |
| Post logout redirect URI | The address Keycloak sends people back to after signing out |
| Token | The signed pass an app gets after sign-in and sends to services |
| Audience (`aud`) | Which services a token is meant for; a service refuses tokens not meant for it |
| Scope / client scope | A named bundle of token contents an app can ask for |
| Protocol mapper | A rule that adds something to a token, such as an audience or roles |
| Required action | A step someone must finish at their next sign-in, such as verifying their email |
| Identity provider | Where someone actually signs in, such as GoA sign-in (`goa-ad`) |
| Locked out (brute-force detection) | The account is blocked for a while after too many wrong passwords |
