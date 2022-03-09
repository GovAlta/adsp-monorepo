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
    minlength: [3, 'Minimum length 3 characters'],
  },
  services: [
    {
      service: {
        type: String,
        required: [true, 'service name required'],
        maxlength: [50, 'Maximum length 50 characters'],
        validate: {
          validator: function (v) {
            return /^[a-z0-9.-]$/.test(v);
          },
          message: `It is not a valid service name! allowed characters: a-z, 0-9, -`,
        },
      },
      host: {
        type: String,
        required: [true, 'host name required'],
        maxlength: [1024, 'Maximum length 50 characters'],
        validate: {
          validator: function (v) {
            return /^[a-z0-9._%+-]+.[a-z0-9.-]+.[a-z]{2,4}$/.test(v);
          },
          message: `It is not a host!`,
        },
      },
      api: {
        type: String,
        maxlength: [50, 'Maximum length 50 characters'],
        validate: {
          validator: function (v) {
            return /^[a-z0-9.-]$/.test(v);
          },
          message: `It is not a api! allowed characters: a-z, 0-9, -`,
        },
      },
    },
  ],
});
