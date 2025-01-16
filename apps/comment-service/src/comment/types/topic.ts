import { AdspId } from '@abgov/adsp-service-sdk';

export interface TopicType {
  tenantId: AdspId;
  id: string;
  name: string;
  adminRoles: string[];
  readerRoles: string[];
  commenterRoles: string[];
  securityClassification?: string;
}

export interface Topic {
  type?: TopicType;
  tenantId: AdspId;
  id: number;
  resourceId?: AdspId | string;
  name: string;
  securityClassification?: string;
  description: string;
  commenters?: string[];
  requiresAttention: boolean;
}

export interface TopicCriteria {
  tenantIdEquals?: AdspId;
  typeIdEquals?: string;
  resourceIdEquals?: AdspId | string;
  requiresAttention?: boolean;
  // nameLike?: string;
  // descriptionLike?: string;
}
