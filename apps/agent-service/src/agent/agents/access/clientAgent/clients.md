# Access Service clients

Use this guide when creating or troubleshooting Keycloak clients for ADSP. Always work in the intended tenant realm and environment.

## Public client example: Tenant Admin Webapp

The Tenant Admin Webapp client is the canonical ADSP public-client example.

| Setting               | Value or pattern                                |
| --------------------- | ----------------------------------------------- |
| Client ID             | `urn:ads:platform:tenant-admin-app` by default  |
| Client type           | OpenID Connect public client                    |
| Client authentication | Off                                             |
| Direct access grants  | Off                                             |
| Valid redirect URIs   | `https://tenant-admin.example.ca/auth/callback` |
| Web origins           | `https://tenant-admin.example.ca`               |
| Access-token audience | `urn:ads:platform:tenant-service`               |

### Web origin and redirect examples for public clients

**Production examples:**

- **Web origin**: `https://tenant-admin.example.ca`
- **Valid redirect URI**: `https://tenant-admin.example.ca/auth/callback`
- **Valid redirect URI**: `https://tenant-admin.example.ca/auth/signin-callback`

**UAT examples:**

- **Web origin**: `https://tenant-admin-uat.example.ca`
- **Valid redirect URI**: `https://tenant-admin-uat.example.ca/auth/callback`

**Development examples (localhost only, never promote to UAT/Production):**

- **Web origin**: `http://localhost:4200`
- **Valid redirect URI**: `http://localhost:4200/auth/callback`
- **Web origin**: `http://localhost:3000`
- **Valid redirect URI**: `http://localhost:3000/auth/callback`

**Key patterns:**

- Web origin must be the base URL without any path: `https://domain.ca` (not `/path`)
- Redirect URIs must include the full callback path: `https://domain.ca/auth/callback`
- Use exact scheme (http/https), host, and port; do not use wildcards (`*`)
- Add one redirect URI per authentication callback path your app uses
- For apps with multiple callback routes, add each as a separate redirect URI
- Never mix localhost entries with production/UAT URLs in the same client

## Create a similar public client in Keycloak v24

1. Open the correct tenant realm and select **Clients** → **Create client**.
2. Select **OpenID Connect** and enter the application client ID.
3. Set **Client authentication** to **Off**.
4. Enable **Standard flow** for browser sign-in and disable **Direct access grants**.
5. Set **Valid redirect URIs** to the application's exact HTTPS callback URI. Avoid wildcard paths.
6. Set **Web origins** to the exact HTTPS application origin. Do not use `*`.
7. Add an audience mapper for each ADSP API the application must call when its audience is not otherwise resolved from assigned client roles.
8. Assign only the required ADSP client roles to users or groups.
9. Sign in again and inspect only redacted claim values to confirm `iss`, `aud`, and `resource_access`.

Dev clients may include explicit localhost entries for local testing, for example:

- Valid redirect URI: `http://localhost:4200/auth/callback`
- Web origin: `http://localhost:4200`

Use the exact scheme, host, port, and callback path; do not use wildcards. Do not add localhost URLs to UAT or Production clients, and do not promote Dev localhost configuration to those environments.

## Confidential client example: Server-to-server integration

Use a confidential client when a backend service needs to access a protected service without a user session.

| Setting               | Value or pattern                   |
| --------------------- | ---------------------------------- |
| Client ID             | `urn:ads:tenant:example-service`   |
| Client type           | OpenID Connect confidential client |
| Client authentication | On                                 |
| Service account roles | On                                 |
| Standard flow         | Off                                |
| Direct access grants  | Off                                |
| Access-token audience | The protected service being called |

## Create a confidential client in Keycloak v24

1. Open the correct tenant realm and select **Clients** → **Create client**.
2. Select **OpenID Connect** and enter the service client ID.
3. Set **Client authentication** to **On**.
4. Enable **Service accounts roles** and disable **Standard flow** and **Direct access grants**.
5. Under **Service account roles**, assign any predefined realm or client roles required by the integration. Apply least privilege and do not limit assignments to ADSP API roles.
6. Add an audience mapper if a target service is not already included in the token audience through assigned client roles.
7. Retrieve the client secret from the **Credentials** tab and store it in the service's secret store. Never put it in source control, frontend configuration, logs, or chat.
8. Request a token from the tenant realm:

```text
POST {access}/auth/realms/{realm}/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=urn%3Aads%3Atenant%3Aexample-service&client_secret={secret}
```

9. Inspect only redacted claim values to confirm `iss`, `aud`, and `resource_access` before calling the target API.

## Public versus confidential clients

- Use a **public client** for browser or native applications that cannot protect a secret.
- Use a **confidential client** with service accounts for server-side `client_credentials` flows.
- Never put a client secret in browser code, frontend configuration, or chat.
- Do not enable direct access grants unless there is a reviewed requirement for the password grant.
