import { Schema } from 'mongoose';
import { Channel } from '../notification';

export const subscriberSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
    },
    userId: String,
    addressAs: {
      type: String,
      required: true,
    },
    channels: {
      type: [
        {
          _id: false,
          channel: {
            type: String,
            enum: Object.values(Channel),
            required: true,
          },
          address: {
            type: String,
            required: true,
          },
          verifyKey: { type: String },
          verified: { type: Boolean },
          pendingVerification: { type: Boolean },
          timeCodeSent: { type: Number },
        },
      ],
      required: true,
    },
  },
  // The dates a subscriber was added and last changed are shown in the registry, so the database
  // keeps them rather than each write having to remember to.
  { timestamps: true }
);
subscriberSchema.index({ tenantId: 1, userId: 1 });
// The registry is listed a page at a time, filtered to the tenant and sorted on one column at a
// time. Cosmos DB's Mongo API only serves a sort on more than one field from a composite index
// matching it exactly, which its background index build does not reliably deliver in practice, so
// each sortable column that is stored as a field of its own gets a plain single-field index instead
// -- Cosmos treats those as always available, and combines the tenant filter with them for free.
// Columns derived from the channels array are sorted on a computed key and cannot be served this way.
subscriberSchema.index({ tenantId: 1 });
subscriberSchema.index({ addressAs: 1 });
subscriberSchema.index({ createdAt: 1 });
subscriberSchema.index({ updatedAt: 1 });

export const subscriptionSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
    },
    typeId: {
      type: String,
      required: true,
    },
    subscriberId: {
      type: Schema.Types.ObjectId,
      ref: 'subscriber',
      required: true,
    },
    criteria: Schema.Types.Mixed,
  },
  { _id: false }
);

subscriptionSchema.index({ tenantId: 1, typeId: 1, subscriberId: 1 });

export const botSchema = new Schema(
  {
    channelId: { type: String, required: true },
    tenantId: { type: String, required: false },
    conversationId: { type: String, required: true },
    name: { type: String, required: false },
    serviceUrl: { type: String, required: true },
    botId: { type: String, required: false },
    botName: { type: String, required: false },
  },
  {
    _id: false,
  }
);

botSchema.index({ channelId: 1, tenantId: 1, conversationId: 1 });
