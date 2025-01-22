import { AdspId } from '@abgov/adsp-service-sdk';
import { Tag, Resource } from './types';

export function mapTag(apiId: AdspId, tag: Tag) {
  return tag
    ? {
        urn: `${apiId}:/tags/${tag.value}`,
        label: tag.label,
        value: tag.value,
        _links: {
          resources: {
            href: `${apiId}:/tags/${tag.value}/resources`,
          },
        },
      }
    : null;
}

export function mapResource(resource: Resource) {
  return resource
    ? {
        urn: resource.urn.toString(),
        name: resource.name,
        description: resource.description,
        type: resource.type,
        _links: {
          represents: { href: resource.urn.toString() },
        },
        _embedded: resource.data && {
          represents: resource.data,
        },
      }
    : null;
}
