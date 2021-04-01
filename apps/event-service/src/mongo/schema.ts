import { Schema } from 'mongoose';

const definitionSchema = {
  _id: false,
  description: {
    type: String,
  },
  payloadSchema: {
    type: Schema.Types.Mixed,
  },
  sendRoles: {
    type: [String],
  },
};

export const namespaceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    adminRole: {
      type: String,
    },
    definitions: {
      type: Map,
      of: definitionSchema,
    },
  },
  { _id: false }
);

namespaceSchema.index('name', { unique: true });
