import { ConfigurationRepository } from './configuration';

export * from './configuration';

export interface Repositories {
  configuration: ConfigurationRepository;
  isConnected: () => boolean;
}
