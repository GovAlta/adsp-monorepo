export type SdkSymbolKind = 'function' | 'class' | 'interface' | 'type' | 'enum' | 'const' | 'decorator';

export interface SdkSymbolDoc {
  name: string;
  kind: SdkSymbolKind;
  module: string;
  summary: string;
  details?: string;
  example?: string;
  deprecated?: boolean;
  seeAlso?: string[];
}

/**
 * Curated reference for every symbol exported from the root of `@abgov/adsp-service-sdk`
 * (libs/adsp-service-sdk/src/index.ts). Coverage against that export list is enforced by
 * reference.spec.ts so this stays in sync as the SDK evolves.
 */
export const SDK_REFERENCE: SdkSymbolDoc[] = [
  // initialize
  {
    name: 'initializeService',
    kind: 'function',
    module: 'initialize',
    summary:
      "SDK's main entry point for a tenant service — the typical way a product team consumes this SDK, since " +
      'platform services already live in the ADSP core-services monorepo and use initializePlatform instead.',
    details:
      'async initializeService(options: Omit<PlatformOptions, "ignoreServiceAud">, logOptions: Logger | LogOptions): ' +
      'Promise<Capabilities>\n\n' +
      'Unlike the root initializePlatform (which fixes realm to "core"), options.realm here is your tenant\'s realm ' +
      '(visible in Tenant Admin, or the realm name you set up your service client under in Keycloak). Resolves the ' +
      "service's single tenant via tenantService.getTenants()[0] and returns a reshaped capability set: same as " +
      'PlatformCapabilities but without tenantService/tenantHandler, and clearCached is reshaped to ' +
      '(serviceId: AdspId) => void (tenant is implicit).',
    example:
      "import { AdspId, initializeService } from '@abgov/adsp-service-sdk';\n\n" +
      "const serviceId = AdspId.parse(environment.CLIENT_ID);\n" +
      "const { coreStrategy, tenantStrategy, ...sdkCapabilities } = await initializeService(\n" +
      "  {\n" +
      "    displayName: 'My tenant service',\n" +
      "    description: 'Example of a service built on top of ADSP.',\n" +
      "    serviceId,\n" +
      "    realm: environment.TENANT_REALM,\n" +
      "    accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),\n" +
      "    clientSecret: environment.CLIENT_SECRET,\n" +
      "    directoryUrl: new URL(environment.DIRECTORY_URL),\n" +
      "    configurationSchema,\n" +
      "    events: [],\n" +
      "    roles: [],\n" +
      "    notifications: [],\n" +
      "  },\n" +
      "  { logger }\n" +
      ");",
    seeAlso: ['initializePlatform', 'ServiceRegistration'],
  },
  {
    name: 'initializePlatform',
    kind: 'function',
    module: 'initialize',
    summary:
      'Entry point for a multi-tenant platform service (the kind that lives in the ADSP core-services monorepo ' +
      'alongside directory-service, configuration-service, etc). Most product teams building on ADSP want ' +
      'initializeService instead — use this only if you are building a new cross-tenant platform capability.',
    details:
      'async initializePlatform(options: PlatformOptions, logOptions: Logger | LogOptions, services?: Partial<PlatformServices>): Promise<PlatformCapabilities>\n\n' +
      'Fixes realm to "core". options extends ServiceRegistration with: clientSecret, directoryUrl, accessServiceUrl, ' +
      'ignoreServiceAud?, configurationConverter?, combineConfiguration?, enableConfigurationInvalidation?, ' +
      'useLongConfigurationCacheTTL?, additionalExtractors?, tracing? (TracingOptions | OTLP endpoint string), ' +
      'metrics? (MetricsOptions | OTLP endpoint string), audit? (AuditClientOptions; immediate delivery by default).\n\n' +
      'Returns PlatformCapabilities: directory, tenantService, configurationService, eventService, auditService, tokenProvider, ' +
      'coreStrategy, tenantStrategy, tenantHandler, configurationHandler, healthCheck, clearCached(tenantId, serviceId), ' +
      'metricsHandler, traceHandler, tracerProvider? (only if tracing enabled), meterProvider? (only if metrics enabled), logger.\n\n' +
      'Also triggers a fire-and-forget registration of roles/events/configuration schema/notifications/etc with the ' +
      'relevant platform services (see ServiceRegistration).',
    seeAlso: ['initializeService', 'ServiceRegistration'],
  },

  // access
  {
    name: 'authorize',
    kind: 'function',
    module: 'access',
    summary: 'Returns Express middleware enforcing role-based access control; user must have at least one of the given roles.',
    details:
      'authorize(...roles: string[]): RequestHandler\n\n' +
      'Passes an UnauthorizedUserError to next() (mapped to 403 by createErrorHandler) if req.user is missing or lacks ' +
      'every listed role.',
    example: "router.get('/resource', authorize('admin'), handler);",
    seeAlso: ['UnauthorizedUserError', 'hasRequiredRole', 'createErrorHandler'],
  },
  {
    name: 'hasRequiredRole',
    kind: 'function',
    module: 'access',
    summary: "Returns true if the user has at least one of the given roles.",
    details: 'hasRequiredRole(user: User, roles: string | string[]): boolean',
    seeAlso: ['authorize', 'isAllowedUser'],
  },
  {
    name: 'isAllowedUser',
    kind: 'function',
    module: 'access',
    summary: 'Checks both tenant match and role match for a user; used by the AssertRole decorator.',
    details:
      'isAllowedUser(user: User, tenantId: AdspId, roles: string | string[], allowCore = false): boolean\n\n' +
      'Allowed if (allowCore and user.isCore) or the user has a tenantId matching tenantId (or no tenantId context ' +
      'given), AND the user has at least one of the roles.',
    seeAlso: ['hasRequiredRole', 'AssertRole'],
  },
  {
    name: 'AssertRole',
    kind: 'decorator',
    module: 'access',
    summary: 'Method decorator that throws UnauthorizedUserError unless the caller (first argument, a User) has a required role.',
    details:
      'AssertRole(operation: string, roles: string | string[], roleProperties?: string | string[], allowCore = false)\n\n' +
      'roleProperties names additional instance properties (arrays of role strings) to combine into the required set. ' +
      'Tenant match is enforced via isAllowedUser using this.tenantId on the decorated instance.',
    seeAlso: ['AssertCoreRole', 'isAllowedUser'],
  },
  {
    name: 'AssertCoreRole',
    kind: 'decorator',
    module: 'access',
    summary: 'Method decorator that throws UnauthorizedUserError unless the caller is a core-realm user with a required role.',
    details: 'AssertCoreRole(operation: string, roles: string | string[])',
    seeAlso: ['AssertRole'],
  },
  {
    name: 'UnauthorizedUserError',
    kind: 'class',
    module: 'access',
    summary: 'GoAError (HTTP 403) thrown when a user is not permitted to perform an operation.',
    details: 'new UnauthorizedUserError(operation: string, user: User, extra?: GoAErrorExtra)',
    seeAlso: ['GoAError', 'createErrorHandler'],
  },
  {
    name: 'TokenProvider',
    kind: 'interface',
    module: 'access',
    summary: "Provides the service's own cached client-credentials access token.",
    details:
      'interface TokenProvider { getAccessToken(): Promise<string>; }\n\n' +
      'The token is cached and refreshed automatically near expiry; obtained from PlatformCapabilities.tokenProvider.',
  },
  {
    name: 'User',
    kind: 'interface',
    module: 'access',
    summary: 'Shape of the authenticated user set on req.user by the SDK Passport strategies.',
    details:
      'interface User {\n' +
      '  id: string; name: string; email: string; roles: string[];\n' +
      '  tenantId?: AdspId; isCore: boolean;\n' +
      '  token: { azp: string; aud: string; iss: string; bearer: string; email_verified: boolean; [x: string]: unknown };\n' +
      '}',
  },

  // utils
  {
    name: 'AdspId',
    kind: 'class',
    module: 'utils',
    summary: 'Utility class for parsing and formatting ADSP URNs (urn:ads:{namespace}:{service}:{api}:{resource}).',
    details:
      'AdspId.parse(urn: string): AdspId — throws AdspIdFormatError on malformed input.\n' +
      'AdspId.isAdspId(value: unknown): boolean — cheap format check without throwing.\n' +
      'instance.type is one of "namespace" | "service" | "api" | "resource" depending on how many URN segments were given.\n' +
      'instance.toString() reconstructs the URN string.',
    example: "const serviceId = AdspId.parse('urn:ads:platform:event-service:v1');",
    seeAlso: ['adspId', 'assertAdspId', 'AdspIdFormatError'],
  },
  {
    name: 'adspId',
    kind: 'function',
    module: 'utils',
    summary: 'Tagged template literal helper that builds and parses an AdspId in one step.',
    example: "const serviceId = adspId`urn:ads:platform:event-service:v1`;",
    seeAlso: ['AdspId'],
  },
  {
    name: 'assertAdspId',
    kind: 'function',
    module: 'utils',
    summary: 'Throws unless an AdspId is one of the given resource types.',
    details: "assertAdspId(id: AdspId, errorMessage?: string, ...types: ('namespace'|'service'|'api'|'resource')[]): void",
    seeAlso: ['AdspId'],
  },
  {
    name: 'AdspIdFormatError',
    kind: 'class',
    module: 'utils',
    summary: 'GoAError (HTTP 400) thrown when a string does not parse as a valid ADSP URN.',
    seeAlso: ['AdspId', 'GoAError'],
  },
  {
    name: 'GoAError',
    kind: 'class',
    module: 'utils',
    summary: 'Base error class used across the SDK, carrying an `extra` bag with statusCode/type/id/parent.',
    details: 'new GoAError(message?: string, extra?: GoAErrorExtra)\n\ncreateErrorHandler reads extra.statusCode to set the HTTP response status.',
    seeAlso: ['GoAErrorExtra', 'createErrorHandler'],
  },
  {
    name: 'GoAErrorExtra',
    kind: 'interface',
    module: 'utils',
    summary: 'Shape of the `extra` property carried by GoAError.',
    details: 'interface GoAErrorExtra { name?: string; statusCode?: number; type?: string; parent?: Error; id?: string; }',
    seeAlso: ['GoAError'],
  },
  {
    name: 'createErrorHandler',
    kind: 'function',
    module: 'utils',
    summary: 'Returns Express error-handling middleware that normalizes GoAError (and generic errors) into a JSON error response.',
    details:
      'createErrorHandler(logger?: Logger): ErrorRequestHandler\n\n' +
      'Reads err.extra.statusCode (GoAError) or err.statusCode, defaults to 500. In production, 5xx messages are ' +
      'replaced with "Internal server error". Logs statusCode/path/method/correlationId when a logger is given. Mount last: app.use(createErrorHandler(logger)).',
    seeAlso: ['GoAError'],
  },
  {
    name: 'createValidationHandler',
    kind: 'function',
    module: 'utils',
    summary: 'Returns Express middleware that validates a request property against a Zod schema, passing ValidationFailedError (400) on failure.',
    details:
      'createValidationHandler<T>(schema: ZodSchema<T>, source?: (req: Request) => unknown): RequestHandler\n\n' +
      'Defaults to validating req.body; pass a custom source function to validate query/params instead.',
    example:
      "router.post('/resource', createValidationHandler(MySchema), handler);\n" +
      "router.get('/search', createValidationHandler(QuerySchema, (req) => req.query), handler);",
    seeAlso: ['ValidationFailedError', 'createErrorHandler'],
  },
  {
    name: 'ValidationFailedError',
    kind: 'class',
    module: 'utils',
    summary: 'GoAError (HTTP 400) thrown by createValidationHandler when Zod validation fails.',
    seeAlso: ['createValidationHandler'],
  },
  {
    name: 'toKebabCase',
    kind: 'function',
    module: 'utils',
    summary: 'Strict kebab-case conversion for IDs: lowercase alphanumeric and hyphens only.',
    example: "toKebabCase('My Form!') // 'my-form'",
    seeAlso: ['toKebabName'],
  },
  {
    name: 'toKebabName',
    kind: 'function',
    module: 'utils',
    summary: 'Legacy kebab-case conversion for tenant names only: lowercases and replaces spaces with hyphens (preserves underscores).',
    details: 'Kept for backward compatibility with existing tenant names. Use toKebabCase for new IDs.',
    deprecated: true,
    seeAlso: ['toKebabCase'],
  },
  {
    name: 'retry',
    kind: 'const',
    module: 'utils',
    summary: 'Exponential-backoff Cockatiel retry policy (10 attempts) used internally by SDK HTTP calls; exposed for consumer use.',
    example: 'await retry.execute(async ({ attempt }) => { /* ... */ });',
  },
  {
    name: 'LimitToOne',
    kind: 'decorator',
    module: 'utils',
    summary: 'Method decorator that de-dupes concurrent calls to an async method sharing a key, so only one execution is in flight at a time.',
    details:
      'LimitToOne(getKey?: (propertyKey: string, ...args) => string)\n\n' +
      'Callers made while an execution is in-flight for the same key share that same promise. Return a falsy key to force ' +
      'independent execution. Used internally for token/directory/tenant/configuration retrieval.',
  },

  {
    name: 'addTraceFormat',
    kind: 'function',
    module: 'utils',
    summary: 'Winston log format that adds the active OpenTelemetry trace ID to log entries.',
    details:
      'addTraceFormat(): Format\n\n' +
      "Adds a `trace` field (from getContextTrace()) to log info if not already set. Used internally by createLogger's default format chain.",
    seeAlso: ['getContextTrace'],
  },

  // directory
  {
    name: 'ServiceDirectory',
    kind: 'interface',
    module: 'directory',
    summary: 'Looks up service/API/resource URLs from the ADSP directory of services.',
    details:
      'interface ServiceDirectory {\n' +
      '  getServiceUrl(serviceId: AdspId): Promise<URL>;\n' +
      '  getResourceUrl(resourceId: AdspId): Promise<URL>;\n' +
      '}\n\n' +
      'Directory entries are cached per namespace with a 10hr TTL. Entries can be overridden with env vars of the ' +
      'form DIR_{NAMESPACE}_{SERVICE}[_{API}] (e.g. DIR_PLATFORM_EVENT_SERVICE). Obtained from PlatformCapabilities.directory.',
    example: "const eventServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:event-service:v1`);",
  },

  // tenant
  {
    name: 'Tenant',
    kind: 'interface',
    module: 'tenant',
    summary: 'Tenant record shape.',
    details: 'interface Tenant { id: AdspId; name: string; realm: string; }',
  },
  {
    name: 'TenantService',
    kind: 'interface',
    module: 'tenant',
    summary: 'Looks up tenant records by ID, name, or Keycloak realm.',
    details:
      'interface TenantService {\n' +
      '  getTenants(): Promise<Tenant[]>;\n' +
      '  getTenant(tenantId: AdspId): Promise<Tenant>;\n' +
      '  getTenantByName(name: string): Promise<Tenant>;\n' +
      '  getTenantByRealm(realm: string): Promise<Tenant>;\n' +
      '}\n\n' +
      'Preloads all tenants on construction and caches results with a 10hr TTL. Obtained from PlatformCapabilities.tenantService (not available on initializeService capabilities, since a tenant service only has its own tenant).',
    seeAlso: ['Tenant'],
  },

  // configuration
  {
    name: 'ConfigurationService',
    kind: 'interface',
    module: 'configuration',
    summary: "Retrieves a service's tenant and/or core configuration from the configuration-service, with caching.",
    details:
      'interface ConfigurationService {\n' +
      '  getConfiguration<C, R = [C, C]>(serviceId: AdspId, token: string, tenantId?: AdspId): Promise<R>;\n' +
      '  getServiceConfiguration<C, R = [C, C, number?]>(name?: string, tenantId?: AdspId): Promise<R>;\n' +
      '  getServiceConfigurationRevision<C, R = [C, C, number?]>(revision: string, name?: string, tenantId?: AdspId): Promise<R>;\n' +
      '}\n\n' +
      'getServiceConfiguration/getServiceConfigurationRevision use the service account context configured via ' +
      'initializePlatform (name is only required when the service registered configuration with useNamespace: true). ' +
      'Results are combined via the combineConfiguration option (default: [tenantConfig, coreConfig]). Obtained from ' +
      'PlatformCapabilities.configurationService; req.getConfiguration()/req.getServiceConfiguration() on requests are ' +
      'set by configurationHandler as convenience wrappers.',
    seeAlso: ['ServiceRegistration'],
  },

  // audit
  {
    name: 'auditDefinitions',
    kind: 'function',
    module: 'audit',
    summary: 'Converts named audit action constants into definitions keyed by action name for catalog registration.',
    details:
      'auditDefinitions(actions: Record<string, AuditAction> | AuditAction[]): Record<string, AuditActionDefinition>\n\n' +
      'Removes name from each definition and uses it as the catalog key. Throws for invalid or duplicate action names. ' +
      'Does not register the catalog or emit audit records; pass actions through ServiceRegistration.auditActions, or ' +
      'the result through ServiceRegistration.serviceConfigurations.',
    example:
      "auditDefinitions({\n" +
      "  UPDATE_CASE: {\n" +
      "    name: 'case.update', version: 1, category: AuditCategories.Administrative,\n" +
      "    severity: AuditSeverities.Info, retentionClass: BuiltInRetentionClasses.Compliance,\n" +
      "  },\n" +
      "});",
    seeAlso: ['AuditAction', 'AuditActionDefinition', 'ServiceRegistration'],
  },
  {
    name: 'AuditAction',
    kind: 'interface',
    module: 'audit',
    summary: 'Named audit action constant accepted by auditDefinitions.',
    details: 'interface AuditAction extends AuditActionDefinition { name: string; }',
    seeAlso: ['AuditActionDefinition', 'auditDefinitions'],
  },
  {
    name: 'AuditActionDefinition',
    kind: 'interface',
    module: 'audit',
    summary: 'Classification and optional metadata schema for an action in an audit catalog.',
    details:
      'interface AuditActionDefinition {\n' +
      '  version: number;\n' +
      '  category: AuditCategory;\n' +
      '  severity: AuditSeverity;\n' +
      '  retentionClass: string; description?: string; resourceType?: string;\n' +
      '  captureChangeSet?: boolean; forwardToSiem?: boolean;\n' +
      '  metadataSchema?: Record<string, unknown>;\n' +
      '}',
    seeAlso: ['AuditAction', 'auditDefinitions', 'AuditCategory', 'AuditSeverity', 'BuiltInRetentionClasses'],
  },
  {
    name: 'AuditCategories',
    kind: 'const',
    module: 'audit',
    summary: 'Shared audit action categories used by TypeScript types and configuration validation.',
    details:
      "const AuditCategories = { Administrative: 'administrative', Runtime: 'runtime', " +
      "Security: 'security', DataAccess: 'data-access' } as const;",
    example: 'category: AuditCategories.Administrative',
    seeAlso: ['AuditCategory', 'AuditActionDefinition'],
  },
  {
    name: 'AuditCategory',
    kind: 'type',
    module: 'audit',
    summary: 'String union of supported audit action categories, derived from AuditCategories.',
    details:
      'type AuditCategory = (typeof AuditCategories)[keyof typeof AuditCategories];\n\n' +
      "Equivalent to 'administrative' | 'runtime' | 'security' | 'data-access'.",
    seeAlso: ['AuditCategories', 'AuditActionDefinition'],
  },
  {
    name: 'AuditSeverities',
    kind: 'const',
    module: 'audit',
    summary: 'Shared audit action severity values used by TypeScript types and configuration validation.',
    details: "const AuditSeverities = { Info: 'info', Warning: 'warning', Critical: 'critical' } as const;",
    example: 'severity: AuditSeverities.Info',
    seeAlso: ['AuditSeverity', 'AuditActionDefinition'],
  },
  {
    name: 'AuditSeverity',
    kind: 'type',
    module: 'audit',
    summary: 'String union of supported audit action severities, derived from AuditSeverities.',
    details:
      'type AuditSeverity = (typeof AuditSeverities)[keyof typeof AuditSeverities];\n\n' +
      "Equivalent to 'info' | 'warning' | 'critical'.",
    seeAlso: ['AuditSeverities', 'AuditActionDefinition'],
  },
  {
    name: 'BuiltInRetentionClasses',
    kind: 'const',
    module: 'audit',
    summary: 'Names of built-in audit retention classes; custom class names remain supported.',
    details:
      "const BuiltInRetentionClasses = { Standard: 'standard', Security: 'security', Compliance: 'compliance' } as const;\n\n" +
      'These constants define names, not retention periods. AuditActionDefinition.retentionClass remains a string ' +
      'so an application can use a custom class such as case-history with a configured retention period.',
    example: 'retentionClass: BuiltInRetentionClasses.Compliance',
    seeAlso: ['AuditActionDefinition', 'auditDefinitions'],
  },
  {
    name: 'AuditService',
    kind: 'interface',
    module: 'audit',
    summary:
      "Records and queries audit events in the service's namespace; returned as auditService by initializePlatform/initializeService.",
    details:
      'interface AuditService {\n' +
      '  record(action: AuditAction, details: AuditRecordDetails): Promise<AuditRecordOutcome>;\n' +
      '  query(criteria?: AuditEventCriteria, options?: AuditQueryOptions): Promise<Results<AuditEventRecord>>;\n' +
      '  flush(): Promise<void>;\n' +
      '  readonly droppedEventCount: number;\n' +
      '}\n\n' +
      'record() sends each event immediately by default. Set options.audit.batchSize greater than 1 during initialization ' +
      'to opt into batching (500 ms default batch interval, per tenant for core services). It retries network errors and ' +
      '429/502/503/504 with the same eventId (honouring Retry-After), and buffers at most 1,000 events or 8 MB. ' +
      'Await it and check the outcome: it never rejects and resolves recorded, rejected, or failed. ' +
      'recorded confirms storage or an idempotent duplicate, not just queue admission. Non-recorded events increment ' +
      'droppedEventCount and the audit.client.dropped_events metric. Change sets are dropped unless the action sets ' +
      'captureChangeSet. Writes wait for auditActions registration to settle. Call flush() before shutdown if batches ' +
      'or unawaited records remain; no separate flush is needed once all record() calls have settled. ' +
      'Normal shutdown must still wait for in-flight application work. ' +
      'query() uses the service token unless options.token is set, and rejects on failure.',
    example:
      "const outcome = await auditService.record(UPDATE_CASE, {\n" +
      "  actor: { id: user.id, type: 'user' },\n" +
      "  resource: { type: 'case', id: caseId },\n" +
      "});\n" +
      "if (outcome.status !== 'recorded') logger.warn(`Audit event not recorded: ${outcome.reason}`);",
    seeAlso: [
      'AuditClientOptions',
      'AuditRecordDetails',
      'AuditRecordOutcome',
      'AuditEventCriteria',
      'AuditQueryOptions',
      'ServiceRegistration',
    ],
  },
  {
    name: 'AuditClientOptions',
    kind: 'interface',
    module: 'audit',
    summary:
      'Optional audit delivery configuration on initializeService and initializePlatform; defaults to immediate single-event writes.',
    details:
      'interface AuditClientOptions {\n' +
      '  batchSize?: number; // default 1; greater than 1 enables batching\n' +
      '  batchIntervalMs?: number; // default 500; unused for single-event delivery\n' +
      '  maxBufferedEvents?: number; // default 1000, including in-flight and retrying events\n' +
      '  maxBufferedBytes?: number; // default 8 MiB serialized\n' +
      '  retryDelaysMs?: number[]; // default [200, 1000, 3000, 5000]\n' +
      '  maxRetryAfterMs?: number; // default 30000\n' +
      '  requestTimeoutMs?: number; // default 10000 per HTTP attempt, not a total call deadline\n' +
      '}',
    example: 'const options = { ...serviceOptions, audit: { batchSize: 100, batchIntervalMs: 500 } };',
    seeAlso: ['AuditService', 'initializeService', 'initializePlatform'],
  },
  {
    name: 'AuditRecordDetails',
    kind: 'interface',
    module: 'audit',
    summary: 'Details of an audit event passed to AuditService.record.',
    details:
      'interface AuditRecordDetails {\n' +
      '  tenantId?: AdspId; // required for core services, ignored for tenant services\n' +
      "  status?: AuditEventStatus; // default 'success'\n" +
      '  actor: AuditActor;\n' +
      '  occurredAt?: Date; // default now\n' +
      '  eventId?: string; // idempotency key, generated when omitted\n' +
      '  resource?: AuditResource; scopeIds?: string[]; correlationId?: string; sessionId?: string;\n' +
      '  metadata?: Record<string, unknown>;\n' +
      '  changeSet?: AuditChangeSet; // sent only if the action sets captureChangeSet\n' +
      '}',
    seeAlso: ['AuditService', 'AuditActor', 'AuditResource', 'AuditChangeSet'],
  },
  {
    name: 'AuditRecordOutcome',
    kind: 'type',
    module: 'audit',
    summary: 'Result resolved by AuditService.record.',
    details:
      "type AuditRecordOutcome =\n" +
      "  | { status: 'recorded'; eventId: string } // stored, or an idempotent duplicate\n" +
      "  | { status: 'rejected'; eventId: string; code: string; reason: string } // refused by the service, not resent\n" +
      "  | { status: 'failed'; eventId: string; reason: Exclude<AuditDropReason, 'rejected'>; error: string };",
    seeAlso: ['AuditService', 'AuditDropReason'],
  },
  {
    name: 'AuditDropReason',
    kind: 'type',
    module: 'audit',
    summary: 'Why an audit event was not stored; also the reason attribute of audit.client.dropped_events.',
    details:
      "type AuditDropReason = 'rejected' | 'invalid_event' | 'buffer_full' | 'retries_exhausted' | 'request_failed' | 'invalid_response';",
    seeAlso: ['AuditRecordOutcome'],
  },
  {
    name: 'AuditEventStatus',
    kind: 'type',
    module: 'audit',
    summary: 'Outcome of the audited action.',
    details: "type AuditEventStatus = 'success' | 'failure' | 'blocked' | 'error';",
    seeAlso: ['AuditRecordDetails'],
  },
  {
    name: 'AuditActorType',
    kind: 'type',
    module: 'audit',
    summary: 'Kind of actor that performed an audited action.',
    details: "type AuditActorType = 'user' | 'service' | 'system';",
    seeAlso: ['AuditActor'],
  },
  {
    name: 'AuditActor',
    kind: 'interface',
    module: 'audit',
    summary: 'Actor that performed an audited action.',
    details: 'interface AuditActor { id: string; type: AuditActorType; name?: string; email?: string; roles?: string[]; }',
    seeAlso: ['AuditRecordDetails', 'AuditActorType'],
  },
  {
    name: 'AuditResource',
    kind: 'interface',
    module: 'audit',
    summary: 'Resource an audited action applied to.',
    details: 'interface AuditResource { type: string; id: string; name?: string; }',
    seeAlso: ['AuditRecordDetails'],
  },
  {
    name: 'AuditChangeSet',
    kind: 'interface',
    module: 'audit',
    summary: 'Before and after state of a change; only sent for actions with captureChangeSet.',
    details:
      'interface AuditChangeSet { before?: Record<string, unknown> | null; after?: Record<string, unknown> | null; }',
    seeAlso: ['AuditRecordDetails', 'AuditActionDefinition'],
  },
  {
    name: 'AuditEventCriteria',
    kind: 'interface',
    module: 'audit',
    summary: 'Filters for AuditService.query.',
    details:
      'interface AuditEventCriteria {\n' +
      '  actor?: string; resourceType?: string; resourceId?: string; action?: string;\n' +
      '  status?: AuditEventStatus; category?: AuditCategory; scope?: string;\n' +
      '  occurredFrom?: Date | string; occurredTo?: Date | string;\n' +
      '}',
    seeAlso: ['AuditService', 'AuditQueryOptions'],
  },
  {
    name: 'AuditQueryOptions',
    kind: 'interface',
    module: 'audit',
    summary: 'Paging, namespace, tenant and token options for AuditService.query.',
    details:
      'interface AuditQueryOptions {\n' +
      '  top?: number; // page size, service default 10\n' +
      '  after?: string; // cursor from page.next\n' +
      "  namespace?: string; // defaults to serviceId.service\n" +
      '  tenantId?: AdspId; // core callers\n' +
      "  token?: string; // e.g. the user's token; defaults to the service account token\n" +
      '}',
    seeAlso: ['AuditService', 'AuditEventCriteria'],
  },
  {
    name: 'AuditEventRecord',
    kind: 'interface',
    module: 'audit',
    summary: 'Stored audit event returned by AuditService.query.',
    details:
      'interface AuditEventRecord {\n' +
      '  id: string; eventId: string; namespace: string; writtenBy: string;\n' +
      '  occurredAt: string; receivedAt: string; action: string; actionVersion: number;\n' +
      '  category: AuditCategory; status: AuditEventStatus; severity: AuditSeverity;\n' +
      '  actor: AuditActor; resource?: AuditResource; scopeIds: string[];\n' +
      '  correlationId?: string; sessionId?: string; changeSet?: AuditChangeSet;\n' +
      '  metadata: Record<string, unknown>; retentionClass: string; retentionUntil: string;\n' +
      '}',
    seeAlso: ['AuditService', 'Results'],
  },

  // event
  {
    name: 'EventService',
    kind: 'interface',
    module: 'event',
    summary: 'Sends domain events; only events registered via ServiceRegistration.events can be sent.',
    details:
      'interface EventService { send(event: DomainEvent): void; }\n\n' +
      "Sends use the service's name as event namespace, POSTing to event-service v1 /v1/events. Failures are logged, " +
      'not thrown, so a failed send does not interrupt the caller.',
    example:
      "eventService.send({\n  name: 'my-event-started',\n  timestamp: new Date(),\n  payload: {},\n});",
    seeAlso: ['DomainEvent', 'DomainEventDefinition'],
  },
  {
    name: 'DomainEvent',
    kind: 'interface',
    module: 'event',
    summary: 'Shape of an event passed to EventService.send.',
    details:
      'interface DomainEvent {\n' +
      '  name: string; timestamp: Date; correlationId?: string; tenantId?: AdspId;\n' +
      '  context?: Record<string, boolean | number | string>;\n' +
      '  payload: Record<string, unknown>;\n' +
      '}',
    seeAlso: ['EventService'],
  },
  {
    name: 'DomainEventDefinition',
    kind: 'interface',
    module: 'event',
    summary: 'Registration shape for a domain event definition, passed to ServiceRegistration.events.',
    details:
      'interface DomainEventDefinition {\n' +
      '  name: string; description: string; payloadSchema: Record<string, unknown>;\n' +
      '  interval?: IntervalDefinition; log?: EventLogConfiguration;\n' +
      '}',
    seeAlso: ['ServiceRegistration', 'IntervalDefinition', 'EventLogConfiguration'],
  },
  {
    name: 'IntervalDefinition',
    kind: 'interface',
    module: 'event',
    summary: 'Defines the start-event pairing for an interval metric on the event that represents the end of the interval.',
    details:
      'interface IntervalDefinition {\n' +
      '  metric: string | string[]; namespace: string; name: string; context?: string | string[];\n' +
      '}\n\n' +
      'Interval events are matched by correlation ID (and optionally by context values, if the correlation ID is not unique to the interval).',
  },
  {
    name: 'EventLogConfiguration',
    kind: 'interface',
    module: 'event',
    summary: 'Per-event-definition flag to suppress event-log persistence.',
    details: 'interface EventLogConfiguration { skip: boolean; }',
  },

  // file
  {
    name: 'FileType',
    kind: 'interface',
    module: 'file',
    summary: 'File-service file-type registration shape, passed to ServiceRegistration.fileTypes.',
    details:
      'interface FileType {\n' +
      '  id: string; name: string; anonymousRead: boolean;\n' +
      '  readRoles: string[]; updateRoles: string[];\n' +
      '  rules?: FileTypeRules; securityClassification?: string;\n' +
      '}',
    seeAlso: ['FileTypeRules', 'ServiceRegistration'],
  },
  {
    name: 'FileTypeRules',
    kind: 'interface',
    module: 'file',
    summary: 'Rules for a file type, currently just retention.',
    details: 'interface FileTypeRules { retention?: { active: true; deleteInDays: number }; }',
    seeAlso: ['FileType'],
  },

  // common
  {
    name: 'SecurityClassifications',
    kind: 'enum',
    module: 'common',
    summary: 'Security classification levels used across service configuration (e.g. FileType.securityClassification).',
    details: "enum SecurityClassifications { ProtectedA = 'protected a', ProtectedB = 'protected b', ProtectedC = 'protected c', Public = 'public' }",
  },
  {
    name: 'Results',
    kind: 'interface',
    module: 'common',
    summary: 'Paged results envelope returned by platform list APIs, e.g. AuditService.query.',
    details: 'interface Results<T> { results: T[]; page: { after?: string; next?: string; size: number }; }',
    seeAlso: ['AuditService'],
  },

  // push
  {
    name: 'Stream',
    kind: 'interface',
    module: 'push',
    summary: 'Push-service event-stream registration shape, passed to ServiceRegistration.eventStreams.',
    details:
      'interface Stream {\n' +
      '  id: string; name: string; description: string;\n' +
      '  events: StreamEvent[]; subscriberRoles: string[]; publicSubscribe: boolean;\n' +
      '}\n\n' +
      'Streams make sets of events available over push-mode endpoints (socket.io or SSE) in push-service.',
    seeAlso: ['StreamEvent', 'EventCriteria', 'ServiceRegistration'],
  },
  {
    name: 'StreamEvent',
    kind: 'interface',
    module: 'push',
    summary: 'One event mapping within a Stream.',
    details: 'interface StreamEvent { namespace: string; name: string; map?: Record<string, string>; criteria?: EventCriteria; }',
    seeAlso: ['Stream', 'EventCriteria'],
  },
  {
    name: 'EventCriteria',
    kind: 'interface',
    module: 'push',
    summary: 'Correlation ID / context filter for a StreamEvent.',
    details: 'interface EventCriteria { correlationId?: string; context?: Record<string, boolean | number | string>; }',
    seeAlso: ['StreamEvent'],
  },

  // notification
  {
    name: 'Channel',
    kind: 'enum',
    module: 'notification',
    summary: 'Notification delivery channels.',
    details: "enum Channel { email = 'email', mail = 'mail', sms = 'sms', bot = 'bot' }",
  },
  {
    name: 'NotificationType',
    kind: 'interface',
    module: 'notification',
    summary: 'Notification-service notification-type registration shape, passed to ServiceRegistration.notifications.',
    details:
      'interface NotificationType {\n' +
      '  name: string; displayName?: string; description: string;\n' +
      '  publicSubscribe: boolean; manageSubscribe?: boolean; subscriberRoles: string[];\n' +
      '  events: NotificationTypeEvent[]; channels: Channel[];\n' +
      '  addressPath?: string; ccPath?: string; bccPath?: string; attachmentPath?: string;\n' +
      '  subjectPath?: string; titlePath?: string; subTitlePath?: string;\n' +
      '}',
    seeAlso: ['NotificationTypeEvent', 'Template', 'Channel', 'ServiceRegistration'],
  },
  {
    name: 'NotificationTypeEvent',
    kind: 'interface',
    module: 'notification',
    summary: 'Maps a domain event to per-channel notification templates within a NotificationType.',
    details:
      'interface NotificationTypeEvent {\n' +
      '  namespace: string; name: string;\n' +
      '  templates: Partial<Record<Channel, Template>>; attachments?: string | string[];\n' +
      '}',
    seeAlso: ['NotificationType', 'Template'],
  },
  {
    name: 'Template',
    kind: 'interface',
    module: 'notification',
    summary: 'A notification template body/subject (Handlebars-templated), for a given channel.',
    details: 'interface Template { subject: unknown; body: unknown; title?: string; subtitle?: string; }',
    seeAlso: ['NotificationTypeEvent'],
  },

  // value
  {
    name: 'ValueDefinition',
    kind: 'interface',
    module: 'value',
    summary: 'Value-service time-series definition shape, passed to ServiceRegistration.values.',
    details: 'interface ValueDefinition { id: string; name: string; description: string; jsonSchema: Record<string, unknown>; }',
    seeAlso: ['ServiceRegistration'],
  },

  // registration
  {
    name: 'ServiceRegistration',
    kind: 'interface',
    module: 'registration',
    summary: 'Options passed to initializePlatform/initializeService describing everything the service registers with the platform.',
    details:
      'interface ServiceRegistration {\n' +
      '  serviceId: AdspId; // also used as the client ID\n' +
      '  displayName: string; description: string;\n' +
      '  roles?: (string | ServiceRole)[];\n' +
      '  configurationSchema?: Record<string, unknown>; // deprecated, use `configuration`\n' +
      '  configuration?: { schema: Record<string, unknown>; description: string; useNamespace?: boolean };\n' +
      '  events?: DomainEventDefinition[];\n' +
      '  eventStreams?: Stream[];\n' +
      '  fileTypes?: FileType[];\n' +
      '  notifications?: NotificationType[];\n' +
      '  values?: ValueDefinition[];\n' +
      '  auditActions?: Record<string, AuditAction> | AuditAction[];\n' +
      '  serviceConfigurations?: { serviceId: AdspId; configuration: Record<string, unknown> | { name: string; configuration: unknown }[] }[];\n' +
      '}\n\n' +
      'On initialization these are patched (fire-and-forget) into configuration-service (roles/config/events/etc as ' +
      'namespaced documents), tenant-service (roles), event-service (event definitions), push-service (event streams), ' +
      'file-service (file types), notification-service (notification types), value-service (value definitions), and ' +
      'audit-service (auditActions replace the actions-<serviceId.service> catalog; duplicate names fail initialization).',
    seeAlso: ['ServiceRole', 'initializePlatform', 'AuditAction'],
  },
  {
    name: 'ServiceRole',
    kind: 'interface',
    module: 'registration',
    summary: 'A service role registered via ServiceRegistration.roles.',
    details:
      'interface ServiceRole {\n' +
      '  role: string; description: string;\n' +
      '  inTenantAdmin?: boolean; // if true, included in the tenant admin composite role\n' +
      '}',
    seeAlso: ['ServiceRegistration'],
  },

  // metrics
  {
    name: 'benchmark',
    kind: 'function',
    module: 'metrics',
    summary: 'Manually starts/stops a named timing on the request, recording it as a value-service metric.',
    details: 'benchmark(req: Request, metric: string, value?: number): void',
    deprecated: true,
    seeAlso: ['startBenchmark'],
  },
  {
    name: 'startBenchmark',
    kind: 'function',
    module: 'metrics',
    summary: 'Returns a closure that stops a named timing started on the request.',
    details: 'startBenchmark(req: Request, metric: string): () => void',
    deprecated: true,
    seeAlso: ['benchmark'],
  },
  {
    name: 'ServiceMetricsValueDefinition',
    kind: 'const',
    module: 'metrics',
    summary: 'Legacy value-service definition for the "service-metrics" value stream (response times).',
    deprecated: true,
    seeAlso: ['ValueDefinition'],
  },
  {
    name: 'CacheName',
    kind: 'const',
    module: 'metrics',
    summary: 'Names of the caches the SDK instruments, used as the adsp.cache.name label on adsp.cache.lookups.',
    details:
      "CacheName: { Configuration: 'configuration'; Directory: 'directory'; Tenant: 'tenant'; Issuer: 'issuer'; " +
      "JwksClient: 'jwks-client' }\n\n" +
      'A fixed set on purpose: cache name x result is the whole cardinality of the lookup counter. Pass one of ' +
      'these for an SDK cache; a service instrumenting its own cache should use its own short, constant name.',
    seeAlso: ['recordCacheResult'],
  },
  {
    name: 'recordCacheResult',
    kind: 'function',
    module: 'metrics',
    summary: 'Records a cache lookup outcome on the adsp.cache.lookups counter.',
    details:
      'recordCacheResult(cache: string, hit: boolean): void\n\n' +
      'Call once per *logical* lookup, where the cache is first consulted. Read-through caches -- get, and on a ' +
      'miss refresh and get again -- would otherwise score one lookup as both a miss and a hit and make the hit ' +
      'ratio meaningless. Labels are adsp.cache.name and adsp.cache.result (hit/miss) only; nothing per-key or ' +
      'per-tenant should reach them.',
    example:
      "import { CacheName, recordCacheResult } from '@abgov/adsp-service-sdk';\n\n" +
      'const cached = cache.get<Thing>(key);\n' +
      'recordCacheResult(CacheName.Configuration, !!cached);\n' +
      'const thing = cached ?? (await retrieve(key));',
    seeAlso: ['CacheName'],
  },

  // jobs
  {
    name: 'instrumentJob',
    kind: 'function',
    module: 'jobs',
    summary: 'Wraps a scheduled job so each run produces a span and an adsp.job.duration measurement.',
    details:
      'instrumentJob(name: string, work: (span: Span) => void | Promise<void>, options?: InstrumentJobOptions): ' +
      '() => Promise<void>\n\n' +
      'Wraps rather than schedules: the SDK takes no scheduler dependency, so the cron expression stays with the ' +
      'caller. Each run starts from ROOT_CONTEXT so a job is its own trace instead of being grafted onto whatever ' +
      'context was active when the timer fired. A thrown job is recorded on the span, counted under ' +
      'adsp.job.result="error", and swallowed -- schedulers do not handle a rejected job, so the unhandled ' +
      'rejection would restart the process over one bad run. Keep name a constant: it is a metric label.',
    example:
      "import { instrumentJob } from '@abgov/adsp-service-sdk';\n" +
      "import * as schedule from 'node-schedule';\n\n" +
      "schedule.scheduleJob('0 1 * * *', instrumentJob('form-lock', lockJob, { logger }));",
    seeAlso: ['InstrumentJobOptions'],
  },
  {
    name: 'InstrumentJobOptions',
    kind: 'interface',
    module: 'jobs',
    summary: 'Options for instrumentJob: a logger for failures, and extra span attributes.',
    details:
      'InstrumentJobOptions { logger?: Logger; attributes?: Attributes }\n\n' +
      'attributes go on the job span only and are deliberately not copied onto the duration metric -- a span ' +
      'attribute is free, while a metric label multiplies the series. Per-tenant or per-run detail belongs here.',
    seeAlso: ['instrumentJob'],
  },

  // trace
  {
    name: 'getContextTrace',
    kind: 'function',
    module: 'trace',
    summary: "Returns the current OpenTelemetry span's W3C traceparent string, or null if there is no active span.",
    details: 'getContextTrace(): { toString(): string } | null',
  },
  {
    name: 'instrumentAxios',
    kind: 'function',
    module: 'trace',
    summary: 'Attaches axios request/response interceptors that log per-request timing.',
    details: 'instrumentAxios(logger: Logger): void\n\nLightweight, non-OpenTelemetry timing log; typically called once near app startup.',
    example: "instrumentAxios(logger);",
  },
];
