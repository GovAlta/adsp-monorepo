export interface CommentTopicTypes {
  id: string;
  name: string;
  adminRoles: string[];
  commenterRoles: string[];
  readerRoles: string[];
  securityClassification: SecurityClassification;
}

export enum SecurityClassification {
  protectedA = 'protected a',
  protectedB = 'protected b',
  protectedC = 'protected c',
  public = 'public',
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

export interface CommentState {
  topicTypes: Record<string, CommentTopicTypes>;
}

export interface UpdateCommentConfig {
  operation: string;
  update: Record<string, CommentTopicTypes>;
}

export interface DeleteCommentConfig {
  operation: string;
  property: string;
}
