import type { DomainEvent } from '@abgov/adsp-service-sdk';
import { Message, Subscriber, Template } from './types';

export interface TemplateService {
  generateMessage(template: Template, event: DomainEvent, subscriber: Subscriber): Message;
}
