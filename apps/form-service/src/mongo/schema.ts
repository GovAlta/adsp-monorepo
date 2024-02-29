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
    formDraftUrl: {
      type: String,
    },
    anonymousApplicant: {
      type: Boolean,
      default: false,
    },
    applicantId: {
      type: String,
      required: true,
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
    dispositionStates: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: false },
      },
    ],
    submissionRecords: {
      type: Boolean,
      required: false,
    },
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
  },
  { _id: false }
);

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
    updatedBy: {
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
    disposition: { type: formDeposition, required: false },
    hash: String,
  },
  { _id: false }
);

formSchema.index({ tenantId: 1, id: 1 }, { unique: true });
formSchema.index({ tenantId: 1, definitionId: 1, applicantId: 1 }, { unique: true });
