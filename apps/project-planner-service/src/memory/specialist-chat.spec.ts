import { adspId } from '@abgov/adsp-service-sdk';
import type { SpecialistChat } from '../planner';
import { MemorySpecialistChatRepository } from './specialist-chat';

describe('MemorySpecialistChatRepository', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/local`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/alberta-health`;

  const createChat = (overrides: Partial<SpecialistChat> = {}): SpecialistChat => ({
    id: 'chat-1',
    tenantId,
    service: 'form-service',
    solutionId: 'grant-intake',
    title: 'Form questions',
    createdById: 'user-1',
    createdByName: 'Pat Planner',
    createdOn: new Date('2026-10-01T00:00:00Z'),
    updatedOn: new Date('2026-10-01T00:00:00Z'),
    messages: [],
    ...overrides,
  });

  let repository: MemorySpecialistChatRepository;

  beforeEach(() => {
    repository = new MemorySpecialistChatRepository();
  });

  it('returns null for an unknown chat', async () => {
    const result = await repository.get(tenantId, 'missing');

    expect(result).toBeNull();
  });

  it('returns a saved chat by tenant and id', async () => {
    const chat = createChat();
    await repository.save(chat);

    const result = await repository.get(tenantId, chat.id);

    expect(result).toBe(chat);
  });

  it('does not return a chat saved for another tenant', async () => {
    await repository.save(createChat({ tenantId: otherTenantId }));

    const result = await repository.get(tenantId, 'chat-1');

    expect(result).toBeNull();
  });

  it('deletes a saved chat', async () => {
    await repository.save(createChat());

    const result = await repository.delete(tenantId, 'chat-1');

    expect(result).toBe(true);
  });

  it('reports false when deleting an unknown chat', async () => {
    const result = await repository.delete(tenantId, 'missing');

    expect(result).toBe(false);
  });

  it('finds only the requesting user chats for the tenant, newest first', async () => {
    await repository.save(createChat({ id: 'older', updatedOn: new Date('2026-10-01T00:00:00Z') }));
    await repository.save(createChat({ id: 'newer', updatedOn: new Date('2026-10-05T00:00:00Z') }));
    await repository.save(createChat({ id: 'other-user', createdById: 'user-2' }));
    await repository.save(createChat({ id: 'other-tenant', tenantId: otherTenantId }));

    const result = await repository.find({ tenantId, createdById: 'user-1' });

    expect(result.map((c) => c.id)).toEqual(['newer', 'older']);
  });

  it('filters chats by service', async () => {
    await repository.save(createChat({ id: 'form-chat', service: 'form-service' }));
    await repository.save(createChat({ id: 'file-chat', service: 'file-service' }));

    const result = await repository.find({ tenantId, createdById: 'user-1', service: 'file-service' });

    expect(result.map((c) => c.id)).toEqual(['file-chat']);
  });

  it('filters chats by solution', async () => {
    await repository.save(createChat({ id: 'grant-chat', solutionId: 'grant-intake' }));
    await repository.save(createChat({ id: 'permit-chat', solutionId: 'permit-renewal' }));

    const result = await repository.find({ tenantId, createdById: 'user-1', solutionId: 'permit-renewal' });

    expect(result.map((c) => c.id)).toEqual(['permit-chat']);
  });
});
