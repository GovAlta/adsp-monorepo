import { Schema, SchemaTypes } from 'mongoose';

export const revisionSchema = new Schema({
  namespace: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  tenant: String,
  revision: {
    type: Number,
    required: true,
    index: true,
  },
  active: {
    type: Number,
    required: false,
  },
  configuration: {
    type: SchemaTypes.Mixed,
    required: true,
  },
});
revisionSchema.index({ namespace: 1, name: 1, tenant: 1, revision: 1 }, { unique: true });
