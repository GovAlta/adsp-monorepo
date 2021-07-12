import { SubscriptionRepository } from './subscription';

export * from './subscription';

export interface Repositories {
  isConnected: () => Promise<boolean>;
  subscriptionRepository: SubscriptionRepository;
}
