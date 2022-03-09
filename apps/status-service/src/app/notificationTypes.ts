export enum Channel {
  email = 'email',
  mail = 'mail',
  sms = 'sms',
  slack = 'slack',
}

export interface Template {
  subject: unknown;
  body: unknown;
}

export interface NotificationTypeEvent {
  namespace: string;
  name: string;
  templates: Partial<Record<Channel, Template>>;
  channels?: string[];
  customized?: boolean;
}

export interface NotificationType {
  name: string;
  description: string;
  publicSubscribe: boolean;
  manageSubscribe?: boolean;
  subscriberRoles: string[];
  events: NotificationTypeEvent[];
}

export const StatusApplicationHealthChange: NotificationType = {
  name: 'status-application-health-change',
  description:
    'Provides notifications of application health check changes including when: health check is started or stopped; health check detects application is healthy or unhealthy. ' +
    'Teams can use this notification type to monitor and address application issues.',
  subscriberRoles: ['status-admin'],
  events: [
    {
      namespace: 'status-service',
      name: 'health-check-started',
      templates: {
        email: {
          subject: 'Health Check for {{ event.payload.application.name }} has started',
          body: `<div>
  <p>Health check has been started for {{ event.payload.application.name }}</p>
  <p>
    Health check polling {{ event.payload.application.name }} on: <a href="{{ event.payload.application.url }}">{{ event.payload.application.url }}</a>
  </p>
</div>`,
        },
        slack: {
          subject: 'Health check for {{ event.payload.application.name }} started',
          body: 'Health check started for {{ event.payload.application.name }} and polling on: {{ event.payload.application.url }}',
        },
      },
      channels: ['email', 'slack'],
    },
    {
      namespace: 'status-service',
      name: 'health-check-stopped',
      templates: {
        email: {
          subject: 'Health Check for {{ event.payload.application.name }} has stopped',
          body: `<div>
  <p>Health check has been stopped for {{ event.payload.application.name }}</p>
  <p>
    Health check no longer polling {{ event.payload.application.name }} on: <a href="{{ event.payload.application.url }}">{{ event.payload.application.url }}</a>
  </p>
</div>`,
        },
        slack: {
          subject: 'Health check for {{ event.payload.application.name }} stopped',
          body: 'Health check stopped for {{ event.payload.application.name }} and no longer polling on: {{ event.payload.application.url }}',
        },
      },
      channels: ['email', 'slack'],
    },
    {
      namespace: 'status-service',
      name: 'application-unhealthy',
      templates: {
        email: {
          subject: '{{ event.payload.application.name }} is unhealthy',
          body: `<div>
  <p>Health check indicates {{ event.payload.application.name }} is unhealthy</p>
  <p>
    Health check polling of {{ event.payload.application.name }} (<a href="{{ event.payload.application.url }}">{{ event.payload.application.url }}</a>) has received multiple non-200 responses.
  </p>
</div>`,
        },
        slack: {
          subject: '{{ event.payload.application.name }} is unhealthy',
          body: 'Health check indicates {{ event.payload.application.name }} ({{ event.payload.application.url }}) is unhealthy.',
        },
      },
      channels: ['email', 'slack'],
    },
    {
      namespace: 'status-service',
      name: 'application-healthy',
      templates: {
        email: {
          subject: '{{ event.payload.application.name }} is healthy',
          body: `<div>
  <p>Health check indicates {{ event.payload.application.name }} is healthy.</p>
  <p>
    Health check polling of {{ event.payload.application.name }} (<a href="{{ event.payload.application.url }}">{{ event.payload.application.url }}</a>) has received multiple 200 responses.
  </p>
</div>`,
        },
        slack: {
          subject: '{{ event.payload.application.name }} is healthy',
          body: 'Health check indicates {{ event.payload.application.name }} ({{ event.payload.application.url }}) is healthy.',
        },
      },
      channels: ['email', 'slack'],
    },
  ],
  publicSubscribe: false,
  manageSubscribe: false,
};

export const StatusApplicationStatusChange: NotificationType = {
  name: 'status-application-status-change',
  description:
    'Provides notifications of application status updates and new published notices. Public users can subscribe to this notification type from the status application.',
  subscriberRoles: [],
  events: [
    {
      namespace: 'status-service',
      name: 'application-status-changed',
      templates: {
        email: {
          subject: '{{ event.payload.application.name }} status has changed',
          body: `<div>
  <p> {{ event.payload.application.name }} status has changed</p>
  <p>
    {{ event.payload.application.name }} is described as follows: {{ event.payload.application.description }}
  </p>
  <p>The original status was: {{ event.payload.application.originalStatus }}</p>
  <p>The new status is now: {{ event.payload.application.newStatus }}</p>
</div>`,
        },
      },
      channels: ['email'],
    },
    {
      namespace: 'status-service',
      name: 'application-notice-published',
      templates: {
        email: {
          subject:
            'New notice for ' +
            '{{#if event.payload.application}}{{ event.payload.application.name }}' +
            '{{else}}{{ tenant.name }}{{/if}}',
          body: `<div>
  {{#if event.payload.application}}
    <p>Notice regarding application {{ event.payload.application.name }}: </p>
  {{else}}
    <p>Notice regarding {{ tenant.name }}: </p>
  {{/if}}

  <p>{{ event.payload.notice.description }}</p>
  <p>
    The affected period is between {{ formatDate event.payload.notice.startTimestamp }} and {{ formatDate event.payload.notice.endTimestamp }}.
  </p>
</div>`,
        },
      },
      channels: ['email'],
    },
  ],
  publicSubscribe: true,
  manageSubscribe: true,
};
