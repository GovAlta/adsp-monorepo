export const configurationSchema = {
  type: 'object',
  properties: {
    sites: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string', pattern: '^https?:\\/\\/[a-zA-Z0-9.:_-]{5,150}$' },
          views: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string' },
              },
              required: ['path'],
            },
          },
          allowAnonymous: { type: 'boolean' },
        },
        required: ['url'],
      },
    },
  },
  required: ['sites'],
};

export interface SiteConfiguration {
  url: URL;
  allowAnonymous: boolean;
  views?: {
    path: string;
  }[];
}

export interface FeedbackConfiguration {
  sites: Record<string, SiteConfiguration>;
}

interface FeedbackConfigurationObject {
  sites?: { url: string; allowAnonymous?: boolean; views?: { path: string }[] }[];
}

export function combineConfiguration(tenant: FeedbackConfigurationObject) {
  return {
    sites:
      tenant?.sites?.reduce(
        (sites, site) => ({
          ...sites,
          [site.url]: { url: new URL(site.url), views: site.views, allowAnonymous: !!site.allowAnonymous },
        }),
        {} as Record<string, SiteConfiguration>
      ) || {},
  };
}
