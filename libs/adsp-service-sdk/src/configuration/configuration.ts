import { AdspId } from '../utils';

export type ConfigurationConverter = (config: unknown, tenantId?: AdspId, revision?: number) => unknown;

export type CombineConfiguration = (tenant: unknown, core: unknown, tenantId?: AdspId, revision?: number) => unknown;
