import { Schema, model, Model, Document } from 'mongoose';

// ✓ ASVS:V4.1.1 — tenantId indexed on all collections for multi-tenant isolation
// ✓ CAS:RULE-015 — every query MUST include tenantId filter (enforced at service layer)

// DDL source: planning_session → MongoDB collection: planningSessions
// Field mapping: SQL snake_case → Mongoose camelCase

export type SessionStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface IPlanningSession {
  sessionId: string;
  tenantId: string;
  userId: string;
  // ✓ ASVS:V5.1.4 — enum constraint matching DDL CHECK constraint (BR-001 session lifecycle)
  status: SessionStatus;
  title?: string;
  businessModelId?: string;
  lastResumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlanningSessionDocument extends IPlanningSession, Document {}

const PlanningSessionSchema = new Schema<IPlanningSessionDocument>(
  {
    // ✓ ASVS:V5.1.1 — required field validators match DDL NOT NULL constraints
    sessionId: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      // ✓ ASVS:V5.1.4 — enum matches planning_session.status CHECK constraint
      enum: ['active', 'paused', 'completed', 'archived'] as SessionStatus[],
      required: true,
      default: 'active',
    },
    title: { type: String, maxlength: 200 },
    businessModelId: { type: String },
    lastResumedAt: { type: Date },
  },
  {
    collection: 'planningSessions',
    // ✓ ASVS:V7.2.2 — timestamps auto-maintained for audit trail
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

// Compound index for tenant-scoped list queries (BR-001)
PlanningSessionSchema.index({ tenantId: 1, userId: 1, status: 1 });
PlanningSessionSchema.index({ tenantId: 1, createdAt: -1 });

export const PlanningSessionModel: Model<IPlanningSessionDocument> = model<IPlanningSessionDocument>(
  'PlanningSession',
  PlanningSessionSchema,
);
