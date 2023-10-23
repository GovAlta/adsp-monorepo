import { Readable } from 'stream';
import { FileEntity, FileTypeEntity } from './model';

export interface FileStorageProvider {
  readFile(entity: FileEntity): Promise<Readable>;
  saveFile(entity: FileEntity, entityFileType: FileTypeEntity, content: Readable): Promise<boolean>;
  deleteFile(entity: FileEntity): Promise<boolean>;
}
