# core-common

Shared code for the Node.js platform services in this monorepo: error types and the Express error handler, request validation, logging, RabbitMQ queue services, a configuration-service client, JSON schema validation, and test helpers.

It is internal to the monorepo and isn't published to npm. Import it through the path aliases in `tsconfig.base.json`:

| Alias                                | Source                                  | Use for                                   |
| :----------------------------------- | :-------------------------------------- | :---------------------------------------- |
| `@core-services/core-common`         | `libs/core-common/src/index.ts`         | Service code                              |
| `@core-services/core-common/testing` | `libs/core-common/src/testing/index.ts` | Specs: `createDocumentedResponseRecorder` |
| `@core-services/core-common/mongo`   | `libs/core-common/src/mongo/index.ts`   | Specs: connecting to a test MongoDB       |

## Usage

Most services create a logger at startup and add the error handler after their routers:

```typescript
import { createErrorHandler, createLogger, NotFoundError } from '@core-services/core-common';
import * as express from 'express';

const logger = createLogger('my-service', process.env.LOG_LEVEL || 'info');
const app = express();

app.get('/my-service/v1/things/:id', (req, _res, next) => {
  // Passed to the error handler, which responds 404 with { errorMessage }.
  next(new NotFoundError('thing', req.params.id));
});

// Add last, after all routers.
app.use(createErrorHandler(logger));
```

### Errors and status codes

The error types extend `GoAError` from `@abgov/adsp-service-sdk` and carry their status code in `extra.statusCode`. All except `ValidationFailedError` take an optional `extra` argument that can override it.

`createErrorHandler(logger)` returns an Express error handler. It responds as follows:

| Error                                                                      | Status    | Body                                              |
| :------------------------------------------------------------------------- | :-------- | :------------------------------------------------ |
| `InvalidOperationError`, `InvalidValueError`, `ValidationFailedError`      | 400       | `{ errorMessage }`                                |
| `AdspIdFormatError` (SDK)                                                  | 400       | `{ errorMessage }`                                |
| `UnauthorizedError`                                                        | 401       | `{ errorMessage }`                                |
| `UnauthorizedUserError` (SDK)                                              | 403       | `{ errorMessage }`                                |
| `NotFoundError`                                                            | 404       | `{ errorMessage }`                                |
| Any of the above given a different `extra.statusCode`                      | That code | `{ errorMessage }`                                |
| Request body that body-parser can't parse (malformed JSON)                 | 400       | `{ errorMessage: 'Malformed request body: ...' }` |
| Anything else, including other `GoAError` subclasses and an oversized body | 500       | Text `Internal Server Error`; the error is logged |

Only the listed classes keep their status code. A `GoAError` of another class, such as a service's own error type, is a 500 unless the service handles it in its own error handler first.

`UnauthorizedError` is 401 and `UnauthorizedUserError` is 403, so check which one the code throws.

### Request validation

`createValidationHandler(...chain)` wraps `express-validator` chains. It returns an array of handlers that runs the chain and calls `next(new ValidationFailedError(result))` if any check fails, so the error handler responds 400.

```typescript
import { createValidationHandler } from '@core-services/core-common';
import { param } from 'express-validator';

router.get('/things/:id', createValidationHandler(param('id').isUUID()), getThing);
```

### Logging

`createLogger(service, level)` returns a [winston](https://github.com/winstonjs/winston) logger that writes to the console with the `service` name, a timestamp and the trace context (from the SDK `addTraceFormat`). `level` defaults to `info`. The levels are `critical`, `alert`, `error`, `warn`, `info`, `debug` and `verbose`.

### Testing

`createDocumentedResponseRecorder(swaggerFile)`, from `@core-services/core-common/testing`, checks that a router's responses match a swagger (OpenAPI) YAML file. It returns `{ middleware, assertDocumented }`:

- Mount `middleware` before the router under test, and the error handler after it.
- Call `await assertDocumented()` in `afterEach`. It throws if a response used a method and path that isn't documented, or a status code that isn't listed for that operation.

```typescript
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { join } from 'path';

const documented = createDocumentedResponseRecorder(join(__dirname, 'thing.swagger.yml'));

const app = express();
app.use(documented.middleware);
app.use('/my-service/v1', router);
app.use(createErrorHandler(logger));

afterEach(async () => {
  await documented.assertDocumented();
});
```

See [API documentation maintenance](../../architecture/api-documentation-maintenance.md) for how the documented-behaviour (`*.docs.spec.ts`) specs use it.

`@core-services/core-common/mongo` exports `connect()` and `disconnect()` for the MongoDB at `MONGO_URL`, plus `generateId()` and `createMockData(repo, data)` for seeding a repository.

## Reference

The main exports of `@core-services/core-common`, by module:

- **errors**: `InvalidOperationError`, `InvalidValueError`, `NotFoundError`, `UnauthorizedError`, `ValidationFailedError`, `createErrorHandler`, `createValidationHandler`.
- **logging**: `createLogger`.
- **assert**: `assertAuthenticatedHandler` (responds 401 if the request has no authenticated user), `AuthAssert`, `authenticateToken`.
- **amqp**: `createAmqpEventService` (domain events from RabbitMQ, optionally filtered by `bindingKey`), `createAmqpQueueService` (a work queue), `createAmqpConfigUpdateService` (configuration update notifications), `getConnectionProps`, and the `AmqpEventSubscriberService` and `AmqpWorkQueueService` classes.
- **event and work**: the `DomainEvent`, `DomainEventWorkItem`, `DomainEventSubscriberService`, `WorkItem` and `WorkQueueService` types.
- **configuration**: `ConfigurationClient`, which reads and writes one configuration-service document (`namespace:name`) with the service account and without caching. It has entry methods (`updateEntry`, `deleteEntry`) and whole-document methods (`getDocument`, `replaceConfiguration`, `setActiveRevision`, `deleteConfiguration`).
- **jsonSchema**: `AjvValidationService`, an implementation of `ValidationService` (`setSchema`, `validate`) that throws `InvalidValueError` when a value doesn't match its schema. It adds the `file-urn`, `phone`, `time` and `computed` formats and the form renderer's named formats (`sin`, `postalCode`, `driverId`, `mvid`).
- **repository, cursor and types**: the `Repository` interface, `decodeAfter` and `encodeNext` for `after`/`next` paging cursors, and the `Results`, `Doc`, `New`, `NewOrExisting` and `Update` types.

## Development

```bash
npx nx test core-common
npx nx lint core-common
```

The library has no build target. Each service bundles it when the service is built.

## Links

- [Platform documentation](https://govalta.github.io/adsp-monorepo)
- [Node SDK guide](../../docs/platform/platform-node-sdk.md), for `@abgov/adsp-service-sdk`, which this library builds on
- [Unit testing standards](../../architecture/unit-testing-standards.md)
