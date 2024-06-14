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
  anonymousRead: {
    type: Boolean,
    required: false,
  },
  revision: {
    type: Number,
    required: true,
    index: true,
  },
  created: {
    type: Date,
    required: false,
  },
  lastUpdated: {
    type: Date,
    required: false,
  },
  configuration: {
    type: SchemaTypes.Mixed,
    required: true,
  },
});
revisionSchema.index({ namespace: 1, name: 1, tenant: 1, revision: 1 }, { unique: true });

export const activeRevisionSchema = new Schema({
  namespace: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  tenant: String,
  anonymousRead: {
    type: Boolean,
    required: false,
  },
  active: {
    type: Number,
    required: false,
  },
  created: {
    type: Date,
    required: false,
  },
  lastUpdated: {
    type: Date,
    required: false,
  },
});

activeRevisionSchema.index({ namespace: 1, name: 1, tenant: 1 }, { unique: true });
