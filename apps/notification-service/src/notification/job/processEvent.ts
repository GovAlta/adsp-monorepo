import { DomainEvent, EventServiceClient, WorkQueueService } from '@core-services/core-common';
import { Notification } from '../types';
import { NotificationTypeRepository, SubscriptionRepository } from '../repository';
import { TemplateService } from '../template';
import { generatedNotifications } from '../event';

interface ProcessEventJobProps {
  templateService: TemplateService
  typeRepository: NotificationTypeRepository
  subscriptionRepository: SubscriptionRepository
  queueService: WorkQueueService<Notification>
  eventService: EventServiceClient
}

export const createProcessEventJob = ({
  templateService,
  typeRepository,
  subscriptionRepository,
  queueService,
  eventService
}: ProcessEventJobProps) => (event: DomainEvent, done: () => void) => {
  typeRepository.find(100, null, { eventCriteria: { name: event.name, namespace: event.namespace } })
  .then(types =>  
    types.results.map(result => 
      subscriptionRepository.getSubscriptions(result, 1000, null)
      .then(subResults => ({
        type: result,
        subscriptions: subResults.results
      }))
    )
  )
  .then(promises => 
    Promise.all(promises)
  )
  .then(typeSubscriptions => 
    typeSubscriptions.reduce(
      (notifications, typeSubscription) => {
        const typeNotifications = typeSubscription.type.generateNotifications(
          templateService, event, typeSubscription.subscriptions
        );
        
        if (typeNotifications.length > 0) {
          eventService.send(
            generatedNotifications(
              event, 
              typeSubscription.type, 
              typeNotifications.length
            )
          );
        }
        
        return [
          ...notifications,
          ...typeNotifications
        ]
      }, 
      []
    )
  )
  .then(notifications =>{
    notifications.forEach(notification => 
      queueService.enqueue(notification)
    )
  })
  .then(() => done());
}
