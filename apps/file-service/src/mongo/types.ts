import { Document } from 'mongoose';
import { File, FileSpace } from '../file';

export interface FileSpaceDoc extends Document, Omit<FileSpace, 'id'> {}

export interface FileDoc extends Document, Omit<File, 'id'> {
  spaceId: string;
  typeId: string;
}
