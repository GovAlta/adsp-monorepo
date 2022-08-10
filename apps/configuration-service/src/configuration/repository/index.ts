import { ConfigurationRepository } from './configuration';

export * from './configuration';
export * from './activeRevision';

export interface Repositories {
  configuration: ConfigurationRepository;
  isConnected: () => boolean;
}
