import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { FormEntity } from '../model';
import { FormCriteria } from '../types';

export interface FormRepository {
  get(tenantId: AdspId, id: string): Promise<FormEntity>;
  find(top: number, after: string, criteria: FormCriteria): Promise<Results<FormEntity>>;
  save(entity: FormEntity): Promise<FormEntity>;
  delete(entity: FormEntity): Promise<boolean>;
}
