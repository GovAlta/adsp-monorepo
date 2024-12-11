import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { FormSubmissionEntity } from '../model';
import { FormSubmissionCriteria } from '../types';

export interface FormSubmissionRepository {
  get(tenantId: AdspId, id: string, formId?: string): Promise<FormSubmissionEntity>;
  find(top: number, after: string, criteria: FormSubmissionCriteria): Promise<Results<FormSubmissionEntity>>;
  save(entity: FormSubmissionEntity): Promise<FormSubmissionEntity>;
  delete(entity: FormSubmissionEntity): Promise<boolean>;
}
