import { AdspId } from '@abgov/adsp-service-sdk';
import { ActiveRevisionEntity } from '../model';
import { ActiveRevision } from '../types';

export interface ActiveRevisionRepository {
  get(namespace: string, name: string, tenantId?: AdspId): Promise<ActiveRevisionEntity>;
  setActiveRevision(entity: ActiveRevisionEntity, active: number): Promise<ActiveRevision>;
}
