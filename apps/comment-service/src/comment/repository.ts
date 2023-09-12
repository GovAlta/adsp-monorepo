import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { TopicEntity, TopicTypeEntity } from './model';
import { Comment, CommentCriteria, TopicCriteria } from './types';

export interface TopicRepository {
  getTopic(types: Record<string, TopicTypeEntity>, id: number, tenantId: AdspId): Promise<TopicEntity>;
  getTopics(
    types: Record<string, TopicTypeEntity>,
    top: number,
    after?: string,
    criteria?: TopicCriteria
  ): Promise<Results<TopicEntity>>;
  getComment(entity: TopicEntity, commentId: number): Promise<Comment>;
  getComments(top: number, after?: string, criteria?: CommentCriteria): Promise<Results<Comment>>;

  save(entity: TopicEntity): Promise<TopicEntity>;
  delete(entity: TopicEntity): Promise<boolean>;

  saveComment(entity: TopicEntity, comment: Comment): Promise<Comment>;
  deleteComment(entity: TopicEntity, commentId: number): Promise<boolean>;
}
