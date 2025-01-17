import { AdspId } from '@abgov/adsp-service-sdk';

export interface Comment {
  topicId: number;
  id: number;
  title?: string;
  content: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdOn: Date;
  lastUpdatedBy: {
    id: string;
    name: string;
  };
  lastUpdatedOn: Date;
}

export interface CommentCriteria {
  tenantIdEquals?: AdspId;
  typeIdEquals?: string;
  topicIdEquals?: number;
  titleLike?: string;
  contentLike?: string;
  titleOrContentLike?: string;
  idGreaterThan?: number;
}
