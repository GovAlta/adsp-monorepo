import {
  AuditAction,
  AuditCategories,
  AuditRecordDetails,
  auditDetailsFromRequest,
  AuditRequestContext,
  AuditService,
  AuditSeverities,
} from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';

const CONNECTION_RESOURCE_TYPE = 'sharepoint-connection';
const DESTINATION_RESOURCE_TYPE = 'sharepoint-destination';
const AUDIT_DISABLED_CODE = 'audit_disabled';

export const CredentialSetAuditAction: AuditAction = {
  name: 'credential.set',
  version: 1,
  category: AuditCategories.Security,
  severity: AuditSeverities.Info,
  resourceType: CONNECTION_RESOURCE_TYPE,
  description: "A SharePoint connection's client secret is saved, for the first time or as a replacement.",
};

export const CredentialDeletedAuditAction: AuditAction = {
  name: 'credential.deleted',
  version: 1,
  category: AuditCategories.Security,
  severity: AuditSeverities.Warning,
  resourceType: CONNECTION_RESOURCE_TYPE,
  description: "A SharePoint connection's client secret is deleted.",
};

export const DataPushedAuditAction: AuditAction = {
  name: 'data.pushed',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  resourceType: DESTINATION_RESOURCE_TYPE,
  description: "A row is created or updated in a destination's SharePoint list.",
};

export const FilePushedAuditAction: AuditAction = {
  name: 'file.pushed',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  resourceType: DESTINATION_RESOURCE_TYPE,
  description: "A file is copied from File Service to a destination's SharePoint document library.",
};

export const DestinationTestedAuditAction: AuditAction = {
  name: 'destination.tested',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: DESTINATION_RESOURCE_TYPE,
  description: "A tenant admin's Test writes sample data as a row in a destination's SharePoint list.",
};

export const DestinationVerifiedAuditAction: AuditAction = {
  name: 'destination.verified',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: DESTINATION_RESOURCE_TYPE,
  description: "A destination's SharePoint lists and columns are checked against its mappings.",
};

export const DestinationSetUpAuditAction: AuditAction = {
  name: 'destination.set-up',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: DESTINATION_RESOURCE_TYPE,
  description: "Missing lists, columns and indexes are created on a destination's SharePoint site.",
};

export const SharePointAuditActions: AuditAction[] = [
  CredentialSetAuditAction,
  CredentialDeletedAuditAction,
  DataPushedAuditAction,
  FilePushedAuditAction,
  DestinationTestedAuditAction,
  DestinationVerifiedAuditAction,
  DestinationSetUpAuditAction,
];

export const connectionResource = (connectionId: string) => ({ type: CONNECTION_RESOURCE_TYPE, id: connectionId });
export const destinationResource = (destinationId: string) => ({ type: DESTINATION_RESOURCE_TYPE, id: destinationId });

type AuditEntry = Omit<AuditRecordDetails, 'actor' | 'tenantId' | 'resource'> &
  Required<Pick<AuditRecordDetails, 'resource'>>;

export type AuditRecorder = (req: AuditRequestContext, action: AuditAction, entry: AuditEntry) => void;

const errorName = (err: unknown) => (err instanceof Error ? err.name : 'unknown');

/**
 * Records entries for the request's tenant and user without waiting, so auditing never fails or delays the request.
 * Failures are logged by code only, since rejection reasons and errors can echo the entry's values.
 */
export function createAuditRecorder(auditService: AuditService, logger: Logger): AuditRecorder {
  return (req, action, entry) => {
    const logFailure = (reason: string) =>
      logger.warn(
        `Audit entry ${action.name} for ${entry.resource.type} '${entry.resource.id}' was not recorded (${reason}).`,
        { context: 'SharePointAudit', tenant: req.tenant?.id?.toString() },
      );

    try {
      auditService
        .record(action, auditDetailsFromRequest(req, entry))
        .then((outcome) => {
          if (outcome.status === 'rejected' && outcome.code !== AUDIT_DISABLED_CODE) {
            logFailure(outcome.code);
          } else if (outcome.status === 'failed') {
            logFailure(outcome.reason);
          }
        })
        .catch((err) => logFailure(errorName(err)));
    } catch (err) {
      logFailure(errorName(err));
    }
  };
}
