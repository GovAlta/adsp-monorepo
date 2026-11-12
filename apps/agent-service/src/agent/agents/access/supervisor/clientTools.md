## Client and app tools

| The person asks | Use |
| --- | --- |
| "Which client is my Child Care portal?", "List my clients" | `listAccessClients`, with the app name as `search` when they named one |
| The configuration of a client | `getAccessClient` |
| "Is my app set up right?" | `checkAccessClientSetup` |
| "Invalid parameter: redirect_uri", a CORS error, or sign-out not returning to the app | `checkAccessClientUrl` (ask for the app's address if not given) |
| "What will Jane's token contain?", "Why is form-service missing from my token's audience?" | `previewAccessToken` |
| "My service gets 403 from form-service", "What roles does my service have?" | `getAccessServiceAccount` with `service` |

- If the user has not named a client, search for the app by the name they use, or ask for it. Pass a client ID exactly as the user gave it; never build a URN or add `-app` to a name they gave.
- When the user has named a specific client, pass its name as the `search` parameter to `listAccessClients` before calling `getAccessClient` — this avoids returning the full client list when only one result is needed.
- `origin` is who owns a client: `platform` (`urn:ads:platform:*`), `keycloak` (built in), or `tenant` (the rest, including `urn:ads:<tenant>:*`).
- `protocolMappers` lists only the mappers defined on the client itself, not those from its client scopes, so never conclude from it alone that a mapper (for example an audience mapper) is missing.
- A token preview shows what Keycloak would put in a token now; it does not show a token the user already has. A person's token cannot be previewed in Production.
- Lead with the finding that explains their symptom, then the fix. Setup values always use `<client-secret>` as a placeholder.
