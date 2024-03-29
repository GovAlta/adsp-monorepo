import { AdspId, Channel } from '@abgov/adsp-service-sdk';

export interface SubscriberChannel {
  channel?: Channel;
  address?: string;
  verified?: boolean;
  verifyKey?: string;
  pendingVerification?: boolean;
  timeCodeSent?: number;
}

export interface Subscriber {
  tenantId: AdspId;
  id?: string;
  channels: SubscriberChannel[];
  userId?: string;
  addressAs: string;
}

export interface SubscriberCriteria {
  tenantIdEquals?: AdspId;
  name?: string;
  email?: string;
  sms?: string;
}
