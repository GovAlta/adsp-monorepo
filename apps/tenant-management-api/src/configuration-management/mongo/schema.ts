import { Schema } from 'mongoose';

export const serviceOptionSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    required: true,
    minlength: 1,
  },
  configOptions: {
    type: JSON,
  },
});

serviceOptionSchema.index({ service: 1, version: 1 }, { unique: true });

export const tenantConfigSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  tenantName: {
    type: String,
    required: true,
    unique: true,
  },
  configurationSettingsList: {
    fileService: {
      isActive: {
        type: Boolean,
        required: true,
      },
      isDisabled: {
        type: Boolean,
        required: true,
      },
    },
  },
});
