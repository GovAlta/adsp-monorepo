import { Schema } from 'mongoose';

export const jobSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  jobId: {
    type: String,
    required: true,
  },
  tenantId: {
    type: String,
    required: true,
  },
});
