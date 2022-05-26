import { EventDefinition } from '@store/event/models';
import jsf from 'json-schema-faker';
import { faker } from '@faker-js/faker/locale/en_CA';

export const eventObject = {
  application: {
    id: '6196e231430bc60012299389',
    url: 'https://status-app-core-services-dev.os99.gov.ab.ca/autotest',
    name: 'Status',
    description: 'application description',
    newStatus: 'reported-issues',
    updatedBy: {
      userId: '71e5fe2c-1f74-4b90-9b7c-3376ec75844d',
      userName: 'Auto Test',
    },
    originalStatus: 'operational',
  },
  subscriber: {
    id: '61d61d3cba517c0013b3a333',
    userId: 'bb566dfd-19fa-4238-90a7-89eba3ea57be',
    addressAs: 'auto.test@gov.ab.ca',
  },
  type: {
    id: 'status-application-health-change',
    name: 'status-application-health-change',
  },
  event: {
    id: '61d61d3cba517c0013b3a333',
    name: 'application-healthy',
    namespace: 'status-service',
    description: 'Event for application',
    end: '2021-11-19T21:00:00.000Z',
    start: '2021-11-19T17:00:00.000Z',
    isPublic: true,
    isAllDay: true,
  },
  form: {
    definition: {
      id: 'form-application',
      name: 'form-application',
    },
    id: '61d61d3cba517c0013b3a333',
    status: 'operational',
    created: '2021-11-19T21:00:00.000Z',
    locked: '2021-11-19T21:00:00.000Z',
    submitted: '2021-11-19T21:00:00.000Z',
    lastAccessed: '2021-11-19T21:00:00.000Z',
    supportEmail: 'auto.test@gov.ab.ca',
    deleteOn: '2021-11-19T21:00:00.000Z',
  },

  message: {
    body: '<!doctype html>\n<html>\n  <head>\n  </head>\n  <body>\n    <p>The healthcheck for File-service has succeeded multiple times</p>\n    <p>\n      File-service is available at <a href="https://file-service-core-services-dev.os99.gov.ab.ca">https://file-service-core-services-dev.os99.gov.ab.ca</a>\n    </p>\n  </body>\n</html>',
    subject: 'File-service is healthy',
  },
  error: 'The application File-service with id 6196e1bd430bc6001229934d becomes unhealthy.',
  updatedBy: {
    id: 'bb566dfd-19fa-4238-90a7-89eba3ea57be',
    name: 'auto.test@gov.ab.ca',
  },
  notice: {
    description: 'Notice for application notice',
    endTimestamp: '2021-11-19T21:00:00.000Z',
    startTimestamp: '2021-11-19T17:00:00.000Z',
  },
  postedBy: {
    userId: 'bb566dfd-19fa-4238-90a7-89eba3ea57be',
    name: 'auto.test@gov.ab.ca',
  },
  file: {
    id: '054aa569-79fa-4344-a7ef-ca83f84e5e97',
    size: 16,
    created: '2021-10-14T17:04:15.787Z',
    filename: 'autotest-new.txt',
    recordId: 'autotest-recordid-new',
    createdBy: {
      id: '71e5fe2c-1f74-4b90-9b7c-3376ec75844d',
      name: 'Auto Test',
    },
    lastAccessed: null,
  },
  deletedBy: {
    id: '71e5fe2c-1f74-4b90-9b7c-3376ec75844d',
    name: 'Auto Test',
  },
  writtenBy: {
    id: '71e5fe2c-1f74-4b90-9b7c-3376ec75844d',
    name: 'Auto Test',
  },
  uploadedBy: {
    id: '71e5fe2c-1f74-4b90-9b7c-3376ec75844d',
    name: 'Auto Test',
  },
  createdBy: {
    id: '71e5fe2c-1f74-4b90-9b7c-3376ec75844d',
    name: 'Auto Test',
  },
  lockedBy: {
    id: '71e5fe2c-1f74-4b90-9b7c-3376ec75844d',
    name: 'Auto Test',
  },
  unLockedBy: {
    id: '71e5fe2c-1f74-4b90-9b7c-3376ec75844d',
    name: 'Auto Test',
  },
  submittedBy: {
    id: '71e5fe2c-1f74-4b90-9b7c-3376ec75844d',
    name: 'Auto Test',
  },
  task: {
    id: 'bb566dfd-19fa-4238-90a7-89eba3ea57be',
    name: 'auto.test@gov.ab.ca',
    description: 'Task for application task',
  },
  completedBy: {
    id: '71e5fe2c-1f74-4b90-9b7c-3376ec75844d',
    name: 'Auto Test',
  },
  cancelledBy: {
    id: '71e5fe2c-1f74-4b90-9b7c-3376ec75844d',
    name: 'Auto Test',
  },

  calendar: {
    name: 'calendar',
    description: 'application description',
    displayName: 'calendar displayName',
  },
  attendee: {
    id: 'bb566dfd-19fa-4238-90a7-89eba3ea57be',
    name: 'auto.test',
    email: 'auto.test@gov.ab.ca',
  },
};

export const dynamicGeneratePayload = (
  tenant: { name: string; realm: string },
  eventDef: EventDefinition,
  managementUrl: string
): Record<string, unknown> => {
  jsf.extend('faker', () => faker);
  jsf.option({
    optionalsProbability: 1,
    maxItems: 3,
    fixedProbabilities: true,
  });
  let payload = {};
  const payloadSchema = eventDef?.payloadSchema;
  if (payloadSchema) {
    payload = jsf.generate(payloadSchema);
  }

  return {
    event: { payload: payload },
    tenant,
    managementUrl,
  };
};
