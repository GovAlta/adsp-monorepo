import { ConfigurationRepository } from './configuration';
import { ActiveRevisionRepository } from './activeRevision';

export * from './configuration';
export * from './activeRevision';

export interface Repositories {
  configuration: ConfigurationRepository;
  activeRevision: ActiveRevisionRepository;
  isConnected: () => boolean;
}
