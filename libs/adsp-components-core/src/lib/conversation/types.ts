export interface CommentTopic {
  id: number;
  resourceId: string;
  typeId?: string;
}

export interface CommentItem {
  id: number | string;
  createdOn: string;
  createdBy?: {
    id?: string;
    name?: string;
  };
  content: string;
}

export interface CommentListResponse {
  results?: CommentItem[];
  page?: {
    after?: string;
    next?: string;
  };
}

export interface FindTopicCriteria {
  resourceIdEquals: string;
  typeIdEquals?: string;
}

export interface GetCommentsOptions {
  top?: number;
  after?: string;
}

export interface ConversationMessage {
  id: string | number;
  direction: 'sent' | 'received';
  sender: string;
  timestamp: Date | string;
  content: string;
  canDelete?: boolean;
}

export interface IConversationClient {
  findTopic(criteria: FindTopicCriteria): Promise<CommentTopic | null>;
  getComments(topicId: number | string, options?: GetCommentsOptions): Promise<CommentListResponse>;
  addComment(topicId: number | string, content: string): Promise<void>;
  deleteComment(topicId: number | string, commentId: number | string): Promise<void>;
}
