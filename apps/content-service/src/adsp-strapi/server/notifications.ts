import { Channel, NotificationType } from '@abgov/adsp-service-sdk';
import { UserRegisteredEventDefinition } from './events';

const CONTENT_EVENT_NAMESPACE = 'content-service';
export const UserRegistrationInvite: NotificationType = {
  name: 'user-registration-invite',
  displayName: 'User registration invite',
  description: 'Provides notification to user to complete their content manager registration.',
  publicSubscribe: false,
  subscriberRoles: [],
  channels: [Channel.email],
  addressPath: 'email',
  events: [
    {
      namespace: CONTENT_EVENT_NAMESPACE,
      name: UserRegisteredEventDefinition.name,
      templates: {
        email: {
          subject: 'Welcome to content service {{ event.payload.firstName }}!',
          body: `
<section>
  <p>You're invited to be an {{#if event.payload.isEditor}}editor{{else}}author{{/if}} in content service.</p>
  <p>Click on the following link to complete your registration: <a href="{{ event.payload.registrationUrl }}">{{ event.payload.registrationUrl }}</a></p>
</section>
          `,
        },
      },
    },
  ],
};
