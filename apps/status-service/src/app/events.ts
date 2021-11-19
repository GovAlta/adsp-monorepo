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
  id: string;
  message: string;
  tennantServRef: string;
  startDate: Date;
  endDate: Date;
  created: Date;
  tenantId: string;
  tenantName: string;
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
      id: {
        type: 'string',
      },
      message: {
        type: { ['string', 'null'] },
      },
      tennantServRef: {
        type: 'string',
      },
      startDate: {
        type: 'date',
      },
      endDate: {
        type: 'data',
      },
      created: {
        type: 'data',
      },
      tenantId: {
        type: 'string',
      },
      tenantName: {
        type: 'string',
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
    id: notice.id,
    message: notice.message,
    tennantServRef: notice.tennantServRef,
    startDate: notice.startDate,
    endDate: notice.endDate,
    created: notice.created,
    tenantId: notice.tenantId,
    tenantName: notice.tenantName,
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

export const applicationNoticePublished = (notice: NoticeApplicationEntity): DomainEvent => ({
  name: 'application-notice-published',
  timestamp: new Date(),
  tenantId: AdspId.parse(notice.tenantId),
  payload: {
    notice: mapNotice(notice),
  },
});
