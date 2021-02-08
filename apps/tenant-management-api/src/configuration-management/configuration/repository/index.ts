import { ServiceConfigurationRepository } from './serviceOption';
import { TenantConfigurationRepository } from './tenantConfig';

export * from './serviceOption'
export * from './tenantConfig'

export interface Repositories {
  isConnected: () => boolean
  serviceConfigurationRepository: ServiceConfigurationRepository
  tenantConfigurationRepository: TenantConfigurationRepository
}