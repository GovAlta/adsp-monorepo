import { Schema } from 'mongoose';

export const spaceSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  spaceAdminRole: {
    type: String,
  },
  subscriberAdminRole: {
    type: String,
  },
});

const templateSchema = {
  subject: String,
  body: String,
};

export const typeSchema = new Schema(
  {
    spaceId: {
      type: String,
      ref: 'space',
      required: true,
    },
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    events: {
      type: [
        {
          _id: false,
          namespace: {
            type: String,
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          templates: {
            email: templateSchema,
            mail: templateSchema,
            sms: templateSchema,
          },
          channels: {
            type: [
              {
                type: String,
                enum: ['email', 'mail', 'sms'],
              },
            ],
            required: true,
          },
        },
      ],
      required: true,
    },
    description: String,
    publicSubscribe: {
      type: Boolean,
    },
    subscriberRoles: {
      type: [String],
      required: true,
    },
  },
  { _id: false }
);

typeSchema.index({ spaceId: 1, _id: 1 }, { unique: true });
typeSchema.index({
  'events.namespace': 1,
  'events.name': 1,
});

export const subscriberSchema = new Schema({
  spaceId: {
    type: String,
    ref: 'space',
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

export const subscriptionSchema = new Schema(
  {
    spaceId: {
      type: String,
      ref: 'space',
      required: true,
    },
    typeId: {
      type: String,
      ref: 'notificationtype',
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

subscriptionSchema.index({ spaceId: 1, typeId: 1, subscriberId: 1 }, { unique: true });
