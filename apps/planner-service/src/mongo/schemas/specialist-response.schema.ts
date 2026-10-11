import { Schema, model, Model, Document } from 'mongoose';

// ✓ CAS:RULE-028 — responsePayload may contain Protected B AI analysis; never logged
// ✓ CAS:RULE-015 — tenantId indexed for multi-tenant isolation

// DDL source: specialist_response → MongoDB collection: specialistResponses

export interface ISpecialistResponse {
  responseId: string;
  requestId: string;
  sessionId: string;
  tenantId: string;
  // ✓ CAS:RULE-028 — responsePayload contains AI-generated analysis of Protected B input
  responsePayload: Record<string, unknown>;
  receivedAt: Date;
}

export interface ISpecialistResponseDocument extends ISpecialistResponse, Document {}

const SpecialistResponseSchema = new Schema<ISpecialistResponseDocument>(
  {
    responseId: { type: String, required: true, unique: true },
    requestId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    responsePayload: { type: Schema.Types.Mixed, required: true },
    receivedAt: { type: Date, required: true, default: () => new Date() },
  },
  {
    collection: 'specialistResponses',
  },
);

SpecialistResponseSchema.index({ tenantId: 1, sessionId: 1 });
SpecialistResponseSchema.index({ tenantId: 1, requestId: 1 }, { unique: true });

export const SpecialistResponseModel: Model<ISpecialistResponseDocument> =
  model<ISpecialistResponseDocument>('SpecialistResponse', SpecialistResponseSchema);
