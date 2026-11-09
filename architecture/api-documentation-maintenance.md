# API documentation maintenance

Best practices for keeping an ADSP service's API documentation complete and accurate. They apply to every service. Read this when you add, change, or remove an endpoint, or when you audit a service's routes against its documentation.

## Principles

1. **The code is the contract; the docs describe it.** Document what the router actually does: its validation, roles, status codes, and response shapes. Don't document what you meant it to do.
2. **Keep the docs next to the code.** The OpenAPI fragment lives beside the router it describes, so one pull request changes both.
3. **Test the docs.** A spec that sends requests through the real router keeps the documented status codes honest.
4. **Every endpoint has an example.** Consumers copy examples before they read schemas.
5. **Tenancy is always explicit.** Every endpoint states which tenant it acts on and who may call it.
6. **One source per fact.** Request and response details go in OpenAPI. Concepts, tenancy, events, and walkthroughs go in the service guide. Link between them; don't copy.

## Where API documentation lives

| Layer | Location | Purpose |
|:-|:-|:-|
| OpenAPI fragment | `apps/<service>/src/<domain>/router/<resource>.swagger.yml` | Reference for each operation. Bundled into `swagger.json`, served at `/swagger/docs/v1`, and combined at https://api.adsp.alberta.ca |
| OpenAPI base | `apps/<service>/swagger.config.js` | Title, version, tags, and security scheme |
| Documented-behaviour spec | `apps/<service>/src/<domain>/router/<resource>.docs.spec.ts` | Fails CI when a response code isn't documented |
| Service guide | `docs/services/<service>.md` | Concepts, roles, tenancy, events, and code examples (GitHub Pages) |

Node.js services bundle `*.swagger.yml` fragments (and any `@swagger` JSDoc comments) with `swagger-jsdoc-webpack-plugin`. Prefer YAML fragments over JSDoc, because the docs spec can read them. Services in other languages use their framework's OpenAPI tooling, but the same principles and checklist apply.

## Checklist: adding or changing an endpoint

### 1. OpenAPI fragment
- [ ] Use the full mounted path (for example `/<api>/v1/<resource>/{id}`), not the router-relative path.
- [ ] Use an existing tag from `swagger.config.js`. Add a tag only for a new resource area.
- [ ] Write a `description` that states:
  - what the operation does;
  - the **required roles**;
  - who else may call it (for example, "the resource owner").
