import { AssertRole, User } from '@abgov/adsp-service-sdk';
import * as random from 'crypto-random-string';
import { Logger } from 'winston';
import { CodeRepository } from './repository';
import { VerifyUserRoles } from './roles';

export interface VerifyService {
  generate(user: User, key: string, expireIn?: number): Promise<{ key: string; code: string; expiresAt: Date }>;
  verify(user: User, key: string, code: string): Promise<boolean>;
}

class VerifyServiceImpl implements VerifyService {
  private LOG_CONTEXT = { context: 'VerifyService' };

  constructor(private readonly logger: Logger, private readonly repository: CodeRepository) {}

  @AssertRole('generate code', VerifyUserRoles.Generator)
  async generate(user: User, key: string, expireIn = 10) {
    this.logger.debug(`Generating new verify code at key '${key}' for user ${user.name} (ID: ${user.id})...`, {
      ...this.LOG_CONTEXT,
      tenant: `${user.tenantId}`,
    });

    const cacheKey = this.getCacheKey(user, key);
    const code = await random.async({ length: 6, type: 'distinguishable' });
    const expiresAt = new Date(Date.now() + 60000 * Math.floor(expireIn));
    await this.repository.set({ key: cacheKey, code }, expiresAt);

    this.logger.info(`Generated new verify code at key '${key}' for user ${user.name} (ID: ${user.id}).`, {
      ...this.LOG_CONTEXT,
      tenant: `${user.tenantId}`,
    });
    return { key, code, expiresAt };
  }

  @AssertRole('verify code', VerifyUserRoles.Verifier)
  async verify(user: User, key: string, code: string) {
    this.logger.debug(`Verifying code at key '${key}' for user ${user.name} (ID: ${user.id})...`, {
      ...this.LOG_CONTEXT,
      tenant: `${user.tenantId}`,
    });

    const cacheKey = this.getCacheKey(user, key);
    const record = await this.repository.get(cacheKey);
    let valid = false;
    if (record) {
      valid = record.code === code;
      if (!valid) {
        // Increment failure and clear if max reached.
        if (await this.repository.failed(cacheKey, 10)) {
          this.logger.warn(
            `Cleared code at key ${key} because verification has failed too many times. ` +
              `Last failure by user ${user.name} (ID: ${user.id}).`,
            {
              ...this.LOG_CONTEXT,
              tenant: `${user.tenantId}`,
            }
          );
        }
      }
    }

    this.logger.info(`Verified code at key ${key} for user ${user.name} (ID: ${user.id}) with result '${valid}'.`, {
      ...this.LOG_CONTEXT,
      tenant: `${user.tenantId}`,
    });

    return valid;
  }

  private getCacheKey(user: User, key: string) {
    const prefix = user.tenantId.resource;
    return `${prefix}:${key}`;
  }
}

interface ServiceProps {
  logger: Logger;
  repository: CodeRepository;
}

export const createVerifyService = ({ logger, repository }: ServiceProps): VerifyService => {
  return new VerifyServiceImpl(logger, repository);
};
