import { Schema, model, Model, Document } from 'mongoose';

// ✓ CAS:RULE-015 — userId+tenantId unique constraint (one context per user per tenant)
// ✓ ASVS:V4.1.1 — preferences are low-sensitivity UI settings; userId is Protected A

// DDL source: user_context → MongoDB collection: userContexts
// Protected A: userId is a GoA employee identifier (POPA s.17)

export interface IUserContext {
  contextId: string;
  userId: string;
  tenantId: string;
  // Low-sensitivity UI preferences (font size, theme, etc.)
  preferences?: Record<string, unknown>;
  lastActiveSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserContextDocument extends IUserContext, Document {}

const UserContextSchema = new Schema<IUserContextDocument>(
  {
    contextId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    preferences: { type: Schema.Types.Mixed },
    lastActiveSessionId: { type: String },
  },
  {
    collection: 'userContexts',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

// ✓ CAS:RULE-015 — unique constraint: one context record per user per tenant (DDL uq_user_context_user_tenant)
UserContextSchema.index({ userId: 1, tenantId: 1 }, { unique: true });

export const UserContextModel: Model<IUserContextDocument> = model<IUserContextDocument>(
  'UserContext',
  UserContextSchema,
);
