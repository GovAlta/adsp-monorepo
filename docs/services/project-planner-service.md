---
layout: page
title: Project planner service
nav_order: 20
parent: Services
---

# Project planner service
Project planner service helps people new to ADSP describe a business problem and turn it into a plan for using ADSP services. It builds a structured *business model* of the problem, matches it to known GoA *business patterns*, proposes *solution hypotheses* with recommended services, and hands the user off to service workspaces with the gathered context.

Recommendations are hypotheses for the user to refine; the planner is not a replacement for early discovery or business analysis.

## Client roles
client `urn:ads:platform:project-planner-service`

| name | description |
|:-|:-|
| planner-admin | Administrator role. Allows access to all solutions in the tenant. |
| planner-user | User role. Allows creating and working on own solutions. |

## Concepts
### Solution
The persistent state of a planning effort: problem statement, business concepts (actors, goals, activities, decisions, evidence, business rules, constraints, evaluation criteria, workflows, outcomes, documents, events, external systems, assumptions, unknowns), decisions with the reasons they were made, open questions, pattern matches, hypotheses, specialist progress, artifacts and next steps. A solution survives across sessions so users do not need to repeat information.

### Business pattern
A template describing a typical GoA application type: domain language, strong and weak signals, likely service mappings, clarifying questions, assumptions and known unknowns. The 19 application types from the planner requirements are built in (Case Management is fully specified). Tenants can extend or override patterns through configuration in the `platform:project-planner-service` namespace and name.

Matching is deterministic: each domain term counts 1 and each strong signal counts 2. Weak signals never add to the score. A score of 8 or more is high confidence, 4 or more is medium, otherwise low; low confidence results include the pattern's clarifying questions.

### Specialist
Each ADSP service has a specialist definition with questions, dependencies, risks and a workspace path. Consulting a specialist reports fit for the solution, questions to ask, dependency status and risks. Handing off records the specialist as `in-workspace` and returns a context package for the service workspace.

## API
Base path `/planner/v1`. See the service swagger docs for details.

| method | path | description |
|:-|:-|:-|
| GET | /patterns, /patterns/{patternId} | Retrieve business patterns. |
| POST | /patterns/match | Match free text against patterns. |
| GET | /specialists | Retrieve service specialists. |
| GET, POST | /solutions | List own solutions (all for planner-admin) or create one. |
| GET, PATCH, DELETE | /solutions/{id} | Retrieve, update, or delete a solution. |
| POST | /solutions/{id}/analyze | Extract concepts, match patterns, generate hypotheses and next steps. Body `mode` is `ai` (default when a model is configured) or `rules`. |
| POST | /solutions/{id}/consult/{service} | Consult a service specialist. Optional body `question` and `mode`. |
| POST | /solutions/{id}/handoff/{service} | Hand off to a service workspace with context. |
| GET | /analysis/options | Available analysis modes, the default mode and the model name. |

## AI analysis
AI analysis calls an OpenAI-compatible chat completions endpoint (the GoA Model as a Service) and is the default mode when `MAAS_API_KEY` is set. The result is validated against the pattern catalog and specialist list. If the model call fails or is not configured, the service falls back to rule-based analysis and records a warning in the solution `analysis` field. Requests retry up to 3 times with exponential backoff on 5xx, 429 and network errors.

| environment variable | default | description |
|:-|:-|:-|
| MAAS_API_KEY | | Virtual key for the model service. Supply as a secret; AI mode is off when empty. |
| MAAS_BASE_URL | https://maas.int.gov.ab.ca/v1 | Model service base URL. |
| MAAS_MODEL | GOA-Default | Model name. |
| MAAS_TIMEOUT_MS | 120000 | Per-request timeout. |
| MAAS_INSECURE_TLS | false | Skip TLS certificate validation (internal endpoints with a private CA only). |

## Events
| name | description |
|:-|:-|
| solution-created | Signalled when a solution is created. |
| solution-updated | Signalled when a solution is updated, analyzed, consulted or handed off. |
| solution-deleted | Signalled when a solution is deleted. |
