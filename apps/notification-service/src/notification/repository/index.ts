import { SubscriptionRepository } from './subscription';

export * from './subscription';

export interface Repositories {
  isConnected: () => boolean;
  subscriptionRepository: SubscriptionRepository;
}
