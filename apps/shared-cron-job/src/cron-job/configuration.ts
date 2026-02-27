import { CronJobConfig } from './types';

export const configurationSchema = {
  type: 'object',
  properties: {
    jobs: {
      type: ['object', 'null'],
      patternProperties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: ['string', 'null'] },
        schedule: { type: 'string' },
        triggerEvents: {
          type: ['array', 'null'],
          items: {
            type: 'object',
            properties: {
              namespace: { type: 'string' },
              name: { type: 'string' },
              payload: { type: ['object', 'null'] },
            },
          },
        },
      },
    },
  },
};

export type CronJobServiceConfiguration = Record<string, CronJobConfig>;
