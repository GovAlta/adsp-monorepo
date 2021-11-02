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
  description: 'Default email templates for application health changes',
  subscriberRoles: [],
  events: [
    {
      namespace: 'status-service',
      name: 'health-check-started',
      templates: {
        email: {
          subject: '{{ event.payload.form.definition.name }} locked',
          body: `<!doctype html>
<html>
<head>
</head>
<body>
<p>Your draft {{ event.payload.form.definition.name }} form has been locked and will be deleted on {{ formatDate event.payload.deleteOn }}.</p>
<p>
No action is required if you do not intend to complete the submission.
If you do wish to continue, please contact {{ event.payload.definition.supportEmail }} to unlock the draft.
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
          subject: '{{ event.payload.form.definition.name }} unlocked',
          body: `<!doctype html>
<html>
<head>
</head>
<body>
<p>Your draft {{ event.payload.form.definition.name }} form has been unlocked.</p>
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
          subject: '{{ event.payload.form.definition.name }} received',
          body: `<!doctype html>
<html>
<head>
</head>
<body>
<p>Your {{ event.payload.form.definition.name }} submission has been received.</p>
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
          subject: '{{ event.payload.form.definition.name }} received',
          body: `<!doctype html>
<html>
<head>
</head>
<body>
<p>Your {{ event.payload.form.definition.name }} submission has been received.</p>
</body>
</html>`,
        },
      },
      channels: ['email'],
    },
  ],
  publicSubscribe: false,
};
