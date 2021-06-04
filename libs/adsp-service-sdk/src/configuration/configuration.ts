import { AdspId } from '../utils';

export type Configuration<C, O = void> = O extends void ? C : C & { options: O };

export type ConfigurationConverter = (config: unknown, tenantId?: AdspId) => unknown;
