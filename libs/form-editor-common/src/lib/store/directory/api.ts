import axios from 'axios';
import {
  Resource,
  ResourceTagResult,
  Tag,
  ResourceTagRequest,
  ResourceType,
  ResourceTagFilterCriteria,
} from './models';

export const tagResourceApi = async (
  token: string,
  serviceUrl: string,
  tagResourceRequest: ResourceTagRequest
): Promise<{ tagged: boolean; tag: Tag; resource: Resource }> => {
  const { tag, resource } = tagResourceRequest;
  const { data } = await axios.post<{ tagged: boolean; tag: Tag; resource: Resource }>(
    new URL('/resource/v1/tags', serviceUrl).href,
    { operation: 'tag-resource', tag: { label: tag.label }, resource: { urn: resource.urn } },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return data;
};

export const unTagResourceApi = async (
  token: string,
  serviceUrl: string,
  resourceTag: ResourceTagResult
): Promise<{ tagged: boolean; tag: Tag; resource: Resource }> => {
  const { urn, label, value } = resourceTag;
  const { data } = await axios.post<{ tagged: boolean; tag: Tag; resource: Resource }>(
    new URL('/resource/v1/tags', serviceUrl).href,
    { operation: 'untag-resource', resource: { urn }, tag: { label, value } },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return data;
};

export const deleteResourceTagsApi = async (token: string, serviceUrl: string, urn: string): Promise<boolean> => {
  const { data } = await axios.delete<{ deleted: boolean }>(
    new URL(`/resource/v1/resources/${encodeURIComponent(urn)}`, serviceUrl).href,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return data.deleted;
};

export const getResourceTagsApi = async (
  token: string,
  serviceUrl: string,
  resource: string
): Promise<ResourceTagResult> => {
  const { data } = await axios.get(
    new URL(`/resource/v1/resources/${encodeURIComponent(resource)}/tags?top=50}`, serviceUrl).href,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return data;
};

export const getTagByNameApi = async (
  token: string,
  serviceUrl: string,
  tagName: string
): Promise<ResourceTagResult> => {
  const { data } = await axios.get(new URL(`/resource/v1/tags/${encodeURIComponent(tagName)}`, serviceUrl).href, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
};

export const getAllTagsApi = async (token: string, serviceUrl: string): Promise<{ results: Tag[] }> => {
  const { data } = await axios.get(new URL('/resource/v1/tags?top=200', serviceUrl).href, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
};

export const getResourcesByTag = async (
  token: string,
  serviceUrl: string,
  tag: string,
  criteria: ResourceTagFilterCriteria,
  next?: string
): Promise<Resource[]> => {
  const tagNext = next ?? '';

  const newCriteria = JSON.stringify({
    typeIdEquals: criteria.typeEquals,
  });

  const url = new URL(
    `/resource/v1/tags/${encodeURIComponent(tag)}/resources?${next ? `&after=${tagNext}` : ''}`,
    serviceUrl
  );

  const { data } = await axios.get(url.href, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      includeRepresents: true,
      top: criteria.top,
      criteria: newCriteria,
    },
  });

  return data;
};
export const fetchResourceTypeApi = async (token: string, url: string): Promise<Record<string, ResourceType>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (url.endsWith('?core')) {
    return Object.entries(res.data).reduce((acc, [resourceName, types]) => {
      acc[resourceName] = (types as unknown as Record<'resourceTypes', Array<ResourceType>>).resourceTypes ?? [];
      return acc;
    }, {});
  }
  return res.data;
};

export const updateResourceTypeApi = async (
  token: string,
  serviceUrl: string,
  resourceType: ResourceType,
  urn: string
) => {
  const { data } = await axios.patch<{ latest: { configuration: Record<string, ResourceType> } }>(
    new URL(`configuration/v2/configuration/platform/directory-service/`, serviceUrl).href,
    { operation: 'UPDATE', update: { [urn]: resourceType } },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data;
};
