import axios from 'axios';
import { Resource, ResourceTagResult, Tag, TagResourceRequest, ResourceType } from './models';

export const tagResourceApi = async (
  token: string,
  serviceUrl: string,
  tagResourceRequest: TagResourceRequest
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
  const { data } = await axios.get(new URL('/resource/v1/tags?top=50', serviceUrl).href, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
};

export const getResourcesByTag = async (
  token: string,
  serviceUrl: string,
  tag: string,
  next?: string
): Promise<Resource[]> => {
  const tagNext = next ?? '';

  const url = new URL(`/resource/v1/tags/${encodeURIComponent(tag)}/resources?top=50&after=${tagNext}`, serviceUrl);

  url.searchParams.append('includeRepresents', 'true');
  const { data } = await axios.get(url.href, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
};
export const fetchResourceTypeApi = async (token: string, url: string): Promise<Record<string, ResourceType>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
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
