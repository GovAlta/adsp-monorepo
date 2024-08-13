import { ResourceType } from './model';
import { ResourceTypeConfiguration } from './types';

export const configurationSchema = {
  type: 'object',
  patternProperties: {
    '^urn:ads:[a-zA-Z0-9-]{1,50}:[a-zA-Z0-9-]{1,50}:[a-zA-Z0-9-]{1,50}$': {
      type: 'object',
      properties: {
        resourceTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              matcher: { type: 'string' },
              type: { type: 'string' },
              namePath: { type: 'string' },
              descriptionPath: { type: ['string', 'null'] },
            },
            required: ['matcher', 'type', 'namePath'],
          },
        },
      },
      required: ['resourceTypes'],
    },
  },
};

export type DirectoryConfiguration = Record<string, ResourceType[]>;

export type DirectoryConfigurationValue = Record<string, { resourceTypes: ResourceTypeConfiguration[] }>;
