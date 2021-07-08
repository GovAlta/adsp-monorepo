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
  displayName: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  configOptions: {
    type: JSON,
  },
  configSchema: {
    type: Schema.Types.Mixed,
    required: false,
  },
  roles: {
    type: [
      {
        _id: false,
        role: { type: String, required: true },
        description: { type: String, required: false },
        inTenantAdmin: { type: Boolean, required: false },
      },
    ],
    required: false,
  },
});

serviceOptionSchema.index({ service: 1, version: 1 }, { unique: true });

const serviceConfiguration = {
  _id: false,
  isActive: {
    type: Boolean,
    required: true,
  },
  isEnabled: {
    type: Boolean,
    required: true,
  },
  configuration: {
    type: Object,
  },
};

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
    type: Map,
    of: serviceConfiguration,
  },
});
