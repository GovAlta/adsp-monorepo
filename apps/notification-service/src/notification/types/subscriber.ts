import { AdspId } from '@abgov/adsp-service-sdk';
import { Channel } from './channel';

export interface SubscriberChannel {
  channel: Channel;
  address: string;
}

export interface Subscriber {
  tenantId: AdspId;
  id: string;
  channels: SubscriberChannel[];
  userId?: string;
  addressAs: string;
}

export interface SubscriberCriteria {
  tenantIdEquals?: AdspId;
}