- [ ] Document every path, query, and body parameter the handler reads, with the same constraints the validation handler applies (`minLength`, `maximum`, `enum`, `pattern`). If the code reads a parameter, document it even if it isn't validated.
- [ ] Reference a shared tenant parameter on every tenant-scoped operation (see [Tenant-scoped behaviour](#tenant-scoped-behaviour)).
- [ ] List **every** status code the route can return, using shared `components/responses`. Work through the handler chain with the [status code table](#status-codes).
- [ ] Reuse `components/schemas` for anything returned by more than one operation.
- [ ] Add request and response examples (see [Examples](#examples)).
- [ ] Mark computed fields `readOnly: true`.

### 2. Documented-behaviour spec
- [ ] Mount `createDocumentedResponseRecorder` (from `@core-services/core-common/testing`) before the router, mount the router at the same path as `main.ts`, and add the service error handler last.
- [ ] Call `assertDocumented()` in `afterEach`. It fails if any response used a status code the fragment doesn't list for that method and path.
- [ ] For each endpoint, add one success case and one case per documented error code. The recorder checks only the responses your tests trigger.
- [ ] Mock repositories and SDK services, not the router or middleware.

### 3. Service guide
- [ ] Add the endpoint to the **API overview** table with its required roles.
- [ ] Add a **code example** for each new capability. Variants of an existing capability don't need one.
- [ ] Update **Tenancy** if the endpoint behaves differently with or without a tenant context, or combines platform and tenant data.
- [ ] Add new roles to **Client roles**, and new domain events to **Events**. Register both in `main.ts` (`roles`, `events`).

### 4. Verify
```bash
npx nx test <service> --testFile=<resource>.docs.spec.ts
npx nx build <service>   # Bundles fragments into swagger.json; YAML errors fail here.
```
Then run `npx nx serve <service>` and open `/swagger/docs/v1` to confirm the operation and examples render.

## Status codes

Map each piece of the handler chain to the status codes it can produce, then document all of them.

| Source in code | Status |
|:-|:-|
| `createValidationHandler(...)`, `ValidationFailedError`, `InvalidOperationError`, `InvalidValueError`, tenant-required guards | 400 |
| `assertAuthenticatedHandler`, `UnauthorizedError` (core-common) | 401 |
| `UnauthorizedUserError` (SDK), `AssertRole`, `isAllowedUser` checks | 403 |
| `NotFoundError`, loader middleware that fetches the resource by ID | 404 |
| Any `GoAError` created with an explicit `statusCode` (for example `CONFLICT`) | That code |

Be careful with `UnauthorizedError`, which is 401, and `UnauthorizedUserError`, which is 403. Models often throw one and routers the other. Read the code; don't guess.

## Tenant-scoped behaviour

ADSP services are multi-tenant, so every endpoint's documentation must answer these questions:

- **Which tenant is used?** Tenant users and service accounts always act on their token's tenant. Core (platform) users act on the tenant given by the `tenantId` query parameter (resolved by `tenantHandler` in `adsp-service-sdk`). Define the `tenantId` parameter once in `components/parameters` and reference it.
- **What happens without a tenant context?** Document whether the route responds 400 (tenant-required guard) or acts across tenants. If a route fails with 500 without a tenant, don't document the 500. Document the parameter as required for the caller, and raise the defect separately (see [Defects found during documentation work](#defects-found-during-documentation-work)).
- **Platform versus tenant data.** When a response merges platform (core) and tenant configuration, say which wins and how a tenant overrides platform defaults.
- **Isolation.** State that IDs from another tenant respond 404, not 403, so callers can't confirm whether a resource exists.
- **Role scope.** Say whether a role must be held in the tenant, or whether a core role also grants access (`isAllowedUser(..., true)`).

## Examples

- Every request body has an `example`, or named `examples` when it has distinct modes (for example, different `operation` values, or self-service versus admin calls).
- Every schema used in a response has a schema-level `example`. Swagger UI builds list and page examples from these.
- Every shared error response has an example `errorMessage` that matches the real message format.
- Use realistic but clearly fake values: `test.user@gov.ab.ca`, `7805550100`, 24-character hex strings for Mongo IDs, and full URNs for tenant IDs (`urn:ads:platform:tenant-service:v2:/tenants/...`).
- Examples in the service guide use `fetch` against the production URL with a bearer token. Each shows the request and the fields read from the response.
- Never include real tokens, secrets, or personal data.

## Service guide structure

Each `docs/services/<service>.md` should have these sections, in this order:

1. **Overview**: what the service is for.
2. **Client roles**: every role registered in `main.ts`.
3. **Tenancy**: the tenant-scoped behaviour above, specific to this service.
4. **API overview**: a table of endpoint groups and required roles, linking to https://api.adsp.alberta.ca for details.
5. **Concepts**: the domain model.
6. **Events**: domain events the service sends, and events it consumes.
7. **Code examples**: one per main capability.

If an area has no HTTP endpoints of its own (for example, data managed through another resource or triggered by events), say so in the API overview. Otherwise readers assume the docs are missing.

## Routes that aren't documented

Leave these out of OpenAPI. If consumers might look for them, note why in the service guide.

- Platform metadata: `/`, `/health`, `/swagger/docs/v1`.
- Webhooks called by third parties (for example, Bot Framework `/provider/v1/bot/messages` in notification-service).
- Non-REST transports, such as WebSocket and socket.io endpoints (see `docs/services/push-service.md`).

## Breaking changes and deprecation

- Never change the meaning of a documented field, parameter, or status code in place. Add a new one, or a new API version (`/v2`).
- Mark replaced operations or fields `deprecated: true`, and say in the description what replaces them.
- Use a `BREAKING CHANGE:` commit footer for any change that removes or narrows documented behaviour.

## Defects found during documentation work

Documentation work describes behaviour; it doesn't change it. When an audit finds a defect, such as an unhandled 500 or a missing validation:

- Don't fix the code in the same change, and don't document the defective response.
- Document the supported usage instead. For example, mark a parameter as required, or state that it must be valid JSON.
- Raise a separate ticket that names the route, the input that triggers the defect, and the response you'd expect.

## Auditing a service

To check that a service's routes and documentation match:

1. List the routes. Search the service for `Router()` and `.get(`, `.post(`, `.put(`, `.patch(`, and `.delete(`, and note the mount path of each router in `main.ts` or `index.ts`.
2. For each route, check:
   - it has a fragment operation;
   - its required roles are in the description;
   - all its parameters are documented;
   - all its reachable status codes are listed;
   - it has examples;
   - it has a docs spec case.
3. Check that the service guide has the sections listed above, and that its roles and events match `main.ts`.
4. Record the result as a table of area, routes, fragment, examples, and spec.

Reference implementation: `apps/notification-service`. It has a full fragment, `subscription.docs.spec.ts`, and `docs/services/notification-service.md`. Other services with docs specs: configuration, event, file, form, tenant-management-api, value, and audit.
