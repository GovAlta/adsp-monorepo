import { FormRepository } from './form';

export * from './definition';
export * from './form';

export interface Repositories {
  formRepository: FormRepository;
  isConnected: () => boolean;
}
