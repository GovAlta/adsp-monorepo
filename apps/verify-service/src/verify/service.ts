import { AdspId, AssertRole, AuditAction, AuditEventStatus, AuditService, User } from '@abgov/adsp-service-sdk';
import * as random from 'crypto-random-string';
import { Logger } from 'winston';
import {
  CodeAttemptsExceededClearedAuditAction,
  CodeGeneratedAuditAction,
  CodeRejectedAuditAction,
  CodeVerifiedAuditAction,
  toVerifyCodeAuditDetails,
} from './audit';
import { CodeRepository } from './repository';
import { VerifyUserRoles } from './roles';

export const MAX_FAILED_VERIFICATIONS = 10;

export interface VerifyService {
  /**
   * Generates a new code at a key.
   *
   * @param tenantId Tenant the audit record is attributed to; defaults to the tenant of the user.
   */
  generate(
    user: User,
    key: string,
    expireIn?: number,
    tenantId?: AdspId,
  ): Promise<{ key: string; code: string; expiresAt: Date }>;
  /**
   * Verifies a code against the code at a key.
   *
   * @param tenantId Tenant the audit record is attributed to; defaults to the tenant of the user.
   */
  verify(user: User, key: string, code: string, tenantId?: AdspId): Promise<boolean>;
}

class VerifyServiceImpl implements VerifyService {
  private LOG_CONTEXT = { context: 'VerifyService' };

  constructor(
    private readonly logger: Logger,
    private readonly repository: CodeRepository,
    private readonly auditService: AuditService,
  ) {}

  @AssertRole('generate code', VerifyUserRoles.Generator, null, true)
  async generate(user: User, key: string, expireIn = 10, tenantId = user?.tenantId) {
    this.logger.debug(`Generating new verify code at key '${key}' for user ${user.name} (ID: ${user.id})...`, {
      ...this.LOG_CONTEXT,
      tenant: `${user.tenantId}`,
    });

    const cacheKey = this.getCacheKey(user, key);
    const code = await random.async({ length: 6, type: 'distinguishable' });
    const expiresAt = new Date(Date.now() + 60000 * Math.floor(expireIn));
    await this.repository.set({ key: cacheKey, code }, expiresAt);
    this.record(CodeGeneratedAuditAction, user, tenantId, key, { expiresAt: expiresAt.toISOString() });

    this.logger.info(`Generated new verify code at key '${key}' for user ${user.name} (ID: ${user.id}).`, {
      ...this.LOG_CONTEXT,
      tenant: `${user.tenantId}`,
    });
    return { key, code, expiresAt };
  }

  @AssertRole('verify code', VerifyUserRoles.Verifier, null, true)
  async verify(user: User, key: string, code: string, tenantId = user?.tenantId) {
    this.logger.debug(`Verifying code at key '${key}' for user ${user.name} (ID: ${user.id})...`, {
      ...this.LOG_CONTEXT,
      tenant: `${user.tenantId}`,
    });

    const cacheKey = this.getCacheKey(user, key);
    const record = await this.repository.get(cacheKey);
    let valid = false;
    let cleared = false;
    if (record) {
      valid = record.code === code;
      if (!valid) {
        // Increment failure and clear if max reached.
        cleared = await this.repository.failed(cacheKey, MAX_FAILED_VERIFICATIONS);
        if (cleared) {
          this.logger.warn(
            `Cleared code at key ${key} because verification has failed too many times. ` +
              `Last failure by user ${user.name} (ID: ${user.id}).`,
            {
              ...this.LOG_CONTEXT,
              tenant: `${user.tenantId}`,
            },
          );
        }
      }
    }

    if (valid) {
      this.record(CodeVerifiedAuditAction, user, tenantId, key, { verified: true });
    } else {
      const reason = record ? 'mismatch' : 'not-found';
      this.record(CodeRejectedAuditAction, user, tenantId, key, { verified: false, reason }, 'failure');
    }
    if (cleared) {
      this.record(CodeAttemptsExceededClearedAuditAction, user, tenantId, key, {
        maxFailedVerifications: MAX_FAILED_VERIFICATIONS,
      });
    }

    this.logger.info(`Verified code at key ${key} for user ${user.name} (ID: ${user.id}) with result '${valid}'.`, {
      ...this.LOG_CONTEXT,
      tenant: `${user.tenantId}`,
    });

    return valid;
  }

  private record(
    action: AuditAction,
    user: User,
    tenantId: AdspId,
    key: string,
    metadata: Record<string, unknown>,
    status: AuditEventStatus = 'success',
  ) {
    // Core callers without a tenantId have no tenant to record to; the audit service requires one.
    if (!tenantId) {
      this.logger.debug(`Audit event ${action.name} at key '${key}' not recorded because there is no tenant.`, {
        ...this.LOG_CONTEXT,
      });
      return;
    }
    void this.auditService.record(action, { ...toVerifyCodeAuditDetails(user, tenantId, key, metadata), status });
  }

  private getCacheKey(user: User, key: string) {
    const prefix = user.tenantId?.resource || 'core';
    return `${prefix}:${key}`;
  }
}

interface ServiceProps {
  logger: Logger;
  repository: CodeRepository;
  auditService: AuditService;
}

export const createVerifyService = ({ logger, repository, auditService }: ServiceProps): VerifyService => {
  return new VerifyServiceImpl(logger, repository, auditService);
};
