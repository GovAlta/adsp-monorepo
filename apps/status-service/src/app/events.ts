import { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { ServiceStatusApplication } from './types';
import { NoticeApplicationEntity } from './model/notice';

const ApplicationDefinition = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: ['string', 'null'] },
    description: { type: ['string', 'null'] },
    url: { type: ['string', 'null'] },
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

export interface ApplicationEvent {
  id: string;
  name: string;
  description: string;
  url: string;
}

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

const mapApplication = (application: ServiceStatusApplication): ApplicationEvent => {
  return {
    id: application._id,
    name: application.name,
    description: application.description,
    url: application.endpoint.url,
  };
};

const mapNotice = (notice: NoticeApplicationEntity): ApplicationNotificationEvent => {
  return {
    description: notice.message,
    startTimestamp: notice.startDate,
    endTimestamp: notice.endDate,
    created: notice.created,
  };
};

export const applicationStatusToStarted = (application: ServiceStatusApplication, user: User): DomainEvent => ({
  name: healthCheckStartedEvent,
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  correlationId: `${application._id}`,
  context: {
    applicationId: `${application._id}`,
    applicationName: application.name,
  },
  payload: {
    application: mapApplication(application),
    startedBy: {
      id: user.id,
      name: user.name,
    },
  },
});

export const applicationStatusToStopped = (application: ServiceStatusApplication, user: User): DomainEvent => ({
  name: healthCheckStoppedEvent,
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  correlationId: `${application._id}`,
  context: {
    applicationId: `${application._id}`,
    applicationName: application.name,
  },
  payload: {
    application: mapApplication(application),
    stoppedBy: {
      id: user.id,
      name: user.name,
    },
  },
});

export const applicationStatusToUnhealthy = (application: ServiceStatusApplication, error: string): DomainEvent => ({
  name: 'application-unhealthy',
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  correlationId: `${application._id}`,
  context: {
    applicationId: `${application._id}`,
    applicationName: application.name,
  },
  payload: {
    application: mapApplication(application),
    error,
  },
});

export const applicationStatusToHealthy = (application: ServiceStatusApplication): DomainEvent => ({
  name: 'application-healthy',
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  correlationId: `${application._id}`,
  context: {
    applicationId: `${application._id}`,
    applicationName: application.name,
  },
  payload: {
    application: mapApplication(application),
  },
});

export const applicationStatusChange = (
  application: ServiceStatusApplication,
  originalStatus: string,
  user: User
): DomainEvent => ({
  name: 'application-status-changed',
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  correlationId: `${application._id}`,
  context: {
    applicationId: `${application._id}`,
    applicationName: application.name,
  },
  payload: {
    application: {
      id: application._id,
      name: application.name,
      description: application.description,
      originalStatus: originalStatus,
      newStatus: application.status,
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
      id: appId,
      name: notice.tennantServRef && JSON.parse(notice.tennantServRef)[0]?.name,
      description: '',
    };
  }
  return event;
};
