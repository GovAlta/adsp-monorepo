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
    status: {
      type: String,
      enum: ['provisioning', 'active', 'archived'],
      default: 'active',
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

tenantSchema.index({ status: 1, deletedAt: 1 });
