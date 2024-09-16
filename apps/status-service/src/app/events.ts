import { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { NoticeApplicationEntity } from './model/notice';
import { StaticApplicationData } from './model';
import { Webhooks } from './model';

const ApplicationDefinition = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: ['string', 'null'] },
    description: { type: ['string', 'null'] },
    url: { type: ['string', 'null'] },
    monitorOnly: { type: ['boolean', 'null'] },
  },
};

const userSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
};

interface ApplicationNotificationEvent {
  description: string;
  startTimestamp: Date;
  endTimestamp: Date;
  created: Date;
}

export const healthCheckStartedEvent = 'health-check-started';
export const healthCheckStoppedEvent = 'health-check-stopped';

export const HealthCheckStartedDefinition: DomainEventDefinition = {
  name: healthCheckStartedEvent,
  description: 'Signalled when an application health check is started.',
  payloadSchema: {
    type: 'object',
    properties: {
      application: ApplicationDefinition,
      startedBy: userSchema,
    },
  },
};

export const HealthCheckStoppedDefinition: DomainEventDefinition = {
  name: healthCheckStoppedEvent,
  description: 'Signalled when an application health check is stopped.',
  payloadSchema: {
    type: 'object',
    properties: {
      application: ApplicationDefinition,
      stoppedBy: userSchema,
    },
  },
};

export const HealthCheckHealthyDefinition: DomainEventDefinition = {
  name: 'application-healthy',
  description: 'Signalled when an application is determined to be healthy by the health check.',
  payloadSchema: {
    type: 'object',
    properties: {
      application: ApplicationDefinition,
    },
  },
  interval: {
    namespace: 'status-service',
    name: 'application-unhealthy',
    metric: ['status-service', 'applicationId', 'downtime'],
  },
};

export const HealthCheckUnhealthyDefinition: DomainEventDefinition = {
  name: 'application-unhealthy',
  description: 'Signalled when an application is determined to be unhealthy by the health check.',
  payloadSchema: {
    type: 'object',
    properties: {
      application: ApplicationDefinition,
      error: { type: 'string' },
    },
  },
  interval: {
    namespace: 'status-service',
    name: 'application-healthy',
    metric: ['status-service', 'applicationId', 'uptime'],
  },
};

export const ApplicationNoticePublishedDefinition: DomainEventDefinition = {
  name: 'application-notice-published',
  description: 'A notice related to the current application is published.',
  payloadSchema: {
    type: 'object',
    properties: {
      application: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: {
            type: 'string',
          },
        },
      },
      notice: {
        type: 'object',
        properties: {
          description: {
            type: ['string', 'null'],
          },
          startTimestamp: {
            type: 'string',
            format: 'date-time',
          },
          endTimestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      postedBy: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          userName: { type: 'string' },
        },
      },
    },
  },
};

