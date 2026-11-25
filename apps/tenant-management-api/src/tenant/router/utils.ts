import { InvalidOperationError, InvalidValueError } from '@core-services/core-common';
import { Logger } from 'winston';
import { TenantRepository } from '../repository';

const LOG_CONTEXT = { context: 'TenantRouter' };

export const validateEmailInDB = async (logger: Logger, repository: TenantRepository, email: string): Promise<void> => {
  logger.debug(`Validate - has user created tenant realm before?`, LOG_CONTEXT);
  const isTenantAdmin = !!(await repository.find({ adminEmailEquals: email }))[0];

  if (isTenantAdmin) {
    const errorMessage = `${email} is the tenant admin in our record. One user can create only one realm.`;
    throw new InvalidOperationError(errorMessage);
  }
};

/**
 * Trims a tenant name and collapses repeated spaces, so the name is checked and stored in one form.
 * Anything that isn't a string is returned as is, for validateName to reject.
 */
export const normalizeTenantName = <T>(name: T): T =>
  (typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : name) as T;

/**
 * Checks that a tenant name is valid and not used by another tenant (ignoring case).
 * Pass excludeTenantId when renaming, so the tenant's own current name (or a change of case) is allowed.
 */
export const validateName = async (
  logger: Logger,
  repository: TenantRepository,
  name: string,
  excludeTenantId?: string,
): Promise<void> => {
  logger.debug(`Validate - is the tenant name valid and unique?`, LOG_CONTEXT);

  if (typeof name !== 'string') {
    throw new InvalidValueError('Tenant name', 'Enter a tenant name.');
  }

  const invalidChars = [
    '!',
    '*',
    "'",
    '(',
    ')',
    ';',
    ':',
    '@',
    '&',
    '=',
    '+',
    '$',
    ',',
    '/',
    '?',
    '%',
    '?',
    '#',
    '[',
    ']',
    '-',
  ];

  invalidChars.forEach((char) => {
    if (name.indexOf(char) !== -1) {
      const errorMessage = `Names cannot contain special characters (e.g. ! & %).`;
      throw new InvalidValueError('Tenant name', errorMessage);
    }
  });

  if (name.trim().length === 0) {
    const errorMessage = `Enter a tenant name.`;
    throw new InvalidValueError('Tenant name', errorMessage);
  }

  const tenantsWithName = await repository.find({ nameEquals: name });
  const doesTenantWithNameExist = tenantsWithName.some((tenant) => !excludeTenantId || tenant.id !== excludeTenantId);
  if (doesTenantWithNameExist) {
    const errorMessage = `This tenant name has already been used. Please enter a different tenant name.`;
    throw new InvalidValueError('Tenant name', errorMessage);
  }
};
