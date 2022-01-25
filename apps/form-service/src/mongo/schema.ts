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

formSchema.index({ tenantId: 1, id: 1 }, { unique: true });
