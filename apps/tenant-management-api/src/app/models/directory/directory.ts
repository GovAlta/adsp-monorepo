import { Document, Model, model, Schema } from 'mongoose';

const directorySchema: Schema = new Schema({
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

export interface DirectoryMap extends Document {
  _id: string;
  name: string;
  service: string;
}

const Directory: Model<DirectoryMap> = model('directory', directorySchema);

export const createDirectory = (directories) => {
  Directory.create(directories, (err) => {
    if (err) {
       return err;
    }
  });
  return '201';
};

export default Directory;
