import { AdspId } from '@abgov/adsp-service-sdk';
import { ConfigurationEntity } from '../model';
import { ActiveRevisionDoc } from '../../mongo/types';

export interface ActiveRevisionRepository {
  get(namespace: string, name: string, tenantId?: AdspId): Promise<ActiveRevisionDoc>;
  setActiveRevision<C>(entity: ConfigurationEntity<C>, active: number): Promise<ActiveRevisionDoc>;
}
