import { AdspId } from '@abgov/adsp-service-sdk';
import { SpecialistChat, SpecialistChatCriteria, SpecialistChatRepository } from '../planner';

const key = (tenantId: AdspId, id: string) => `${tenantId}|${id}`;

export class MemorySpecialistChatRepository implements SpecialistChatRepository {
  private chats = new Map<string, SpecialistChat>();

  async find(criteria: SpecialistChatCriteria): Promise<SpecialistChat[]> {
    return [...this.chats.values()]
      .filter(
        (c) =>
          c.tenantId.toString() === criteria.tenantId.toString() &&
          c.createdById === criteria.createdById &&
          (!criteria.service || c.service === criteria.service) &&
          (!criteria.solutionId || c.solutionId === criteria.solutionId),
      )
      .sort((a, b) => b.updatedOn.getTime() - a.updatedOn.getTime());
  }

  async get(tenantId: AdspId, id: string): Promise<SpecialistChat | null> {
    return this.chats.get(key(tenantId, id)) || null;
  }

  async save(chat: SpecialistChat): Promise<SpecialistChat> {
    this.chats.set(key(chat.tenantId, chat.id), chat);
    return chat;
  }

  async delete(tenantId: AdspId, id: string): Promise<boolean> {
    return this.chats.delete(key(tenantId, id));
  }
}
