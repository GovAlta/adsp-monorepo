// clean-code-ignore: RULE-19 — repository interface declaration; the mongo implementation is
// covered by ../../mongo/form.spec.ts.
import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { FormEntity } from '../model';
import { FormCriteria, ResultsSort } from '../types';

export interface FormRepository {
  get(tenantId: AdspId, id: string): Promise<FormEntity>;
  find(top: number, after: string, criteria: FormCriteria, sort?: ResultsSort): Promise<Results<FormEntity>>;
  save(entity: FormEntity): Promise<FormEntity>;
  delete(entity: FormEntity): Promise<boolean>;
}
