import type { PlatformCapabilities } from '../constants';
import { StrategyAdapter } from './adapter';

export default function adaptTenantStrategy({ logger, tenantStrategy }: PlatformCapabilities) {
  return new StrategyAdapter(logger, 'adsp-tenant', tenantStrategy).get();
}
