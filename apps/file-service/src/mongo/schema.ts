import { Schema } from 'mongoose';

export const fileSchema = new Schema({
  _id: String,
  spaceId: {
    type: String,
    required: true,
  },
  typeId: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: false,
  },
  securityClassification: {
    type: String,
    required: false,
  },
  filename: {
    type: String,
    required: true,
  },
  storage: {
    type: String,
    required: true,
  },
  recordId: String,
  createdBy: {
    name: {
      type: String,
      default: '',
    },
    id: {
      type: String,
      required: true,
    },
  },
  created: {
    type: Date,
    required: true,
    index: true,
  },
  lastAccessed: Date,
  scanned: {
    type: Boolean,
    default: false,
  },
  infected: {
    type: Boolean,
    default: false,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  digest: String,
});
