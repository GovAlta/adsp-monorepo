import { Message, Template } from './types';

export interface TemplateService {
  generateMessage(template: Template, data: unknown): Message;
}