export const ApplicationStatusChangedDefinition: DomainEventDefinition = {
  name: 'application-status-changed',
  description: 'Signalled when an application status is changed.',
  payloadSchema: {
    type: 'object',
    properties: {
      application: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          originalStatus: {
            type: 'string',
          },
          newStatus: {
            type: 'string',
          },
          updatedBy: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              userName: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

export const MonitoredServiceDownDefinition: DomainEventDefinition = {
  name: 'monitored-service-down',
  description: 'Signalled when an application status is down for a specified period',
  payloadSchema: {
    type: 'object',
    properties: {
      application: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },

          updatedBy: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              userName: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

export const MonitoredServiceUpDefinition: DomainEventDefinition = {
  name: 'monitored-service-up',
  description: 'Signalled when an application status is up for a specified period',
  payloadSchema: {
    type: 'object',
    properties: {
      application: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          updatedBy: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              userName: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

const mapNotice = (notice: NoticeApplicationEntity): ApplicationNotificationEvent => {
  return {
    description: notice.message,
    startTimestamp: notice.startDate,
    endTimestamp: notice.endDate,
    created: notice.created,
  };
};

export const applicationStatusToStarted = (app: StaticApplicationData, user: User): DomainEvent => ({
  name: healthCheckStartedEvent,
  timestamp: new Date(),
  tenantId: AdspId.parse(user.tenantId.toString()),
  correlationId: app.appKey,
  context: {
    applicationId: app.appKey,
    applicationName: app.name,
  },
  payload: {
    application: app,
    startedBy: {
      id: user.id,
      name: user.name,
    },
  },
});

export const applicationStatusToStopped = (app: StaticApplicationData, user: User): DomainEvent => ({
  name: healthCheckStoppedEvent,
  timestamp: new Date(),
  tenantId: user.tenantId,
  correlationId: app.appKey,
  context: {
    applicationId: app.appKey,
    applicationName: app.name,
  },
  payload: {
    application: app,
    stoppedBy: {
      id: user.id,
      name: user.name,
    },
  },
});

export const applicationStatusToUnhealthy = (
  app: StaticApplicationData,
  tenantId: string,
  error: string
): DomainEvent => ({
  name: 'application-unhealthy',
  timestamp: new Date(),
  tenantId: AdspId.parse(tenantId),
  correlationId: app.appKey,
  context: {
    applicationId: app.appKey,
    applicationName: app.name,
  },
  payload: {
    application: app,
    error,
  },
});

export const applicationStatusToHealthy = (app: StaticApplicationData, tenantId: string): DomainEvent => ({
  name: 'application-healthy',
  timestamp: new Date(),
  tenantId: AdspId.parse(tenantId),
  correlationId: app.appKey,
  context: {
    applicationId: app.appKey,
    applicationName: app.name,
  },
  payload: {
    application: app,
  },
});

export const monitoredServiceDown = (app: StaticApplicationData, user: User, webhook: Webhooks): DomainEvent => ({
  name: 'monitored-service-down',
  timestamp: new Date(),
  tenantId: user.tenantId,
  correlationId: webhook.id,
  context: {
    applicationId: app.appKey,
    applicationName: app.name,
    webhookURL: webhook?.url,
    webhookId: webhook?.id,
  },
  payload: {
    application: {
      id: app.appKey,
      name: app.name,
      description: app.description,
      targetId: webhook.targetId,
      eventTypes: webhook.eventTypes,
      waitTimeInterval: webhook.intervalMinutes,
      generatedByTest: webhook.generatedByTest,
      updatedBy: {
        userId: user.id,
        userName: user.name,
      },
    },
  },
});

export const monitoredServiceUp = (app: StaticApplicationData, user: User, webhook: Webhooks): DomainEvent => ({
  name: 'monitored-service-up',
  timestamp: new Date(),
  tenantId: user.tenantId,
  correlationId: webhook.id,
  context: {
    applicationId: app.appKey,
    applicationName: app.name,
    webhookURL: webhook?.url,
    webhookId: webhook?.id,
  },
  payload: {
    application: {
      id: app.appKey,
      name: app.name,
      description: app.description,
      targetId: webhook.targetId,
      eventTypes: webhook.eventTypes,
      waitTimeInterval: webhook.intervalMinutes,
      generatedByTest: webhook.generatedByTest,
      updatedBy: {
        userId: user.id,
        userName: user.name,
      },
    },
  },
});

export const applicationStatusChange = (
  app: StaticApplicationData,
  newStatus: string,
  originalStatus: string,
  user: User
): DomainEvent => ({
  name: 'application-status-changed',
  timestamp: new Date(),
  tenantId: user.tenantId,
  correlationId: user.tenantId.resource,
  context: {
    applicationId: app.appKey,
    applicationName: app.name,
  },
  payload: {
    application: {
      id: app.appKey,
      name: app.name,
      description: app.description,
      monitorOnly: app.monitorOnly,
      originalStatus: originalStatus,
      newStatus: newStatus,
      updatedBy: {
        userId: user.id,
        userName: user.name,
      },
    },
  },
});

export const applicationNoticePublished = (notice: NoticeApplicationEntity, user: User): DomainEvent => {
  const event: DomainEvent = {
    name: 'application-notice-published',
    timestamp: new Date(),
    tenantId: AdspId.parse(notice.tenantId),
    payload: {
      notice: mapNotice(notice),
      postedBy: {
        userId: user.id,
        userName: user.name,
      },
    },
  };
  if (!notice.isAllApplications) {
    const appId = notice.tennantServRef && JSON.parse(notice.tennantServRef)[0]?.id;
    event.correlationId = appId;
    event.payload['application'] = {
      id: user.tenantId.resource,
      name: notice.tennantServRef && JSON.parse(notice.tennantServRef)[0]?.name,
      description: '',
    };
  }
  return event;
};
