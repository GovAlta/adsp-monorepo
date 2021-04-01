import { NotificationSpaceRepository } from './space';
import { SubscriptionRepository } from './subscription';
import { NotificationTypeRepository } from './type';

export * from './space';
export * from './type';
export * from './subscription';

export interface Repositories {
  isConnected: () => boolean;
  spaceRepository: NotificationSpaceRepository;
  typeRepository: NotificationTypeRepository;
  subscriptionRepository: SubscriptionRepository;
}
