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
          subject: 'Health Check for {{ healthCheck.application.name }} has started',
          body: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <p>Health checking has been activated for application {{ healthCheck.application.name }}</p>
    <p>
      {{ healthCheck.application.name }} is described as follows: {{ healthCheck.application.description }}
    </p>
    <p>
      {{ healthCheck.application.name }} is available at <a href="{{ healthCheck.application.url }}">{{ healthCheck.application.url }}</a>
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
          subject: 'Health Check for {{ healthCheck.application.name }} has stopped',
          body: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <p>Health checking has been disabled for application {{ healthCheck.application.name }}</p>
    <p>
      {{ healthCheck.application.name }} is described as follows: {{ healthCheck.application.description }}
    </p>
    <p>
      {{ healthCheck.application.name }} is available at <a href="{{ healthCheck.application.url }}">{{ healthCheck.application.url }}</a>
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
          subject: 'Status of {{ healthCheck.application.name }} is deemed to be unhealthy',
          body: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <p>{{ healthCheck.application.name }} may be offline</p>
    <p>
      {{ healthCheck.application.name }} is described as follows: {{ healthCheck.application.description }}
    </p>
    <p>
      {{ healthCheck.application.name }} is available at <a href="{{ healthCheck.application.url }}">{{ healthCheck.application.url }}</a>
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
          subject: 'Status of {{ healthCheck.application.name }} is healthy',
          body: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <p>{{ healthCheck.application.name }} seems to be available</p>
    <p>
      {{ healthCheck.application.name }} is described as follows: {{ healthCheck.application.description }}
    </p>
    <p>
      {{ healthCheck.application.name }} is available at <a href="{{ healthCheck.application.url }}">{{ healthCheck.application.url }}</a>
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
