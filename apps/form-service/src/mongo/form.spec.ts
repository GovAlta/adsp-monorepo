import '@abgov/adsp-service-sdk';
import { adspId } from '@abgov/adsp-service-sdk';
import { connect, connection, model, Model } from 'mongoose';
import { Logger } from 'winston';
import { MongoFormRepository } from './form';
import { FormEntity, FormStatus } from '../form';

describe('MongoFormRepository', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const mockDefinitionRepository = {
    getDefinition: jest.fn().mockResolvedValue(null),
  };

  const mockNotificationService = {
    getSubscriber: jest.fn(),
  };

  let repo: MongoFormRepository;
  let mongoose: typeof import('mongoose');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let formModel: Model<any>;

  beforeAll(async () => {
    mongoose = await connect(process.env.MONGO_URL);
    repo = new MongoFormRepository(logger, mockDefinitionRepository as never, mockNotificationService as never);
    formModel = model('form');
  });

  beforeEach(async () => {
    await formModel.deleteMany({});
    jest.clearAllMocks();
    mockDefinitionRepository.getDefinition.mockResolvedValue(null);
  });

  afterAll(async () => {
    await connection.close();
  });

  function generateId(): string {
    return `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const DAY_MS = 24 * 60 * 60 * 1000;

  function daysFrom(base: Date, days: number): Date {
    return new Date(base.getTime() + days * DAY_MS);
  }

  async function saveForms(...overrides: Partial<FormEntity>[]): Promise<void> {
    for (const override of overrides) {
      await repo.save(createForm(override));
    }
  }

  function createForm(overrides: Partial<FormEntity> = {}): FormEntity {
    const now = new Date();

    return {
      id: generateId(),
      tenantId,
      definition: { id: 'test-definition' },
      applicant: null,
      formDraftUrl: 'https://my-form/test',
      anonymousApplicant: false,
      created: now,
      createdBy: { id: 'user-1', name: 'Test User' },
      locked: null,
      submitted: null,
      lastAccessed: now,
      status: FormStatus.Draft,
      data: {},
      files: {},
      hash: 'abc123',
      dryRun: false,
      securityClassification: null,
      registeredId: undefined,
      ...overrides,
    } as FormEntity;
  }

  describe('find', () => {
    beforeEach(async () => {
      const baseDate = new Date('2024-01-15T10:00:00Z');

      await saveForms(
        { id: 'form-1', created: daysFrom(baseDate, -2) },
        { id: 'form-2', created: daysFrom(baseDate, -1) },
        { id: 'form-3', created: daysFrom(baseDate, 1) },
      );
    });

    it('should find forms created after a date', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        createDateAfter: new Date('2024-01-15T00:00:00Z'),
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('form-3');
    });

    it('should find forms created before a date', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        createDateBefore: new Date('2024-01-14T00:00:00Z'),
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('form-1');
    });

    it('should find forms created within a date range', async () => {
      // form-1: 2024-01-13T10:00:00Z, form-2: 2024-01-14T10:00:00Z, form-3: 2024-01-16T10:00:00Z
      // Only form-2 falls within [2024-01-14T00:00:00Z, 2024-01-15T00:00:00Z].
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        createDateAfter: new Date('2024-01-14T00:00:00Z'),
        createDateBefore: new Date('2024-01-15T00:00:00Z'),
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('form-2');
    });

    it('should return all forms when no date criteria is specified', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
      });
      expect(results.results).toHaveLength(3);
    });
  });

  describe('find by criteria', () => {
    it('should find forms by definition ID case insensitively', async () => {
      await saveForms({ id: 'form-1' }, { id: 'form-2', definition: { id: 'other-definition' } as never });

      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        definitionIdEquals: 'Test-Definition',
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('form-1');
    });

    it('should find forms by status', async () => {
      await saveForms({ id: 'form-1', status: FormStatus.Submitted }, { id: 'form-2', status: FormStatus.Draft });

      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        statusEquals: FormStatus.Submitted,
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('form-1');
    });

    it('should find forms locked before a date', async () => {
      await saveForms(
        { id: 'form-1', locked: new Date('2024-01-10T00:00:00Z') },
        { id: 'form-2', locked: new Date('2024-01-20T00:00:00Z') },
      );

      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        lockedBefore: new Date('2024-01-15T00:00:00Z'),
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('form-1');
    });

    it('should find forms last accessed before a date', async () => {
      await saveForms(
        { id: 'form-1', lastAccessed: new Date('2024-01-10T00:00:00Z') },
        { id: 'form-2', lastAccessed: new Date('2024-01-20T00:00:00Z') },
      );

      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        lastAccessedBefore: new Date('2024-01-15T00:00:00Z'),
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('form-1');
    });

    it('should find forms by hash', async () => {
      await saveForms({ id: 'form-1', hash: 'hash-1' }, { id: 'form-2', hash: 'hash-2' });

      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        hashEquals: 'hash-1',
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('form-1');
    });

    it('should find forms by created by ID', async () => {
      await saveForms(
        { id: 'form-1', createdBy: { id: 'user-1', name: 'Test User' } },
        { id: 'form-2', createdBy: { id: 'user-2', name: 'Other User' } },
      );

      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        createdByIdEquals: 'user-2',
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('form-2');
    });

    it('should find forms by anonymous applicant', async () => {
      await saveForms({ id: 'form-1', anonymousApplicant: true }, { id: 'form-2', anonymousApplicant: false });

      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        anonymousApplicantEquals: true,
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('form-1');
    });

    it('should find forms by data criteria', async () => {
      await saveForms({ id: 'form-1', data: { field1: 'value1' } }, { id: 'form-2', data: { field1: 'value2' } });

      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        dataCriteria: { field1: 'value1' },
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('form-1');
    });
  });

  describe('get', () => {
    it('should get a saved form', async () => {
      await repo.save(createForm({ id: 'form-1' }));

      const result = await repo.get(tenantId, 'form-1');
      expect(result).toBeTruthy();
      expect(result.id).toBe('form-1');
    });

    it('should return null for non-existent form', async () => {
      const result = await repo.get(tenantId, 'non-existent');
      expect(result).toBeNull();
    });

    it('should map applicant and files of a saved form', async () => {
      const subscriber = { urn: adspId`urn:ads:platform:notification-service:v1:/subscribers/test` };
      mockNotificationService.getSubscriber.mockResolvedValue(subscriber);

      await repo.save(
        createForm({
          id: 'form-1',
          applicant: subscriber as never,
          files: {
            'supporting.document': adspId`urn:ads:platform:file-service:v1:/files/file-1`,
            missing: null,
          },
        })
      );

      const result = await repo.get(tenantId, 'form-1');
      const [, subscriberId] = mockNotificationService.getSubscriber.mock.calls[0];
      expect(`${subscriberId}`).toBe('urn:ads:platform:notification-service:v1:/subscribers/test');
      expect(result.applicant).toBe(subscriber);
      expect(result.files['supporting.document'].toString()).toBe('urn:ads:platform:file-service:v1:/files/file-1');
      expect(result.files['missing']).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a saved form', async () => {
      const form = createForm({ id: 'form-1' });
      await repo.save(form);

      const deleted = await repo.delete(form);
      expect(deleted).toBe(true);
      expect(await repo.get(tenantId, 'form-1')).toBeNull();
    });

    it('should return false for non-existent form', async () => {
      const deleted = await repo.delete(createForm({ id: 'non-existent' }));
      expect(deleted).toBe(false);
    });
  });
});
