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

export const slackSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    workspace: { type: String, required: true, index: true },
    installation: { type: Schema.Types.Mixed, required: true },
  },
  {
    _id: false,
  }
);

export const botSchema = new Schema(
  {
    channelId: { type: String, required: true },
    tenantId: { type: String, required: false },
    conversationId: { type: String, required: true },
    name: { type: String, required: false },
    serviceUrl: { type: String, required: true },
  },
  {
    _id: false,
  }
);

botSchema.index({ channelId: 1, tenantId: 1, conversationId: 1 }, { unique: true });
