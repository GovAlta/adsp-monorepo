import { Schema } from 'mongoose';

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
          enum: ['email', 'mail', 'sms'],
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
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
