import { Schema } from 'mongoose';

export const directorySchema = new Schema({
  _id: String,
  name: {
    type: String,
    required: true,
  },
  services: [
    {
      service: {
        type: String,
        required: true,
      },
      host: {
        type: String,
        default: true,
      },
    },
  ],
});
