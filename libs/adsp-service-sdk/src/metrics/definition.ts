/**
 * @deprecated Value service metrics recording is deprecated. Use OpenTelemetry instrumentation via the
 * `meterProvider` option of `createMetricsHandler` instead.
 */
export const ServiceMetricsValueDefinition = {
  id: 'service-metrics',
  name: 'Service metrics',
  description: 'Low level metrics of the service.',
  jsonSchema: {
    type: 'object',
    properties: {
      responseTime: { type: 'number' },
    },
    additionalProperties: { type: 'number' },
  },
};
