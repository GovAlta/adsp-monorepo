import { CronJob } from './types';

export const configurationSchema = {
  type: 'object',
  properties: {
    jobs: {
      type: ['object', 'null'],
      patternProperties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: ['string', 'null'] },
        webhook: { type: 'string' },
        schedule: { type: 'string' },
        payload: { type: 'object' },
        metadata: { type: 'object' },
        triggerEvents: {
          type: ['array', 'null'],
          items: {
            type: 'object',
            properties: {
              namespace: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

export type CronJobServiceConfiguration = Record<string, CronJob>;
