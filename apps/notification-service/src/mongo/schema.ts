import { Schema } from 'mongoose';
import { Channel } from '../notification';

export const subscriberSchema = new Schema({
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
      },
    ],
    required: true,
  },
});
subscriberSchema.index(
  { tenantId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $exists: true } } }
);

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
    criteria: {
      _id: false,
      correlationId: String,
      context: {
        type: Map,
        of: Schema.Types.Mixed,
      },
    },
  },
  { _id: false }
);

subscriptionSchema.index({ tenantId: 1, typeId: 1, subscriberId: 1 }, { unique: true });

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

botSchema.index({ channelId: 1, tenantId: 1, conversationId: 1 }, { unique: true });
