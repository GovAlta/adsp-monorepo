import { AdspId } from '@abgov/adsp-service-sdk';

export interface TopicType {
  tenantId: AdspId;
  id: string;
  name: string;
  adminRoles: string[];
  readerRoles: string[];
  commenterRoles: string[];
}

export interface Topic {
  type?: TopicType;
  tenantId: AdspId;
  id: number;
  resourceId?: AdspId | string;
  name: string;
  description: string;
  commenters?: string[];
}

export interface TopicCriteria {
  tenantIdEquals?: AdspId;
  typeIdEquals?: string;
  resourceIdEquals?: AdspId;
  // nameLike?: string;
  // descriptionLike?: string;
}
