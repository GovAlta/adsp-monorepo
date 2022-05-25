export const ServiceMetricsValueDefinition = {
  id: 'service-metrics',
  name: 'Service metrics',
  description: 'Low level metrics of the service.',
  jsonSchema: {
    type: 'object',
    properties: {
      responseTime: { type: 'number' },
    },
  },
};
