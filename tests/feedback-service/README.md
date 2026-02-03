# Feedback Service Load Test (Artillery)

## Overview

This Artillery test targets the **Feedback Service** to measure performance and scalability of feedback submission.

Each virtual user:

1. Fetches a Keycloak token using **username/password**
2. Submits feedback via `/feedback/v1/feedback`

---

## Behavior

Each VU performs **one feedback submission** per scenario.

---

## Authentication

Token is obtained using Keycloak **Resource Owner Password Credentials grant**:

- `client_id`
- `client_secret`
- `username`
- `password`

Token is cached per worker to reduce Keycloak load.

### Required Environment Variables

```bash
export ARTILLERY_CLIENT_SECRET=********
export ARTILLERY_USER_PASSWORD=********
```

---

## CSV Payload

Environment CSV file must contain:

```csv
keycloak_url,realm_id,tenant_name,client_id,username
```

Example file names:

```
artillery.dev.csv
artillery.uat.csv
```

---

## Running the Test

```bash
artillery run feedback-artillery.yml
```

To target a specific environment:

```bash
artillery run --environment dev feedback-artillery.yml
```

---

## Project Structure

```
.
├── feedback-artillery.yml
├── processor.mjs
└── ../artillery.dev.csv
└── ../artillery.uat.csv
```

---

## Notes

- This is a load test, not a functional test.
- No cleanup is performed.
- Logging masks secrets and tokens.

```

---
```
