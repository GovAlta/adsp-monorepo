import { DomainEvent } from '@core-services/core-common';
import { Message, Subscriber, Template } from './types';

export interface TemplateService {
  generateMessage(
    template: Template, 
    event: DomainEvent, 
    subscriber: Subscriber
  ): Message
}
