import { AdspId, AssertRole, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { New, Results } from '@core-services/core-common';
import { TopicRepository } from '../repository';
import { Comment, CommentCriteria, Topic } from '../types';
import { TopicTypeEntity } from './type';
import { ServiceRoles } from '../roles';

export class TopicEntity implements Topic {
  tenantId: AdspId;
  id: number;
  type?: TopicTypeEntity;
  name: string;
  description: string;
  resourceId?: AdspId | string;
  commenters?: string[] = [];

  @AssertRole('create topic', [ServiceRoles.Admin, ServiceRoles.TopicSetter])
  public static async create(
    _user: User,
    repository: TopicRepository,
    type: TopicTypeEntity,
    topic: New<Topic>
  ): Promise<TopicEntity> {
    const entity = new TopicEntity(repository, type, { ...topic, tenantId: type.tenantId });
    return await repository.save(entity);
  }

  public constructor(private repository: TopicRepository, type: TopicTypeEntity, topic: Topic | New<Topic>) {
    this.tenantId = topic.tenantId;
    this.type = type;
    this.resourceId = topic.resourceId;
    this.name = topic.name;
    this.description = topic.description;
    this.commenters = topic.commenters || [];

    const record = topic as Topic;
    if (record.id) {
      this.id = record.id;
    }
  }

  @AssertRole('update topic', [ServiceRoles.Admin, ServiceRoles.TopicSetter])
  public async update(
    _user: User,
    { name, description, commenters }: Pick<Topic, 'name' | 'description' | 'commenters'>
  ): Promise<TopicEntity> {
    if (name) {
      this.name = name;
    }

    if (description !== undefined) {
      this.description = description;
    }

    if (commenters) {
      this.commenters = commenters;
    }

    return await this.repository.save(this);
  }

  @AssertRole('delete topic', [ServiceRoles.Admin, ServiceRoles.TopicSetter])
  public async delete(_user: User): Promise<boolean> {
    return await this.repository.delete(this);
  }

  public canRead(user: User): boolean {
    return this.type?.canRead(user);
  }

  public canComment(user: User): boolean {
    return this.type?.canComment(user) || (user && this.commenters.includes(user.id));
  }

  public canModifyComment(user: User, { createdBy }: Comment): boolean {
    return this.type?.canAdmin(user) || (this.canComment(user) && createdBy.id === user.id);
  }

  public async getComments(
    user: User,
    top: number,
    after?: string,
    criteria?: CommentCriteria
  ): Promise<Results<Comment>> {
    if (!this.canRead(user)) {
      throw new UnauthorizedUserError('read comments', user);
    }

    return await this.repository.getComments(top, after, {
      ...criteria,
      tenantIdEquals: this.tenantId,
      topicIdEquals: this.id,
    });
  }

  public async getComment(user: User, commentId: number): Promise<Comment> {
    if (!this.canRead(user)) {
      throw new UnauthorizedUserError('read comment', user);
    }

    return this.repository.getComment(this, commentId);
  }

  public async postComment(user: User, comment: Pick<Comment, 'title' | 'content' | 'id'>): Promise<Comment> {
    if (!this.canComment(user)) {
      throw new UnauthorizedUserError('post comment', user);
    }

    const createdOn = new Date();
    return await this.repository.saveComment(this, {
      ...comment,
      topicId: this.id,
      id: undefined,
      createdBy: user,
      createdOn,
      lastUpdatedBy: user,
      lastUpdatedOn: createdOn,
    });
  }

  public async updateComment(
    user: User,
    comment: Comment,
    update: Partial<Pick<Comment, 'title' | 'content'>>
  ): Promise<Comment> {
    if (!this.canModifyComment(user, comment)) {
      throw new UnauthorizedUserError('update comment', user);
    }

    if (update.title) {
      comment.title = update.title;
    }

    if (update.content !== undefined) {
      comment.content = update.content;
    }

    comment.lastUpdatedBy = user;
    comment.lastUpdatedOn = new Date();

    return this.repository.saveComment(this, comment);
  }

  public async deleteComment(user: User, comment: Comment): Promise<boolean> {
    if (!this.canModifyComment(user, comment)) {
      throw new UnauthorizedUserError('delete comment', user);
    }
    return this.repository.deleteComment(this, comment.id);
  }
}
