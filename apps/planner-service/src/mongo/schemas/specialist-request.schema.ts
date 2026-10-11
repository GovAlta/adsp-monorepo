import { Schema, model, Model, Document } from 'mongoose';
import { SpecialistType } from '../../types';

// ✓ ASVS:V5.1.4 — specialist type and status enums match DDL CHECK constraints
// ✓ CAS:RULE-028 — requestPayload may contain Protected B session context; never logged

// DDL source: specialist_request → MongoDB collection: specialistRequests
// INT-003..006 are currently Stub status; this schema is forward-looking for when
// specialist integrations are enabled.

export type SpecialistRequestStatus = 'pending' | 'sent' | 'completed' | 'failed';

export interface ISpecialistRequest {
  requestId: string;
  sessionId: string;
  tenantId: string;
  // ✓ ASVS:V5.1.4 — specialist type matches SpecialistType union
  specialistType: SpecialistType;
  // ✓ CAS:RULE-028 — requestPayload contains Protected B context fragments
  requestPayload: Record<string, unknown>;
  status: SpecialistRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISpecialistRequestDocument extends ISpecialistRequest, Document {}

const SpecialistRequestSchema = new Schema<ISpecialistRequestDocument>(
  {
    requestId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    specialistType: {
      type: String,
      enum: ['form-service', 'pdf-service', 'comment-service', 'notification-service'] as SpecialistType[],
      required: true,
    },
    requestPayload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'completed', 'failed'] as SpecialistRequestStatus[],
      required: true,
      default: 'pending',
    },
  },
  {
    collection: 'specialistRequests',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

SpecialistRequestSchema.index({ tenantId: 1, sessionId: 1, status: 1 });

export const SpecialistRequestModel: Model<ISpecialistRequestDocument> =
  model<ISpecialistRequestDocument>('SpecialistRequest', SpecialistRequestSchema);
