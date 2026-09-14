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
// The registry is listed a page at a time and sorted on a column, and the database serves a sort
// only from an index. Each sortable column that is stored as a field of its own therefore gets a
// composite index of the tenant (always matched on), the column, and the id that breaks ties, so
// that paging over a column with repeated values returns each subscriber exactly once. Columns
// derived from the channels array are sorted on a computed key and cannot be served this way.
subscriberSchema.index({ tenantId: 1, addressAs: 1, _id: 1 });
subscriberSchema.index({ tenantId: 1, createdAt: 1, _id: 1 });
subscriberSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

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
