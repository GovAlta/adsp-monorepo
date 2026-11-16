---
layout: page
title: Project planner service
parent: Services
---

# Project planner service

## Overview

Project planner service helps people new to ADSP describe a business problem and turn it into a plan for using ADSP services. It builds a structured _business model_ of the problem, matches it to known GoA _business patterns_, proposes _solution hypotheses_ with recommended services, and points the user to each service's workspace.

Recommendations are hypotheses for the user to refine; the planner is not a replacement for early discovery or business analysis.

## Client roles

client `urn:ads:platform:project-planner-service`

| name          | description                                                       |
| :------------ | :---------------------------------------------------------------- |
| planner-admin | Administrator role. Allows access to all solutions in the tenant. |
| planner-user  | User role. Allows creating and working on own solutions.          |

Every endpoint requires one of these roles. `planner-admin` is part of the tenant admin role, and is also required to create, update, and delete business patterns.

## Tenancy

- **Tenant users only.** Users act on the tenant of their token, and need `planner-user` or `planner-admin` in that tenant. Core (platform) users aren't granted access: requests from a core user respond `403`, or `400` when they don't set a `tenantId` query parameter, because there is no tenant context.
- **Solutions** belong to the tenant and to the user who created them. A `planner-user` sees and works on only their own solutions; a `planner-admin` can see and work on all solutions in the tenant. Only the user who created a solution can delete it, even if another user is a `planner-admin`. Other users receive `403`.
- **Saved versions** belong to their solution, and follow the same access rules.
- **Specialist chats** are private to the user who had the conversation, including from `planner-admin`. Chats of other users respond `404`.
- **Business patterns** combine platform and tenant data. The built-in patterns are the same for every tenant. A tenant overrides them with patterns in its configuration (`patterns`, in the `platform:project-planner-service` configuration), and those are in turn overridden by patterns stored through the API. Patterns stored through the API belong to the tenant.
- **Isolation.** IDs of solutions, versions, and chats from another tenant respond `404`, not `403`.

## API overview

All endpoints are under `https://project-planner-service.adsp.alberta.ca/planner/v1` and require a bearer token. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Area                     | Endpoints                                                                                                                                                                                           | Required role                                                     |
| :----------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| Analysis options         | `GET /analysis/options`                                                                                                                                                                             | planner-user or planner-admin                                     |
| Business patterns        | `GET /patterns`, `GET /patterns/{patternId}`, `POST /patterns/match`                                                                                                                                | planner-user or planner-admin                                     |
|                          | `POST /patterns`, `PUT /patterns/{patternId}`, `DELETE /patterns/{patternId}`                                                                                                                       | planner-admin                                                     |
| Problem statement upload | `POST /documents/extract`                                                                                                                                                                           | planner-user or planner-admin                                     |
| Solutions                | `GET /solutions`, `POST /solutions`                                                                                                                                                                 | planner-user (own solutions) or planner-admin (all in the tenant) |
|                          | `GET /solutions/{id}`, `PATCH /solutions/{id}`                                                                                                                                                      | planner-user (creator) or planner-admin                           |
|                          | `DELETE /solutions/{id}`                                                                                                                                                                            | planner-user or planner-admin, and the creator of the solution    |
| Planner workflow         | `POST /solutions/{id}/analyze`, `/discovery`, `/chat`, `/blueprint`, `/consult/{service}`, `PUT /solutions/{id}/components/{order}/review`                                                          | planner-user (creator) or planner-admin                           |
| Versions and export      | `GET /solutions/{id}/export`, `GET /solutions/{id}/versions`, `POST /solutions/{id}/versions/checkpoint`, `PATCH /solutions/{id}/versions/{number}`, `GET /solutions/{id}/versions/{number}/export` | planner-user (creator) or planner-admin                           |
| Specialists              | `GET /specialists`, `POST /specialists/{service}/chat`                                                                                                                                              | planner-user or planner-admin                                     |
| Saved specialist chats   | `GET /specialists/chats`, `GET /specialists/chats/export`, `GET /specialists/chats/{chatId}`, `GET /specialists/chats/{chatId}/export`, `DELETE /specialists/chats/{chatId}`                        | planner-user or planner-admin (own chats only)                    |

The export endpoints return JSON with a `Content-Disposition: attachment` header. `POST /solutions/{id}/chat` returns the updated solution as JSON; it isn't a stream.

