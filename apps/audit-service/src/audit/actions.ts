import { AuditActionDefinition } from '@abgov/adsp-service-sdk';

export const REPLAY_ACTION = 'failed-event.replay';
export const REPLAY_DEFINITION: AuditActionDefinition = {
  version: 1,
  category: 'administrative',
  severity: 'info',
  retentionClass: 'compliance',
  resourceType: 'failed-event',
  captureChangeSet: false,
  forwardToSiem: false,
};
