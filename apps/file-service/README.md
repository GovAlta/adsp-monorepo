# File service

Implements the ADSP file service (`urn:ads:platform:file-service`). See the [File service documentation](https://govalta.github.io/adsp-monorepo/services/file-service.html) for what it does, its roles, file types, events and audit actions.

## Run locally

The service needs Keycloak, MongoDB and RabbitMQ. Uploads are virus scanned with ClamAV (`AV_HOST`, `AV_PORT`).

```bash
npx nx serve file-service
```

The service listens on `PORT` (default `3337`). The health endpoint is at `/health`. Set `POD_TYPE=job` to run the job pod, which also runs the daily retention job.

## Test and lint

```bash
npx nx test file-service
npx nx lint file-service
```

## Environment variables

Variables are loaded with [dotenv](https://www.npmjs.com/package/dotenv) and validated in `src/environments/environment.ts`, which holds the full list and the defaults. Do not commit `.env`.

| Variable                                                    | Purpose                                                                |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| `MONGO_URI`, `MONGO_DB`, `MONGO_USER`, `MONGO_PASSWORD`     | File metadata database connection                                      |
| `KEYCLOAK_ROOT_URL`                                         | Keycloak server                                                        |
| `CLIENT_ID`, `CLIENT_SECRET`                                | Service account of the file service                                    |
| `DIRECTORY_URL`                                             | Directory service                                                      |
| `AMQP_HOST`, `AMQP_USER`, `AMQP_PASSWORD`                   | RabbitMQ, for the scan and delete work queue and configuration updates |
| `STORAGE_PROVIDER`                                          | `file` (default) for the local file system, or `blob` for Azure Blob   |
| `FILE_PATH`                                                 | Directory for the `file` storage provider                              |
| `BLOB_ACCOUNT_URL`, `BLOB_ACCOUNT_NAME`, `BLOB_ACCOUNT_KEY` | Azure Blob storage account, for the `blob` storage provider            |
| `AV_PROVIDER`, `AV_HOST`, `AV_PORT`                         | Anti-virus scanner (default `clam` on `localhost:3310`)                |
| `POD_TYPE`                                                  | `api` (default) or `job`                                               |
| `FILE_AUDIT_ENABLED`                                        | Turns audit recording on or off; see the service documentation         |

Ask the team for the dev Keycloak client secrets.

## API documentation

The OpenAPI spec is built from `src/**/*.swagger.yml` (see `swagger.config.js`) and served at `/swagger/docs/v1`. `src/file/router/file.docs.spec.ts` checks that the router's responses match the documented operations.