Tenant patterns can also be set in the configuration service; see [Business pattern library](#business-pattern-library).

## Concepts

### Solution

The persistent state of a planning effort: problem statement, business concepts (actors, goals, activities, decisions, evidence, business rules, constraints, evaluation criteria, workflows, outcomes, documents, events, external systems, assumptions, unknowns), decisions with the reasons they were made, open questions, pattern matches, hypotheses, specialist progress, artifacts and next steps. A solution survives across sessions so users do not need to repeat information.

### Discovery

`POST /solutions/{id}/discovery` is a discovery conversation. The planner replies with one message of clarifying questions and scores six factors (problem, users, process, information, communication, constraints). The solution is analyzed and presented (`state.discovery.ready`) once the average (`state.confidence.score`) reaches 75 and every individual factor is at least 40, or when `force` is true. `restart` clears the discovery thread. Replies keep working after the solution is presented: each one re-runs the analysis, so the solution is refined from the discovery answers.

`POST /solutions/{id}/chat` sends a message after analysis; the analysis is refined using the answers and conversation, and the reply is appended to `state.conversation`.

### Blueprint

`POST /solutions/{id}/blueprint` generates the complete project blueprint (`state.blueprint`): overview, technical architecture (layers and diagram), ADSP service mapping, notes from specialist consultations of every recommended service, components to set up, core workflows, data and governance, delivery plan, and acceptance criteria. Saved consultations are reused unless `refreshConsultations` is true. The solution must be analyzed first. Users review each component (`PUT /solutions/{id}/components/{order}/review`); rejected components are left out of exports.

### Versions

A solution's content is saved as a numbered version whenever an operation changes it. `PATCH /solutions/{id}`, `/analyze` and `/blueprint` accept `checkpoint: false` to skip saving, which lets a client combine several calls into one version and then call `POST /solutions/{id}/versions/checkpoint`. Versions can be renamed and downloaded; `GET /solutions/{id}/export` downloads the current solution, including any unsaved changes.

### Business pattern

A template describing a typical GoA application type: domain language, strong and weak signals, likely service mappings, clarifying questions, assumptions and known unknowns. The 19 application types from the planner requirements are built in (Case Management is fully specified). Tenants can extend or override patterns through configuration in the `platform:project-planner-service` namespace and name.

Matching is deterministic: each domain term counts 1 and each strong signal counts 2. Weak signals never add to the score. A score of 8 or more is high confidence, 4 or more is medium, otherwise low; low confidence results include the pattern's clarifying questions.

### Business pattern library

The service ships 19 built-in business patterns (case management, grant applications, permit/licence, registration, inspection, complaint intake, consultation, eligibility, booking, document submission, incident reporting, FOIP-style requests, referral routing, status tracking, audit trail, public reporting, document generation, notification subscriptions, internal service requests). Each pattern provides: name, purpose, domain language, common features (`commonFeatures`), strong signals, weak or misleading signals, likely ADSP service mappings (each with a reason), clarifying questions, assumptions and known unknowns. Tenants manage patterns through the API (`planner-admin` role only for writes):

- `POST /patterns` creates a custom pattern. The `id` is optional and defaults to a slug of the name.
- `PUT /patterns/{id}` updates a pattern. Updating a built-in pattern stores a tenant copy that overrides it.
- `DELETE /patterns/{id}` deletes a custom pattern. Deleting a customized built-in pattern restores the built-in version. Built-in patterns themselves cannot be deleted.

Each pattern returned by the API has a `source` of `built-in`, `customized` or `custom`. The effective catalogue is built-in patterns, overridden by configuration (`patterns`), overridden by tenant patterns stored through the API, and it feeds both rule-based matching and AI analysis. Service mappings must reference a known specialist service.

### Specialist

Each ADSP service has a specialist definition with questions, dependencies, risks and a workspace path. Consulting a specialist reports fit for the solution, questions to ask, dependency status and risks.

Specialists have two responsibilities:

1. **Guide the planner.** When the planner consults a specialist (`POST /solutions/{id}/consult/{service}`), the result states whether the service is a good fit (`fit`), which parts of the solution it can support (`supports`), constraints, dependencies and risks the planner may not have considered, and, when a plan is supplied in `proposal`, a `validation` verdict (`sound`, `needs-changes` or `not-a-fit`) with findings.
2. **Guide a user directly.** `POST /specialists/{service}/chat` is a multi-turn conversation with a single service specialist and needs no planner session. The `intent` selects the task: `ask` (answer questions), `recommend` (service-specific solutions), `design` (refine a service-specific design), `validate` (verdict and findings) or `sample` (sample code or configuration). The response contains `chatId`, `reply`, `suggestions`, `samples`, `validation` and `followUps`. An optional `solutionId` gives the specialist the solution context. Without AI, a rule-based reply with the service's questions and pitfalls is returned.

A chat holds up to 200 messages; start a new chat when it is full.

### AI analysis

AI analysis calls an OpenAI-compatible chat completions endpoint (the GoA Model as a Service) and is the default mode when `MAAS_API_KEY` is set. `GET /analysis/options` reports the available modes, the default mode and the model name. The result is validated against the pattern catalog and specialist list. If the model call fails or is not configured, the service falls back to rule-based analysis and records a warning in the solution `analysis` field. Requests retry up to 3 times with exponential backoff on 5xx, 429 and network errors.

| environment variable | default                       | description                                                                       |
| :------------------- | :---------------------------- | :-------------------------------------------------------------------------------- |
| MAAS_API_KEY         |                               | Virtual key for the model service. Supply as a secret; AI mode is off when empty. |
| MAAS_BASE_URL        | https://maas.int.gov.ab.ca/v1 | Model service base URL.                                                           |
| MAAS_MODEL           | GOA-Default                   | Model name.                                                                       |
| MAAS_TIMEOUT_MS      | 120000                        | Per-request timeout.                                                              |

## Events

The service sends these domain events in the `project-planner-service` namespace. Each payload includes the solution's `id`, `name`, `scenario` and `status`, and the user who made the change. The service doesn't consume events.

| name             | description                                                                                                                                                                                                                       |
| :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| solution-created | Signalled when a solution is created.                                                                                                                                                                                             |
| solution-updated | Signalled when a solution is updated, analyzed or consulted. `operation` is one of `update`, `analyze`, `chat`, `discovery`, `consult`, `blueprint`, `component-review`, `specialist-chat`, `version-saved` or `version-renamed`. |
| solution-deleted | Signalled when a solution is deleted.                                                                                                                                                                                             |

## Audit actions

Project planner service records audit events in the `project-planner-service` namespace of the [audit service](audit-service.md). Records are written to the tenant of the solution, pattern or chat, with the signed-in user (ID, name and roles, without the email address) as the actor. The correlation ID is the trace ID of the request when tracing is on. Metadata holds only IDs, counts and enumerated values: problem statements, conversation and chat messages, chat titles, AI prompts and responses, and blueprint content are never recorded. All actions are version 1. Actions do not set a retention class; the audit service derives it from the category (`compliance` for administrative and data-access actions, `standard` for runtime actions), as shown in the table.

| action | category | severity | retention class | recorded when |
|:-|:-|:-|:-|:-|
| solution.created | administrative | info | compliance | A solution is created (`POST /solutions`), with the `scenario` in the metadata. |
| solution.deleted | administrative | warning | compliance | A solution is deleted by its owner (`DELETE /solutions/{id}`), with its `scenario` and `status`. |
| solution.exported | data-access | info | compliance | A solution is downloaded (`GET /solutions/{id}/export`, `scope: 'solution'` with the latest `version` and `unsavedChanges`) or a saved version is downloaded (`GET /solutions/{id}/versions/{number}/export`, `scope: 'version'` with the `version`). |
| solution.admin-accessed | data-access | info | compliance | A `planner-admin` successfully reads, changes or exports a solution owned by another user, with the `ownerId` and the `operation` (`read`, `update` or `export`) in the metadata. Reading the solution or its versions is `read`; changes, analysis, discovery, chat, consultations, blueprints, component reviews and version checkpoints or renames are `update`. A specialist chat that uses the solution as context is `read`, or `update` when the chat changes the solution. |
| solution.analyzed | runtime | info | standard | A request sends solution content to the AI model, with the `endpoint` (`analyze`, `discovery`, `chat`, `blueprint`, `consult` or `specialist-chat`), the `mode` of the result (`ai`, or `rules` after a fallback), the configured `model`, whether any model call in the request `fellBack` to rules, and the specialist `service` for consultations and specialist chats. |
| pattern.created | administrative | info | compliance | A tenant pattern is created (`POST /patterns`), with `source: 'custom'`. |
| pattern.updated | administrative | info | compliance | A pattern is updated or a built-in pattern is customized (`PUT /patterns/{id}`), with the `source` after the update and the `previousSource`. The change set holds the before and after values of the changed pattern fields. |
| pattern.deleted | administrative | warning | compliance | A custom pattern is deleted or a customized built-in pattern is reset (`DELETE /patterns/{id}`), with the `source` (`custom` or `customized`) of the deleted pattern. |
| specialist-chat.exported | data-access | info | compliance | A user downloads one saved specialist chat (`scope: 'single'`) or all of their chats (`scope: 'all'`), with the `chatCount`, the specialist `service` and the `solutionId` (the filters, for an export of all chats). |
| specialist-chat.deleted | administrative | info | compliance | A saved specialist chat is deleted, with its specialist `service` and `solutionId`. |

Solution records use `{ type: 'solution', id: <solution ID>, name: <solution name> }` as the resource, pattern records use `{ type: 'pattern', id: <pattern ID>, name: <pattern name> }`, and chat records use `{ type: 'specialist-chat', id: <chat ID> }`. An export of all chats has no single chat, so it has no resource. A pattern change set that would exceed the 16 KB audit limit is omitted, with `changeSetOmitted: true` in the metadata.

`solution.analyzed` is recorded only when the model is called: rule-based requests, and AI requests when no model is configured, send nothing to the model and are not recorded. It is recorded once per request when the request completes, including when the request fails after solution content was sent to the model. A failed request is recorded with status `failure` (client error) or `error` (server error) and without a `mode`, since there is no result.

Routine reads by the solution owner (listing and reading solutions, patterns, specialists, chats and versions) are not audited, and neither is a `planner-admin` listing the solutions of the tenant. Solution updates are not recorded as separate actions; they are covered by the `solution-updated` event. Patterns defined in the `patterns` configuration are managed in the [configuration service](configuration-service.md), which records those changes in the `configuration-service` namespace. Denied and failed operations are not recorded.

Records are sent after the operation succeeds and the response is sent. Audit failures are logged and do not fail the request. On shutdown, the service waits for in-flight requests to complete and delivers the audit records still being sent before exiting. The project planner service account requires the `audit-writer` role of `urn:ads:platform:audit-service`.

Audit recording is on by default. Set the environment variable `PROJECT_PLANNER_AUDIT_ENABLED=false` on project planner service to turn it off, or `true` to turn it on regardless of the SDK `AUDIT_ENABLED` variable, which applies when `PROJECT_PLANNER_AUDIT_ENABLED` is not set. The action catalog is still registered while recording is off, so turning it back on needs only a restart.

## Business pattern library

## Code examples

### Create and analyze a solution

```typescript
const plannerServiceUrl = 'https://project-planner-service.adsp.alberta.ca';

const createResponse = await fetch(`${plannerServiceUrl}/planner/v1/solutions`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Small business grant',
    scenario: 'new',
    problemStatement: 'Applicants apply for a small business grant. Staff review each application and decide.',
  }),
});
const { id } = await createResponse.json();

const analyzeResponse = await fetch(`${plannerServiceUrl}/planner/v1/solutions/${id}/analyze`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'rules' }),
});
const { state } = await analyzeResponse.json();
// state.patternMatches[0].patternId, state.hypotheses[0].recommendations, state.questions
```

### Continue the discovery conversation

```typescript
const response = await fetch(`${plannerServiceUrl}/planner/v1/solutions/${id}/discovery`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Small businesses apply online. Program staff review and approve each application.',
  }),
});
const { state } = await response.json();
// state.discovery.ready, state.discovery.confidence, state.discovery.messages
```

### Generate the blueprint

```typescript
const response = await fetch(`${plannerServiceUrl}/planner/v1/solutions/${id}/blueprint`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
});
const { state } = await response.json();
// state.blueprint.serviceMapping, state.blueprint.components, state.blueprint.acceptance
```

### Ask a service specialist

```typescript
const response = await fetch(`${plannerServiceUrl}/planner/v1/specialists/form-service/chat`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Do applicants need to sign in?', intent: 'ask', solutionId: id }),
});
const { chatId, reply, followUps } = await response.json();
// Pass chatId in the next message to continue the same chat.
```

### Extract a problem statement from a document

```typescript
const form = new FormData();
form.append('file', file); // A .md, .docx, .doc (HTML export) or .pdf file up to 20 MB.

const response = await fetch(`${plannerServiceUrl}/planner/v1/documents/extract`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: form,
});
const { text } = await response.json();
```

### Save, list and download versions

```typescript
const checkpoint = await fetch(`${plannerServiceUrl}/planner/v1/solutions/${id}/versions/checkpoint`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
});
const { number } = await checkpoint.json();

const versions = await fetch(`${plannerServiceUrl}/planner/v1/solutions/${id}/versions`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const { latest, unsavedChanges, results } = await versions.json();

const download = await fetch(`${plannerServiceUrl}/planner/v1/solutions/${id}/versions/${number}/export`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const exported = await download.json();
// exported.version, exported.changedSections, exported.state
```

### Add a tenant business pattern

Requires the `planner-admin` role.

```typescript
const response = await fetch(`${plannerServiceUrl}/planner/v1/patterns`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Grant application',
    domainLanguage: ['grant', 'applicant', 'funding', 'award'],
    strongSignals: [{ description: 'Applicants apply for funding', keywords: ['grant', 'funding'] }],
    serviceMappings: [{ service: 'form-service', reason: 'Collects the application.' }],
  }),
});
const { id: patternId, source } = await response.json();
// patternId is 'grant-application' and source is 'custom'.
```
