import { adspId } from '@abgov/adsp-service-sdk';
import { Knex } from 'knex';
import { SpecialistChat, StoredChatMessage } from '../planner';
import { PostgresSpecialistChatRepository } from './specialist-chat';

describe('PostgresSpecialistChatRepository', () => {
  const knexMock = jest.fn();
  const repository = new PostgresSpecialistChatRepository(knexMock as unknown as Knex);

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const messages: StoredChatMessage[] = [
    { role: 'user', content: 'How do I let applicants save drafts?', at: '2026-03-01T10:00:00.000Z', intent: 'ask' },
    {
      role: 'assistant',
      content: 'Enable draft saving on the form definition.',
      at: '2026-03-01T10:00:01.000Z',
      intent: 'ask',
      mode: 'ai',
      model: 'GOA-Default',
    },
  ];
  const record = {
    id: 'b7e2f6a1-4c3d-4e8f-9a1b-2c3d4e5f6a7b',
    tenant: tenantId.toString(),
    service: 'form-service',
    solutionId: '5f0a1c52-7d0e-4c1b-9a8e-3b6f2d1e4a70',
    title: 'How do I let applicants save drafts?',
    createdById: 'planner-1',
    createdByName: 'Pat Planner',
    createdOn: new Date('2026-03-01T10:00:00.000Z'),
    updatedOn: new Date('2026-03-01T10:00:01.000Z'),
    messages,
  };
  const chat: SpecialistChat = {
    id: record.id,
    tenantId,
    service: record.service,
    solutionId: record.solutionId,
    title: record.title,
    createdById: record.createdById,
    createdByName: record.createdByName,
    createdOn: record.createdOn,
    updatedOn: record.updatedOn,
    messages,
  };

  const plain = (c: SpecialistChat) => ({ ...c, tenantId: c.tenantId.toString() });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('find', () => {
    const queryMock = { where: jest.fn(), orderBy: jest.fn() };

    beforeEach(() => {
      queryMock.where.mockReturnValue(queryMock);
      knexMock.mockReturnValueOnce(queryMock);
    });

    it('queries the specialist_chats table', async () => {
      queryMock.orderBy.mockResolvedValueOnce([record]);

      await repository.find({ tenantId, createdById: 'planner-1' });

      expect(knexMock).toHaveBeenCalledWith('specialist_chats');
    });

    it('filters by tenant and creator', async () => {
      queryMock.orderBy.mockResolvedValueOnce([record]);

      await repository.find({ tenantId, createdById: 'planner-1' });

      expect(queryMock.where).toHaveBeenCalledWith({ tenant: tenantId.toString(), createdById: 'planner-1' });
    });

    it('filters by service when provided', async () => {
      queryMock.orderBy.mockResolvedValueOnce([record]);

      await repository.find({ tenantId, createdById: 'planner-1', service: 'form-service' });

      expect(queryMock.where).toHaveBeenCalledWith({
        tenant: tenantId.toString(),
        createdById: 'planner-1',
        service: 'form-service',
      });
    });

    it('filters by solution when provided', async () => {
      queryMock.orderBy.mockResolvedValueOnce([record]);

      await repository.find({ tenantId, createdById: 'planner-1', solutionId: record.solutionId });

      expect(queryMock.where).toHaveBeenCalledWith({
        tenant: tenantId.toString(),
        createdById: 'planner-1',
        solutionId: record.solutionId,
      });
    });

    it('filters by both service and solution when provided', async () => {
      queryMock.orderBy.mockResolvedValueOnce([record]);

      await repository.find({
        tenantId,
        createdById: 'planner-1',
        service: 'form-service',
        solutionId: record.solutionId,
      });

      expect(queryMock.where).toHaveBeenCalledWith({
        tenant: tenantId.toString(),
        createdById: 'planner-1',
        service: 'form-service',
        solutionId: record.solutionId,
      });
    });

    it('orders by most recently updated', async () => {
      queryMock.orderBy.mockResolvedValueOnce([record]);

      await repository.find({ tenantId, createdById: 'planner-1' });

      expect(queryMock.orderBy).toHaveBeenCalledWith('updatedOn', 'desc');
    });

    it('maps records to chats', async () => {
      queryMock.orderBy.mockResolvedValueOnce([record]);

      const result = await repository.find({ tenantId, createdById: 'planner-1' });

      expect(result.map(plain)).toEqual([plain(chat)]);
    });

    it('returns an empty list when the user has no chats', async () => {
      queryMock.orderBy.mockResolvedValueOnce([]);

      const result = await repository.find({ tenantId, createdById: 'planner-1' });

      expect(result).toEqual([]);
    });

    it('maps a missing solution id to undefined', async () => {
      queryMock.orderBy.mockResolvedValueOnce([{ ...record, solutionId: null }]);

      const [result] = await repository.find({ tenantId, createdById: 'planner-1' });

      expect(result.solutionId).toBeUndefined();
    });

    it('parses the tenant id into an AdspId', async () => {
      queryMock.orderBy.mockResolvedValueOnce([record]);

      const [result] = await repository.find({ tenantId, createdById: 'planner-1' });

      expect(result.tenantId.toString()).toBe(tenantId.toString());
    });
  });

  describe('get', () => {
    const queryMock = { where: jest.fn(), limit: jest.fn() };

    beforeEach(() => {
      queryMock.where.mockReturnValue(queryMock);
      knexMock.mockReturnValueOnce(queryMock);
    });

    it('queries by tenant and id', async () => {
      queryMock.limit.mockResolvedValueOnce([record]);

      await repository.get(tenantId, record.id);

      expect(queryMock.where).toHaveBeenCalledWith({ tenant: tenantId.toString(), id: record.id });
    });

    it('returns the mapped chat', async () => {
      queryMock.limit.mockResolvedValueOnce([record]);

      const result = await repository.get(tenantId, record.id);

      expect(plain(result)).toEqual(plain(chat));
    });

    it('returns null when the chat does not exist', async () => {
      queryMock.limit.mockResolvedValueOnce([]);

      const result = await repository.get(tenantId, 'missing');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    const queryMock = {
      insert: jest.fn(),
      onConflict: jest.fn(),
      merge: jest.fn(),
      returning: jest.fn(),
    };

    beforeEach(() => {
      queryMock.insert.mockReturnValue(queryMock);
      queryMock.onConflict.mockReturnValue(queryMock);
      queryMock.merge.mockReturnValue(queryMock);
      knexMock.mockReturnValueOnce(queryMock);
    });

    it('inserts the record with messages serialized as JSON', async () => {
      queryMock.returning.mockResolvedValueOnce([record]);

      await repository.save(chat);

      expect(queryMock.insert).toHaveBeenCalledWith({ ...record, messages: JSON.stringify(messages) });
    });

    it('upserts on id', async () => {
      queryMock.returning.mockResolvedValueOnce([record]);

      await repository.save(chat);

      expect(queryMock.onConflict).toHaveBeenCalledWith('id');
    });

    it('merges only the title, updated timestamp and messages on conflict', async () => {
      queryMock.returning.mockResolvedValueOnce([record]);

      await repository.save(chat);

      expect(queryMock.merge).toHaveBeenCalledWith(['title', 'updatedOn', 'messages']);
    });

    it('returns all columns of the saved row', async () => {
      queryMock.returning.mockResolvedValueOnce([record]);

      await repository.save(chat);

      expect(queryMock.returning).toHaveBeenCalledWith('*');
    });

    it('returns the saved chat', async () => {
      queryMock.returning.mockResolvedValueOnce([record]);

      const result = await repository.save(chat);

      expect(plain(result)).toEqual(plain(chat));
    });

    it('inserts a chat that is not about a solution without a solution id', async () => {
      queryMock.returning.mockResolvedValueOnce([{ ...record, solutionId: null }]);

      await repository.save({ ...chat, solutionId: undefined });

      expect(queryMock.insert).toHaveBeenCalledWith(expect.objectContaining({ solutionId: undefined }));
    });

    it('propagates database failures', async () => {
      queryMock.returning.mockRejectedValueOnce(new Error('connection refused'));

      await expect(repository.save(chat)).rejects.toThrow('connection refused');
    });
  });

  describe('delete', () => {
    const queryMock = { where: jest.fn(), delete: jest.fn() };

    beforeEach(() => {
      queryMock.where.mockReturnValue(queryMock);
      knexMock.mockReturnValueOnce(queryMock);
    });

    it('deletes by tenant and id', async () => {
      queryMock.delete.mockResolvedValueOnce(1);

      await repository.delete(tenantId, record.id);

      expect(queryMock.where).toHaveBeenCalledWith({ tenant: tenantId.toString(), id: record.id });
    });

    it('returns true when a row was deleted', async () => {
      queryMock.delete.mockResolvedValueOnce(1);

      const result = await repository.delete(tenantId, record.id);

      expect(result).toBe(true);
    });

    it('returns false when no row was deleted', async () => {
      queryMock.delete.mockResolvedValueOnce(0);

      const result = await repository.delete(tenantId, 'missing');

      expect(result).toBe(false);
    });
  });
});
