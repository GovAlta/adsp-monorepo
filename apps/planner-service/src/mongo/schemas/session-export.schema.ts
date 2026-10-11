import { Schema, model, Model, Document } from 'mongoose';

// ✓ CAS:RULE-028 — exportData is a full Protected B session snapshot; never logged
// ✓ CAS:RULE-015 — tenantId indexed; userId indexed for own-session access control

// DDL source: session_export → MongoDB collection: sessionExports
// SYSREQ-016: export as portable JSON document (UC-008)

export interface ISessionExport {
  exportId: string;
  sessionId: string;
  tenantId: string;
  userId: string;
  // ✓ CAS:RULE-028 — exportData contains full Protected B planning session content
  exportData: Record<string, unknown>;
  format: string;
  exportedAt: Date;
}

export interface ISessionExportDocument extends ISessionExport, Document {}

const SessionExportSchema = new Schema<ISessionExportDocument>(
  {
    exportId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    exportData: { type: Schema.Types.Mixed, required: true },
    format: {
      type: String,
      required: true,
      // ✓ ASVS:V5.1.4 — only JSON format supported in this version
      enum: ['json'],
      default: 'json',
    },
    exportedAt: { type: Date, required: true, default: () => new Date() },
  },
  {
    collection: 'sessionExports',
  },
);

SessionExportSchema.index({ tenantId: 1, sessionId: 1 });
SessionExportSchema.index({ tenantId: 1, userId: 1, exportedAt: -1 });

export const SessionExportModel: Model<ISessionExportDocument> = model<ISessionExportDocument>(
  'SessionExport',
  SessionExportSchema,
);
