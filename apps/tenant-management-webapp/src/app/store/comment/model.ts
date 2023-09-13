export interface CommentTopicTypes {
  id: string;
  name: string;
  adminRoles: string[];
  commenterRoles: string[];
  readerRoles: string[];
}

export const defaultCommentTopicType: CommentTopicTypes = {
  id: '',
  name: '',
  adminRoles: [],
  commenterRoles: [],
  readerRoles: [],
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
