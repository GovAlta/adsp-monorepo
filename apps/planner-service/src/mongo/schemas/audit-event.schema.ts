import { Schema, model, Model, Document } from 'mongoose';

// ✓ ASVS:V7.2.2 — audit event schema for tamper-evident HMAC chain (BR-008, SYSREQ-020)
// ✓ CAS:RULE-028 — append-only collection; no delete or update operations permitted
// ✓ ASVS:V7.2.1 — captures actor, action, resource, outcome for complete audit trail

// DDL source: audit_event → MongoDB collection: auditEvents
// IMPORTANT: Application-layer append-only enforcement. The service layer MUST
// reject any attempt to update or delete audit event records.
// HMAC chain: each event's hmac field covers (previousEventId || JSON.stringify(eventPayload))
// signed with AUDIT_SIGNING_KEY. Protects against log tampering.

export type AuditOutcome = 'success' | 'failure';

export interface IAuditEvent {
  eventId: string;
  timestamp: Date;
  actorId: string;
  tenantId: string;
  action: string;
  resourceId?: string;
  resourceType?: string;
  outcome: AuditOutcome;
  // ✓ CAS:RULE-028 — HMAC-SHA256 of event payload using AUDIT_SIGNING_KEY
  hmac: string;
  // ✓ CAS:RULE-028 — chain reference; null for first event per tenant
  previousEventId: string | null;
  ipAddress?: string;
  userAgent?: string;
}

export interface IAuditEventDocument extends IAuditEvent, Document {}

const AuditEventSchema = new Schema<IAuditEventDocument>(
  {
    eventId: { type: String, required: true, unique: true },
    timestamp: { type: Date, required: true, default: () => new Date() },
    actorId: { type: String, required: true },
    tenantId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    resourceId: { type: String },
    resourceType: { type: String },
    outcome: {
      type: String,
      enum: ['success', 'failure'] as AuditOutcome[],
      required: true,
    },
    // ✓ ASVS:V7.2.2 — HMAC field is required; missing HMAC = rejected write
    hmac: { type: String, required: true },
    previousEventId: { type: String, default: null },
    // ✓ ASVS:V7.2.1 — IP and UA stored for traceability; no session content here
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    collection: 'auditEvents',
    // Disable built-in timestamps — timestamp is explicit required field
  },
);

AuditEventSchema.index({ tenantId: 1, timestamp: -1 });
AuditEventSchema.index({ tenantId: 1, actorId: 1, timestamp: -1 });
AuditEventSchema.index({ tenantId: 1, eventId: 1 }, { unique: true });

export const AuditEventModel: Model<IAuditEventDocument> = model<IAuditEventDocument>(
  'AuditEvent',
  AuditEventSchema,
);
