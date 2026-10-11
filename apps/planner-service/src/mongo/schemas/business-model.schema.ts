import { Schema, model, Model, Document } from 'mongoose';

// ✓ ASVS:V5.1.4 — enum constraints match DDL CHECK constraints for concept and relationship types
// ✓ CAS:RULE-015 — tenantId indexed; all queries must filter by tenantId

// DDL source: business_model + business_concept + concept_relationship
// MongoDB collection: businessModels (concepts[] embedded sub-documents)
// BR-006: BusinessConcept conceptType enum (15 valid types)

export type ConceptType =
  | 'Actor'
  | 'Goal'
  | 'Activity'
  | 'Decision'
  | 'Evidence'
  | 'BusinessRule'
  | 'Constraint'
  | 'EvaluationCriteria'
  | 'Workflow'
  | 'Outcome'
  | 'Document'
  | 'Event'
  | 'ExternalSystem'
  | 'Assumption'
  | 'Unknown';

export const CONCEPT_TYPES: ConceptType[] = [
  'Actor', 'Goal', 'Activity', 'Decision', 'Evidence',
  'BusinessRule', 'Constraint', 'EvaluationCriteria', 'Workflow',
  'Outcome', 'Document', 'Event', 'ExternalSystem', 'Assumption', 'Unknown',
];

export type RelationshipType = 'uses' | 'produces' | 'triggers' | 'governs' | 'requires' | 'part-of';

export const RELATIONSHIP_TYPES: RelationshipType[] = [
  'uses', 'produces', 'triggers', 'governs', 'requires', 'part-of',
];

export interface IConceptRelationship {
  targetConceptId: string;
  relationshipType: RelationshipType;
  description?: string;
}

export interface IBusinessConcept {
  conceptId: string;
  conceptType: ConceptType;
  name: string;
  description?: string;
  sourceText?: string;
  relationships: IConceptRelationship[];
}

export interface IBusinessModel {
  modelId: string;
  sessionId: string;
  tenantId: string;
  concepts: IBusinessConcept[];
  confidenceScore: number;
  version: number;
  matchedPatternId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusinessModelDocument extends IBusinessModel, Document {}

// concept_relationship embedded schema (_id: false — no sub-document IDs)
const ConceptRelationshipSchema = new Schema<IConceptRelationship>(
  {
    targetConceptId: { type: String, required: true },
    relationshipType: {
      type: String,
      // ✓ ASVS:V5.1.4 — matches concept_relationship.relationship_type CHECK constraint
      enum: RELATIONSHIP_TYPES,
      required: true,
    },
    description: { type: String },
  },
  { _id: false },
);

// business_concept embedded schema
const BusinessConceptSchema = new Schema<IBusinessConcept>(
  {
    conceptId: { type: String, required: true },
    conceptType: {
      type: String,
      // ✓ ASVS:V5.1.4 — matches business_concept.concept_type CHECK constraint (BR-006)
      enum: CONCEPT_TYPES,
      required: true,
    },
    name: { type: String, required: true, maxlength: 200 },
    description: { type: String },
    // ✓ CAS:RULE-028 — sourceText contains Protected B content; not logged, only stored
    sourceText: { type: String },
    relationships: { type: [ConceptRelationshipSchema], default: [] },
  },
  { _id: false },
);

const BusinessModelSchema = new Schema<IBusinessModelDocument>(
  {
    modelId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    concepts: { type: [BusinessConceptSchema], default: [] },
    // ✓ ASVS:V5.1.3 — confidence_score bounded 0-100 (BR-004)
    confidenceScore: { type: Number, required: true, min: 0, max: 100, default: 0 },
    version: { type: Number, required: true, min: 1, default: 1 },
    matchedPatternId: { type: String },
  },
  {
    collection: 'businessModels',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

BusinessModelSchema.index({ tenantId: 1, sessionId: 1 }, { unique: true });

export const BusinessModelModel: Model<IBusinessModelDocument> = model<IBusinessModelDocument>(
  'BusinessModel',
  BusinessModelSchema,
);
