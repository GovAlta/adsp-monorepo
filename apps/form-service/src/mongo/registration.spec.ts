import { adspId, User } from '@abgov/adsp-service-sdk';
import { connect, connection, model, Model } from 'mongoose';
import { Logger } from 'winston';
import { FormRegistrationEntity, RegistrationStatus } from '../form';
import { MongoFormRegistrationRepository } from './registration';

describe('MongoFormRegistrationRepository', () => {
  const logger = { debug: jest.fn(), info: jest.fn(), error: jest.fn() } as unknown as Logger;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/other`;
  const definitionId = 'medical-intake';
  const reviewer = { id: 'reviewer-1', name: 'Reviewer' } as User;

  let repo: MongoFormRegistrationRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let registrationModel: Model<any>;

  const createEntity = (email = 'test.user@gov.ab.ca', tenant = tenantId) =>
    FormRegistrationEntity.create(tenant, definitionId, {
      firstName: 'Test',
      lastName: 'User',
      email,
      data: { profession: 'nurse' },
    });

  beforeAll(async () => {
    await connect(process.env.MONGO_URL);
    repo = new MongoFormRegistrationRepository(logger);
    registrationModel = model('formRegistration');
    await registrationModel.init();
  });

  beforeEach(async () => {
    await registrationModel.deleteMany({});
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('create', () => {
    it('stores the request', async () => {
      const entity = createEntity();
      const created = await repo.create(entity);

      expect(created).toMatchObject({
        id: entity.id,
        formDefinitionId: definitionId,
        status: RegistrationStatus.Pending,
        email: 'test.user@gov.ab.ca',
        data: { profession: 'nurse' },
      });
      expect(created.tenantId).toBe(tenantId);
    });

    it('rejects a second pending request for the same email and form with a conflict', async () => {
      await repo.create(createEntity());

      await expect(repo.create(createEntity('Test.User@gov.ab.ca'))).rejects.toMatchObject({
        extra: { statusCode: 409 },
      });
    });

    it('allows a new request once the earlier one is reviewed', async () => {
      const first = await repo.create(createEntity());
      await repo.updateIfPending(first.review(reviewer, RegistrationStatus.Denied));

      await expect(repo.create(createEntity())).resolves.toBeTruthy();
    });

    it('allows the same email for another tenant', async () => {
      await repo.create(createEntity());

      await expect(repo.create(createEntity('test.user@gov.ab.ca', otherTenantId))).resolves.toBeTruthy();
    });

    it('still rejects a duplicate after a review that leaves the registration pending', async () => {
      const first = await repo.create(createEntity());
      await repo.updateIfPending(first.review(reviewer, RegistrationStatus.Pending));

      await expect(repo.create(createEntity())).rejects.toMatchObject({ extra: { statusCode: 409 } });
    });
  });

  describe('get', () => {
    it('returns the request for the tenant and form', async () => {
      const created = await repo.create(createEntity());

      await expect(repo.get(tenantId, definitionId, created.id)).resolves.toMatchObject({ id: created.id });
    });

    it('returns null for another tenant', async () => {
      const created = await repo.create(createEntity());

      await expect(repo.get(otherTenantId, definitionId, created.id)).resolves.toBeNull();
    });

    it('returns null for another form', async () => {
      const created = await repo.create(createEntity());

      await expect(repo.get(tenantId, 'other-form', created.id)).resolves.toBeNull();
    });
  });

  describe('getLatestByEmail', () => {
    it('returns the most recent request for the email regardless of case', async () => {
      const first = createEntity();
      first.submittedAt = new Date('2026-01-01T00:00:00Z');
      await repo.create(first);
      await repo.updateIfPending(first.review(reviewer, RegistrationStatus.Denied));
      const second = await repo.create(createEntity());

      await expect(repo.getLatestByEmail(tenantId, definitionId, 'TEST.USER@gov.ab.ca')).resolves.toMatchObject({
        id: second.id,
        status: RegistrationStatus.Pending,
      });
    });

    it('returns null when there is no request', async () => {
      await expect(repo.getLatestByEmail(tenantId, definitionId, 'nobody@gov.ab.ca')).resolves.toBeNull();
    });
  });

  describe('find', () => {
    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        const entity = createEntity(`user${i}@gov.ab.ca`);
        entity.submittedAt = new Date(Date.UTC(2026, 0, i + 1));
        await repo.create(entity);
      }
      const approved = createEntity('approved@gov.ab.ca');
      approved.submittedAt = new Date(Date.UTC(2026, 0, 10));
      await repo.create(approved);
      await repo.updateIfPending(approved.review(reviewer, RegistrationStatus.Approved));
      await repo.create(createEntity('user0@gov.ab.ca', otherTenantId));
    });

    it('requires tenant criteria', async () => {
      await expect(repo.find(10, null, { tenantIdEquals: null, definitionIdEquals: definitionId })).rejects.toThrow(
        /tenant context/,
      );
    });

    it('returns requests for the tenant and form, newest first', async () => {
      const { results, page } = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        definitionIdEquals: definitionId,
      });

      expect(results.map((r) => r.email)).toEqual([
        'approved@gov.ab.ca',
        'user2@gov.ab.ca',
        'user1@gov.ab.ca',
        'user0@gov.ab.ca',
      ]);
      expect(page).toMatchObject({ size: 4, total: 4 });
    });

    it('filters by status', async () => {
      const { results } = await repo.find(10, null, {
        tenantIdEquals: tenantId,
        definitionIdEquals: definitionId,
        statusEquals: RegistrationStatus.Approved,
      });

      expect(results.map((r) => r.email)).toEqual(['approved@gov.ab.ca']);
    });

    it('pages the results', async () => {
      const first = await repo.find(2, null, { tenantIdEquals: tenantId, definitionIdEquals: definitionId });
      const second = await repo.find(2, first.page.next, {
        tenantIdEquals: tenantId,
        definitionIdEquals: definitionId,
      });

      expect(first.results).toHaveLength(2);
      expect(first.page.next).toBeTruthy();
      expect(second.results.map((r) => r.email)).toEqual(['user1@gov.ab.ca', 'user0@gov.ab.ca']);
    });
  });

  describe('updateIfPending', () => {
    it('stores the review of a pending request', async () => {
      const created = await repo.create(createEntity());
      const updated = await repo.updateIfPending(created.review(reviewer, RegistrationStatus.Approved));

      expect(updated).toMatchObject({
        status: RegistrationStatus.Approved,
        reviewedBy: { id: 'reviewer-1', name: 'Reviewer' },
      });
      expect(updated.reviewedAt).toBeInstanceOf(Date);
    });

    it('returns null when the stored request is no longer pending', async () => {
      const created = await repo.create(createEntity());
      const stale = await repo.get(tenantId, definitionId, created.id);
      await repo.updateIfPending(created.review(reviewer, RegistrationStatus.Approved));

      await expect(repo.updateIfPending(stale.review(reviewer, RegistrationStatus.Denied))).resolves.toBeNull();
    });
  });
});
