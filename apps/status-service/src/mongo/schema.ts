import { Schema } from 'mongoose';

export const serviceStatusEndpointSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'disabled',
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
    statusTimestamp: {
      type: Number,
    },
    timeIntervalMin: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: 'disabled',
      required: true,
    },
    endpoints: [serviceStatusEndpointSchema],
  },
  { timestamps: true }
);

export const noticeEndpointSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

export const noticeApplicationSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
    },
    tennantServRef: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    mode: {
      type: String,
      defualt: 'draft',
      required: true,
    },
    endpoints: [noticeEndpointSchema],
  },
  { timestamps: true }
);
