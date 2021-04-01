export interface SubscriptionCriteria {
  correlationId?: string;
  context?: {
    [key: string]: unknown;
  };
}

export interface Subscription {
  spaceId: string;
  typeId: string;
  criteria: SubscriptionCriteria;
  subscriberId: string;
}
