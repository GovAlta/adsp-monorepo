import { AdspId, Channel } from '@abgov/adsp-service-sdk';

export interface SubscriberChannel {
  channel: Channel;
  address: string;
  verified: boolean;
  verifyKey?: string;
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
