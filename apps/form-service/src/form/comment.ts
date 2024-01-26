import { FormEntity } from './model';

export interface CommentService {
  createSupportTopic(form: FormEntity, urn: string): Promise<void>;
}
