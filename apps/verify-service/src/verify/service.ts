import { AssertRole, User } from '@abgov/adsp-service-sdk';
import * as random from 'crypto-random-string';
import { Logger } from 'winston';
import { CodeRepository } from './repository';
import { VerifyUserRoles } from './roles';

export interface VerifyService {
  generate(user: User, key: string): Promise<{ key: string; code: string; expiresAt: Date }>;
  verify(user: User, key: string, code: string): Promise<boolean>;
}

class VerifyServiceImpl implements VerifyService {
  private LOG_CONTEXT = { context: 'VerifyService' };

  constructor(private readonly logger: Logger, private readonly repository: CodeRepository) {}

  @AssertRole('generate code', VerifyUserRoles.Generator)
  async generate(user: User, key: string) {
    this.logger.debug(`Generating new verify code at key '${key}' for user ${user.name} (ID: ${user.id})...`, {
      ...this.LOG_CONTEXT,
      tenant: `${user.tenantId}`,
    });

    const prefix = this.getPrefix(user);
    const code = random({ length: 6, type: 'distinguishable' });
    const expiresAt = new Date(Date.now() + 600000);
    await this.repository.set({ key: `${prefix}:${key}`, code }, expiresAt);

    this.logger.info(`Generated new verify code at key '${key}' for user ${user.name} (ID: ${user.id}).`, {
      ...this.LOG_CONTEXT,
      tenant: `${user.tenantId}`,
    });
    return { key, code, expiresAt };
  }

  async verify(user: User, key: string, code: string) {
    this.logger.debug(`Verifying code at key '${key}' for user ${user.name} (ID: ${user.id})...`, {
      ...this.LOG_CONTEXT,
      tenant: `${user.tenantId}`,
    });

    const prefix = this.getPrefix(user);
    const record = await this.repository.get(`${prefix}:${key}`);
    const valid = record?.code === code;

    this.logger.info(`Verified code at key ${key} for user ${user.name} (ID: ${user.id}) with result '${valid}'.`, {
      ...this.LOG_CONTEXT,
      tenant: `${user.tenantId}`,
    });

    return valid;
  }

  private getPrefix(user: User) {
    const prefix = user.tenantId.resource;
    return prefix;
  }
}

interface ServiceProps {
  logger: Logger;
  repository: CodeRepository;
}

export const createVerifyService = ({ logger, repository }: ServiceProps): VerifyService => {
  return new VerifyServiceImpl(logger, repository);
};
