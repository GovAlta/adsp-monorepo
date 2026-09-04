import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import { configurationSchema } from './configuration';

describe('configuration', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  it('is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('configuration', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'configuration', configurationSchema);
  });

  it('accepts a form definition with review configuration', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('formDefinition', configurationSchema);
    service.validate('test', 'formDefinition', {
      id: 'intake',
      name: 'Intake',
      anonymousApply: false,
      applicantRoles: [],
      assessorRoles: [],
      reviewConfiguration: {
        columns: [{ path: 'applicant.firstName' }, { path: 'fileNumber' }],
      },
    });
  });

  it('rejects review columns without a path', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('formDefinition', configurationSchema);

    expect(() =>
      service.validate('test', 'formDefinition', {
        id: 'intake',
        name: 'Intake',
        anonymousApply: false,
        applicantRoles: [],
        assessorRoles: [],
        reviewConfiguration: { columns: [{}] },
      }),
    ).toThrow();
  });
  it.each([['intake@gov.ab.ca'], [''], [null]])('accepts a questions email of %p', (questionsEmail) => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('formDefinition', configurationSchema);
    service.validate('test', 'formDefinition', {
      id: 'intake',
      name: 'Intake',
      anonymousApply: false,
      applicantRoles: [],
      assessorRoles: [],
      reviewConfiguration: { columns: [], questionsEmail },
    });
  });

  it('rejects a questions email that is not an address', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('formDefinition', configurationSchema);

    expect(() =>
      service.validate('test', 'formDefinition', {
        id: 'intake',
        name: 'Intake',
        anonymousApply: false,
        applicantRoles: [],
        assessorRoles: [],
        reviewConfiguration: { columns: [], questionsEmail: 'not an address' },
      }),
    ).toThrow();
  });
});
