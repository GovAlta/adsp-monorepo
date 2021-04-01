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
  adminRole: {
    type: String,
  },
});

export const streamSchema = new Schema(
  {
    spaceId: {
      type: String,
      required: true,
      ref: 'space',
    },
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    subscriberRoles: {
      type: [String],
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
          map: {
            type: Object,
          },
          criteria: {
            type: {
              correlationId: String,
              context: Object,
            },
          },
        },
      ],
      required: true,
    },
  },
  { _id: false }
);

streamSchema.index({ spaceId: 1, _id: 1 }, { unique: true });
