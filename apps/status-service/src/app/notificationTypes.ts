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
}

export interface NotificationType {
  name: string;
  description: string;
  publicSubscribe: boolean;
  subscriberRoles: string[];
  events: NotificationTypeEvent[];
}

export const StatusApplicationHealthChange: NotificationType = {
  name: 'status-application-health-change',
  description:
    'Default email templates for application health changes - includes the following events: health-check-started, health-check-stopped, application-unhealthy, application-unhealthy',
  subscriberRoles: ['status-admin'],
  events: [
    {
      namespace: 'status-service',
      name: 'health-check-started',
      templates: {
        email: {
          subject: 'Health Check for {{ event.payload.application.name }} has started',
          body: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <p>Health check has been activated for {{ event.payload.application.name }}</p>
    <p>
      {{ event.payload.application.name }} is available at <a href="{{ event.payload.application.url }}">{{ event.payload.application.url }}</a>
    </p>
  </body>
</html>`,
        },
      },
      channels: ['email'],
    },
    {
      namespace: 'status-service',
      name: 'health-check-stopped',
      templates: {
        email: {
          subject: 'Health Check for {{ event.payload.application.name }} has stopped',
          body: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <p>Health check has been disabled for {{ event.payload.application.name }}</p>
    <p>
      {{ event.payload.application.name }} is available at <a href="{{ event.payload.application.url }}">{{ event.payload.application.url }}</a>
    </p>
  </body>
</html>`,
        },
      },
      channels: ['email'],
    },
    {
      namespace: 'status-service',
      name: 'application-unhealthy',
      templates: {
        email: {
          subject: '{{ event.payload.application.name }} is unhealthy',
          body: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <p>The healthcheck for {{ event.payload.application.name }} has failed multiple times</p>
    <p>
      {{ event.payload.application.name }} is available at <a href="{{ event.payload.application.url }}">{{ event.payload.application.url }}</a>
    </p>
  </body>
</html>`,
        },
      },
      channels: ['email'],
    },
    {
      namespace: 'status-service',
      name: 'application-healthy',
      templates: {
        email: {
          subject: '{{ event.payload.application.name }} is healthy',
          body: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <p>The healthcheck for {{ event.payload.application.name }} has succeeded multiple times</p>
    <p>
      {{ event.payload.application.name }} is available at <a href="{{ event.payload.application.url }}">{{ event.payload.application.url }}</a>
    </p>
  </body>
</html>`,
        },
      },
      channels: ['email'],
    },
  ],
  publicSubscribe: false,
};

export const StatusApplicationStatusChange: NotificationType = {
  name: 'status-application-status-change',
  description: 'Default email templates for application status changes',
  subscriberRoles: ['status-admin'],
  events: [
    {
      namespace: 'status-service',
      name: 'application-status-changed',
      templates: {
        email: {
          subject: '{{ event.payload.application.name }} status has changed',
          body: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <p> {{ event.payload.application.name }} status has changed</p>
    <p>
      {{ event.payload.application.name }} is described as follows: {{ event.payload.application.description }}
    </p>
    <p>The original status was: {{ event.payload.application.originalStatus }}</p>
    <p>The new status is now: {{ event.payload.application.newStatus }}</p>
  </body>
</html>`,
        },
      },
      channels: ['email'],
    },
    {
      namespace: 'status-service',
      name: 'application-notice-published',
      templates: {
        email: {
          subject: 'A notice for {{ event.payload.application.name }} was published',
          body: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <p>A notice related to application {{ event.payload.application.name}} has been published by {{event.payload.postedBy.userName}}</p>
    <p>
      The notice is described as follows: {{ event.payload.notice.description }}
    </p>
    <p>
      The notice is in effect between {{ event.payload.notice.startTimestamp }} and {{ event.payload.notice.endTimestamp }}
    </p>
  </body>
</html>`,
        },
      },
      channels: ['email'],
    },
  ],
  publicSubscribe: true,
};
