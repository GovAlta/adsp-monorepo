import { Schema } from 'mongoose';

export const serviceStatusEndpointSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

export const serviceStatusApplicationSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    statusTimestamp: {
      type: Number,
    },
    timeIntervalMin: {
      type: Number,
      required: true,
    },
    endpoints: [serviceStatusEndpointSchema],
  },
  { timestamps: true }
);
