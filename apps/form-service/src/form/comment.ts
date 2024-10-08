import { FormEntity } from './model';

export const SUPPORT_COMMENT_TOPIC_TYPE_ID = 'form-questions';

export interface CommentService {
  createSupportTopic(form: FormEntity, urn: string): Promise<void>;
}
