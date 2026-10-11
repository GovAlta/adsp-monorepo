import { Schema, model, Model, Document } from 'mongoose';

// ✓ ASVS:V5.1.4 — hypothesis status enum matches DDL CHECK constraint (BR-010)
// ✓ CAS:RULE-015 — tenantId indexed; all queries must filter by tenantId

// DDL source: hypothesis_record → MongoDB collection: solutionHypotheses
// Note: collection name is plural; SQL table is hypothesis_record (singular per ISO 11179)

export type HypothesisStatus = 'draft' | 'proposed' | 'accepted' | 'rejected' | 'superseded';

export interface IHypothesisRecord {
  hypothesisId: string;
  sessionId: string;
  tenantId: string;
  // ✓ ASVS:V5.1.4 — status enum enforces BR-010 state machine transitions
  status: HypothesisStatus;
  // adspServices: AI-recommended ADSP services (at least one required)
  adspServices: string[];
  summary: string;
  version: number;
  patternId?: string;
  reasoning?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHypothesisRecordDocument extends IHypothesisRecord, Document {}

const HypothesisRecordSchema = new Schema<IHypothesisRecordDocument>(
  {
    hypothesisId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'proposed', 'accepted', 'rejected', 'superseded'] as HypothesisStatus[],
      required: true,
      default: 'draft',
    },
    adspServices: {
      type: [String],
      required: true,
      // ✓ ASVS:V5.1.3 — must have at least one ADSP service recommended
      validate: {
        validator: (v: string[]) => v.length >= 1,
        message: 'At least one ADSP service must be recommended',
      },
      default: [],
    },
    summary: { type: String, required: true },
    version: { type: Number, required: true, min: 1, default: 1 },
    patternId: { type: String },
    reasoning: { type: String },
  },
  {
    collection: 'solutionHypotheses',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

HypothesisRecordSchema.index({ tenantId: 1, sessionId: 1, status: 1 });
HypothesisRecordSchema.index({ tenantId: 1, createdAt: -1 });

export const HypothesisRecordModel: Model<IHypothesisRecordDocument> = model<IHypothesisRecordDocument>(
  'HypothesisRecord',
  HypothesisRecordSchema,
);
