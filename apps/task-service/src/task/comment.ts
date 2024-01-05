import { Task } from './types';

export interface CommentService {
  createTopic(task: Task, urn: string): Promise<void>;
}
