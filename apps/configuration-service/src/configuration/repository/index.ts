import { ConfigurationRepository } from './configuration';

export * from './configuration';
export * from './activeRevision';
export * from './types';

export interface Repositories {
  configuration: ConfigurationRepository;
  isConnected: () => boolean;
}
