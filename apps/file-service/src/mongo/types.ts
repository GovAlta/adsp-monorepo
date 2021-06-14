import { Document } from 'mongoose';
import { FileRecord, FileSpace } from '../file';

export interface FileSpaceDoc extends Document, Omit<FileSpace, 'id'> {}

export interface FileDoc extends Document, Omit<FileRecord, 'id'> {
  spaceId: string;
  typeId: string;
}
