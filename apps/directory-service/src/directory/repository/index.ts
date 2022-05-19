import { DirectoryRepository } from './directory';
export * from './directory';

export interface Repositories {
  directoryRepository: DirectoryRepository;
  isConnected: () => boolean;
}
