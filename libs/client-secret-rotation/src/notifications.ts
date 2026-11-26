import { Channel } from '@abgov/adsp-service-sdk';
import type { NotificationType } from '@abgov/adsp-service-sdk';
import { CLIENT_SECRET_ADMIN_ROLE, NOTIFICATION_TYPE_ID, ROTATION_NAMESPACE } from './constants';

const links = `<p>
  {{#if event.payload.keycloakUrl}}<a href="{{ event.payload.keycloakUrl }}">Open the client in Keycloak</a>{{#if event.payload.runbookUrl}} | {{/if}}{{/if}}{{#if event.payload.runbookUrl}}<a href="{{ event.payload.runbookUrl }}">Rotation runbook</a>{{/if}}
</p>`;

// Dates are ISO strings in the event payload; the notification service formats them in Alberta time.
const DATE_TIME = 'format="DDD t ZZZZ"';

// The templates never contain a secret. The new secret is read from the client's Credentials tab in Keycloak.
export const ClientSecretRotationNotificationType: NotificationType = {
  name: NOTIFICATION_TYPE_ID,
  displayName: 'Client secret rotation',
  description:
    'Notifies tenant admins and client contacts before a Keycloak client secret is rotated, when it is rotated, and when the previous secret stops working.',
  subscriberRoles: [CLIENT_SECRET_ADMIN_ROLE],
  channels: [Channel.email],
  events: [
    {
      namespace: ROTATION_NAMESPACE,
      name: 'client-secret-rotation-due',
      templates: {
        email: {
          subject: `Action needed: client secret for {{ event.payload.clientId }} will be rotated on {{ formatDate event.payload.expiry ${DATE_TIME} }}`,
          body: `<div>
  <p>The secret for client <b>{{ event.payload.clientId }}</b> will be rotated on <b>{{ formatDate event.payload.expiry ${DATE_TIME} }}</b>{{#if event.payload.daysRemaining}} (in {{ event.payload.daysRemaining }} days){{/if}}.</p>
  <p><b>What you need to do</b></p>
  <ol>
    <li>After the rotation, open the client's Credentials tab in Keycloak and copy the new secret.</li>
    <li>Update your application with the new secret.</li>
  </ol>
  <p>The previous secret keeps working for a short time after the rotation, so you can switch over without an outage.</p>
  ${links}
</div>`,
        },
      },
    },
    {
      namespace: ROTATION_NAMESPACE,
      name: 'client-secret-rotated',
      templates: {
        email: {
          subject:
            '{{#if event.payload.emergency}}Emergency: {{/if}}Client secret for {{ event.payload.clientId }} was rotated',
          body: `<div>
  <p>The secret for client <b>{{ event.payload.clientId }}</b> was rotated{{#if event.payload.emergency}} outside the normal schedule{{/if}}.</p>
  <p><b>What you need to do</b></p>
  <ol>
    <li>Open the client's Credentials tab in Keycloak and copy the new secret.</li>
    <li>Update your application with the new secret{{#if event.payload.overlapEndsAt}} before <b>{{ formatDate event.payload.overlapEndsAt ${DATE_TIME} }}</b>, when the previous secret stops working{{/if}}.</li>
  </ol>
  {{#if event.payload.newExpiry}}<p>The new secret expires on <b>{{ formatDate event.payload.newExpiry ${DATE_TIME} }}</b>.</p>{{/if}}
  ${links}
</div>`,
        },
      },
    },
    {
      namespace: ROTATION_NAMESPACE,
      name: 'client-secret-revoked',
      templates: {
        email: {
          subject: 'Previous client secret for {{ event.payload.clientId }} stopped working',
          body: `<div>
  <p>The previous secret for client <b>{{ event.payload.clientId }}</b> stopped working{{#if event.payload.revokedAt}} on <b>{{ formatDate event.payload.revokedAt ${DATE_TIME} }}</b>{{/if}}.</p>
  <p>Any application still using the previous secret can no longer sign in. If one does, update it with the current secret from the client's Credentials tab in Keycloak.</p>
  ${links}
</div>`,
        },
      },
    },
    {
      namespace: ROTATION_NAMESPACE,
      name: 'client-secret-rotation-enabled',
      templates: {
        email: {
          subject: 'Automatic secret rotation was turned on for {{ event.payload.clientId }}',
          body: `<div>
  <p>Automatic secret rotation was turned on for client <b>{{ event.payload.clientId }}</b>.</p>
  <p>From now on its secret expires on a schedule and is rotated before it does. You will be notified before each rotation and again when it happens, so you can update your application with the new secret.</p>
  ${links}
</div>`,
        },
      },
    },
    {
      namespace: ROTATION_NAMESPACE,
      name: 'client-secret-rotation-disabled',
      templates: {
        email: {
          subject: 'Automatic secret rotation was turned off for {{ event.payload.clientId }}',
          body: `<div>
  <p>Automatic secret rotation was turned off for client <b>{{ event.payload.clientId }}</b>.</p>
  <p>Its secret no longer expires or rotates automatically, so you will not receive rotation notices for it. Rotate the secret manually if your own policy requires it.</p>
  ${links}
</div>`,
        },
      },
    },
  ],
  publicSubscribe: false,
  manageSubscribe: true,
};
