import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request, RequestHandler, Response } from 'express';
import { Logger } from 'winston';
import { FormServiceRoles } from '../roles';
import { updateIntakeSchedule } from './definition';
import {
  deleteFormSubmission,
  findFormSubmissions,
  findForms,
  findSubmissions,
  getForm,
  getFormSubmission,
} from './form';

// CS-5718: core users may omit tenantId, so these handlers must reject with a 400 instead of reading req.tenant.id.
describe('form routes without tenant context', () => {
  const apiId = adspId`urn:ads:platform:form-service:v1`;
  const repositoryMock = { find: jest.fn(), get: jest.fn(), delete: jest.fn() };
  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const coreUser = { isCore: true, id: 'core', roles: [FormServiceRoles.Admin] };

  const handlers: [string, RequestHandler][] = [
    ['findForms', findForms(apiId, repositoryMock as never)],
    ['findSubmissions', findSubmissions(apiId, repositoryMock as never)],
    ['findFormSubmissions', findFormSubmissions(apiId, repositoryMock as never, repositoryMock as never)],
    ['getForm', getForm(repositoryMock as never)],
    ['getFormSubmission', getFormSubmission(apiId, repositoryMock as never)],
    [
      'deleteFormSubmission',
      deleteFormSubmission(apiId, { send: jest.fn() } as never, repositoryMock as never, logger, {
        audit: jest.fn(),
      } as never),
    ],
    ['updateIntakeSchedule', updateIntakeSchedule({} as never)],
  ];

  it.each(handlers)('%s calls next with InvalidOperationError', async (_name, handler) => {
    const req = {
      user: coreUser,
      query: {},
      params: { formId: 'form', submissionId: 'submission', definitionId: 'definition' },
      body: {},
      getServiceConfiguration: jest.fn(),
    };
    const next = jest.fn();

    await handler(req as unknown as Request, { send: jest.fn() } as unknown as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    expect(repositoryMock.find).not.toHaveBeenCalled();
    expect(repositoryMock.get).not.toHaveBeenCalled();
    expect(req.getServiceConfiguration).not.toHaveBeenCalled();
  });
});
