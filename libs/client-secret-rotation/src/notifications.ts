import { Channel } from '@abgov/adsp-service-sdk';
import type { NotificationType } from '@abgov/adsp-service-sdk';
import { CLIENT_SECRET_ADMIN_ROLE, NOTIFICATION_TYPE_ID, ROTATION_NAMESPACE } from './constants';
import { ClientSecretRotationEventNames as EventNames } from './events';

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
    'Notifies tenant admins and client contacts before a Keycloak client secret expires, when it is rotated, and when the previous secret stops working.',
  subscriberRoles: [CLIENT_SECRET_ADMIN_ROLE],
  channels: [Channel.email],
  events: [
    {
      namespace: ROTATION_NAMESPACE,
      name: EventNames.due,
      templates: {
        email: {
          subject: `Action needed: client secret for {{ event.payload.clientId }} expires on {{ formatDate event.payload.expiry ${DATE_TIME} }}`,
          body: `<div>
  <p>The secret for client <b>{{ event.payload.clientId }}</b> expires on <b>{{ formatDate event.payload.expiry ${DATE_TIME} }}</b>{{#if event.payload.daysRemaining}} (in {{ event.payload.daysRemaining }} day(s)){{/if}}. It is not rotated automatically.</p>
  <p><b>What you need to do</b></p>
  <ol>
    <li>Rotate the secret before it expires, from the Client secrets tab in the ADSP access portal or in Keycloak.</li>
    <li>Open the client's Credentials tab in Keycloak, copy the new secret, and update your application.</li>
  </ol>
  <p>The previous secret keeps working for a short time after you rotate, so you can switch over without an outage.</p>
  ${links}
</div>`,
        },
      },
    },
    {
      namespace: ROTATION_NAMESPACE,
      name: EventNames.rotated,
      templates: {
        email: {
          subject: 'Client secret for {{ event.payload.clientId }} was rotated',
          body: `<div>
  <p>The secret for client <b>{{ event.payload.clientId }}</b> was rotated.</p>
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
      name: EventNames.revoked,
      templates: {
        email: {
          subject: 'Previous client secret for {{ event.payload.clientId }} stopped working',
          body: `<div>
  <p>The previous secret for client <b>{{ event.payload.clientId }}</b> stopped working{{#if event.payload.revokedAt}} on <b>{{ formatDate event.payload.revokedAt ${DATE_TIME} }}</b>{{/if}}.</p>
  <p>Any application still using the previous secret can no longer sign in. If one does, update it with the current secret from the client's Credentials tab in Keycloak. Rotate again before the current secret expires.</p>
  ${links}
</div>`,
        },
      },
    },
    {
      namespace: ROTATION_NAMESPACE,
      name: EventNames.enabled,
      templates: {
        email: {
          subject: 'Secret expiry was turned on for {{ event.payload.clientId }}',
          body: `<div>
  <p>Secret expiry was turned on for client <b>{{ event.payload.clientId }}</b>.</p>
  <p>From now on its secret expires on a schedule. You will be notified before it expires. Secrets are not rotated automatically, so rotate the secret before then and update your application with the new one.</p>
  ${links}
</div>`,
        },
      },
    },
    {
      namespace: ROTATION_NAMESPACE,
      name: EventNames.disabled,
      templates: {
        email: {
          subject: 'Secret expiry was turned off for {{ event.payload.clientId }}',
          body: `<div>
  <p>Secret expiry was turned off for client <b>{{ event.payload.clientId }}</b>.</p>
  <p>Its secret no longer expires, so you will not receive expiry notices for it. Rotate the secret manually if your own policy requires it.</p>
  ${links}
</div>`,
        },
      },
    },
    {
      namespace: ROTATION_NAMESPACE,
      name: EventNames.digest,
      templates: {
        email: {
          subject: 'Client secret expiry summary for {{ event.payload.realm }}',
          body: `<div>
  <p>Client secrets in <b>{{ event.payload.realm }}</b> need your attention.</p>
  {{#if event.payload.due.length}}
  <p><b>Secrets expiring soon</b></p>
  <ul>
    {{#each event.payload.due}}<li>{{#if keycloakUrl}}<a href="{{ keycloakUrl }}">{{ clientId }}</a>{{else}}{{ clientId }}{{/if}}: expires on <b>{{ formatDate expiry ${DATE_TIME} }}</b>{{#if daysRemaining}} (in {{ daysRemaining }} day(s)){{/if}}</li>{{/each}}
  </ul>
  <p>Secrets are not rotated automatically. Rotate each secret before it expires, from the Client secrets tab in the ADSP access portal or in Keycloak, then copy the new secret from the client's Credentials tab and update your application. The previous secret keeps working for a short time.</p>
  {{/if}}
  {{#if event.payload.revoked.length}}
  <p><b>Previous secret stopped working</b></p>
  <ul>
    {{#each event.payload.revoked}}<li>{{#if keycloakUrl}}<a href="{{ keycloakUrl }}">{{ clientId }}</a>{{else}}{{ clientId }}{{/if}}{{#if revokedAt}}: stopped working on <b>{{ formatDate revokedAt ${DATE_TIME} }}</b>{{/if}}</li>{{/each}}
  </ul>
  <p>Any application still using the previous secret can no longer sign in. Update it with the current secret.</p>
  {{/if}}
  {{#if event.payload.runbookUrl}}<p><a href="{{ event.payload.runbookUrl }}">Rotation runbook</a></p>{{/if}}
</div>`,
        },
      },
    },
  ],
  publicSubscribe: false,
  manageSubscribe: true,
};
