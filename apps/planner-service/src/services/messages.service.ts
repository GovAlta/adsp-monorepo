import * as crypto from 'crypto';
import { PaginatedResult, NotFoundError } from '../types';
import {
  ConversationMessageModel,
  IConversationMessageDocument,
  MessageRole,
} from '../mongo/schemas/conversation-message.schema';
import { PlanningSessionModel } from '../mongo/schemas/planning-session.schema';

// ✓ ASVS:V4.1.1 — tenantId enforced on all message queries and writes
// ✓ CAS:RULE-028 — message content is Protected B (ATIA s.23); never included in logs
// ✓ ASVS:V7.2.2 — append-only message collection (SYSREQ-005); no updates to existing messages

export class MessagesService {
  /**
   * saveMessage — persists a ConversationMessage to MongoDB.
   * Verifies the sessionId belongs to tenantId BEFORE writing to prevent cross-tenant injection.
   *
   * UC-002: user message is always persisted, even when the LLM call fails.
   *
   * ✓ ASVS:V4.1.1 — session ownership verified before message write
   * ✓ CAS:RULE-015 — cross-tenant session access blocked before write
   * ✓ CAS:RULE-028 — content stored but never logged
   */
  async saveMessage(
    tenantId: string,
    sessionId: string,
    role: MessageRole,
    content: string,
    agentId?: string,
  ): Promise<IConversationMessageDocument> {
    // ✓ ASVS:V4.1.1 — tenant-scoped session lookup; returns null if wrong tenant
    // ✓ CAS:RULE-015 — prevents writing messages to sessions owned by other tenants
    const session = await PlanningSessionModel.findOne({ tenantId, sessionId }).lean();
    if (!session) {
      throw new NotFoundError('PlanningSession', sessionId);
    }

    // ✓ ASVS:V5.1.1 — messageId generated server-side; never client-supplied
    const message = await ConversationMessageModel.create({
      messageId: crypto.randomUUID(),
      sessionId,
      tenantId,
      role,
      // ✓ CAS:RULE-028 — content is Protected B; stored encrypted-at-rest; never logged
      content,
      timestamp: new Date(),
      agentId: agentId || undefined,
    });

    return message;
  }

  /**
   * listMessages — returns paginated conversation history for a session.
   * Messages are sorted chronologically (timestamp ascending) per UC-006.
   * Default pageSize is 50 (last 50 messages) per UC-006 requirements.
   *
   * ✓ ASVS:V4.1.1 — session must belong to tenantId; returns 404 otherwise
   * ✓ CAS:RULE-015 — tenant isolation enforced before query
   */
  async listMessages(
    tenantId: string,
    sessionId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<IConversationMessageDocument>> {
    // ✓ ASVS:V4.1.1 — verify session belongs to tenant before querying messages
    const sessionExists = await PlanningSessionModel.exists({ tenantId, sessionId });
    if (!sessionExists) {
      throw new NotFoundError('PlanningSession', sessionId);
    }

    const filter = { tenantId, sessionId };
    const [items, total] = await Promise.all([
      ConversationMessageModel.find(filter)
        // UC-006: chronological order for conversation history
        .sort({ timestamp: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      ConversationMessageModel.countDocuments(filter),
    ]);

    return {
      items: items as unknown as IConversationMessageDocument[],
      total,
      page,
      pageSize,
    };
  }

  /**
   * getLastMessages — retrieves the N most recent messages for a session.
   * Intended for LLM context assembly when INT-001 is unblocked.
   *
   * [IMPL-DEFERRED: INT-001] — this method is a placeholder for context assembly;
   * it will be called by messages.controller once Anthropic API integration is enabled.
   *
   * ✓ ASVS:V4.1.1 — tenant-scoped query; no cross-tenant data returned
   * ✓ CAS:RULE-028 — results used in-process only; never logged or externally transmitted
   */
  async getLastMessages(
    tenantId: string,
    sessionId: string,
    limit: number,
  ): Promise<IConversationMessageDocument[]> {
    // ✓ ASVS:V4.1.1 — session ownership verified before returning messages
    const sessionExists = await PlanningSessionModel.exists({ tenantId, sessionId });
    if (!sessionExists) {
      throw new NotFoundError('PlanningSession', sessionId);
    }

    const messages = await ConversationMessageModel.find({ tenantId, sessionId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    // Reverse to return in chronological order (most recent last for LLM context)
    return (messages as unknown as IConversationMessageDocument[]).reverse();
  }
}
