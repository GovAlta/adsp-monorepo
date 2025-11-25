"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRegistrationInvite = void 0;
const adsp_service_sdk_1 = require("@abgov/adsp-service-sdk");
const events_1 = require("./events");
const CONTENT_EVENT_NAMESPACE = 'content-service';
exports.UserRegistrationInvite = {
    name: 'user-registration-invite',
    displayName: 'User registration invite',
    description: 'Provides notification to user to complete their content manager registration.',
    publicSubscribe: false,
    subscriberRoles: [],
    channels: [adsp_service_sdk_1.Channel.email],
    addressPath: 'email',
    events: [
        {
            namespace: CONTENT_EVENT_NAMESPACE,
            name: events_1.UserRegisteredEventDefinition.name,
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
//# sourceMappingURL=notifications.js.map