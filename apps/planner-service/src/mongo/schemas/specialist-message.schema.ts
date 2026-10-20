import { Schema, model, Model, Document } from 'mongoose';

// ✓ CAS:RULE-028 — content field contains Protected B deliberative content; never logged
// ✓ ASVS:V4.1.1 — tenantId + sessionId on all queries; no cross-tenant access
// ✓ ASVS:V5.1.4 — role enum matches allowed values

// DDL: specialist_direct_message → MongoDB collection: specialistDirectMessages
// Multi-turn direct chat between the user and a specialist agent (UC-005 direct mode).
// [IMPL-DEFERRED: INT-003..006] — assistant messages are stubs until agents are live.

export type DirectMessageRole = 'user' | 'assistant';

export interface ISpecialistDirectMessage {
  messageId: string;
  sessionId: string;
  tenantId: string;
  specialistType: string;
  role: DirectMessageRole;
  /** Protected B — deliberative content; never logged */
  content: string;
  createdAt: Date;
}

export interface ISpecialistDirectMessageDocument extends ISpecialistDirectMessage, Document {}

const SpecialistDirectMessageSchema = new Schema<ISpecialistDirectMessageDocument>(
  {
    messageId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    specialistType: { type: String, required: true },
    role: {
      type: String,
      enum: ['user', 'assistant'] as DirectMessageRole[],
      required: true,
    },
    // ✓ ASVS:V5.1.3 — max 10 000 chars; matches UI textarea maxCount
    content: { type: String, required: true, minlength: 1, maxlength: 10000 },
  },
  {
    collection: 'specialistDirectMessages',
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  },
);

// Compound index supports history fetch (sessionId+specialistType) ordered by createdAt
SpecialistDirectMessageSchema.index({ tenantId: 1, sessionId: 1, specialistType: 1, createdAt: 1 });

export const SpecialistDirectMessageModel: Model<ISpecialistDirectMessageDocument> =
  model<ISpecialistDirectMessageDocument>('SpecialistDirectMessage', SpecialistDirectMessageSchema);
