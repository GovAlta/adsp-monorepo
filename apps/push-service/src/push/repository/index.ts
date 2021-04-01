import { PushSpaceRepository } from './space';
import { StreamRepository } from './stream';

export * from './space';
export * from './stream';

export interface Repositories {
  spaceRepository: PushSpaceRepository;
  streamRepository: StreamRepository;
  isConnected(): boolean;
}
