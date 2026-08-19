import { Schema } from 'mongoose';
import { FormStatus } from '../form';

export const formSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
    },
    definitionId: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    securityClassification: {
      type: String,
    },
    formDraftUrl: {
      type: String,
    },
    anonymousApplicant: {
      type: Boolean,
      default: false,
    },
    // Applicant URN no longer stored here, except for in old form records.
    // Instead this property is used for the uniqueness constraint on application user ID.
    applicantId: {
      type: String,
      required: true,
    },
    subscriberId: {
      type: String,
    },
    created: {
      type: Date,
      required: true,
      index: true,
    },
    createdBy: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    locked: Date,
    submitted: Date,
    lastAccessed: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: [FormStatus.Draft, FormStatus.Locked, FormStatus.Submitted, FormStatus.Archived],
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    files: {
      type: Schema.Types.Map,
      of: String,
      required: true,
    },
    hash: {
      type: String,
      index: true,
    },
    dryRun: {
      type: Boolean,
    },
  },
  { _id: false }
);

formSchema.index({ tenantId: 1, id: 1 }, { unique: true });
formSchema.index({ tenantId: 1, definitionId: 1, applicantId: 1 }, { unique: true });

// Sortable columns need an index the sort can be served from. A top level column is sorted with the
// create date as tie breaker, which one composite index covers in both directions. Data value
// columns are at paths that vary by definition, so a wildcard index covers them; it indexes single
// fields only, which is why those columns are sorted on one key.
formSchema.index({ status: 1, created: 1 });
formSchema.index({ 'data.$**': 1 });

export const createdBy = {
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
};

export const formDeposition = {
  id: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
};

// clean-code-ignore: RULE-19 — schema declarations only.
export const formSubmissionNoteSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    created: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: createdBy,
      required: true,
    },
  },
  { _id: false }
);

export const formSubmissionSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    formDefinitionId: {
      type: String,
      required: true,
    },
    formDefinitionRevision: {
      type: Number,
    },
    formId: {
      type: String,
      required: true,
    },
    tenantId: {
      type: String,
      required: true,
    },
    formData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    formFiles: {
      type: Schema.Types.Map,
      of: String,
      required: true,
    },
    created: {
      type: Date,
      required: true,
      index: true,
    },
    createdBy: {
      type: createdBy,
      required: true,
    },
    // Updated by defined as two distinct properties for backwards compatibility.
    updatedBy: {
      type: String,
      required: true,
    },
    updatedById: {
      type: String,
      required: true,
    },
    updatedDateTime: {
      type: Date,
      required: true,
    },
    submissionStatus: {
      type: String,
      required: false,
    },
    securityClassification: {
      type: String,
    },
    dryRun: {
      type: Boolean,
    },
    disposition: { type: formDeposition, required: false },
    notes: { type: [formSubmissionNoteSchema], required: false },
    hash: String,
  },
  { _id: false }
);

formSubmissionSchema.index({ tenantId: 1, formDefinitionId: 1 });
formSubmissionSchema.index({ submissionStatus: 1, created: 1 });
// Nested columns are indexed on their own; a composite index is not supported on a nested path.
formSubmissionSchema.index({ 'disposition.status': 1 });
formSubmissionSchema.index({ 'formData.$**': 1 });
