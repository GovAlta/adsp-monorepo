import { InvalidOperationError, InvalidValueError } from '@core-services/core-common';
import { Logger } from 'winston';
import { TenantRepository } from '../repository';

export const validateEmailInDB = async (logger: Logger, repository: TenantRepository, email: string): Promise<void> => {
  logger.info(`Validate - has user created tenant realm before?`);
  const isTenantAdmin = !!(await repository.find({ adminEmailEquals: email }))[0];

  if (isTenantAdmin) {
    const errorMessage = `${email} is the tenant admin in our record. One user can create only one realm.`;
    throw new InvalidOperationError(errorMessage);
  }
};

export const validateName = async (logger: Logger, repository: TenantRepository, name: string): Promise<void> => {
  logger.info(`Validate - is the tenant name valid and unique?`);

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

  if (name.length === 0) {
    const errorMessage = `Enter a tenant name.`;
    throw new InvalidValueError('Tenant name', errorMessage);
  }

  const doesTenantWithNameExist = (await repository.find({ nameEquals: name }))[0];
  if (doesTenantWithNameExist) {
    const errorMessage = `This tenant name has already been used. Please enter a different tenant name.`;
    throw new InvalidValueError('Tenant name', errorMessage);
  }
};
