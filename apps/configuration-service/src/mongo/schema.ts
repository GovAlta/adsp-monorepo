import { Schema, SchemaTypes } from 'mongoose';

export const revisionSchema = new Schema({
  namespace: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    required: true,
  },
  tenant: String,
  revision: {
    type: Number,
    required: true,
  },
  configuration: {
    type: SchemaTypes.Mixed,
    required: true,
  },
});
revisionSchema.index({ namespace: 1, service: 1, tenant: 1, revision: 1 }, { unique: true });
