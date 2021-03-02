import { Document, Model, model, Schema } from 'mongoose';

const roleSchema: Schema = new Schema({
  permissions: [
    {
      type: Object,
    },
  ],
  resouces: [
    {
      type: Object,
    },
  ],
});

const userSchema: Schema = new Schema(
  {
    username: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    version: {
      type: String,
      default: 'v1',
    },
    roles: [roleSchema],
  },
  { timestamps: true }
);

export interface User extends Document {
  username: string;
  email: string;
  roles?: Array<any>;
  tenantIds?: Array<string>;
  adminOfTenants: Array<string>;
}

export const User: Model<User> = model('User', userSchema);
