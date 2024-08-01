import { ConfigurationRepository } from './configuration';

export * from './configuration';
export * from './types';

export interface Repositories {
  configuration: ConfigurationRepository;
  isConnected: () => boolean;
}
