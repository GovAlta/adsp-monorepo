import { Schema } from 'mongoose';

export const tenantSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    version: {
      type: String,
      default: 'v1',
    },
    realm: {
      type: String,
      required: true,
    },
    adminEmail: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
