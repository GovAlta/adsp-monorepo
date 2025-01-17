import { AdspId } from '@abgov/adsp-service-sdk';
import { Results, decodeAfter, encodeNext } from '@core-services/core-common';
import { Knex } from 'knex';
import { TopicCriteria, Comment, CommentCriteria, TopicEntity, TopicRepository, TopicTypeEntity } from '../comment';
import { CommentRecord, TopicRecord } from './types';

export class PostgresTopicRepository implements TopicRepository {
  constructor(private knex: Knex) {}

  private mapRecord(types: Record<string, TopicTypeEntity>, record: TopicRecord): TopicEntity {
    return record
      ? new TopicEntity(this, types[record.type], {
          tenantId: AdspId.parse(record.tenant),
          id: record.id,
          name: record.name,
          description: record.description,
          securityClassification: record.securityClassification,
          type: types[record.type],
          resourceId: AdspId.isAdspId(record.resource) ? AdspId.parse(record.resource) : record.resource,
          commenters: record.commenters,
          requiresAttention: record.requiresAttention,
        })
      : null;
  }

  private mapCommentRecord(record: CommentRecord): Comment {
    return record
      ? {
          topicId: record.topic_id,
          id: record.id,
          createdOn: record.createdOn,
          createdBy: {
            id: record.createdById,
            name: record.createdByName,
          },
          lastUpdatedOn: record.lastUpdatedOn,
          lastUpdatedBy: {
            id: record.lastUpdatedById,
            name: record.lastUpdatedByName,
          },
          title: record.title,
          content: record.content,
        }
      : null;
  }

  async getTopics(
    types: Record<string, TopicTypeEntity>,
    top: number,
    after?: string,
    criteria?: TopicCriteria
  ): Promise<Results<TopicEntity>> {
    const skip = decodeAfter(after);
    const topChecked = top + 1;
    let query = this.knex<TopicRecord>('topics');
    query = query.offset(skip).limit(topChecked);

    if (criteria) {
      const queryCriteria: Record<string, unknown> = {};
      if (criteria.tenantIdEquals) {
        queryCriteria.tenant = criteria.tenantIdEquals.toString();
      }

      if (criteria.resourceIdEquals) {
        queryCriteria.resource = criteria.resourceIdEquals.toString();
      }

      if (criteria.typeIdEquals) {
        queryCriteria.type = criteria.typeIdEquals;
      }

      if (criteria.requiresAttention) {
        queryCriteria.requiresAttention = true;
      }

      query.where(queryCriteria);
    }

    const rows = await query.orderBy('id', 'asc');

    return {
      results: rows.map((r) => this.mapRecord(types, r)).slice(0, top),
      page: {
        after,
        next: encodeNext(rows.length, topChecked, skip - 1),
        size: rows.length > top ? top : rows.length,
      },
    };
  }

  async getTopic(types: Record<string, TopicTypeEntity>, id: number, tenantId: AdspId): Promise<TopicEntity> {
    const [record] = await this.knex<TopicRecord>('topics').limit(1).where({ id, tenant: tenantId.toString() });

    return this.mapRecord(types, record);
  }

  async getComment(entity: TopicEntity, commentId: number): Promise<Comment> {
    const [record] = await this.knex<CommentRecord>('comments')
      .limit(1)
      .where({ id: commentId, topic_id: entity.id, tenant: entity.tenantId.toString() });

    return this.mapCommentRecord(record);
  }

  async getComments(top: number, after?: string, criteria?: CommentCriteria): Promise<Results<Comment>> {
    const skip = decodeAfter(after);

    let query = this.knex<CommentRecord>('comments');
    query = query.offset(skip).limit(top);

    if (criteria) {
      const queryCriteria: Record<string, unknown> = {};
      if (criteria.tenantIdEquals) {
        queryCriteria['comments.tenant'] = criteria.tenantIdEquals.toString();
      }

      if (criteria.topicIdEquals) {
        queryCriteria.topic_id = criteria.topicIdEquals;
      }
      query.where(queryCriteria);

      if (criteria.idGreaterThan) {
        query.andWhere('id', '>', criteria.idGreaterThan);
      }

      if (criteria.titleLike) {
        query.andWhereRaw("to_tsvector('english', title) @@ to_tsquery(?)", `'${criteria.titleLike}'`);
      }

      if (criteria.contentLike) {
        query.andWhereRaw("to_tsvector('english', content) @@ to_tsquery(?)", `'${criteria.contentLike}'`);
      }

      if (criteria.titleOrContentLike) {
        query.andWhere((c) => {
          c.whereRaw("to_tsvector('english', title) @@ to_tsquery(?)", `'${criteria.titleOrContentLike}'`).orWhereRaw(
            "to_tsvector('english', content) @@ to_tsquery(?)",
            `'${criteria.titleOrContentLike}'`
          );
        });
      }

      if (criteria.typeIdEquals) {
        query
          .innerJoin('topics', 'topics.id', '=', 'comments.topic_id')
          .andWhere('topics.type', '=', criteria.typeIdEquals);
      }
    }

    const rows = await query.orderBy('createdOn', 'desc');

    return {
      results: rows.map((r) => this.mapCommentRecord(r)),
      page: {
        after,
        next: encodeNext(rows.length, top, skip),
        size: rows.length,
      },
    };
  }

  async save(entity: TopicEntity): Promise<TopicEntity> {
    const tenant = entity.tenantId.toString();
    const record = await this.knex.transaction(async (ts) => {
      const [row] = await ts<TopicRecord>('topics')
        .insert({
          tenant,
          id: entity.id,
          type: entity.type.id,
          name: entity.name,
          description: entity.description,
          securityClassification: entity.securityClassification,
          resource: entity.resourceId?.toString(),
          commenters: entity.commenters,
          requiresAttention: entity.requiresAttention,
        })
        .onConflict(['tenant', 'id'])
        .merge()
        .returning('*');

      return row;
    });

    return this.mapRecord({ [entity.type.id]: entity.type }, record);
  }

  async delete(entity: TopicEntity): Promise<boolean> {
    const result = await this.knex<TopicRecord>('topics')
      .limit(1)
      .where({
        tenant: entity.tenantId.toString(),
        id: entity.id,
      })
      .delete();

    return result === 1;
  }

  async saveComment(entity: TopicEntity, comment: Comment): Promise<Comment> {
    const tenant = entity.tenantId.toString();
    const record = await this.knex.transaction(async (ts) => {
      const [row] = await ts<CommentRecord>('comments')
        .insert({
          tenant,
          topic_id: entity.id,
          id: comment.id,
          title: comment.title,
          content: comment.content,
          createdById: comment.createdBy.id,
          createdByName: comment.createdBy.name,
          createdOn: comment.createdOn,
          lastUpdatedById: comment.lastUpdatedBy.id,
          lastUpdatedByName: comment.lastUpdatedBy.name,
          lastUpdatedOn: comment.lastUpdatedOn,
        })
        .onConflict(['tenant', 'topic_id', 'id'])
        .merge()
        .returning('*');

      return row;
    });

    return this.mapCommentRecord(record);
  }

  async deleteComment(entity: TopicEntity, commentId: number): Promise<boolean> {
    const result = await this.knex<CommentRecord>('comments')
      .limit(1)
      .where({
        tenant: entity.tenantId.toString(),
        topic_id: entity.id,
        id: commentId,
      })
      .delete();

    return result === 1;
  }
}
