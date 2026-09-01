// clean-code-ignore: RULE-19 — service interface and constant; the implementation is covered by ../comment.ts consumers.
import { AdspId } from '@abgov/adsp-service-sdk';
import { FormEntity } from './model';

export const SUPPORT_COMMENT_TOPIC_TYPE_ID = 'form-questions';

export interface CommentService {
  createSupportTopic(form: FormEntity, urn: string): Promise<void>;
  getComment(tenantId: AdspId, topicId: number, commentId: number): Promise<{ content: string } | null>;
}
