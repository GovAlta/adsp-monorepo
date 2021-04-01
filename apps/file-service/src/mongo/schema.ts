import { Schema } from 'mongoose';

const fileTypeDefinition = {
  _id: false,
  name: {
    type: String,
    required: true,
  },
  anonymousRead: {
    type: Boolean,
    default: false,
  },
  readRoles: {
    type: [String],
    default: [],
  },
  updateRoles: {
    type: [String],
    default: [],
  },
};

export const fileSpaceSchema = new Schema({
  _id: String,
  name: {
    type: String,
    required: true,
  },
  spaceAdminRole: {
    type: String,
    required: true,
  },
  types: {
    type: Map,
    of: fileTypeDefinition,
  },
});

export const fileSchema = new Schema({
  _id: String,
  spaceId: {
    type: String,
    ref: 'filespace',
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
  },
  lastAccessed: Date,
  scanned: {
    type: Boolean,
    default: false,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
