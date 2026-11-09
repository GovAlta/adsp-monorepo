---
layout: page
title: Project planner service
nav_order: 20
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
