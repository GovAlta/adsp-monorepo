import { AdspId } from '@abgov/adsp-service-sdk';
import { Tag, Resource } from './types';

export function mapTag(apiId: AdspId, tag: Tag) {
  return tag
    ? {
        urn: `${apiId}:/tags/${tag.value}`,
        label: tag.label,
        value: tag.value,
        _links: {
          self: {
            href: `${apiId}:/tags/${tag.value}`,
          },
          resources: {
            href: `${apiId}:/tags/${tag.value}/resources`,
          },
        },
      }
    : null;
}

export function mapResource(apiId: AdspId, resource: Resource) {
  return resource
    ? {
        urn: resource.urn.toString(),
        name: resource.name,
        description: resource.description,
        type: resource.type,
        _links: {
          self: {
            href: `${apiId}:/resources/${encodeURIComponent(resource.urn.toString())}`,
          },
          represents: {
            href: resource.urn.toString(),
          },
          tags: {
            href: `${apiId}:/resources/${resource.urn}/tags`,
          },
        },
        _embedded: resource.data && {
          represents: resource.data,
        },
      }
    : null;
}
