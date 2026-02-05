import '@abgov/adsp-service-sdk';
import { adspId, AdspId } from '@abgov/adsp-service-sdk';
import { connect, connection, model, Model } from 'mongoose';
import { Logger } from 'winston';
import { MongoFormSubmissionRepository } from './formSubmission';
import { FormSubmissionEntity, FormDefinitionEntity, FormEntity } from '../form';

describe('MongoFormSubmissionRepository', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  // Mock definition that will be returned by the repository
  const mockDefinition = {
    id: 'test-definition',
    name: 'Test Definition',
    tenantId,
  } as FormDefinitionEntity;

  // Mock repositories - return minimal mock objects
  const mockDefinitionRepository = {
    getDefinition: jest.fn().mockResolvedValue(mockDefinition),
  };

  const mockFormRepository = {
    get: jest.fn().mockResolvedValue(null),
  };

  let repo: MongoFormSubmissionRepository;
  let mongoose: typeof import('mongoose');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let submissionModel: Model<any>;

  beforeAll(async () => {
    mongoose = await connect(process.env.MONGO_URL);
    repo = new MongoFormSubmissionRepository(
      logger,
      mockDefinitionRepository as never,
      mockFormRepository as never
    );
    // Get reference to the model that was created in the repository
    submissionModel = model('formSubmission');
  });

  beforeEach(async () => {
    await submissionModel.deleteMany({});
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockDefinitionRepository.getDefinition.mockResolvedValue(mockDefinition);
    mockFormRepository.get.mockResolvedValue(null);
  });

  afterAll(async () => {
    await connection.close();
  });

  function generateId(): string {
    return `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function createSubmission(overrides: Partial<FormSubmissionEntity> = {}): FormSubmissionEntity {
    const now = new Date();
    const formId = overrides.formId || 'form-123';
    
    // Create a minimal form object since toDoc uses entity.form?.id
    const mockForm = {
      id: formId,
      dryRun: overrides.dryRun || false,
    } as FormEntity;
    
    return {
      id: generateId(),
      tenantId,
      formId,
      formDefinitionId: 'test-definition',
      formDefinitionRevision: 1,
      formData: { field1: 'value1' },
      formFiles: {},
      created: now,
      createdBy: { id: 'user-1', name: 'Test User' },
      updatedBy: { id: 'user-1', name: 'Test User' },
      updated: now,
      submissionStatus: 'submitted',
      disposition: null,
      hash: 'abc123',
      securityClassification: null,
      dryRun: false,
      form: mockForm,
      ...overrides,
      // Ensure form.id matches formId if overridden
      ...(overrides.formId && { form: { ...mockForm, id: overrides.formId } }),
    } as FormSubmissionEntity;
  }

  describe('save and get', () => {
    it('should save and retrieve a submission', async () => {
      const submission = createSubmission();
      await repo.save(submission);

      const retrieved = await repo.get(tenantId, submission.id);
      expect(retrieved).toBeTruthy();
      expect(retrieved.id).toBe(submission.id);
      expect(retrieved.formData).toEqual({ field1: 'value1' });
    });

    it('should return null for non-existent submission', async () => {
      const retrieved = await repo.get(tenantId, 'non-existent-id');
      expect(retrieved).toBeNull();
    });

    it('should retrieve submission by formId', async () => {
      const submission = createSubmission({ formId: 'specific-form' });
      await repo.save(submission);

      const retrieved = await repo.get(tenantId, submission.id, 'specific-form');
      expect(retrieved).toBeTruthy();
      expect(retrieved.formId).toBe('specific-form');
    });

    it('should update existing submission on save', async () => {
      const submission = createSubmission();
      await repo.save(submission);

      submission.formData = { field1: 'updated-value' };
      submission.submissionStatus = 'processed';
      await repo.save(submission);

      const retrieved = await repo.get(tenantId, submission.id);
      expect(retrieved.formData).toEqual({ field1: 'updated-value' });
      expect(retrieved.submissionStatus).toBe('processed');
    });
  });

  describe('find', () => {
    const testFormId = 'form-A';

    beforeEach(async () => {
      // Create test submissions with various attributes
      const baseDate = new Date('2024-01-15T10:00:00Z');

      await repo.save(
        createSubmission({
          id: 'sub-1',
          formId: testFormId,
          formDefinitionId: 'def-1',
          submissionStatus: 'submitted',
          created: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          createdBy: { id: 'user-1', name: 'Alice' },
          formData: { category: 'support', priority: 'high' },
        })
      );

      await repo.save(
        createSubmission({
          id: 'sub-2',
          formId: testFormId,
          formDefinitionId: 'def-1',
          submissionStatus: 'processing',
          created: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          createdBy: { id: 'user-2', name: 'Bob' },
          formData: { category: 'billing', priority: 'low' },
          disposition: {
            id: 'disp-1',
            status: 'approved',
            reason: 'Valid request',
            date: new Date(baseDate.getTime()),
          },
        })
      );

      await repo.save(
        createSubmission({
          id: 'sub-3',
          formId: 'form-B',
          formDefinitionId: 'def-2',
          submissionStatus: 'submitted',
          created: baseDate,
          createdBy: { id: 'user-1', name: 'Alice' },
          formData: { category: 'support', priority: 'medium' },
        })
      );

      await repo.save(
        createSubmission({
          id: 'sub-4',
          formId: testFormId,
          formDefinitionId: 'def-1',
          submissionStatus: 'rejected',
          created: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day later
          createdBy: { id: 'user-3', name: 'Charlie' },
          formData: { category: 'billing', priority: 'high' },
          disposition: {
            id: 'disp-2',
            status: 'rejected',
            reason: 'Incomplete data',
            date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          },
        })
      );
    });

    it('should find submissions by formId', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
      });
      expect(results.results).toHaveLength(3);
    });

    it('should find submissions by definitionId', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: 'form-B',
        definitionIdEquals: 'def-2',
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('sub-3');
    });

    it('should find submissions by status', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
        submissionStatusEquals: 'submitted',
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('sub-1');
    });

    it('should find submissions created before a date', async () => {
      // sub-1 is created at 2024-01-13T10:00:00Z (2 days before base)
      // sub-2 is created at 2024-01-14T10:00:00Z (1 day before base)
      // Querying for createDateBefore 2024-01-13T12:00:00Z should only return sub-1
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
        createDateBefore: new Date('2024-01-13T12:00:00Z'),
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('sub-1');
    });

    it('should find submissions created after a date', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
        createDateAfter: new Date('2024-01-15T08:00:00Z'),
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('sub-4');
    });

    it('should find submissions by createdBy name', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
        createdByIdEquals: 'Alice',
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('sub-1');
    });

    it('should find dispositioned submissions', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
        dispositioned: true,
      });
      expect(results.results).toHaveLength(2);
    });

    it('should find non-dispositioned submissions', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
        dispositioned: false,
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('sub-1');
    });

    it('should find submissions by disposition status', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
        dispositionStatusEquals: 'approved',
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('sub-2');
    });

    it('should find submissions by nested formData criteria', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
        dataCriteria: { category: 'support' },
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('sub-1');
    });

    it('should find submissions with multiple formData criteria', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
        dataCriteria: { category: 'billing', priority: 'high' },
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('sub-4');
    });

    it('should combine multiple criteria', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
        submissionStatusEquals: 'submitted',
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].id).toBe('sub-1');
    });

    it('should sort by created date descending', async () => {
      const results = await repo.find(10, null, { 
        tenantIdEquals: tenantId,
        formIdEquals: testFormId, 
      });
      const dates = results.results.map((r) => new Date(r.created).getTime());

      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    it('should paginate results', async () => {
      const page1 = await repo.find(2, null, { 
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
      });
      expect(page1.results).toHaveLength(2);
      expect(page1.page.next).toBeTruthy();
      expect(page1.page.size).toBe(2);

      const page2 = await repo.find(2, page1.page.next, { 
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
      });
      expect(page2.results).toHaveLength(1);

      // Ensure no duplicates between pages
      const page1Ids = page1.results.map((r) => r.id);
      const page2Ids = page2.results.map((r) => r.id);
      expect(page1Ids.filter((id) => page2Ids.includes(id))).toHaveLength(0);
    });

    it('should return empty results for no matches', async () => {
      const results = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        formIdEquals: testFormId,
        submissionStatusEquals: 'non-existent-status',
      });
      expect(results.results).toHaveLength(0);
    });

    it('should throw error without tenant context', () => {
      expect(() => repo.find(10, null, { formIdEquals: testFormId } as never)).toThrow(
        'Cannot retrieve submissions without tenant context.'
      );
    });
  });

  describe('delete', () => {
    it('should delete a submission', async () => {
      const submission = createSubmission();
      await repo.save(submission);

      const deleted = await repo.delete(submission);
      expect(deleted).toBe(true);

      const retrieved = await repo.get(tenantId, submission.id);
      expect(retrieved).toBeNull();
    });

    it('should return false when submission does not exist', async () => {
      const submission = createSubmission({ id: 'non-existent' });
      const deleted = await repo.delete(submission);
      expect(deleted).toBe(false);
    });
  });
});
