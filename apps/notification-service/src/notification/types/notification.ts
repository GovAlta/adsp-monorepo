import { Channel } from './channel';
import { Message } from './message';

export interface Notification {
  spaceId: string;
  typeId: string;
  correlationId?: string;
  channel: Channel;
  to: string;
  message: Message;
}
