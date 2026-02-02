# Form Service Load Test – Artillery

## Overview

This Artillery load test simulates realistic user interactions with the **Form Service API**, covering the full lifecycle of a form:

1. Create a form draft
2. Update the draft multiple times
3. Submit and delete the form

The test models **partial user drop-off** and **human think time** to better reflect real-world usage patterns.

Pre-created data: a form definition needs to be created with First Name and Second Name user inputs and the form definition needs to allow mutiple
forms per applicant

User permission: the applicant user needs to have permission to add, edit and submit the form.

---

## Virtual User (VU) Behavior

Each Virtual User follows the same scenario, with probabilistic branching to control load distribution:

| Action            | Percentage                       |
| ----------------- | -------------------------------- |
| Create form draft | **100%**                         |
| Update form       | **80%**                          |
| Submit form       | **50% of updaters (~40% total)** |
| Updates per form  | **1–5 (randomized)**             |

Think times are added between steps to simulate realistic pauses between user actions.

---

## Authentication (Keycloak – Password Grant)

Authentication is handled in `processor.mjs` using **Keycloak Resource Owner Password Credentials (password grant)**.

### How it works

- A Keycloak access token is fetched using:

  - `client_id`
  - `client_secret`
  - `username`
  - `password`

- Tokens are:

  - cached in memory
  - reused across VUs in the same worker
  - refreshed automatically before expiry

- This significantly reduces load on Keycloak during performance tests.

⚠️ **Important:**
Because tokens are cached, multiple VUs using the same username will share a token. This is intentional for load testing efficiency.

---

## Required Configuration

### 1️⃣ CSV Payload

Your environment CSV must include the following fields:

```csv
keycloak_url,realm_id,tenant_name,client_id,username
```

These values are injected into the processor via `context.vars`.

---

### 2️⃣ Environment Variables

Sensitive values are injected via environment variables and **never stored in source control**:

```bash
export ARTILLERY_CLIENT_SECRET=********
export ARTILLERY_USER_PASSWORD=********
```

---

## Project Structure

```text
.
├── artillery.yml          # Artillery test definition
├── processor.mjs          # Auth + VU behavior logic
├── definitions.csv        # Form definition IDs
├── applicants.csv         # Applicant test data
└── artillery.dev.csv      # Environment-specific config
```

---

## Scenario Flow (High Level)

```text
Create form draft (100%)
        |
      think
        |
Update form? (80%)
        |
   Update 1–5 times
        |
      think
        |
Submit form? (50% of updates)
        |
   Submit + delete
```

---

## Why This Model

This test is designed to:

- Exercise **all major form endpoints**
- Control load distribution precisely
- Avoid unrealistic “all users submit” behavior
- Minimize Keycloak overhead during load tests
- Be easy to tune by changing percentages in one place (`processor.mjs`)

---

## Running the Test

```bash
artillery run artillery.yml
```

To target a specific environment:

```bash
artillery run --environment dev artillery.yml
```

---

## Notes

- This is a load test, not a functional test.
- Cleanup is performed.
- Logging masks secrets and tokens.
