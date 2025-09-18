import { ActionState } from '@store/session/models';
export interface CommentTopicTypes {
  id: string;
  name: string;
  adminRoles: string[];
  commenterRoles: string[];
  readerRoles: string[];
  securityClassification: SecurityClassification;
}

export interface TopicItem {
  id: string;
  name: string;
  typeId: string;
  description: string;
  resourceId: string;
}
export interface Topic {
  results: TopicItem[];
  page: null;
}

export interface Comment {
  topicId: number;
  id: number;
  title: string;
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

export enum SecurityClassification {
  protectedA = 'protected a',
  protectedB = 'protected b',
  protectedC = 'protected c',
  public = 'public',
}
export interface Indicator {
  details?: Record<string, ActionState>;
}

export const defaultEditCommentTopicType: CommentTopicTypes = {
  id: '',
  name: '',
  adminRoles: [],
  commenterRoles: [],
  readerRoles: [],
  securityClassification: undefined,
};

export const defaultCommentTopicType: CommentTopicTypes = {
  id: '',
  name: '',
  adminRoles: [],
  commenterRoles: [],
  readerRoles: [],
  securityClassification: SecurityClassification.protectedA,
};

export const defaultTopic: TopicItem = {
  id: '',
  name: '',
  typeId: '',
  description: '',
  resourceId: '',
};
export const defaultComment: Comment = {
  topicId: null,
  id: null,
  title: '',
  content: '',
  createdBy: {
    id: '',
    name: '',
  },
  createdOn: null,
  lastUpdatedBy: {
    id: '',
    name: '',
  },
  lastUpdatedOn: null,
};

export interface CommentState {
  topicTypes: CommentTopicTypes[];
  core: CommentTopicTypes[];
  topics: TopicItem[];
  comments: Comment[];
  nextEntries: string;
  nextCommentEntries: string;
  metrics: CommentMetrics;
}

export interface UpdateCommentConfig {
  operation: string;
  update: Record<string, CommentTopicTypes>;
}

export interface DeleteCommentConfig {
  operation: string;
  property: string;
}

export interface CommentMetrics {
  topicsCreated?: number;
  commentsCreated?: number;
}
