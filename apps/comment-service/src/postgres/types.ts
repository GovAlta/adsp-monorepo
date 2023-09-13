import { Comment, Topic } from '../comment';

export interface TopicRecord extends Omit<Topic, 'tenantId' | 'type' | 'resourceId'> {
  tenant: string;
  type: string;
  resource: string;
}

export interface CommentRecord extends Omit<Comment, 'topicId' | 'createdBy' | 'lastUpdatedBy'> {
  tenant: string;
  topic_id: number;
  createdById: string;
  createdByName: string;
  lastUpdatedById: string;
  lastUpdatedByName: string;
}
