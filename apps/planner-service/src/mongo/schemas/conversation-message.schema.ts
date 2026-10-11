import { Schema, model, Model, Document } from 'mongoose';

// ✓ ASVS:V5.1.4 — message role enum matches DDL CHECK constraint
// ✓ CAS:RULE-028 — content field contains Protected B data; never logged
// ✓ ASVS:V7.2.2 — append-only collection (SYSREQ-005); no updates to existing messages

// DDL source: conversation_message → MongoDB collection: conversationMessages
// SYSREQ-005: append-only conversation history; no updates to existing messages

export type MessageRole = 'user' | 'assistant' | 'system';

export interface IConversationMessage {
  messageId: string;
  sessionId: string;
  tenantId: string;
  // ✓ ASVS:V5.1.4 — role enum enforces conversation structure
  role: MessageRole;
  // ✓ CAS:RULE-028 — content is Protected B deliberative government content (ATIA s.23)
  content: string;
  timestamp: Date;
  agentId?: string;
}

export interface IConversationMessageDocument extends IConversationMessage, Document {}

const ConversationMessageSchema = new Schema<IConversationMessageDocument>(
  {
    messageId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'] as MessageRole[],
      required: true,
    },
    // SYSREQ-024: max 10,000 characters per message
    content: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 10000,
    },
    timestamp: { type: Date, required: true, default: () => new Date() },
    agentId: { type: String },
  },
  {
    collection: 'conversationMessages',
    // No timestamps option — timestamp is explicit field to preserve insert order
  },
);

ConversationMessageSchema.index({ tenantId: 1, sessionId: 1, timestamp: 1 });

export const ConversationMessageModel: Model<IConversationMessageDocument> =
  model<IConversationMessageDocument>('ConversationMessage', ConversationMessageSchema);
