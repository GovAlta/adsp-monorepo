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
    <p>Health checking has been activated for application {{ event.payload.application.name }}</p>
    <p>
      {{ event.payload.application.name }} is described as follows: {{ event.payload.application.description }}
    </p>
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
    <p>Health checking has been disabled for application {{ event.payload.application.name }}</p>
    <p>
      {{ event.payload.application.name }} is described as follows: {{ event.payload.application.description }}
    </p>
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
      namespace: 'Status-Service',
      name: 'application-unhealthy',
      templates: {
        email: {
          subject: 'Status of {{ event.payload.application.name }} is deemed to be unhealthy',
          body: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <p>{{ event.payload.application.name }} may be offline</p>
    <p>
      {{ event.payload.application.name }} is described as follows: {{ event.payload.application.description }}
    </p>
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
      namespace: 'Status-Service',
      name: 'application-healthy',
      templates: {
        email: {
          subject: 'Status of {{ event.payload.application.name }} is healthy',
          body: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <p>{{ event.payload.application.name }} seems to be available</p>
    <p>
      {{ event.payload.application.name }} is described as follows: {{ event.payload.application.description }}
    </p>
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
