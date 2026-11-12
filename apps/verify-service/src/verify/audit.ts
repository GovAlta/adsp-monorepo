import {
  AdspId,
  AuditAction,
  AuditCategories,
  AuditRecordDetails,
  AuditSeverities,
  BuiltInRetentionClasses,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';

const VERIFY_CODE_RESOURCE_TYPE = 'verify-code';

export const CodeGeneratedAuditAction: AuditAction = {
  name: 'code.generated',
  version: 1,
  category: AuditCategories.Security,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Security,
  resourceType: VERIFY_CODE_RESOURCE_TYPE,
  description: 'A new verification code is generated at a key.',
};

export const CodeVerifySucceededAuditAction: AuditAction = {
  name: 'code.verified.succeeded',
  version: 1,
  category: AuditCategories.Security,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Security,
  resourceType: VERIFY_CODE_RESOURCE_TYPE,
  description: 'A code is submitted and matches the code at the key.',
};

export const CodeVerifyFailedAuditAction: AuditAction = {
  name: 'code.verified.failed',
  version: 1,
  category: AuditCategories.Security,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Security,
  resourceType: VERIFY_CODE_RESOURCE_TYPE,
  description:
    'A code is submitted and does not match, or there is no code at the key because it expired or was cleared.',
};

export const CodeAttemptsExceededClearedAuditAction: AuditAction = {
  name: 'code.attempts-exceeded-cleared',
  version: 1,
  category: AuditCategories.Security,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Security,
  resourceType: VERIFY_CODE_RESOURCE_TYPE,
  description: 'The code at a key is cleared because the maximum number of failed verifications is reached.',
};

export const VerifyAuditActions: AuditAction[] = [
  CodeGeneratedAuditAction,
  CodeVerifySucceededAuditAction,
  CodeVerifyFailedAuditAction,
  CodeAttemptsExceededClearedAuditAction,
];

/**
 * Builds the details of an audit event about the code at a key. The calling user or service account is the actor and
 * the key is the resource. The code value must never be included.
 */
export function toVerifyCodeAuditDetails(
  user: User,
  tenantId: AdspId,
  key: string,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return {
    tenantId,
    actor: toAuditActor(user),
    resource: { type: VERIFY_CODE_RESOURCE_TYPE, id: key },
    metadata: { codeKey: key, ...metadata },
  };
}
