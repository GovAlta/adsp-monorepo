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
  securityClassification?: string;
  resourceId?: AdspId | string;
  commenters?: string[] = [];
  requiresAttention: boolean;

  @AssertRole('create topic', [ServiceRoles.Admin, ServiceRoles.TopicSetter], null, true)
  public static async create(
    _user: User,
    repository: TopicRepository,
    type: TopicTypeEntity,
    topic: New<Topic, 'requiresAttention'>
  ): Promise<TopicEntity> {
    const entity = new TopicEntity(repository, type, { ...topic, tenantId: type.tenantId });
    return await repository.save(entity);
  }

  public constructor(
    private repository: TopicRepository,
    type: TopicTypeEntity,
    topic: Topic | New<Topic, 'requiresAttention'>
  ) {
    this.tenantId = topic.tenantId;
    this.type = type;
    this.resourceId = topic.resourceId;
    this.name = topic.name;
    this.description = topic.description;
    this.securityClassification = type.securityClassification;
    this.commenters = topic.commenters || [];
    this.requiresAttention = false;

    const record = topic as Topic;
    if (record.id) {
      this.id = record.id;
      this.securityClassification = record.securityClassification;
      this.requiresAttention = record.requiresAttention || false;
    }
  }

  @AssertRole('update topic', [ServiceRoles.Admin, ServiceRoles.TopicSetter], null, true)
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

  public async setRequiresAttention(user: User, requiresAttention: boolean) {
    if (!this.canComment(user)) {
      throw new UnauthorizedUserError('clear requires attention', user);
    }

    let set = false;
    if (this.requiresAttention !== requiresAttention) {
      this.requiresAttention = requiresAttention;

      const result = await this.repository.save(this);
      set = result.requiresAttention === requiresAttention;
    }

    return set;
  }

  @AssertRole('delete topic', [ServiceRoles.Admin, ServiceRoles.TopicSetter], null, true)
  public async delete(_user: User): Promise<boolean> {
    return await this.repository.delete(this);
  }

  /**
   * Gets a flag indicating if the user is a commenter on the topic.
   * This is used for external parties like people being supported on a support topic.
   *
   * @param {User} user
   * @returns {boolean}
   * @memberof TopicEntity
   */
  public isCommenter(user: User): boolean {
    return user && this.commenters.includes(user.id);
  }

  public canRead(user: User): boolean {
    return this.type?.canRead(user) || this.isCommenter(user);
  }

  public canComment(user: User): boolean {
    return this.type?.canComment(user) || this.isCommenter(user);
  }

  public canModifyComment(user: User, { createdBy }: Comment): boolean {
    return this.type?.canAdmin(user) || (this.canComment(user) && createdBy.id === user.id);
  }

  private anonymizeComment(user: User, comment: Comment) {
    if (comment) {
      const { createdBy, lastUpdatedBy, ...additional } = comment;
      // If user is a topic specific commenter and the comment wasn't created by them, then remove the name from the result.
      if (this.isCommenter(user)) {
        if (createdBy.id !== user.id) {
          createdBy.name = null;
        }
        if (lastUpdatedBy.id !== user.id) {
          lastUpdatedBy.name = null;
        }
      }

      comment = { ...additional, createdBy, lastUpdatedBy };
    }
    return comment;
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

    const { results, page } = await this.repository.getComments(top, after, {
      ...criteria,
      tenantIdEquals: this.tenantId,
      topicIdEquals: this.id,
    });

    return {
      results: results.map((result) => this.anonymizeComment(user, result)),
      page,
    };
  }

  public async getComment(user: User, commentId: number): Promise<Comment> {
    if (!this.canRead(user)) {
      throw new UnauthorizedUserError('read comment', user);
    }

    const comment = await this.repository.getComment(this, commentId);

    return this.anonymizeComment(user, comment);
  }

  public async postComment(
    user: User,
    comment: Pick<Comment, 'title' | 'content'>,
    requiresAttention?: boolean
  ): Promise<Comment> {
    if (!this.canComment(user)) {
      throw new UnauthorizedUserError('post comment', user);
    }

    const createdOn = new Date();
    const created = await this.repository.saveComment(this, {
      title: comment.title,
      content: comment.content,
      topicId: this.id,
      id: undefined,
      createdBy: user,
      createdOn,
      lastUpdatedBy: user,
      lastUpdatedOn: createdOn,
    });

    if (typeof requiresAttention === 'boolean') {
      await this.setRequiresAttention(user, requiresAttention);
    }

    return created;
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
