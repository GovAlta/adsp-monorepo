import * as types from './types';
export * from './types';
import { TenantMongoRepository } from '../mongo';
export const tenantRepository: types.TenantRepository = new TenantMongoRepository();
