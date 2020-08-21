import { FileSpaceRepository } from './space';
import { FileRepository } from './file';

export * from './space';
export * from './file';

export interface Repositories {
  spaceRepository: FileSpaceRepository
  fileRepository: FileRepository
  isConnected(): boolean
}
