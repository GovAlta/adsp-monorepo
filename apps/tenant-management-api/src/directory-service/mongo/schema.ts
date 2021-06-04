import { Schema } from 'mongoose';
/* Schema Validation
 Required validator checks if a property is not empty.
 Numbers have min and max validators.
 Strings have enum, match, minlength, and maxlength validators.
  */

export const directorySchema = new Schema({
  name: {
    type: String,
    required: [true, 'directory name required'],
    enum: ['platform', 'ccds', 'ArcGIS'],
    minlength: [5, 'Minimum code length 5 characters'],
  },
  services: [
    {
      service: {
        type: String,
        required: [true, 'service name required'],
      },
      host: {
        type: String,
        required: [true, 'service name required'],
        validate: {
          validator: function (v) {
            return /^[a-z0-9._%+-]+.[a-z0-9.-]+.[a-z]{2,4}$/.test(v);
          },
          message: `It is not a host!`,
        },
      },
    },
  ],
});
