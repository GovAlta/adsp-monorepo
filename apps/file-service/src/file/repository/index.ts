import { FileRepository } from './file';

export * from './type';
export * from './file';

export interface Repositories {
  fileRepository: FileRepository;
  isConnected(): boolean;
}
