import { Readable } from 'stream';
import { FileEntity } from './model';

export interface FileStorageProvider {
  readFile(entity: FileEntity): Promise<Readable>;
  saveFile(entity: FileEntity, content: Readable): Promise<boolean>;
  deleteFile(entity: FileEntity): Promise<boolean>;
}
