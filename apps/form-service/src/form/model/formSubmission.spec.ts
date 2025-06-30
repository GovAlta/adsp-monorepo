import { adspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { FormSubmission, QueueTaskToProcess } from '../types';
import { FormSubmissionEntity } from './formSubmission';
import { FormServiceRoles } from '../roles';
import { FormEntity } from './form';
import { FormDefinitionEntity } from './definition';
import { InvalidValueError } from '@core-services/core-common';

describe('FormSubmission', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const validationService = {
    validate: jest.fn(),
    setSchema: jest.fn(),
  };

  const calendarService = {
    getScheduledIntake: jest.fn(),
  };

  const aDefinition = new FormDefinitionEntity(validationService, calendarService, tenantId, {
    id: 'test',
    name: 'test-form-definition',
    description: null,
    formDraftUrlTemplate: 'https://my-form/{{ id }}',
    anonymousApply: false,
    applicantRoles: ['test-applicant'],
    assessorRoles: ['test-assessor'],
    submissionRecords: true,
    submissionPdfTemplate: '',
    supportTopic: true,
    clerkRoles: [],
    dataSchema: null,
    dispositionStates: [{ id: 'rejected', name: 'rejected', description: 'err' }],
    queueTaskToProcess: { queueName: 'test', queueNameSpace: 'queue-namespace' } as QueueTaskToProcess,
    dryRun: false,
  });

  const formSubmissionMock = {
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    getByFormIdAndSubmissionId: jest.fn(),
    dispositionSubmission: jest.fn(),
  };

  const repositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn((save) => Promise.resolve(save)),
    delete: jest.fn(),
    getByFormIdAndSubmissionId: jest.fn(),
  };

  const formSubmissionInfo: FormSubmission = {
    id: 'formSubmission-id',
    formDefinitionId: 'test-form-definition',
    formDefinitionRevision: 0,
    formId: 'test-form',
    formData: {},
    formFiles: {},
    created: new Date(),
    createdBy: { id: 'tester', name: 'tester' },
    updatedBy: { id: 'tester', name: 'tester' },
    updated: new Date(),
    submissionStatus: '',
    disposition: {
      id: 'id',
      status: 'rejected',
      reason: 'invalid data',
      date: new Date(),
    },
    hash: 'hashid',
    dryRun: false,
  };

  beforeEach(() => {
    repositoryMock.save.mockClear();
    repositoryMock.delete.mockClear();
    validationService.validate.mockReset();
  });

  describe('form submission', () => {
    it('it can be created', () => {
      const entity = new FormSubmissionEntity(formSubmissionMock, tenantId, formSubmissionInfo);
      expect(entity).toBeTruthy();
      expect(entity).toMatchObject(formSubmissionInfo);
    });
  });

  it('can static create', async () => {
    const user: User = {
      tenantId,
      id: 'tester',
      email: 'test@test.com',
      isCore: false,
      name: 'tester',
      roles: [FormServiceRoles.Admin],
      token: {
        azp: '',
        aud: '',
        iss: '',
        bearer: '',
        email_verified: false,
      },
    };

    const entity = new FormSubmissionEntity(formSubmissionMock, tenantId, formSubmissionInfo);

    repositoryMock.save.mockResolvedValueOnce(entity);
    FormSubmissionEntity.create(user, repositoryMock, { definition: aDefinition } as FormEntity, '21');

    expect(repositoryMock.save).toBeCalled();
  });

  it('can delete form submission', async () => {
    const user: User = {
      tenantId,
      id: 'tester',
      email: 'test@test.com',
      isCore: false,
      name: 'tester',
      roles: [FormServiceRoles.Admin],
      token: {
        azp: '',
        aud: '',
        iss: '',
        bearer: '',
        email_verified: false,
      },
    };

    const entity = new FormSubmissionEntity(repositoryMock, tenantId, formSubmissionInfo);

    repositoryMock.delete.mockResolvedValueOnce(entity);
    entity.delete(user);
    expect(repositoryMock.delete).toBeCalled();
  });

  it('form submission cannot delete - unauthorized', async () => {
    const entity = new FormSubmissionEntity(repositoryMock, tenantId, formSubmissionInfo);
    await expect(entity.delete({ tenantId, id: 'tester', roles: [] } as User)).rejects.toThrow(UnauthorizedUserError);
  });

  it('form submission can update disposition', async () => {
    const before = new Date();
    const entity = new FormSubmissionEntity(repositoryMock, tenantId, formSubmissionInfo, aDefinition, {
      id: '242',
      definition: aDefinition,
    } as FormEntity);
    repositoryMock.save.mockResolvedValueOnce(entity);

    const user = { tenantId, id: 'tester', name: 'Tester', roles: [FormServiceRoles.Admin] } as User;
    const result = await entity.dispositionSubmission(user, 'rejected', 'bad data');

    expect(repositoryMock.save).toHaveBeenCalled();
    expect(result.updated.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.updatedBy).toMatchObject({ id: user.id, name: user.name });
  });

  it('form submission cannot update disposition - invalid status', async () => {
    const entity = new FormSubmissionEntity(repositoryMock, tenantId, formSubmissionInfo, aDefinition, {
      id: '242',
      definition: aDefinition,
    } as FormEntity);
    repositoryMock.save.mockResolvedValueOnce(entity);

    const user = { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] } as User;

    await expect(entity.dispositionSubmission(user, 'rejeacted', 'bad data')).rejects.toThrow(InvalidValueError);
  });

  it('form submission cannot update disposition - unauthorized', async () => {
    const entity = new FormSubmissionEntity(repositoryMock, tenantId, formSubmissionInfo, aDefinition, {
      id: 'fds435',
      definition: aDefinition,
    } as FormEntity);
    repositoryMock.save.mockResolvedValueOnce(entity);

    const user = { tenantId, id: 'tester', roles: ['abc'] } as User;

    await expect(entity.dispositionSubmission(user, 'rejeacted', 'bad data')).rejects.toThrow(UnauthorizedUserError);
  });

  it('can read definition is empty', async () => {
    const entity = new FormSubmissionEntity(repositoryMock, tenantId, formSubmissionInfo, aDefinition, {
      id: 'fds435',
      definition: null,
    } as FormEntity);

    const user = { tenantId, id: 'tester', roles: ['abc'] } as User;

    entity.canRead(user);
  });

  it('can read form is empty', async () => {
    const entity = new FormSubmissionEntity(repositoryMock, tenantId, formSubmissionInfo, null);

    const user = { tenantId, id: 'tester', roles: ['abvc'] } as User;

    entity.canRead(user);
  });
});
