import { Resource, Tag } from '../types';

type RequestResource = Omit<Resource, 'tenantId' | 'urn'> & { urn: string };
type RequestTag = Partial<Omit<Tag, 'tenantId'>>;

export const TAG_OPERATION_TAG = 'tag-resource';
export interface TagRequest {
  operation: typeof TAG_OPERATION_TAG;
  tag: RequestTag;
  resource: RequestResource;
}

export const TAG_OPERATION_UNTAG = 'untag-resource';
export interface UntagRequest {
  operation: typeof TAG_OPERATION_UNTAG;
  tag: RequestTag;
  resource: RequestResource;
}

export type TagOperationRequests = TagRequest | UntagRequest;
