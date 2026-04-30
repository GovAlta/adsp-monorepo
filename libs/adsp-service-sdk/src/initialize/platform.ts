import type { Logger } from 'winston';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import { createRealmStrategy, createTenantStrategy, createTokenProvider } from '../access';
import { createConfigurationHandler, createConfigurationService } from '../configuration';
import { createDirectory } from '../directory';
import { createEventService } from '../event';
import { createHealthCheck } from '../healthCheck';
import { createMetricsHandler } from '../metrics';
import { createServiceRegistrar } from '../registration';
import { createTenantHandler, createTenantService } from '../tenant';
import { createTraceHandler } from '../trace';
import { LogOptions, PlatformCapabilities, PlatformOptions, PlatformServices } from './types';
import { AdspId, assertAdspId, createLogger } from '../utils';

export async function initializePlatform(
  {
    realm,
    serviceId,
    clientSecret,
    directoryUrl,
    accessServiceUrl,
    ignoreServiceAud,
    configurationConverter,
    combineConfiguration,
    enableConfigurationInvalidation,
    useLongConfigurationCacheTTL,
    additionalExtractors,
    tracing,
    metrics,
    ...registration
  }: PlatformOptions,
  logOptions: Logger | LogOptions,
  service?: Partial<PlatformServices>,
): Promise<PlatformCapabilities> {
  assertAdspId(serviceId, null, 'service');

  const logger =
    ('debug' in logOptions ? logOptions : logOptions?.logger) ||
    createLogger(serviceId.toString(), (logOptions as LogOptions)?.logLevel);

  const tokenProvider = createTokenProvider({ logger, serviceId, clientSecret, accessServiceUrl, realm });
  const directory = service?.directory || createDirectory({ logger, directoryUrl });

  // Initialization is not dependent on registration, so registration completes asynchronously.
  const registrar = createServiceRegistrar({ logger, directory, tokenProvider });
  registrar
    .register({ ...registration, serviceId })
    .catch((err) => logger.warn(`Error encountered during service registration. ${err}`));

  const tenantService = service?.tenantService || createTenantService({ logger, directory, tokenProvider });
  const tenantHandler = createTenantHandler(tenantService);

  const coreStrategy = await createRealmStrategy({
    realm: 'core',
    logger,
    serviceId,
    accessServiceUrl,
    tenantService,
    ignoreServiceAud,
    additionalExtractors,
  });

  const tenantStrategy =
    realm === 'core'
      ? createTenantStrategy({
          logger,
          serviceId,
          accessServiceUrl,
          tenantService,
          ignoreServiceAud,
          additionalExtractors,
        })
      : await createRealmStrategy({
          realm,
          logger,
          serviceId,
          accessServiceUrl,
          tenantService,
          ignoreServiceAud,
          additionalExtractors,
        });

  let configurationService = service?.configurationService;
  let clearCached = function (_tenantId: AdspId, _serviceId: AdspId) {
    // no-op implementation for when configuration is externally provided.
  };
  if (!configurationService) {
    const configServiceImpl = createConfigurationService({
      serviceId,
      logger,
      directory,
      tokenProvider,
      useNamespace: registration.configuration?.useNamespace || false,
      converter: configurationConverter,
      combine: combineConfiguration,
      enableConfigurationInvalidation,
      useLongConfigurationCacheTTL,
    });
    configurationService = configServiceImpl;

    clearCached = function (tenantId: AdspId, serviceId: AdspId) {
      configServiceImpl.clearCached(tenantId, serviceId.namespace, serviceId.service);
    };
  }

  const configurationHandler = createConfigurationHandler(tokenProvider, configurationService, serviceId);

  const eventService =
    service?.eventService ||
    createEventService({
      isCore: realm === 'core',
      logger,
      serviceId,
      directory,
      tokenProvider,
      events: registration.events,
    });

  // Skip health checks on anything that's injected or anything not configured (assumed not used).
  const excludedHealthChecks = {
    directory: !!service?.directory,
    tenant: !!service?.tenantService,
    configuration: !!service?.configurationService || !registration.configurationSchema,
    event: !!service?.eventService || !registration.events || !registration.events.length,
  };

  const serviceName = serviceId.service;
  const serviceVersion = '1.0.0';
  const resource = new Resource({
    'service.name': serviceName,
    'service.version': serviceVersion,
  });

  let meterProvider: MeterProvider | undefined;
  if (metrics) {
    try {
      const metricReader = new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: `${metrics.endpoint}/v1/metrics`,
          headers: metrics.headers,
        }),
        exportIntervalMillis: metrics.exportIntervalMillis ?? 60000,
        exportTimeoutMillis: metrics.exportTimeoutMillis ?? 30000,
      });

      meterProvider = new MeterProvider({
        resource,
        readers: [metricReader],
      } as unknown as never);

      logger.info(`OpenTelemetry metrics initialized: ${serviceName} -> ${metrics.endpoint}`);
    } catch (err) {
      logger.warn(
        `Failed to initialize OpenTelemetry metrics: ${err instanceof Error ? err.message : String(err)}. Metrics disabled.`,
      );
      meterProvider = undefined;
    }
  }

  const metricsHandler = await createMetricsHandler(
    serviceId,
    logger,
    tokenProvider,
    directory,
    undefined,
    meterProvider,
  );
  const healthCheck = createHealthCheck(
    logger,
    accessServiceUrl,
    directoryUrl,
    directory,
    excludedHealthChecks,
    meterProvider,
  );

  // Initialize tracer provider if tracing config is provided
  let tracerProvider: NodeTracerProvider | undefined;
  if (tracing) {
    try {
      const endpoint = tracing.endpoint;
      const sampleRate = tracing.sampleRate ?? 1.0;

      // Create tracer provider with semantic attributes
      tracerProvider = new NodeTracerProvider({
        sampler: new TraceIdRatioBasedSampler(sampleRate),
        resource,
      });

      const exporter = new OTLPTraceExporter({
        url: `${endpoint}/v1/traces`,
        headers: tracing.headers,
      });

      // Add span processor
      tracerProvider.addSpanProcessor(
        new BatchSpanProcessor(exporter, {
          maxQueueSize: 2048,
          maxExportBatchSize: 512,
          scheduledDelayMillis: 5000,
          exportTimeoutMillis: 30000,
        }),
      );

      tracerProvider.register();

      logger.info(`OpenTelemetry tracing initialized: ${serviceName} → ${endpoint}`);
    } catch (err) {
      logger.warn(
        `Failed to initialize OpenTelemetry tracing: ${err instanceof Error ? err.message : String(err)}. Tracing disabled.`,
      );
      tracerProvider = undefined;
    }
  }

  // Note: Sample rate is not currently used in the SDK.
  const traceHandler = createTraceHandler({ logger, sampleRate: 0, tracerProvider });

  return {
    tokenProvider,
    coreStrategy,
    tenantService,
    tenantStrategy,
    tenantHandler,
    configurationService,
    configurationHandler,
    eventService,
    directory,
    healthCheck,
    clearCached,
    metricsHandler,
    traceHandler,
    tracerProvider,
    meterProvider,
    logger,
  };
}
