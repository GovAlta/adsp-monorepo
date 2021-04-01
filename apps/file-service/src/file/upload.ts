import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as multer from 'multer';
import * as uniqueFilename from 'unique-filename';

interface UploadProps {
  rootStoragePath: string;
}

export const createUpload = ({ rootStoragePath }: UploadProps) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(rootStoragePath, '/tmp');
      mkdirp(dest)
        .then(() => cb(null, dest))
        .catch((err) => cb(err, dest));
    },
    filename: (req, file, cb) => {
      cb(null, uniqueFilename(''));
    },
  });

  const limits = {
    fields: 10,
    fileSize: 26214400,
    files: 1,
  };

  return multer({ storage, limits });
};
