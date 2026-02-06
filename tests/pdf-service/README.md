# PDF Service Load Test (Artillery)

## Overview

This Artillery test targets the **PDF Service** to measure performance and scalability of PDF job creation.

Each virtual user:

1. Fetches a Keycloak token using client credentials
2. Calls `/pdf/v1/jobs` to create a PDF generation job

---

## Behavior

Each VU performs **one job creation request** per scenario.

This test does **not** poll for completion or validate the generated PDF.

---

## Authentication

Token is obtained using Keycloak **client credentials grant**:

- `client_id`
- `client_secret`

Token is cached per worker to reduce Keycloak load.

### Required Environment Variable

```bash
export ARTILLERY_CLIENT_SECRET=********
```

---

## CSV Payload

Environment CSV file must contain:

```csv
keycloak_url,realm_id,tenant_name,client_id
```

Example file names:

```
artillery.dev.csv
artillery.uat.csv
```

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

## Project Structure

```
.
├── artillery.yml
├── processor.mjs
└── ../artillery.dev.csv
└── ../artillery.uat.csv
```

---

## Notes

- This is a load test, not a functional test.
- No cleanup is performed.
- Logging masks secrets and tokens.
