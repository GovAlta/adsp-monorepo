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
