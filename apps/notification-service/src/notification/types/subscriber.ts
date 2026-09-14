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
  created?: Date;
  updated?: Date;
}

export interface SubscriberCriteria {
  tenantIdEquals?: AdspId;
  name?: string;
  email?: string;
  sms?: string;
  // Matches subscribers whose name, email address, or phone number contains the value, so that the
  // registry can be searched without the user having to know which field holds what they remember.
  search?: string;
}

// The columns the registry can be sorted on. The request validator checks the value against this
// list, so the type and what the API accepts are the same thing.
export const SUBSCRIBER_SORT_FIELDS = ['name', 'email', 'sms', 'verified', 'created', 'updated'] as const;

export type SubscriberSortField = (typeof SUBSCRIBER_SORT_FIELDS)[number];

export interface SubscriberSort {
  field: SubscriberSortField;
  direction?: 'asc' | 'desc';
}
