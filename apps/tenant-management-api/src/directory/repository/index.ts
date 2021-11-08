import { DirectoryRepository } from './directory';
export * from './directory';

export interface Repositories {
  isConnected: () => boolean;
  directoryRepository: DirectoryRepository;
}
