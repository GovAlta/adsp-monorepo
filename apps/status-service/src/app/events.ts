import { AdspId, DomainEvent, DomainEventDefinition } from '@abgov/adsp-service-sdk';
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

interface ApplicationEvent {
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

export const HealthCheckStartedDefinition: DomainEventDefinition = {
  name: 'health-check-started',
  description: 'Signalled when healthcheck started for an event.',
  payloadSchema: {
    type: 'object',
    properties: {
      application: ApplicationDefinition,
    },
  },
};

export const HealthCheckStoppedDefinition: DomainEventDefinition = {
  name: 'health-check-stopped',
  description: 'Signalled when an application health check is stopped.',
  payloadSchema: {
    type: 'object',
    properties: {
      application: ApplicationDefinition,
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
};

export const ApplicationNoticePublishedDefinition: DomainEventDefinition = {
  name: 'application-notice-published',
  description: 'A notice related to the current application is published.',
  payloadSchema: {
    type: 'object',
    properties: {
      application: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: {
          type: ['string', 'null'],
        },
      },
      notice: {
        description: {
          type: ['string', 'null'],
        },
        startTimestamp: {
          type: 'date',
        },
        endTimestamp: {
          type: 'date',
        },
        created: {
          type: 'date',
        },
      },
      postBy: {
        tenantId: {
          type: 'string',
        },
        tenantName: {
          type: 'string',
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

export const applicationStatusToStarted = (application: ServiceStatusApplication): DomainEvent => ({
  name: 'health-check-started',
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  payload: {
    application: mapApplication(application),
  },
});

export const applicationStatusToStopped = (application: ServiceStatusApplication): DomainEvent => ({
  name: 'health-check-stopped',
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  payload: {
    application: mapApplication(application),
  },
});

export const applicationStatusToUnhealthy = (application: ServiceStatusApplication, error: string): DomainEvent => ({
  name: 'application-unhealthy',
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  payload: {
    application: mapApplication(application),
    error,
  },
});

export const applicationStatusToHealthy = (application: ServiceStatusApplication): DomainEvent => ({
  name: 'application-healthy',
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  payload: {
    application: mapApplication(application),
  },
});

export const applicationStatusChange = (
  application: ServiceStatusApplication,
  originalStatus: string,
  user: Express.User
): DomainEvent => ({
  name: 'application-status-changed',
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
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

export const applicationNoticePublished = (
  notice: NoticeApplicationEntity,
  tennantServRef,
  user: Express.User
): DomainEvent => ({
  name: 'application-notice-published',
  timestamp: new Date(),
  tenantId: AdspId.parse(notice.tenantId),
  payload: {
    application: {
      id: tennantServRef[0].id,
      name: tennantServRef[0].name,
      description: tennantServRef[0].description ? tennantServRef[0].description : '',
    },

    notice: mapNotice(notice),
    postBy: {
      userId: user.id,
      userName: user.name,
    },
  },
});
