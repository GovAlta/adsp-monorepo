import { Schema } from 'mongoose';

export const serviceOptionSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true,
    minlength: 1
  },
  configOptions: {
    type: String
  }
});

serviceOptionSchema.index({service:1, version:1}, {unique: true});

export const tenantConfigSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  realmName: {
    type: String,
    required: true,
    unique: true
  },
  configurationSettingsList: {
    type: String,
    required: true,
  }
});
