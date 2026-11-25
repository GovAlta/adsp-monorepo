import { adspId } from '@abgov/adsp-service-sdk';
import { connect, connection, model, Model } from 'mongoose';
import { Logger } from 'winston';
import { SharePointPush } from '../form';
import { MongoSharePointPushRepository } from './sharepointPush';

describe('MongoSharePointPushRepository', () => {
  const logger = { debug: jest.fn(), info: jest.fn(), error: jest.fn() } as unknown as Logger;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const now = new Date('2026-11-19T12:00:00Z');
  const leaseMs = 3 * 60 * 1000;

  let repo: MongoSharePointPushRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pushModel: Model<any>;

  const aPush = (id: string, nextAttemptAt: Date, props: Partial<SharePointPush> = {}): SharePointPush => ({
    id,
    tenantId,
    formId: 'form-1',
    submissionId: 'submission-1',
    attempts: 1,
    nextAttemptAt,
    ...props,
  });
  const minutes = (count: number) => new Date(now.getTime() + count * 60 * 1000);

  beforeAll(async () => {
    await connect(process.env.MONGO_URL);
    repo = new MongoSharePointPushRepository(logger);
    pushModel = model('sharePointPush');
    await pushModel.init();
  });

  beforeEach(async () => {
    await pushModel.deleteMany({});
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('claimDue', () => {
    it('resolves null when nothing is due', async () => {
      await repo.create(aPush('later', minutes(5)));

      expect(await repo.claimDue(now, leaseMs)).toBeNull();
    });

    it('takes a due push, counts the attempt and leases it', async () => {
      await repo.create(aPush('due', minutes(-1)));

      const claimed = await repo.claimDue(now, leaseMs);

      expect(claimed).toMatchObject({ id: 'due', formId: 'form-1', submissionId: 'submission-1', attempts: 2 });
      expect(claimed.tenantId.toString()).toBe(tenantId.toString());
      expect(claimed.nextAttemptAt).toEqual(new Date(now.getTime() + leaseMs));
    });

    it('takes the push that has been due the longest first', async () => {
      await repo.create(aPush('newer', minutes(-1)));
      await repo.create(aPush('older', minutes(-10)));

      expect((await repo.claimDue(now, leaseMs)).id).toBe('older');
    });

    it('keeps the PDF file ID of a submission PDF push', async () => {
      const pdfUrn = 'urn:ads:platform:file-service:v1:/files/pdf-1';
      await repo.create(aPush('due', minutes(-1), { submissionPdfFileId: pdfUrn }));

      expect(await repo.claimDue(now, leaseMs)).toMatchObject({ id: 'due', submissionPdfFileId: pdfUrn });
    });

    it('does not hand the same push to a second claim while it is leased', async () => {
      await repo.create(aPush('due', minutes(-1)));

      expect(await repo.claimDue(now, leaseMs)).not.toBeNull();
      expect(await repo.claimDue(now, leaseMs)).toBeNull();
    });

    it('lets only one of several claims made at the same time take the push', async () => {
      await repo.create(aPush('due', minutes(-1)));

      const claims = await Promise.all([1, 2, 3, 4, 5].map(() => repo.claimDue(now, leaseMs)));

      expect(claims.filter((claim) => claim !== null)).toHaveLength(1);
    });

    it('hands the push out again once its lease has run out', async () => {
      await repo.create(aPush('due', minutes(-1)));
      await repo.claimDue(now, leaseMs);

      const claimed = await repo.claimDue(new Date(now.getTime() + leaseMs + 1000), leaseMs);

      expect(claimed).toMatchObject({ id: 'due', attempts: 3 });
    });
  });

  describe('reschedule', () => {
    it('sets when the push is next due and the last error', async () => {
      await repo.create(aPush('due', minutes(-1)));
      await repo.claimDue(now, leaseMs);

      await repo.reschedule('due', minutes(1), 'network');

      expect(await repo.claimDue(now, leaseMs)).toBeNull();
      expect(await repo.claimDue(minutes(2), leaseMs)).toMatchObject({
        id: 'due',
        lastErrorCode: 'network',
        attempts: 3,
      });
    });
  });

  describe('delete', () => {
    it('removes the push', async () => {
      await repo.create(aPush('due', minutes(-1)));

      await repo.delete('due');

      expect(await repo.claimDue(now, leaseMs)).toBeNull();
    });
  });
});
