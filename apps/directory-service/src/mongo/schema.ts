import { Schema } from 'mongoose';
/* Schema Validation
 Required validator checks if a property is not empty.
 Numbers have min and max validators.
 Strings have enum, match, minlength, and max length validators.
  */

export const directorySchema = new Schema({
  name: {
    type: String,
    required: [true, 'directory name required'],
    minlength: [3, 'Minimum length 3 characters'],
    unique: true,
  },
  services: [
    {
      service: {
        type: String,
        required: [true, 'service name required'],
        maxlength: [50, 'Maximum length 50 characters'],
      },
      host: {
        type: String,
        required: [true, 'host name required'],
        maxlength: [1024, 'Maximum length 50 characters'],
      },
    },
  ],
});

export const tagSchema = new Schema({
  tenantId: String,
  label: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
});
tagSchema.index({ tenantId: 1, value: 1 }, { unique: true });

export const resourceSchema = new Schema({
  tenantId: String,
  urn: {
    type: String,
    required: true,
  },
  name: { type: String },
  description: { type: String },
  type: { type: String },
});
tagSchema.index({ tenantId: 1, urn: 1 }, { unique: true });

export const resourceTagSchema = new Schema(
  {
    tagId: {
      type: Schema.Types.ObjectId,
      ref: 'tag',
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'resource',
      required: true,
    },
  },
  { _id: false }
);
resourceTagSchema.index({ resourceId: 1, tagId: 1 }, { unique: true });
