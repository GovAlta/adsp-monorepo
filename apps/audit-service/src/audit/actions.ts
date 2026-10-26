import {
  AuditActionDefinition,
  AuditCategories,
  AuditSeverities,
  BuiltInRetentionClasses,
} from '@abgov/adsp-service-sdk';

export const REPLAY_ACTION = 'failed-event.replay';
export const REPLAY_DEFINITION: AuditActionDefinition = {
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: 'failed-event',
  captureChangeSet: false,
  forwardToSiem: false,
};
